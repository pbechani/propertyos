/**
 * SQLite database initialisation for offline-first sync.
 *
 * Tables:
 *   projects    – local project cache
 *   tasks       – local task cache
 *   change_log  – outbound change queue (unpushed mutations)
 *   crdt_docs   – last-write-wins CRDT state per entity
 *
 * Based on sprint-06-e-mobile.md architecture.
 */
import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('pribec.db');
  }
  return _db;
}

export async function initDatabase(): Promise<void> {
  const db = getDb();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS projects (
      id          TEXT PRIMARY KEY,
      data        TEXT NOT NULL,
      updated_at  INTEGER NOT NULL,
      synced_at   INTEGER
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id          TEXT PRIMARY KEY,
      project_id  TEXT NOT NULL,
      data        TEXT NOT NULL,
      updated_at  INTEGER NOT NULL,
      synced_at   INTEGER
    );

    CREATE TABLE IF NOT EXISTS change_log (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id   TEXT NOT NULL,
      operation   TEXT NOT NULL CHECK(operation IN ('create','update','delete')),
      payload     TEXT NOT NULL,
      created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
      synced      INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS crdt_docs (
      entity_type TEXT NOT NULL,
      entity_id   TEXT NOT NULL,
      vector_clock TEXT NOT NULL,
      data        TEXT NOT NULL,
      updated_at  INTEGER NOT NULL,
      PRIMARY KEY (entity_type, entity_id)
    );

    CREATE INDEX IF NOT EXISTS idx_change_log_unsynced
      ON change_log (synced, created_at)
      WHERE synced = 0;

    CREATE INDEX IF NOT EXISTS idx_tasks_project
      ON tasks (project_id);
  `);
}
