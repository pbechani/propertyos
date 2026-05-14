'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Bot, Loader2,
  Home, Calendar, MessageSquare, DoorOpen, MessagesSquare, FolderOpen,
  ClipboardCheck, Star, StickyNote, Eye, Users, Tag, ShoppingBag, CheckSquare,
  Download, Pencil,
} from 'lucide-react';
import { OverflowTabBar, type TabItem } from '@/components/my-listings/OverflowTabBar';
import { ScheduledViewings } from '@/components/my-listings/ScheduledViewings';
import { ListingDetails } from '@/components/my-listings/ListingDetails';
import { Enquiries } from '@/components/my-listings/Enquiries';
import { OpenHouses } from '@/components/my-listings/OpenHouses';
import { PropertyCondition } from '@/components/my-listings/PropertyCondition';
import { SellingPoints } from '@/components/my-listings/SellingPoints';
import { Notes } from '@/components/my-listings/Notes';
import { Showings } from '@/components/my-listings/Showings';
import { Leads } from '@/components/my-listings/Leads';
import { Offers } from '@/components/my-listings/Offers';
import { SaleDetails } from '@/components/my-listings/SaleDetails';
import { PostSaleActivities } from '@/components/my-listings/PostSaleActivities';
import { Documents } from '@/components/my-listings/Documents';
import { CommunicationLog } from '@/components/my-listings/CommunicationLog';
import { AIAssistant } from '@/components/my-listings/AIAssistant';
import { ActivitySummary } from '@/components/my-listings/ActivitySummary';
import { ListingDetailSidebar } from '@/components/my-listings/ListingDetailSidebar';
import { propertiesApi, type PropertyListing, type PropertyStats } from '@/lib/api-client';
import { getAccessToken, getStoredUser } from '@/lib/auth-session';
import { formatMoney } from '@/lib/formatters';

const TAB_DEFS: Omit<TabItem, 'badge'>[] = [
  { value: 'details',    label: 'Listing Details',    icon: Home },
  { value: 'viewings',   label: 'Viewings',           icon: Calendar },
  { value: 'enquiries',  label: 'Enquiries',          icon: MessageSquare },
  { value: 'openhouses', label: 'Open Houses',        icon: DoorOpen },
  { value: 'comms',      label: 'Communications',     icon: MessagesSquare },
  { value: 'documents',  label: 'Documents',          icon: FolderOpen },
  { value: 'condition',  label: 'Condition',          icon: ClipboardCheck },
  { value: 'selling',    label: 'Selling Points',     icon: Star },
  { value: 'notes',      label: 'Notes',              icon: StickyNote },
  { value: 'showings',   label: 'Showings',           icon: Eye },
  { value: 'leads',      label: 'Leads',              icon: Users },
  { value: 'offers',     label: 'Offers',             icon: Tag },
  { value: 'sale',       label: 'Sale Details',       icon: ShoppingBag },
  { value: 'postsale',   label: 'Post-Sale',          icon: CheckSquare },
];

