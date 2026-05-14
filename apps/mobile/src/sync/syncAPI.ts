/**
 * Sync API — pushes local changes to the server and pulls remote changes.
 */
import { apiFetch } from '../lib/api';
import type { Operation } from './syncQueue';

// ── Push ─────────────────────────────────────────────────────────────────────

export interface ChangePayload {
  id: number;
  entityType: string;
  entityId: string;
  operation: Operation;
  payload: unknown;
  createdAt: number;
}

export interface PushResult {
  syncedIds: number[];
  failedIds: number[];
}

/**
 * Send a batch of local changes to the server.
 * Returns which entry IDs were accepted and which failed.
 */
export async function pushChanges(changes: ChangePayload[]): Promise<PushResult> {
  if (changes.length === 0) return { syncedIds: [], failedIds: [] };

  try {
    const result = await apiFetch<PushResult>('/sync/push', {
      method: 'POST',
      body: JSON.stringify({ changes }),
    });
    return result;
  } catch {
    // On network failure, consider all as unsynced
    return { syncedIds: [], failedIds: changes.map((c) => c.id) };
  }
}

// ── Pull ─────────────────────────────────────────────────────────────────────

export interface RemoteChange {
  entityType: string;
  entityId: string;
  operation: Operation;
  payload: unknown;
  serverTimestamp: number;
}

export interface PullResult {
  changes: RemoteChange[];
  cursor: string;
}

/**
 * Fetch changes from the server since the given cursor (ISO timestamp or "").
 */
export async function pullChanges(since: string): Promise<PullResult> {
  const qs = since ? `?since=${encodeURIComponent(since)}` : '';
  return apiFetch<PullResult>(`/sync/pull${qs}`);
}
