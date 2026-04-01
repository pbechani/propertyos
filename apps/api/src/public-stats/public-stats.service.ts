import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database';

export type EventCategory =
  | 'financial'
  | 'property'
  | 'sale'
  | 'document'
  | 'user'
  | 'construction'
  | 'general';

interface ActivityItem {
  label: string;
  category: EventCategory;
  timeAgo: string;
}

export interface PlatformStats {
  activeListings: number;
  inEscrowUsd: string;
  verifiedUsers: number;
  completionRate: number;
  recentActivity: ActivityItem[];
  cachedAt: number;
}

/** Simple in-memory TTL cache — no Redis dependency required at this stage. */
let cached: PlatformStats | null = null;
const CACHE_TTL_MS = 60_000; // 60 seconds

function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

function humaniseAction(raw: string): string {
  return raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatActivityLabel(action: string, resourceType: string): string {
  const a = action.toLowerCase();
  const r = (resourceType ?? '').toLowerCase();

  // Financial
  if (a.includes('escrow_release') || a.includes('escrow released')) return 'Escrow funds released to seller';
  if (a.includes('milestone') && a.includes('payment')) return 'Milestone payment released to contractor';
  if (a.includes('deposit') || (a.includes('payment') && r === 'escrow')) return 'Buyer deposit secured in escrow';
  if (a.includes('refund')) return 'Escrow refund processed';

  // Property
  if (a.includes('deed') && (a.includes('verif') || a.includes('approved'))) return 'Title deed verified';
  if (a.includes('listing_created') || (a.includes('creat') && r === 'property')) return 'New property listed on platform';
  if (a.includes('listing_published') || a.includes('publishe')) return 'Property listing published';
  if (a.includes('offer_accepted') || a.includes('offer_accept')) return 'Offer accepted on property';
  if (a.includes('offer_submitted') || a.includes('offer_submit')) return 'New offer submitted by buyer';
  if (a.includes('transfer_completed') || a.includes('sale_completed')) return 'Property transfer completed';

  // Sale pipeline
  if (a.includes('stage_advanced') || a.includes('stage_progress')) return 'Purchase progressed to next stage';
  if (a.includes('document_submitted') || (a.includes('submit') && r === 'document')) return 'Document submitted for review';
  if (a.includes('compliance') && a.includes('certificate')) return 'Compliance certificate issued';

  // Document
  if (a.includes('document_upload') || (a.includes('upload') && r === 'document')) return 'Supporting document uploaded';
  if (a.includes('document_verif') || (a.includes('verif') && r === 'document')) return 'Document verified and approved';

  // User / KYC
  if (a.includes('kyc_approved') || a.includes('kyc_verif') || a.includes('identity_verif')) return 'User identity verified via KYC';
  if (a.includes('kyc_submitted')) return 'KYC documents submitted for review';
  if (a.includes('user_registered') || a.includes('user_creat')) return 'New member joined the platform';

  // Construction
  if (a.includes('milestone_complet')) return 'Construction milestone marked complete';
  if (a.includes('inspection_passed') || a.includes('inspection_approv')) return 'Site inspection passed';
  if (a.includes('inspection_failed')) return 'Site inspection flagged for re-work';
  if (a.includes('project_creat')) return 'New construction project initiated';
  if (a.includes('boq') || a.includes('bill_of_quantities')) return 'Bill of quantities generated';

  // Fallback — humanise the raw action string
  return humaniseAction(action);
}

function categoriseEvent(action: string, resourceType: string): EventCategory {
  const a = action.toLowerCase();
  const r = (resourceType ?? '').toLowerCase();

  if (r === 'escrow' || a.includes('escrow') || a.includes('payment') || a.includes('deposit') || a.includes('refund')) return 'financial';
  if (a.includes('kyc') || a.includes('user_register') || a.includes('user_creat') || a.includes('identity_verif') || r === 'user') return 'user';
  if (r === 'document' || a.includes('document') || a.includes('deed')) return 'document';
  if (a.includes('milestone') || a.includes('inspection') || a.includes('project_creat') || a.includes('boq') || r === 'construction') return 'construction';
  if (a.includes('stage') || a.includes('offer') || a.includes('sale') || a.includes('transfer') || r === 'sale') return 'sale';
  if (r === 'property' || a.includes('listing') || a.includes('property')) return 'property';

  return 'general';
}

@Injectable()
export class PublicStatsService {
  private readonly logger = new Logger(PublicStatsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<Omit<PlatformStats, 'cachedAt'>> {
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      const { cachedAt: _omit, ...rest } = cached;
      return rest;
    }

    try {
      const [
        activeListings,
        verifiedUsers,
        escrowResult,
        stageTotal,
        stageCompleted,
        recentLogs,
      ] = await this.prisma.$transaction([
        // 1. Active property listings
        this.prisma.property.count({ where: { status: 'active' } }),

        // 2. Active (registered) users
        this.prisma.identityUser.count({ where: { status: 'active' } }),

        // 3. Total value credited into escrow accounts
        this.prisma.ledgerEntry.aggregate({
          _sum: { baseCurrencyAmount: true },
          where: {
            status: 'completed',
            creditAccount: { accountType: 'escrow', status: 'active' },
          },
        }),

        // 4. Total sale stage progress records
        this.prisma.saleStageProgress.count(),

        // 5. Completed sale stage progress records
        this.prisma.saleStageProgress.count({ where: { status: 'completed' } }),

        // 6. Recent sales audit log events (non-PII: action + resourceType only)
        this.prisma.salesAuditLog.findMany({
          select: { action: true, resourceType: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ]);

      const escrowTotal = Number(escrowResult._sum.baseCurrencyAmount ?? 0);
      const completionRate =
        stageTotal > 0 ? Math.round((stageCompleted / stageTotal) * 100) : 0;

      const recentActivity: ActivityItem[] = recentLogs.map((log) => ({
        label: formatActivityLabel(log.action, log.resourceType ?? ''),
        category: categoriseEvent(log.action, log.resourceType ?? ''),
        timeAgo: formatTimeAgo(log.createdAt),
      }));

      const inEscrowUsd =
        escrowTotal >= 1_000_000
          ? `$${(escrowTotal / 1_000_000).toFixed(1)}M`
          : escrowTotal >= 1_000
            ? `$${(escrowTotal / 1_000).toFixed(1)}K`
            : `$${escrowTotal.toFixed(0)}`;

      const result: PlatformStats = {
        activeListings,
        inEscrowUsd,
        verifiedUsers,
        completionRate,
        recentActivity,
        cachedAt: Date.now(),
      };

      cached = result;
      const { cachedAt: _omit, ...rest } = result;
      return rest;
    } catch (err) {
      this.logger.error('Failed to compute platform stats', err);

      // Return last cached value on DB error rather than surfacing an error to public visitors
      if (cached) {
        const { cachedAt: _omit, ...rest } = cached;
        return rest;
      }

      // Absolute fallback — all zeros, empty feed
      return {
        activeListings: 0,
        inEscrowUsd: '$0',
        verifiedUsers: 0,
        completionRate: 0,
        recentActivity: [],
      };
    }
  }
}
