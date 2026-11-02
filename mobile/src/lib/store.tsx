/** Local-first library store (progress, watchlist, history, settings). */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as db from './db';

export interface LibraryState {
  ready: boolean;
  progress: db.ProgressRow[];
  watchlist: db.WatchlistRow[];
  history: db.HistoryRow[];
  searchHistory: string[];
  settings: {
    defaultQuality: string; // 'auto' | '360p' | ...
    autoplayNext: boolean;
    reduceMotion: boolean | null; // null = follow system
  };
  refresh: () => Promise<void>;
  toggleWatchlist: (item: Omit<db.WatchlistRow, 'addedAt'>) => Promise<'added' | 'removed'>;
  removeProgress: (key: string) => Promise<void>;
  removeHistory: (id: number) => Promise<void>;
  clearHistory: () => Promise<void>;
  addSearchQuery: (q: string) => Promise<void>;
  clearSearchHistory: () => Promise<void>;
  setSetting: (key: string, value: string) => Promise<void>;
  getProgress: (subjectId: string, se: number, ep: number) => Promise<db.ProgressRow | null>;
  addHistory: (entry: { subjectId: string; detailPath: string; title: string; cover: string | null; season: number; episode: number }) => Promise<void>;
  saveProgress: typeof db.saveProgress;
}

const LibraryContext = createContext<LibraryState | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState<db.ProgressRow[]>([]);
  const [watchlist, setWatchlist] = useState<db.WatchlistRow[]>([]);
  const [history, setHistory] = useState<db.HistoryRow[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [settings, setSettingsState] = useState({
    defaultQuality: 'auto',
    autoplayNext: true,
    reduceMotion: null as boolean | null,
  });

  const refresh = useCallback(async () => {
    const [p, w, h, s] = await Promise.all([db.allProgress(), db.listWatchlist(), db.listHistory(), db.listSearchHistory()]);
    setProgress(p);
    setWatchlist(w);
    setHistory(h);
    setSearchHistory(s);
    const [q, a, r] = await Promise.all([
      db.getSetting('defaultQuality'),
      db.getSetting('autoplayNext'),
      db.getSetting('reduceMotion'),
    ]);
    setSettingsState({
      defaultQuality: q ?? 'auto',
      autoplayNext: a !== 'off',
      reduceMotion: r === null ? null : r === 'on',
    });
  }, []);

  useEffect(() => {
    refresh()
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, [refresh]);

  const toggleWatchlist = useCallback(
    async (item: Omit<db.WatchlistRow, 'addedAt'>) => {
      const result = await db.toggleWatchlist(item);
      await refresh();
      return result;
    },
    [refresh],
  );

  const removeProgress = useCallback(
    async (key: string) => {
      await db.removeProgress(key);
      await refresh();
    },
    [refresh],
  );

  const removeHistory = useCallback(
    async (id: number) => {
      await db.removeHistory(id);
      await refresh();
    },
    [refresh],
  );

  const clearHistory = useCallback(
    async () => {
      await db.clearHistory();
      await refresh();
    },
    [refresh],
  );

  const addSearchQuery = useCallback(
    async (q: string) => {
      await db.addSearchHistory(q);
      await refresh();
    },
    [refresh],
  );

  const clearSearchHistory = useCallback(
    async () => {
      await db.clearSearchHistory();
      await refresh();
    },
    [refresh],
  );

  const setSetting = useCallback(
    async (key: string, value: string) => {
      await db.setSetting(key, value);
      await refresh();
    },
    [refresh],
  );

  const getProgress = useCallback(
    async (subjectId: string, se: number, ep: number) => {
      await refresh();
      return db.getProgress(subjectId, se, ep);
    },
    [refresh],
  );

  const value = useMemo<LibraryState>(
    () => ({
      ready,
      progress,
      watchlist,
      history,
      searchHistory,
      settings,
      refresh,
      toggleWatchlist,
      removeProgress,
      removeHistory,
      clearHistory,
      addSearchQuery,
      clearSearchHistory,
      setSetting,
      getProgress,
      addHistory: db.addHistory,
      saveProgress: db.saveProgress,
    }),
    [ready, progress, watchlist, history, searchHistory, settings, refresh, toggleWatchlist, removeProgress, removeHistory, clearHistory, addSearchQuery, clearSearchHistory, setSetting, getProgress],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryState {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used inside LibraryProvider');
  return ctx;
}
