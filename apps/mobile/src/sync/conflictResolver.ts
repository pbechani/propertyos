/**
 * Conflict resolver — last-write-wins strategy.
 *
 * For financial data (escrow, ledger), conflicts are flagged for manual
 * resolution rather than silently overwritten.
 */
import { getDb } from '../db/database';
import type { RemoteChange } from './syncAPI';

const FINANCIAL_ENTITY_TYPES = new Set(['escrow_release', 'ledger_entry', 'payment']);

export interface ConflictResolution {
  action: 'apply' | 'skip' | 'manual';
  reason?: string;
}

/**
 * Decide how to handle a remote change that conflicts with local state.
 *
 * Strategy:
 * - Financial entities → 'manual' (require human review)
 * - All others → last-write-wins (higher timestamp wins)
 */
export async function resolveConflict(
  remote: RemoteChange,
  localUpdatedAt: number,
): Promise<ConflictResolution> {
  if (FINANCIAL_ENTITY_TYPES.has(remote.entityType)) {
    return { action: 'manual', reason: 'Financial conflict requires manual review' };
  }

  // Last-write-wins: apply remote if it's newer
  if (remote.serverTimestamp >= localUpdatedAt) {
    return { action: 'apply' };
  }

  return { action: 'skip', reason: 'Local version is newer' };
}

/**
 * Apply a remote change to the local SQLite cache.
 * Only called after resolveConflict returns { action: 'apply' }.
 */
export async function applyRemoteChange(change: RemoteChange): Promise<void> {
  const db = getDb();
  const table = entityTypeToTable(change.entityType);
  if (!table) return;

  if (change.operation === 'delete') {
    await db.runAsync(`DELETE FROM ${table} WHERE id = ?`, [change.entityId]);
    return;
  }

  // Upsert: insert or replace
  await db.runAsync(
    `INSERT OR REPLACE INTO ${table} (id, data, updated_at, synced_at)
     VALUES (?, ?, ?, ?)`,
    [
      change.entityId,
      JSON.stringify(change.payload),
      change.serverTimestamp,
      Date.now(),
    ],
  );
}

function entityTypeToTable(entityType: string): string | null {
  const map: Record<string, string> = {
    project: 'projects',
    task: 'tasks',
  };
  return map[entityType] ?? null;
}
