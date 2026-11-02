import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';

/* ------------------------- device detection ------------------------ */

/**
 * One universal APK, two experiences.
 *
 * React Native reports `Platform.isTV` from Android's UiModeManager, which is set by
 * the launcher on Android TV / Fire TV / Google TV devices. We treat that as the
 * authoritative signal, and additionally treat a large landscape screen with no
 * touch input as a television so sideloaded boxes behave correctly.
 */
export function detectFormFactor(): {isTv: boolean; isLowTier: boolean} {
  /**
   * Android sets `Platform.isTV` from UiModeManager, which the TV launcher
   * populates. That is the only trustworthy signal.
   *
   * A geometry heuristic used to live here as a fallback for sideloaded boxes,
   * but it matched any phone in landscape (1080x2400 satisfies "short edge >=
   * 540 and aspect > 1.5"), so rotating a phone mounted the ten-foot UI. That
   * looked like the app breaking. Geometry is gone; if a device really is a TV
   * without the flag, it can be forced from Settings.
   */
  const isTv = Platform.isTV === true;
  return {isTv, isLowTier: false};
}

/* ----------------------------- storage ----------------------------- */

const K = {
  settings: '@hallyu/settings',
  library: '@hallyu/library',
  progress: '@hallyu/progress',
  downloads: '@hallyu/downloads',
  deviceToken: '@hallyu/deviceToken',
  deviceId: '@hallyu/deviceId',
  onboarded: '@hallyu/onboarded',
  recentSearches: '@hallyu/recentSearches',
  pairingBase: '@hallyu/pairingBase',
} as const;

async function read<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function write(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage is best-effort; a failed write must never break playback.
  }
}

export const store = {
  async settings(): Promise<Settings> {
    return read<Settings>(K.settings, DEFAULT_SETTINGS);
  },
  saveSettings: (v: Settings) => write(K.settings, v),

  async library(): Promise<LibraryEntry[]> {
    return read<LibraryEntry[]>(K.library, []);
  },
  saveLibrary: (v: LibraryEntry[]) => write(K.library, v),

  async progress(): Promise<Record<string, Progress>> {
    return read<Record<string, Progress>>(K.progress, {});
  },
  saveProgress: (v: Record<string, Progress>) => write(K.progress, v),

  async downloads(): Promise<DownloadEntry[]> {
    return read<DownloadEntry[]>(K.downloads, []);
  },
  saveDownloads: (v: DownloadEntry[]) => write(K.downloads, v),

  async recentSearches(): Promise<string[]> {
    return read<string[]>(K.recentSearches, []);
  },
  saveRecentSearches: (v: string[]) => write(K.recentSearches, v),

  async deviceToken(): Promise<string | null> {
    return read<string | null>(K.deviceToken, null);
  },
  saveDeviceToken: (v: string | null) => write(K.deviceToken, v),
  async deviceId(): Promise<string | null> {
    return read<string | null>(K.deviceId, null);
  },
  saveDeviceId: (v: string | null) => write(K.deviceId, v),

  async pairingBase(): Promise<string | null> {
    return read<string | null>(K.pairingBase, null);
  },
  savePairingBase: (v: string) => write(K.pairingBase, v),

  async onboarded(): Promise<boolean> {
    return read<boolean>(K.onboarded, false);
  },
  saveOnboarded: () => write(K.onboarded, true),

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(K));
  },
};

/* ------------------------------ types ------------------------------ */

export interface Settings {
  autoplayNext: boolean;
  wifiOnlyDownloads: boolean;
  preferredQuality: 'auto' | '360p' | '480p' | '720p' | '1080p';
  subtitlesOn: boolean;
  subtitleLanguage: string;
  reduceEffects: boolean;
  pairingBaseUrl: string;
}

export const DEFAULT_SETTINGS: Settings = {
  autoplayNext: true,
  wifiOnlyDownloads: true,
  preferredQuality: 'auto',
  subtitlesOn: false,
  subtitleLanguage: 'en',
  reduceEffects: false,
  pairingBaseUrl: '',
};

export interface LibraryEntry {
  subjectId: string;
  detailPath: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  addedAt: number;
}

export interface Progress {
  subjectId: string;
  detailPath: string;
  title: string;
  poster: string;
  season: number;
  episode: number;
  positionMs: number;
  durationMs: number;
  updatedAt: number;
}

export interface DownloadEntry {
  id: string;
  subjectId: string;
  detailPath: string;
  title: string;
  poster: string;
  season: number;
  episode: number;
  quality: string;
  url: string;
  status: 'queued' | 'downloading' | 'ready' | 'failed';
  bytes: number;
  createdAt: number;
}

/* ---------------------------- formatting --------------------------- */

/** 3501 → "58:21" ; 3725 → "1:02:05" */
export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return '—';
  }
  const s = Math.floor(totalSeconds % 60);
  const m = Math.floor((totalSeconds / 60) % 60);
  const h = Math.floor(totalSeconds / 3600);
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function formatPosition(ms: number): string {
  return formatDuration(Math.max(0, ms / 1000));
}

export function progressRatio(positionMs: number, durationMs: number): number {
  if (!durationMs || durationMs <= 0) {
    return 0;
  }
  return Math.min(1, Math.max(0, positionMs / durationMs));
}

export function formatYear(releaseDate?: string | null): string {
  if (!releaseDate) {
    return '';
  }
  const m = /(\d{4})/.exec(releaseDate);
  return m ? m[1] : '';
}

export function humanBytes(bytes: number): string {
  if (!bytes) {
    return '—';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) {
    return 'just now';
  }
  if (min < 60) {
    return `${min}m ago`;
  }
  const h = Math.floor(min / 60);
  if (h < 24) {
    return `${h}h ago`;
  }
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : `${d}d ago`;
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
