import { getProviderBaseUrl, JSON_TIMEOUT_MS, MAX_JSON_RETRIES } from '../config';
import type {
  Caption,
  DetailPayload,
  HomePayload,
  ProviderError,
  SearchResult,
  StreamPayload,
} from '../types';
import { normalizeCaptions, normalizeDetail, normalizeHome, normalizeSearch, normalizeStream } from './normalize';

export class ProviderErrorImpl extends Error implements ProviderError {
  status?: number;
  retryable: boolean;
  kind: ProviderError['kind'];

  constructor(message: string, kind: ProviderError['kind'], retryable: boolean, status?: number) {
    super(message);
    this.name = 'ProviderError';
    this.kind = kind;
    this.retryable = retryable;
    this.status = status;
  }
}

export interface StreamParams {
  subjectId: string;
  detailPath: string;
  season: number;
  episode: number;
}

type FetchImpl = typeof fetch;

export interface ZarhostingClientOptions {
  fetchImpl?: FetchImpl;
  timeoutMs?: number;
  retries?: number;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** JSON-only client. It never fetches video bytes (`01` §3, ADR 001). */
export class ZarhostingClient {
  private readonly fetchImpl: FetchImpl;
  private readonly timeoutMs: number;
  private readonly retries: number;

  constructor(options: ZarhostingClientOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.timeoutMs = options.timeoutMs ?? JSON_TIMEOUT_MS;
    this.retries = options.retries ?? MAX_JSON_RETRIES;
  }

  private async request(path: string): Promise<unknown> {
    const url = `${getProviderBaseUrl()}${path}`;
    let lastError: ProviderErrorImpl | undefined;

    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await this.fetchImpl(url, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        if (!response.ok) {
          const retryable = response.status >= 500 || response.status === 429;
          throw new ProviderErrorImpl(
            `Provider returned HTTP ${response.status}`,
            'http',
            retryable,
            response.status,
          );
        }
        const text = await response.text();
        try {
          return JSON.parse(text) as unknown;
        } catch {
          throw new ProviderErrorImpl('Provider response was not valid JSON', 'parse', false);
        }
      } catch (error) {
        if (error instanceof ProviderErrorImpl) {
          lastError = error;
        } else {
          const aborted = error instanceof Error && error.name === 'AbortError';
          lastError = new ProviderErrorImpl(
            aborted ? 'Catalogue request timed out' : 'Could not reach the catalogue',
            'network',
            true,
          );
        }
        if (!lastError.retryable || attempt >= this.retries) break;
        await sleep(200 * (attempt + 1));
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError ?? new ProviderErrorImpl('Unknown provider error', 'network', true);
  }

  async getHome(): Promise<HomePayload> {
    return normalizeHome(await this.request('/home'));
  }

  async search(query: string, page = 1): Promise<SearchResult> {
    const path = `/search?q=${encodeURIComponent(query)}&page=${encodeURIComponent(String(page))}`;
    return normalizeSearch(await this.request(path), query, page);
  }

  async getDetail(detailPath: string): Promise<DetailPayload> {
    const path = `/detail/${encodeURIComponent(detailPath)}`;
    const detail = normalizeDetail(await this.request(path));
    if (!detail) {
      throw new ProviderErrorImpl('Detail response did not contain stable title identifiers', 'invalid', false);
    }
    return detail;
  }

  async getStream(params: StreamParams): Promise<StreamPayload> {
    const path =
      `/stream/${encodeURIComponent(params.subjectId)}` +
      `?detail_path=${encodeURIComponent(params.detailPath)}` +
      `&se=${encodeURIComponent(String(params.season))}` +
      `&ep=${encodeURIComponent(String(params.episode))}`;
    const normalised = normalizeStream(await this.request(path));
    return {
      ...params,
      ...normalised,
      resolvedAt: Date.now(),
    };
  }

  async getCaptions(params: StreamParams): Promise<Caption[]> {
    const path =
      `/stream/${encodeURIComponent(params.subjectId)}/captions` +
      `?detail_path=${encodeURIComponent(params.detailPath)}` +
      `&se=${encodeURIComponent(String(params.season))}` +
      `&ep=${encodeURIComponent(String(params.episode))}`;
    return normalizeCaptions(await this.request(path));
  }

  /**
   * Captions are loaded in parallel and MUST NOT block video (`05` §5, `13.8`).
   * A captions failure yields an empty list, never a thrown playback error.
   */
  async resolveStream(params: StreamParams): Promise<StreamPayload> {
    const [stream, captions] = await Promise.all([
      this.getStream(params),
      this.getCaptions(params).catch(() => [] as Caption[]),
    ]);
    return { ...stream, captions: stream.captions.length ? stream.captions : captions };
  }
}

export const zarhosting = new ZarhostingClient();
