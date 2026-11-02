/**
 * Storage contract (`08-DATA_AND_APIS.md` §3).
 * The shared layer depends on this interface only. Each app injects its real adapter:
 *   - Expo phone: AsyncStorage + expo-secure-store
 *   - TV: AsyncStorage + platform secure storage
 *   - web harness: localStorage
 * A real local DB with migrations is the production target; this adapter keeps the
 * first Phase-3 slice testable and swappable without touching UI code.
 */

export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const memory = new Map<string, string>();

export const memoryStore: KeyValueStore = {
  async getItem(key) {
    return memory.has(key) ? (memory.get(key) as string) : null;
  },
  async setItem(key, value) {
    memory.set(key, value);
  },
  async removeItem(key) {
    memory.delete(key);
  },
};

let adapter: KeyValueStore = memoryStore;
let secureAdapter: KeyValueStore = memoryStore;

export function setStorageAdapter(store: KeyValueStore): void {
  adapter = store;
}

export function setSecureStorageAdapter(store: KeyValueStore): void {
  secureAdapter = store;
}

export const storage: KeyValueStore = {
  getItem: (key) => adapter.getItem(key),
  setItem: (key, value) => adapter.setItem(key, value),
  removeItem: (key) => adapter.removeItem(key),
};

export const secureStorage: KeyValueStore = {
  getItem: (key) => secureAdapter.getItem(key),
  setItem: (key, value) => secureAdapter.setItem(key, value),
  removeItem: (key) => secureAdapter.removeItem(key),
};

export const KEYS = {
  settings: 'hallyu.settings.v1',
  watchlist: 'hallyu.watchlist.v1',
  history: 'hallyu.history.v1',
  progress: 'hallyu.progress.v1',
  downloads: 'hallyu.downloads.v1',
  searchHistory: 'hallyu.searchHistory.v1',
  homeCache: 'hallyu.homeCache.v1',
  onboardingSeen: 'hallyu.onboardingSeen.v1',
  installationId: 'hallyu.installationId.v1',
  tvDeviceToken: 'hallyu.tvDeviceToken.v1',
  tvDeviceId: 'hallyu.tvDeviceId.v1',
} as const;

export async function readJson<T>(store: KeyValueStore, key: string, fallback: T): Promise<T> {
  try {
    const raw = await store.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson<T>(store: KeyValueStore, key: string, value: T): Promise<void> {
  await store.setItem(key, JSON.stringify(value));
}

export async function remove(store: KeyValueStore, key: string): Promise<void> {
  await store.removeItem(key);
}
