/**
 * Sync engine — orchestrates push-then-pull cycle.
 *
 * 1. Push all unsynced local changes to the server.
 * 2. Pull remote changes since the last known cursor.
 * 3. For each remote change, resolve conflicts and apply to local store.
 * 4. Persist the new pull cursor in AsyncStorage.
 */
import { storageGet, storageSet } from '../lib/storage';
import { getPendingChanges, markSynced } from './syncQueue';
import { pushChanges, pullChanges } from './syncAPI';
import { resolveConflict, applyRemoteChange } from './conflictResolver';
import { getDb } from '../db/database';

const CURSOR_KEY = 'sync_cursor';

export interface SyncResult {
  pushed: number;
  pulled: number;
  conflicts: number;
  errors: string[];
}

/**
 * Run one full push-pull sync cycle.
 * Safe to call concurrently — subsequent calls while a sync is in progress
 * will be no-ops (guarded by the isSyncing flag).
 */
let isSyncing = false;

export async function syncEngine(): Promise<SyncResult> {
  if (isSyncing) return { pushed: 0, pulled: 0, conflicts: 0, errors: ['Sync already in progress'] };
  isSyncing = true;

  const result: SyncResult = { pushed: 0, pulled: 0, conflicts: 0, errors: [] };

  try {
    // ── 1. Push ──────────────────────────────────────────────────────────────
    const pending = await getPendingChanges();
    if (pending.length > 0) {
      const pushResult = await pushChanges(pending);
      await markSynced(pushResult.syncedIds);
      result.pushed = pushResult.syncedIds.length;

      if (pushResult.failedIds.length > 0) {
        result.errors.push(`Failed to push ${pushResult.failedIds.length} change(s)`);
      }
    }

    // ── 2. Pull ──────────────────────────────────────────────────────────────
    const cursor = (await storageGet(CURSOR_KEY)) ?? '';
    const pullResult = await pullChanges(cursor);

    // ── 3. Apply remote changes ──────────────────────────────────────────────
    const db = getDb();
    for (const change of pullResult.changes) {
      // Check if we have a local version
      const table = change.entityType === 'project' ? 'projects' : change.entityType === 'task' ? 'tasks' : null;
      let localUpdatedAt = 0;

      if (table) {
        const local = await db.getFirstAsync<{ updated_at: number }>(
          `SELECT updated_at FROM ${table} WHERE id = ?`,
          [change.entityId],
        );
        localUpdatedAt = local?.updated_at ?? 0;
      }

      const resolution = await resolveConflict(change, localUpdatedAt);

      if (resolution.action === 'apply') {
        await applyRemoteChange(change);
        result.pulled++;
      } else if (resolution.action === 'manual') {
        result.conflicts++;
      }
      // 'skip' — local is newer, do nothing
    }

    // ── 4. Persist cursor ────────────────────────────────────────────────────
    if (pullResult.cursor) {
      await storageSet(CURSOR_KEY, pullResult.cursor);
    }
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : String(err));
  } finally {
    isSyncing = false;
  }

  return result;
}
