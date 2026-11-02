import { KEYS, readJson, storage, writeJson, type KeyValueStore } from './storage';
import { progressKey, seasonEpisodeForTitle } from './playback';
import type {
  DownloadEntry,
  HistoryEntry,
  ProgressEntry,
  Settings,
  Title,
  WatchlistItem,
} from './types';

export const DEFAULT_SETTINGS: Settings = {
  defaultQuality: 'auto',
  subtitleLanguage: 'off',
  autoplayNext: true,
  wifiOnlyDownloads: true,
  reduceMotion: false,
  captionSize: 'default',
  lowTier: false,
};

type Listener = () => void;

/**
 * Local-first personal library (`08` §3, `09` §5). No account required.
 * Every mutation is persisted and emits a change so RN screens can re-read.
 */
export class LibraryStore {
  private readonly store: KeyValueStore;
  private listeners = new Set<Listener>();

  constructor(store: KeyValueStore = storage) {
    this.store = store;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }

  // ── Settings ────────────────────────────────────────────────────────────
  async getSettings(): Promise<Settings> {
    const stored = await readJson<Partial<Settings>>(this.store, KEYS.settings, {});
    return { ...DEFAULT_SETTINGS, ...stored };
  }

  async setSettings(patch: Partial<Settings>): Promise<Settings> {
    const next = { ...(await this.getSettings()), ...patch };
    await writeJson(this.store, KEYS.settings, next);
    this.emit();
    return next;
  }

  // ── Watchlist ───────────────────────────────────────────────────────────
  async getWatchlist(): Promise<WatchlistItem[]> {
    return readJson<WatchlistItem[]>(this.store, KEYS.watchlist, []);
  }

  async isInWatchlist(subjectId: string): Promise<boolean> {
    return (await this.getWatchlist()).some((item) => item.subjectId === subjectId);
  }

  async toggleWatchlist(title: Title): Promise<boolean> {
    const items = await this.getWatchlist();
    const exists = items.some((item) => item.subjectId === title.subjectId);
    const next = exists
      ? items.filter((item) => item.subjectId !== title.subjectId)
      : [
          {
            subjectId: title.subjectId,
            detailPath: title.detailPath,
            title: title.title,
            cover: title.cover,
            addedAt: Date.now(),
          },
          ...items,
        ];
    await writeJson(this.store, KEYS.watchlist, next);
    this.emit();
    return !exists;
  }

  async removeFromWatchlist(subjectId: string): Promise<void> {
    const next = (await this.getWatchlist()).filter((item) => item.subjectId !== subjectId);
    await writeJson(this.store, KEYS.watchlist, next);
    this.emit();
  }

  // ── Progress / Continue Watching ────────────────────────────────────────
  async getProgress(): Promise<ProgressEntry[]> {
    return readJson<ProgressEntry[]>(this.store, KEYS.progress, []);
  }

  async getProgressFor(key: string): Promise<ProgressEntry | undefined> {
    return (await this.getProgress()).find((entry) => entry.key === key);
  }

