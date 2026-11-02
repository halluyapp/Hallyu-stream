/**
 * Provider client.
 *
 * Hard architectural rule: provider JSON is resolved ON DEVICE and media bytes travel
 * CDN → device. Nothing here is proxied, cached on a server, or transcoded.
 */

const BASE = 'https://movieapi.zarhosting.dpdns.org/api/public/v1';

/**
 * Media requests are only accepted by the CDN when they look like they came from the
 * web player. Kept in exactly one place so it can never drift between screens.
 */
export const MEDIA_HEADERS: Record<string, string> = {
  Referer: 'https://www.moviebox.ph/',
  Origin: 'https://www.moviebox.ph',
  'User-Agent':
    'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
};

const JSON_HEADERS = {
  Accept: 'application/json',
  ...MEDIA_HEADERS,
};

const TIMEOUT_MS = 15000;

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: JSON_HEADERS,
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new ApiError(res.status, `Provider responded ${res.status}`);
    }
    return (await res.json()) as T;
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      throw new ApiError(0, 'The request timed out.');
    }
    if (e instanceof ApiError) {
      throw e;
    }
    throw new ApiError(0, 'Could not reach the catalogue.');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

/* ----------------------------- models ------------------------------ */

export type TitleType = 'movie' | 'series';

export interface Title {
  subjectId: string;
  detailPath: string;
  title: string;
  poster: string;
  badge?: string;
  genre?: string;
  rating?: number;
  year?: string;
  type: TitleType;
  description?: string;
}

export interface Section {
  key: string;
  title: string;
  items: Title[];
}

export interface Episode {
  season: number;
  episode: number;
  /** Stable identity: subjectId|detailPath|se|ep */
  id: string;
}

export interface Season {
  season: number;
  episodes: Episode[];
  resolutions: string[];
}

export interface Detail {
  subjectId: string;
  detailPath: string;
  title: string;
  description: string;
  poster: string;
  backdrop?: string;
  year: string;
  durationSeconds: number;
  genres: string[];
  country?: string;
  rating?: number;
  type: TitleType;
  hasResource: boolean;
  seasons: Season[];
  trailerUrl?: string;
  subtitles: string[];
}

export interface Source {
  url: string;
  quality: string;
  format: string;
  sizeBytes: number;
  durationSeconds: number;
  codec?: string;
  isHls: boolean;
}

export interface StreamInfo {
  subjectId: string;
  season: number;
  episode: number;
  sources: Source[];
  captions: Caption[];
  limited: boolean;
  note?: string;
}

export interface Caption {
  id: string;
  language: string;
  label: string;
  url: string;
}

