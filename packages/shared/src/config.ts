/**
 * Single configuration module (`01` §5, `02` §8/§10).
 * Provider base, timeouts, retry policy and media headers live here and nowhere else.
 */

export const ZAR_BASE_URL = 'https://movieapi.zarhosting.dpdns.org/api/public/v1';

/** Applied by the device player/downloader only when the stack supports custom headers. */
export const MEDIA_REQUEST_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  Referer: 'https://www.moviebox.ph/',
  Origin: 'https://www.moviebox.ph',
  'User-Agent':
    'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36',
});

export const JSON_TIMEOUT_MS = 14_000;
export const MAX_JSON_RETRIES = 1;
export const STREAM_RESOLVE_MAX_RETRIES = 2;
export const PAIRING_TTL_SECONDS = 10 * 60;
export const PAIRING_SHORT_CODE_LENGTH = 6;
export const QR_DEEP_LINK_SCHEME = 'hallyu-stream://pair';

export interface RuntimeConfig {
  providerBaseUrl?: string;
  pairingBaseUrl?: string;
  pairingClientKey?: string;
  /** Verified live before locking (`02` §6, Appendix D #2). */
  movieSeason?: number;
  movieEpisode?: number;
}

let runtime: RuntimeConfig = {};

export function configureRuntime(next: Partial<RuntimeConfig>): void {
  runtime = { ...runtime, ...next };
}

export function getRuntime(): Readonly<RuntimeConfig> {
  return runtime;
}

export function getProviderBaseUrl(): string {
  return (runtime.providerBaseUrl || ZAR_BASE_URL).replace(/\/+$/, '');
}

export function getPairingBaseUrl(): string {
  const base = runtime.pairingBaseUrl;
  if (!base) {
    throw new Error('Pairing API is not configured. Set EXPO_PUBLIC_SUPABASE_URL at app startup.');
  }
  return base.replace(/\/+$/, '');
}

export function getPairingClientKey(): string {
  return runtime.pairingClientKey || '';
}