  async getContinueWatching(): Promise<ProgressEntry[]> {
    return (await this.getProgress())
      .filter((entry) => !entry.completed && entry.positionMs > 0)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async saveProgress(
    title: Title,
    positionMs: number,
    opts: { season?: number; episode?: number; durationMs?: number; completed?: boolean } = {},
  ): Promise<ProgressEntry> {
    const { season, episode } = seasonEpisodeForTitle(title, opts);
    const key = progressKey(title.subjectId, season, episode);
    const entries = await this.getProgress();
    const previous = entries.find((entry) => entry.key === key);
    const entry: ProgressEntry = {
      key,
      subjectId: title.subjectId,
      detailPath: title.detailPath,
      title: title.title,
      cover: title.cover,
      season,
      episode,
      positionMs: Math.max(0, Math.round(positionMs)),
      durationMs: opts.durationMs ?? previous?.durationMs,
      updatedAt: Date.now(),
      completed: opts.completed ?? false,
    };
    const next = [entry, ...entries.filter((item) => item.key !== key)];
    await writeJson(this.store, KEYS.progress, next);
    if (entry.completed) await this.addHistory(entry);
    this.emit();
    return entry;
  }

  async markCompleted(key: string): Promise<void> {
    const entries = await this.getProgress();
    const updated = entries.map((entry) =>
      entry.key === key ? { ...entry, completed: true, updatedAt: Date.now() } : entry,
    );
    await writeJson(this.store, KEYS.progress, updated);
    const completed = updated.find((entry) => entry.key === key);
    if (completed) await this.addHistory(completed);
    this.emit();
  }

  async removeProgress(key: string): Promise<void> {
    const next = (await this.getProgress()).filter((entry) => entry.key !== key);
    await writeJson(this.store, KEYS.progress, next);
    this.emit();
  }

  // ── History ─────────────────────────────────────────────────────────────
  async getHistory(): Promise<HistoryEntry[]> {
    return readJson<HistoryEntry[]>(this.store, KEYS.history, []);
  }

  private async addHistory(entry: ProgressEntry): Promise<void> {
    const items = await this.getHistory();
    const record: HistoryEntry = {
      key: entry.key,
      subjectId: entry.subjectId,
      detailPath: entry.detailPath,
      title: entry.title,
      cover: entry.cover,
      season: entry.season,
      episode: entry.episode,
      watchedAt: Date.now(),
    };
    await writeJson(this.store, KEYS.history, [record, ...items.filter((i) => i.key !== record.key)].slice(0, 200));
  }

  async clearHistory(): Promise<void> {
    await writeJson(this.store, KEYS.history, []);
    this.emit();
  }

  // ── Search history ──────────────────────────────────────────────────────
  async getSearchHistory(): Promise<string[]> {
    return readJson<string[]>(this.store, KEYS.searchHistory, []);
  }

  async addSearchQuery(query: string): Promise<void> {
    const clean = query.trim();
    if (clean.length < 2) return;
    const items = await this.getSearchHistory();
    await writeJson(
      this.store,
      KEYS.searchHistory,
      [clean, ...items.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 12),
    );
    this.emit();
  }

  async removeSearchQuery(query: string): Promise<void> {
    const next = (await this.getSearchHistory()).filter((item) => item !== query);
    await writeJson(this.store, KEYS.searchHistory, next);
    this.emit();
  }

  async clearSearchHistory(): Promise<void> {
    await writeJson(this.store, KEYS.searchHistory, []);
    this.emit();
  }

  // ── Onboarding ──────────────────────────────────────────────────────────
  async hasSeenOnboarding(): Promise<boolean> {
    return (await this.store.getItem(KEYS.onboardingSeen)) === 'true';
  }

  async setOnboardingSeen(): Promise<void> {
    await this.store.setItem(KEYS.onboardingSeen, 'true');
    this.emit();
  }

  // ── Downloads registry (bytes live on device, never on our backend) ──────
  async getDownloads(): Promise<DownloadEntry[]> {
    return readJson<DownloadEntry[]>(this.store, KEYS.downloads, []);
  }

  async upsertDownload(entry: DownloadEntry): Promise<void> {
    const next = [entry, ...(await this.getDownloads()).filter((item) => item.id !== entry.id)];
    await writeJson(this.store, KEYS.downloads, next);
    this.emit();
  }

  async removeDownload(id: string): Promise<void> {
    const next = (await this.getDownloads()).filter((item) => item.id !== id);
    await writeJson(this.store, KEYS.downloads, next);
    this.emit();
  }

  // ── Catalogue cache (offline: labelled `Saved`, `15.4`) ───────────────────
  async readHomeCache<T>(): Promise<T | null> {
    return readJson<T | null>(this.store, KEYS.homeCache, null);
  }

  async writeHomeCache<T>(value: T): Promise<void> {
    await writeJson(this.store, KEYS.homeCache, value);
  }
}

export const library = new LibraryStore();