export default function ListingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const listingId = params.id as string;
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') ?? 'details');
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [stats, setStats] = useState<PropertyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const authToken = getAccessToken() ?? '';
  const user = getStoredUser();

  useEffect(() => {
    setIsLoading(true);
    setError('');

    Promise.all([
      propertiesApi.getById(listingId, authToken || undefined),
      authToken ? propertiesApi.getPropertyStats(authToken, listingId) : Promise.resolve(null),
    ])
      .then(([prop, propertyStats]) => {
        setProperty(prop);
        setStats(propertyStats);
      })
      .catch((err: Error) => setError(err.message || 'Failed to load listing'))
      .finally(() => setIsLoading(false));
  }, [listingId, authToken]);

  const address = property?.location?.address_line1 ?? property?.title ?? 'Address unavailable';
  const cityRegion = [property?.location?.city, property?.location?.region].filter(Boolean).join(', ');

  const agentName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Agent';

  const daysOnMarket = property
    ? Math.max(0, Math.floor((Date.now() - new Date(property.created_at).getTime()) / 86_400_000))
    : 0;

  const listingContext = property ? {
    address,
    agentFirstName: user?.firstName ?? 'Agent',
    agentFullName: agentName,
    price: property.price ? parseFloat(property.price) : undefined,
    currency: property.currency ?? undefined,
    beds: property.bedrooms ?? undefined,
    baths: property.bathrooms ?? undefined,
    areaSqm: property.area_sqm ? Number(property.area_sqm) : undefined,
    status: property.status,
    daysOnMarket,
    viewings: stats?.viewings_requested,
    leads: stats?.leads_count,
    enquiries: stats?.inquiries,
  } : undefined;

  const tabBadges: Record<string, number> = stats
    ? {
        viewings: stats.viewings_requested,
        enquiries: stats.inquiries,
        openhouses: stats.open_houses_scheduled,
        documents: stats.documents_count,
        leads: stats.leads_count,
      }
    : {};

  const tabs: TabItem[] = useMemo(
    () => TAB_DEFS.map((t) => ({ ...t, badge: tabBadges[t.value] })),
    [stats], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className="min-h-screen bg-[#F2E8D5]">
      {/* Forest dark header */}
      <div className="relative overflow-hidden" style={{ background: '#1A3C28' }}>
        {/* Decorative circles */}
        <div className="absolute pointer-events-none" style={{ top: -60, right: -60, width: 220, height: 220, background: '#C4562A', opacity: 0.08, borderRadius: '50%' }} />
        <div className="absolute pointer-events-none" style={{ bottom: 10, left: '40%', width: 160, height: 160, background: '#00E87A', opacity: 0.04, borderRadius: '50%' }} />

        <div className="relative px-8 pt-6 pb-0" style={{ zIndex: 1 }}>
          {/* Breadcrumb eyebrow */}
          <div className="flex items-center gap-1 mb-4" style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C4562A' }}>
            <button onClick={() => router.push('/app/my-listings')} className="flex items-center gap-1 transition-opacity hover:opacity-100" style={{ opacity: 0.75, color: 'inherit', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <ArrowLeft className="w-3 h-3" />
              My Listings
            </button>
            <span style={{ opacity: 0.5, margin: '0 4px' }}>›</span>
            <span style={{ color: 'rgba(242,232,213,0.7)', fontWeight: 600 }}>{address}</span>
          </div>

          {/* Title row */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              {/* Badges */}
              <div className="flex items-center gap-2 mb-2">
                {property?.listing_type && (
                  <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 8px', borderRadius: 5, background: '#1A3C28', color: '#F2E8D5', border: '1px solid rgba(242,232,213,0.2)' }}>
                    {property.listing_type.replace(/_/g, ' ')}
                  </span>
                )}
                {stats && stats.views > 50 && (
                  <span style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 8px', borderRadius: 5, background: '#FEE2E2', color: '#DC2626' }}>
                    🔥 High Demand
                  </span>
                )}
              </div>
              <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 26, fontWeight: 700, color: '#F2E8D5', letterSpacing: '-0.5px', lineHeight: 1.15 }}>
                {property?.title ?? address}
              </h1>
              <div className="flex items-center gap-2 mt-1" style={{ fontSize: 13, color: 'rgba(242,232,213,0.55)', fontWeight: 400 }}>
                {cityRegion && <span>{cityRegion}</span>}
                {cityRegion && (property?.bedrooms != null || property?.area_sqm) && <span style={{ width: 3, height: 3, background: 'rgba(242,232,213,0.3)', borderRadius: '50%', display: 'inline-block' }} />}
                {(property?.bedrooms != null || property?.bathrooms != null || property?.area_sqm) && (
                  <span>
                    {[
                      property?.bedrooms != null ? `${property.bedrooms} bed` : null,
                      property?.bathrooms != null ? `${property.bathrooms} bath` : null,
                      property?.area_sqm ? `${Number(property.area_sqm).toLocaleString()} m²` : null,
                    ].filter(Boolean).join(' · ')}
                  </span>
                )}
                {property?.status && (
                  <>
                    <span style={{ width: 3, height: 3, background: 'rgba(242,232,213,0.3)', borderRadius: '50%', display: 'inline-block' }} />
                    <span style={{ color: '#00E87A', fontWeight: 600 }}>{property.status.replace(/_/g, ' ')}</span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'rgba(242,232,213,0.08)', color: 'rgba(242,232,213,0.8)', border: '1px solid rgba(242,232,213,0.14)' }}
                className="transition-all hover:opacity-90"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
              <Link
                href={`/app/my-listings/${listingId}/edit`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#C4562A', color: '#fff', border: 'none', textDecoration: 'none' }}
                className="transition-all hover:opacity-90"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit Listing
              </Link>
              <button
                onClick={() => setIsAIOpen(!isAIOpen)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: isAIOpen ? 'rgba(0,232,122,0.15)' : '#1A3C28', color: '#00E87A', border: '1px solid rgba(0,232,122,0.25)' }}
                className="transition-all hover:opacity-90"
              >
                <span className={`w-1.5 h-1.5 rounded-full bg-[#00E87A] ${!isAIOpen ? 'animate-pulse' : ''}`} />
                <Bot className="w-3.5 h-3.5" />
                AI Assistant
              </button>
            </div>
          </div>

          {/* 4-cell KPI strip */}
          {property && (
            <div className="grid grid-cols-4 gap-2.5 pb-5">
              {/* Listing Price */}
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(242,232,213,0.1)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(242,232,213,0.45)', marginBottom: 5 }}>Listing Price</div>
                <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, fontWeight: 700, color: '#F2E8D5', lineHeight: 1 }}>{formatMoney(property.price, property.currency)}</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#00E87A', marginTop: 3 }}>asking price</div>
              </div>
              {/* Days on Market */}
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(242,232,213,0.1)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(242,232,213,0.45)', marginBottom: 5 }}>Days on Market</div>
                <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, fontWeight: 700, color: '#F5C87A', lineHeight: 1 }}>{daysOnMarket}</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(242,232,213,0.45)', marginTop: 3 }}>days active</div>
              </div>
              {/* Total Views */}
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(242,232,213,0.1)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(242,232,213,0.45)', marginBottom: 5 }}>Total Views</div>
                <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, fontWeight: 700, color: '#00E87A', lineHeight: 1 }}>{stats?.views ?? property.view_count ?? 0}</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#00E87A', marginTop: 3 }}>portal impressions</div>
              </div>
              {/* Enquiries */}
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(242,232,213,0.1)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontFamily: 'var(--font-ibm-plex-mono)', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(242,232,213,0.45)', marginBottom: 5 }}>Enquiries</div>
                <div style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, fontWeight: 700, color: '#E8A080', lineHeight: 1 }}>{stats?.inquiries ?? 0}</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(242,232,213,0.45)', marginTop: 3 }}>{(stats?.inquiries ?? 0) > 0 ? 'pending review' : 'no enquiries yet'}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky tab bar */}
      <div className="sticky top-0 z-40">
        {isLoading ? (
          <div className="bg-[#EAD9C4]/50 border-b border-[#1A3C28]/[0.08] px-4 py-3 flex items-center justify-center h-[52px]">
            <Loader2 className="w-4 h-4 text-[#1A3C28] animate-spin" />
          </div>
        ) : (
          <OverflowTabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        )}
      </div>

      {/* Main Content */}
      <div>
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-[#1A3C28] animate-spin" />
          </div>
        )}

        {!isLoading && error && (
          <div className="mx-6 mt-6 bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {!isLoading && property && (
          <>
            {/* Details tab — 2-col layout */}
            {activeTab === 'details' && (
              <div className="grid gap-5 px-8 py-6" style={{ gridTemplateColumns: '1fr 320px', alignItems: 'start' }}>
                <div>
                  <ListingDetails property={property} />
                </div>
                <div className="flex flex-col gap-3.5">
                  <ListingDetailSidebar
                    property={property}
                    stats={stats}
                    daysOnMarket={daysOnMarket}
                    listingId={listingId}
                    authToken={authToken}
                    onTabChange={setActiveTab}
                  />
                </div>
              </div>
            )}

            {/* All other tabs — full width with ActivitySummary */}
            {activeTab !== 'details' && (
              <div className="px-8 py-6">
                <ActivitySummary propertyId={listingId} authToken={authToken} onTabChange={(tab) => setActiveTab(tab)} />
                <div className="bg-white rounded-xl shadow-sm border border-[#1A3C28]/10 p-6">
                  {activeTab === 'viewings'   && <ScheduledViewings propertyId={listingId} authToken={authToken} />}
                  {activeTab === 'enquiries'  && <Enquiries propertyId={listingId} authToken={authToken} property={property} />}
                  {activeTab === 'openhouses' && <OpenHouses propertyId={listingId} authToken={authToken} propertyAddress={address} currentAgentName={agentName} />}
                  {activeTab === 'comms'      && <CommunicationLog propertyId={listingId} authToken={authToken} property={property} />}
                  {activeTab === 'documents'  && <Documents propertyId={listingId} authToken={authToken} />}
                  {activeTab === 'condition'  && <PropertyCondition propertyId={listingId} authToken={authToken} />}
                  {activeTab === 'selling'    && <SellingPoints propertyId={listingId} authToken={authToken} />}
                  {activeTab === 'notes'      && <Notes propertyId={listingId} authToken={authToken} />}
                  {activeTab === 'showings'   && <Showings propertyId={listingId} authToken={authToken} />}
                  {activeTab === 'leads'      && <Leads propertyId={listingId} authToken={authToken} />}
                  {activeTab === 'offers'     && <Offers propertyId={listingId} authToken={authToken} listPrice={property ? parseFloat(property.price) : undefined} />}
                  {activeTab === 'sale'       && <SaleDetails propertyId={listingId} authToken={authToken} />}
                  {activeTab === 'postsale'   && <PostSaleActivities propertyId={listingId} authToken={authToken} />}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* AI Assistant */}
      <AIAssistant isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} listing={listingContext} />

      {/* Floating AI button for mobile */}
      {!isAIOpen && (
        <button
          onClick={() => setIsAIOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#1A3C28] text-[#00E87A] rounded-2xl shadow-lg shadow-[#1A3C28]/30 hover:shadow-xl hover:shadow-[#1A3C28]/40 transition-all flex items-center justify-center z-40 md:hidden"
        >
          <Bot className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
