import { JSON_MAX_RETRIES, JSON_TIMEOUT_MS, ZAR_BASE } from './config';

export class ProviderError extends Error {
  constructor(message: string, readonly kind: 'network' | 'http' | 'empty' = 'network') {
    super(message);
    this.name = 'ProviderError';
  }
}

async function fetchJsonOnce(path: string, signal?: AbortSignal): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), JSON_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);
  try {
    const res = await fetch(`${ZAR_BASE}${path}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (res.status >= 500) throw new ProviderError(`HTTP ${res.status}`, 'http');
    if (!res.ok) throw new ProviderError(`HTTP ${res.status}`, 'http');
    const text = await res.text();
    if (!text) throw new ProviderError('Empty body', 'empty');
    try {
      return JSON.parse(text);
    } catch {
      throw new ProviderError('Malformed JSON', 'empty');
    }
  } catch (err) {
    if (err instanceof ProviderError) throw err;
    throw new ProviderError(err instanceof Error ? err.message : 'Network error', 'network');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

/** GET with 12–15s timeout and at most one retry on transient failures (pack 02 §2). */
export async function getJson(path: string, signal?: AbortSignal): Promise<unknown> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= JSON_MAX_RETRIES; attempt++) {
    try {
      return await fetchJsonOnce(path, signal);
    } catch (err) {
      if (signal?.aborted) throw err;
      if (err instanceof ProviderError && err.kind === 'http' && /HTTP 4/.test(err.message)) throw err;
      lastError = err;
    }
  }
  throw lastError;
}

export function encode(value: string): string {
  return encodeURIComponent(value);
}
