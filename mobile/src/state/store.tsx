import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {
  DEFAULT_SETTINGS,
  DownloadEntry,
  LibraryEntry,
  Progress,
  Settings,
  store,
} from '../core/platform';

interface AppState {
  ready: boolean;
  settings: Settings;
  library: LibraryEntry[];
  progress: Record<string, Progress>;
  downloads: DownloadEntry[];
  recentSearches: string[];
  deviceToken: string | null;
  deviceId: string | null;
  toast: string | null;

  updateSettings: (patch: Partial<Settings>) => void;
  toggleLibrary: (entry: Omit<LibraryEntry, 'addedAt'>) => void;
  isSaved: (subjectId: string) => boolean;
  saveProgress: (p: Omit<Progress, 'updatedAt'>) => void;
  progressFor: (subjectId: string, season: number, episode: number) => Progress | undefined;
  continueWatching: () => Progress[];
  addRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
  setDownload: (entry: DownloadEntry) => void;
  removeDownload: (id: string) => void;
  setDeviceToken: (token: string | null, id?: string | null) => void;
  showToast: (message: string) => void;
  resetAll: () => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

/** Progress key is exactly `{subjectId}|{season}|{episode}` — never a title. */
export const progressKey = (subjectId: string, season: number, episode: number) =>
  `${subjectId}|${season}|${episode}`;

export function AppProvider({children}: {children: React.ReactNode}) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [library, setLibrary] = useState<LibraryEntry[]>([]);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [downloads, setDownloads] = useState<DownloadEntry[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [deviceToken, setTokenState] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const [s, lib, prog, dl, rec, tok, did] = await Promise.all([
        store.settings(),
        store.library(),
        store.progress(),
        store.downloads(),
        store.recentSearches(),
        store.deviceToken(),
        store.deviceId(),
      ]);
      setSettings(s);
      setLibrary(lib);
      setProgress(prog);
      setDownloads(dl);
      setRecentSearches(rec);
      setTokenState(tok);
      setDeviceId(did);
      setReady(true);
    })();
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings(prev => {
      const next = {...prev, ...patch};
      void store.saveSettings(next);
      return next;
    });
  }, []);

  const toggleLibrary = useCallback((entry: Omit<LibraryEntry, 'addedAt'>) => {
    setLibrary(prev => {
      const exists = prev.some(e => e.subjectId === entry.subjectId);
      const next = exists
        ? prev.filter(e => e.subjectId !== entry.subjectId)
        : [{...entry, addedAt: Date.now()}, ...prev];
      void store.saveLibrary(next);
      return next;
    });
  }, []);

  const isSaved = useCallback(
    (subjectId: string) => library.some(e => e.subjectId === subjectId),
    [library],
  );

  const saveProgress = useCallback((p: Omit<Progress, 'updatedAt'>) => {
    setProgress(prev => {
      const key = progressKey(p.subjectId, p.season, p.episode);
      const next = {...prev, [key]: {...p, updatedAt: Date.now()}};
      void store.saveProgress(next);
      return next;
    });
  }, []);

  const progressFor = useCallback(
    (subjectId: string, season: number, episode: number) =>
      progress[progressKey(subjectId, season, episode)],
    [progress],
  );

  /** One row per title: the most recently watched episode that is not finished. */
  const continueWatching = useCallback(() => {
    const byTitle = new Map<string, Progress>();
    Object.values(progress).forEach(p => {
      const ratio = p.durationMs > 0 ? p.positionMs / p.durationMs : 0;
      if (ratio > 0.95 || p.positionMs < 15000) {
        return;
      }
      const existing = byTitle.get(p.subjectId);
      if (!existing || p.updatedAt > existing.updatedAt) {
        byTitle.set(p.subjectId, p);
      }
    });
    return Array.from(byTitle.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [progress]);

  const addRecentSearch = useCallback((q: string) => {
    const term = q.trim();
    if (term.length < 2) {
      return;
    }
    setRecentSearches(prev => {
      const next = [term, ...prev.filter(t => t.toLowerCase() !== term.toLowerCase())].slice(0, 8);
      void store.saveRecentSearches(next);
      return next;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    void store.saveRecentSearches([]);
  }, []);

  const setDownload = useCallback((entry: DownloadEntry) => {
    setDownloads(prev => {
      const next = [entry, ...prev.filter(d => d.id !== entry.id)];
      void store.saveDownloads(next);
      return next;
    });
  }, []);

  const removeDownload = useCallback((id: string) => {
    setDownloads(prev => {
      const next = prev.filter(d => d.id !== id);
      void store.saveDownloads(next);
      return next;
    });
  }, []);

  const setDeviceToken = useCallback((token: string | null, id?: string | null) => {
    setTokenState(token);
    void store.saveDeviceToken(token);
    if (id !== undefined) {
      setDeviceId(id);
      void store.saveDeviceId(id);
    }
  }, []);

  const resetAll = useCallback(async () => {
    await store.clearAll();
    setSettings(DEFAULT_SETTINGS);
    setLibrary([]);
    setProgress({});
    setDownloads([]);
    setRecentSearches([]);
    setTokenState(null);
    setDeviceId(null);
  }, []);

  const value = useMemo<AppState>(
    () => ({
      ready,
      settings,
      library,
      progress,
      downloads,
      recentSearches,
      deviceToken,
      deviceId,
      toast,
      updateSettings,
      toggleLibrary,
      isSaved,
      saveProgress,
      progressFor,
      continueWatching,
      addRecentSearch,
      clearRecentSearches,
      setDownload,
      removeDownload,
      setDeviceToken,
      showToast,
      resetAll,
    }),
    [
      ready, settings, library, progress, downloads, recentSearches, deviceToken, deviceId, toast,
      updateSettings, toggleLibrary, isSaved, saveProgress, progressFor, continueWatching,
      addRecentSearch, clearRecentSearches, setDownload, removeDownload, setDeviceToken, showToast, resetAll,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return v;
}
