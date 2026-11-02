import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Durable store for pairing sessions and the device registry.
 *
 * This database holds *signalling metadata only*. It never stores media URLs,
 * video bytes, or provider credentials (ADR 001 / ADR 002).
 */
export function openDatabase(databasePath) {
  if (databasePath !== ':memory:') {
    fs.mkdirSync(path.dirname(path.resolve(databasePath)), { recursive: true });
  }
  const db = new DatabaseSync(databasePath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  migrate(db);
  return db;
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = new Set(
    db.prepare('SELECT version FROM schema_migrations').all().map((r) => r.version),
  );

  const migrations = [
    {
      version: 1,
      sql: `
        CREATE TABLE users (
          id TEXT PRIMARY KEY,
          display_name TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE TABLE user_tokens (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash TEXT NOT NULL UNIQUE,
          created_at TEXT NOT NULL,
          last_used_at TEXT,
          revoked_at TEXT
        );

        CREATE TABLE pairing_sessions (
          id TEXT PRIMARY KEY,
          short_code_hash TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected','expired')),
          device_name TEXT NOT NULL,
          device_model TEXT,
          platform TEXT NOT NULL DEFAULT 'tv',
          created_at TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          approved_by_user_id TEXT REFERENCES users(id),
          approved_at TEXT,
          rejected_at TEXT,
          consumed_at TEXT,
          poll_token_hash TEXT NOT NULL,
          delivery_token TEXT,
          delivered_device_id TEXT
        );
        CREATE INDEX idx_pairing_status ON pairing_sessions(status);
        CREATE INDEX idx_pairing_expires ON pairing_sessions(expires_at);
        CREATE INDEX idx_pairing_short ON pairing_sessions(short_code_hash);

        CREATE TABLE devices (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type TEXT NOT NULL CHECK (type IN ('tv','mobile')),
          display_name TEXT NOT NULL,
          model TEXT,
          credential_hash TEXT NOT NULL,
          pairing_session_id TEXT,
          created_at TEXT NOT NULL,
          last_seen_at TEXT,
          revoked_at TEXT
        );
        CREATE INDEX idx_devices_user ON devices(user_id);
        CREATE INDEX idx_devices_credential ON devices(credential_hash);
      `,
    },
  ];

  for (const migration of migrations) {
    if (applied.has(migration.version)) continue;
    db.exec('BEGIN');
    try {
      db.exec(migration.sql);
      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)')
        .run(migration.version, new Date().toISOString());
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
}