/* --------------------------- normalisers --------------------------- */

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const num = (v: unknown): number => {
  if (typeof v === 'number' && Number.isFinite(v)) {
    return v;
  }
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

function typeOf(raw: any): TitleType {
  const t = raw?.type ?? raw?.subjectType ?? raw?.subject_type;
  if (t === 2 || t === '2' || t === 'series' || t === 'tv') {
    return 'series';
  }
  return 'movie';
}

/** Home rows are minimal: no description, sometimes no year. That is fine. */
function normaliseItem(raw: any): Title | null {
  const subjectId = str(raw?.subject_id ?? raw?.subjectId);
  const detailPath = str(raw?.slug ?? raw?.detail_path ?? raw?.detailPath);
  const title = str(raw?.name ?? raw?.title);
  if (!subjectId || !detailPath || !title) {
    return null;
  }
  return {
    subjectId,
    detailPath,
    title,
    poster: str(raw?.poster_url ?? raw?.poster ?? raw?.cover),
    badge: str(raw?.badge) || undefined,
    genre: str(raw?.genre) || undefined,
    rating: num(raw?.rating) || undefined,
    year: str(raw?.year) || undefined,
    type: typeOf(raw),
    description: str(raw?.description) || undefined,
  };
}

export function normaliseHome(payload: any): Section[] {
  const sections = arr<any>(payload?.sections ?? payload?.data?.sections);
  return sections
    .map((s, i) => ({
      key: `${str(s?.section) || 'row'}-${i}`,
      title: str(s?.section) || 'More to watch',
      items: arr<any>(s?.items)
        .map(normaliseItem)
        .filter((x): x is Title => x !== null),
    }))
    .filter(s => s.items.length > 0);
}

export function normaliseSearch(payload: any): {items: Title[]; total: number; hasMore: boolean; page: number} {
  const items = arr<any>(payload?.items ?? payload?.data?.items)
    .map(normaliseItem)
    .filter((x): x is Title => x !== null);
  return {
    items,
    total: num(payload?.total),
    hasMore: payload?.has_more === true,
    page: num(payload?.page) || 1,
  };
}

export function normaliseDetail(payload: any): Detail | null {
  const d = payload?.data ?? payload;
  const subject = d?.subject ?? d;
  const subjectId = str(subject?.subjectId ?? subject?.subject_id);
  const detailPath = str(subject?.detailPath ?? subject?.detail_path ?? subject?.slug);
  const title = str(subject?.title ?? subject?.name);
  if (!subjectId || !detailPath || !title) {
    return null;
  }

  const resource = d?.resource ?? {};
  const seasons: Season[] = arr<any>(resource?.seasons)
    .map(s => {
      const season = num(s?.se);
      const maxEp = num(s?.maxEp) || num(s?.allEp);
      const listed = arr<any>(s?.resolutions);
      const episodeSet = new Set<number>();
      listed.forEach(r => {
        const ep = num(r?.epNum);
        if (ep > 0) {
          episodeSet.add(ep);
        }
      });
      if (episodeSet.size === 0) {
        for (let i = 1; i <= maxEp; i += 1) {
          episodeSet.add(i);
        }
      }
      const episodes = Array.from(episodeSet)
        .sort((a, b) => a - b)
        .map(ep => ({season, episode: ep, id: `${subjectId}|${detailPath}|${season}|${ep}`}));
      return {
        season,
        episodes,
        resolutions: Array.from(new Set(listed.map(r => str(r?.resolution)).filter(Boolean))),
      };
    })
    .filter(s => s.episodes.length > 0)
    .sort((a, b) => a.season - b.season);

  const type = typeOf(subject);
  const genres = str(subject?.genre)
    .split(/[,/|]/)
    .map(g => g.trim())
    .filter(Boolean);

  return {
    subjectId,
    detailPath,
    title,
    description: str(subject?.description),
    poster: str(subject?.cover?.url ?? subject?.poster_url),
    backdrop: str(subject?.stills?.url) || undefined,
    year: str(subject?.releaseDate).slice(0, 4),
    durationSeconds: num(subject?.duration),
    genres,
    country: str(subject?.countryName) || undefined,
    rating: num(subject?.imdbRatingValue) || undefined,
    type,
    hasResource: subject?.hasResource !== false && seasons.length > 0,
    seasons: type === 'movie' ? [] : seasons,
    trailerUrl: str(subject?.trailer) || undefined,
    subtitles: arr<any>(subject?.subtitles)
      .map(s => str(s?.lan ?? s))
      .filter(Boolean),
  };
}

export function normaliseStream(payload: any): StreamInfo {
  const raw = arr<any>(payload?.sources);
  const sources: Source[] = raw
    .map(s => {
      const url = str(s?.url);
      if (!url) {
        return null;
      }
      const format = str(s?.format).toUpperCase() || 'MP4';
      return {
        url,
        quality: str(s?.resolution) || 'Auto',
        format,
        sizeBytes: num(s?.size),
        durationSeconds: num(s?.duration),
        codec: str(s?.codec) || undefined,
        isHls: format.includes('HLS') || url.includes('.m3u8'),
      } as Source;
    })
    .filter((x): x is Source => x !== null);

  const hls = arr<any>(payload?.hls)
    .map(h => str(h?.url))
    .filter(Boolean)
    .map<Source>(url => ({
      url,
      quality: 'Auto',
      format: 'HLS',
      sizeBytes: 0,
      durationSeconds: 0,
      isHls: true,
    }));

  const captions: Caption[] = arr<any>(payload?.captions)
    .map(c => {
      const url = str(c?.url);
      if (!url) {
        return null;
      }
      const language = str(c?.lan) || 'en';
      return {
        id: str(c?.id) || `${language}-${url.slice(-12)}`,
        language,
        label: str(c?.lanName) || language.toUpperCase(),
        url,
      } as Caption;
    })
    .filter((x): x is Caption => x !== null);

  return {
    subjectId: str(payload?.subject_id),
    season: num(payload?.se),
    episode: num(payload?.ep),
    sources: [...sources, ...hls],
    captions,
    limited: payload?.limited === true,
    note: str(payload?.note) || undefined,
  };
}

/* ------------------------ source selection ------------------------- */

const QUALITY_ORDER = ['1080p', '720p', '480p', '360p', '240p'];

function qualityRank(q: string): number {
  const i = QUALITY_ORDER.indexOf(q.toLowerCase());
  return i === -1 ? QUALITY_ORDER.length : i;
}

/**
 * Selection rules, in order:
 *  1. MP4 before HLS (seek + captions behave better on a fixed file).
 *  2. Discard stubs: a source must run longer than ~5 minutes or weigh more than 50 MB.
 *  3. Sort by resolution, best first.
 *  4. Honour the viewer's quality preference; `auto` starts at 480p on mobile and
 *     the best available on TV.
 * Never invents a quality that the provider did not return.
 */
export function selectSource(
  info: StreamInfo,
  opts: {preferred: string; isTv: boolean; fallbackToAny?: boolean},
): Source | null {
  const viable = info.sources.filter(
    s => s.durationSeconds > 300 || s.sizeBytes > 50 * 1024 * 1024,
  );
  const pool = viable.length > 0 ? viable : opts.fallbackToAny ? info.sources : [];

  const sorted = [...pool].sort((a, b) => {
    if (a.isHls !== b.isHls) {
      return a.isHls ? 1 : -1;
    }
    return qualityRank(a.quality) - qualityRank(b.quality);
  });

  if (sorted.length === 0) {
    return null;
  }

  if (opts.preferred !== 'auto') {
    const exact = sorted.find(s => s.quality.toLowerCase() === opts.preferred.toLowerCase());
    if (exact) {
      return exact;
    }
    // Preference unavailable: fall to the next best at or below it.
    const want = qualityRank(opts.preferred);
    const atOrBelow = sorted.find(s => qualityRank(s.quality) >= want);
    return atOrBelow ?? sorted[sorted.length - 1];
  }

  if (opts.isTv) {
    return sorted[0];
  }
  // Mobile Auto: start modest, let the viewer raise it.
  return sorted.find(s => s.quality === '480p') ?? sorted.find(s => s.quality === '360p') ?? sorted[0];
}

/* ---------------------------- endpoints ---------------------------- */

export const api = {
  home: (signal?: AbortSignal) => getJson<any>('/home', signal).then(normaliseHome),

  search: (q: string, page = 1, signal?: AbortSignal) =>
    getJson<any>(`/search?q=${encodeURIComponent(q)}&page=${page}`, signal).then(normaliseSearch),

  detail: (detailPath: string, signal?: AbortSignal) =>
    getJson<any>(`/detail/${encodeURIComponent(detailPath)}`, signal).then(normaliseDetail),

  /**
   * Movies are addressed with se=0&ep=0 — the provider rejects 1/1 for a film.
   */
  stream: (args: {subjectId: string; detailPath: string; season: number; episode: number}, signal?: AbortSignal) => {
    const {subjectId, detailPath, season, episode} = args;
    const se = season > 0 ? season : 0;
    const ep = episode > 0 ? episode : 0;
    const qs = `detail_path=${encodeURIComponent(detailPath)}&se=${se}&ep=${ep}`;
    return getJson<any>(`/stream/${encodeURIComponent(subjectId)}?${qs}`, signal).then(normaliseStream);
  },

  captions: (args: {subjectId: string; detailPath: string; season: number; episode: number}, signal?: AbortSignal) => {
    const {subjectId, detailPath, season, episode} = args;
    const qs = `detail_path=${encodeURIComponent(detailPath)}&se=${season}&ep=${episode}`;
    return getJson<any>(`/stream/${encodeURIComponent(subjectId)}/captions?${qs}`, signal).then(normaliseStream)
      .then(s => s.captions);
  },
};
