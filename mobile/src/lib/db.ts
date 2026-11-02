/**
 * Local schema minimum (architecture pack 08 §3), on SQLite with migrations.
 * progress    key = subjectId|se|ep
 * watchlist   metadata only (never signed URLs)
 * history     reverse-chronological viewing log
 * settings    key/value app defaults
 */
import * as SQLite from 'expo-sqlite';

export interface ProgressRow {
  key: string;
  subjectId: string;
  detailPath: string;
  title: string;
  cover: string | null;
  contentType: 'movie' | 'series' | null;
  season: number;
  episode: number;
  positionMs: number;
  durationMs: number | null;
  updatedAt: number;
  completed: number;
}

export interface WatchlistRow {
  subjectId: string;
  detailPath: string;
  title: string;
  cover: string | null;
  contentType: 'movie' | 'series' | null;
  addedAt: number;
}

export interface HistoryRow {
  id: number;
  subjectId: string;
  detailPath: string;
  title: string;
  cover: string | null;
  season: number;
  episode: number;
  watchedAt: number;
}

const MIGRATIONS: string[] = [
  // v1
  `CREATE TABLE IF NOT EXISTS progress (
     key TEXT PRIMARY KEY,
     subjectId TEXT NOT NULL,
     detailPath TEXT NOT NULL,
     title TEXT NOT NULL,
     cover TEXT,
     contentType TEXT,
     season INTEGER NOT NULL DEFAULT 1,
     episode INTEGER NOT NULL DEFAULT 1,
     positionMs INTEGER NOT NULL DEFAULT 0,
     durationMs INTEGER,
     updatedAt INTEGER NOT NULL,
     completed INTEGER NOT NULL DEFAULT 0
   );
   CREATE TABLE IF NOT EXISTS watchlist (
     subjectId TEXT PRIMARY KEY,
     detailPath TEXT NOT NULL,
     title TEXT NOT NULL,
     cover TEXT,
     contentType TEXT,
     addedAt INTEGER NOT NULL
   );
   CREATE TABLE IF NOT EXISTS history (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     subjectId TEXT NOT NULL,
     detailPath TEXT NOT NULL,
     title TEXT NOT NULL,
     cover TEXT,
     season INTEGER NOT NULL DEFAULT 1,
     episode INTEGER NOT NULL DEFAULT 1,
     watchedAt INTEGER NOT NULL
   );
   CREATE INDEX IF NOT EXISTS history_watchedAt ON history (watchedAt DESC);
   CREATE TABLE IF NOT EXISTS settings (
     key TEXT PRIMARY KEY,
     value TEXT NOT NULL
   );
   CREATE TABLE IF NOT EXISTS searchHistory (
     query TEXT PRIMARY KEY,
     updatedAt INTEGER NOT NULL
   );`,
];

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('hallyu-stream.db');
      await db.execAsync('PRAGMA journal_mode = WAL');
      for (let v = 0; v < MIGRATIONS.length; v++) {
        const { user_version: current } = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version')
          .then((r) => r ?? { user_version: 0 });
        if (current >= v + 1) break;
        await db.withTransactionAsync(async () => {
          await db.execAsync(MIGRATIONS[v] ?? '');
          await db.execAsync(`PRAGMA user_version = ${v + 1}`);
        });
      }
      return db;
    })();
  }
  return dbPromise;
}

/* ---------- progress ---------- */

export const progressKey = (subjectId: string, se: number, ep: number) => `${subjectId}|${se}|${ep}`;

