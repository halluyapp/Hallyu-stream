/**
 * Single configuration module for the zarhosting provider and media CDN
 * (architecture pack 02 §10). Change hosts/headers here only.
 */

export const ZAR_BASE = 'https://movieapi.zarhosting.dpdns.org/api/public/v1';

/** Timeouts: 12–15s for JSON (pack 02 §2). */
export const JSON_TIMEOUT_MS = 15000;

/** At most one retry on transient 5xx / network (pack 02 §2). */
export const JSON_MAX_RETRIES = 1;

/**
 * Browser-like headers for device media requests to the provider CDN
 * (pack 02 §8). Applied from one module; never proxied server-side.
 */
export const MEDIA_HEADERS: Record<string, string> = {
  Referer: 'https://www.moviebox.ph/',
  Origin: 'https://www.moviebox.ph',
  'User-Agent':
    'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36',
};
