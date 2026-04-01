/**
 * Change queue — writes mutations to the local change_log table
 * so they can be pushed to the server when connectivity is restored.
 */
import { getDb } from '../db/database';

export type Operation = 'create' | 'update' | 'delete';

export interface ChangeEntry {
  entityType: string;
  entityId: string;
  operation: Operation;
  payload: unknown;
}

/**
 * Record a local mutation to the outbound sync queue.
 * Returns the rowid of the new change_log entry.
 */
export async function addToQueue(entry: ChangeEntry): Promise<number> {
  const db = getDb();
  const result = await db.runAsync(
    `INSERT INTO change_log (entity_type, entity_id, operation, payload, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      entry.entityType,
      entry.entityId,
      entry.operation,
      JSON.stringify(entry.payload),
      Date.now(),
    ],
  );
  return result.lastInsertRowId;
}

/**
 * Return all unsynced entries ordered oldest-first.
 */
export async function getPendingChanges(): Promise<
  Array<{ id: number; entityType: string; entityId: string; operation: Operation; payload: unknown; createdAt: number }>
> {
  const db = getDb();
  const rows = await db.getAllAsync<{
    id: number;
    entity_type: string;
    entity_id: string;
    operation: string;
    payload: string;
    created_at: number;
  }>(`SELECT * FROM change_log WHERE synced = 0 ORDER BY created_at ASC`);

  return rows.map((r) => ({
    id: r.id,
    entityType: r.entity_type,
    entityId: r.entity_id,
    operation: r.operation as Operation,
    payload: JSON.parse(r.payload),
    createdAt: r.created_at,
  }));
}

/**
 * Mark a list of change_log entries as synced.
 */
export async function markSynced(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  const db = getDb();
  const placeholders = ids.map(() => '?').join(',');
  await db.runAsync(`UPDATE change_log SET synced = 1 WHERE id IN (${placeholders})`, ids);
}