export async function saveProgress(entry: {
  subjectId: string;
  detailPath: string;
  title: string;
  cover: string | null;
  contentType: 'movie' | 'series' | null;
  season: number;
  episode: number;
  positionMs: number;
  durationMs: number | null;
  completed?: boolean;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO progress (key, subjectId, detailPath, title, cover, contentType, season, episode, positionMs, durationMs, updatedAt, completed)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET
       positionMs=excluded.positionMs,
       durationMs=excluded.durationMs,
       updatedAt=excluded.updatedAt,
       completed=excluded.completed,
       title=excluded.title,
       cover=excluded.cover`,
    progressKey(entry.subjectId, entry.season, entry.episode),
    entry.subjectId,
    entry.detailPath,
    entry.title,
    entry.cover,
    entry.contentType,
    entry.season,
    entry.episode,
    Math.max(0, Math.round(entry.positionMs)),
    entry.durationMs !== null ? Math.round(entry.durationMs) : null,
    Date.now(),
    entry.completed ? 1 : 0,
  );
}

export async function getProgress(subjectId: string, se: number, ep: number): Promise<ProgressRow | null> {
  const db = await getDb();
  return (
    (await db.getFirstAsync<ProgressRow>(
      'SELECT * FROM progress WHERE key = ?',
      progressKey(subjectId, se, ep),
    )) ?? null
  );
}

export async function allProgress(): Promise<ProgressRow[]> {
  const db = await getDb();
  return db.getAllAsync<ProgressRow>('SELECT * FROM progress WHERE completed = 0 ORDER BY updatedAt DESC');
}

export async function removeProgress(key: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM progress WHERE key = ?', key);
}

/* ---------- watchlist ---------- */

export async function listWatchlist(): Promise<WatchlistRow[]> {
  const db = await getDb();
  return db.getAllAsync<WatchlistRow>('SELECT * FROM watchlist ORDER BY addedAt DESC');
}

export async function isInWatchlist(subjectId: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT subjectId FROM watchlist WHERE subjectId = ?', subjectId);
  return !!row;
}

export async function toggleWatchlist(item: Omit<WatchlistRow, 'addedAt'>): Promise<'added' | 'removed'> {
  const db = await getDb();
  const exists = await isInWatchlist(item.subjectId);
  if (exists) {
    await db.runAsync('DELETE FROM watchlist WHERE subjectId = ?', item.subjectId);
    return 'removed';
  }
  await db.runAsync(
    'INSERT INTO watchlist (subjectId, detailPath, title, cover, contentType, addedAt) VALUES (?, ?, ?, ?, ?, ?)',
    item.subjectId,
    item.detailPath,
    item.title,
    item.cover,
    item.contentType,
    Date.now(),
  );
  return 'added';
}

/* ---------- history ---------- */

export async function addHistory(entry: {
  subjectId: string;
  detailPath: string;
  title: string;
  cover: string | null;
  season: number;
  episode: number;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO history (subjectId, detailPath, title, cover, season, episode, watchedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    entry.subjectId,
    entry.detailPath,
    entry.title,
    entry.cover,
    entry.season,
    entry.episode,
    Date.now(),
  );
  await db.runAsync(
    `DELETE FROM history WHERE id IN (
       SELECT id FROM history WHERE subjectId = ? AND season = ? AND episode = ?
         ORDER BY watchedAt DESC LIMIT -1 OFFSET 1
     )`,
    entry.subjectId,
    entry.season,
    entry.episode,
  );
}

export async function listHistory(): Promise<HistoryRow[]> {
  const db = await getDb();
  return db.getAllAsync<HistoryRow>('SELECT * FROM history ORDER BY watchedAt DESC LIMIT 200');
}

export async function removeHistory(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM history WHERE id = ?', id);
}

export async function clearHistory(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM history');
}

/* ---------- search history ---------- */

export async function listSearchHistory(): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ query: string }>('SELECT query FROM searchHistory ORDER BY updatedAt DESC LIMIT 12');
  return rows.map((r) => r.query);
}

export async function addSearchHistory(query: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO searchHistory (query, updatedAt) VALUES (?, ?) ON CONFLICT(query) DO UPDATE SET updatedAt=excluded.updatedAt',
    query,
    Date.now(),
  );
}

export async function clearSearchHistory(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM searchHistory');
}

/* ---------- settings ---------- */

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
    key,
    value,
  );
}
