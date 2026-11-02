/** Defensive normalisers — provider shapes may drift (pack 02 §2). */
import type { Caption, Season, StreamSource, Title } from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */

type Any = Record<string, any>;

function str(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number') return String(value);
  return null;
}

function num(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function list(value: unknown): Any[] {
  if (Array.isArray(value)) return value.filter((v) => v && typeof v === 'object');
  return [];
}

/** Map any plausible content-type marker to our union. */
function contentType(value: unknown): 'movie' | 'series' | null {
  const raw = str(value)?.toLowerCase() ?? '';
  if (raw.includes('serie') || raw === 'tv' || raw === 'show') return 'series';
  if (raw.includes('movie') || raw === 'film') return 'movie';
  return null;
}

export function normalizeTitle(raw: Any, categories: string[] = []): Title | null {
  const subjectId = str(raw.subjectId ?? raw.subject_id ?? raw.id ?? raw.subjectID);
  const title = str(raw.title ?? raw.name);
  if (!subjectId || !title) return null;

  const detailPath = str(
    raw.detailPath ??
      raw.detail_path ??
      raw.path ??
      raw.detail ??
      (typeof raw.detailUrl === 'string' ? raw.detailUrl.split('/').pop() : null),
  );
  if (!detailPath) return null;

  const seasons: Season[] = list(raw.seasons ?? raw.resource?.seasons)
    .map((s) => ({
      seasonNumber: num(s.se ?? s.season ?? s.seasonNumber ?? s.number) ?? 1,
      maxEpisodes: num(s.maxEp ?? s.max_ep ?? s.maxEpisodes ?? s.episodes) ?? 0,
    }))
    .filter((s) => s.seasonNumber > 0);

  const genres = Array.isArray(raw.genres)
    ? raw.genres.map((g: unknown) => str(typeof g === 'object' ? (g as Any)?.name : g)).filter((g): g is string => !!g)
    : [];

  const year = num(raw.releaseYear ?? raw.year ?? raw.release_year);
  const rating = str(raw.rating ?? raw.score);

  return {
    subjectId,
    detailPath,
    title,
    cover: str(raw.cover ?? raw.poster ?? raw.image ?? raw.thumb),
    backdrop: str(raw.backdrop ?? raw.background ?? raw.fanart),
    description: str(raw.description ?? raw.overview ?? raw.synopsis ?? raw.plot),
    genres,
    releaseYear: year && year > 1900 && year < 2100 ? year : null,
    rating: rating ? (num(rating) !== null ? String(num(rating)) : rating) : null,
    contentType: contentType(raw.contentType ?? raw.type ?? raw.mediaType),
    seasons,
    categories,
  };
}

export function normalizeTitleList(raw: unknown, categories: string[] = []): Title[] {
  const rows = list(raw as Any).length ? list(raw as Any) : list((raw as Any)?.data).length ? list((raw as Any)?.data) : [];
  const seen = new Set<string>();
  const out: Title[] = [];
  for (const row of rows) {
    const title = normalizeTitle(row, categories);
    if (title && !seen.has(title.subjectId)) {
      seen.add(title.subjectId);
      out.push(title);
    }
  }
  return out;
}

export interface HomeRow {
  key: string;
  label: string;
  titles: Title[];
}

/**
 * Normalise the /home payload into ordered sections. The provider shape may be
 * an object of named rows or a list with category metadata — handle both.
 */
export function normalizeHome(raw: unknown): HomeRow[] {
  const out: HomeRow[] = [];
  const push = (key: string, label: string, titles: Title[]) => {
    if (titles.length) out.push({ key, label, titles });
  };

  if (Array.isArray(raw)) {
    for (let i = 0; i < raw.length; i++) {
      const row = raw[i] as Any;
      const label = str(row.title ?? row.name ?? row.category) ?? `Section ${i + 1}`;
      const cats = [label];
      push(String(row.id ?? row.key ?? label), label, normalizeTitleList(row.items ?? row.list ?? row.data ?? row, cats));
    }
    return out;
  }

  const data = (raw as Any)?.data ?? raw;
  if (data && typeof data === 'object') {
    for (const [key, value] of Object.entries(data as Any)) {
      if (key === 'code' || key === 'message' || key === 'status') continue;
      const label = key.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      push(key, label, normalizeTitleList(value, [label]));
    }
  }
  return out;
}

export function normalizeSearch(raw: unknown): { titles: Title[]; hasMore: boolean } {
  const data = (raw as Any)?.data ?? raw;
  const rows = Array.isArray(data) ? data : list((data as Any)?.items ?? (data as Any)?.list ?? (data as Any)?.results);
  const titles = normalizeTitleList(rows);
  const page = num((data as Any)?.page) ?? 1;
  const totalPages = num((data as Any)?.totalPages ?? (data as Any)?.total_pages) ?? num((data as Any)?.pages);
  const hasMore = totalPages !== null ? page < totalPages : titles.length > 0;
  return { titles, hasMore };
}

export function normalizeDetail(raw: unknown): { title: Title; seasons: Season[] } | null {
  const data = ((raw as Any)?.data ?? raw) as Any;
  const inner = data?.resource ?? data?.detail ?? data;
  const normalized = normalizeTitle({ ...inner, ...data });
  if (!normalized) return null;
  const seasons: Season[] = list(inner?.seasons ?? data?.seasons)
    .map((s) => ({
      seasonNumber: num(s.se ?? s.season ?? s.seasonNumber ?? s.number) ?? 1,
      maxEpisodes: num(s.maxEp ?? s.max_ep ?? s.maxEpisodes ?? s.episodes) ?? 0,
    }))
    .filter((s) => s.seasonNumber > 0 && s.maxEpisodes > 0);
  return { title: normalized, seasons: seasons.length ? seasons : normalized.seasons };
}

/** Map raw source entries into StreamSource (field names may vary slightly — pack 02 §4). */
export function normalizeSources(raw: unknown): StreamSource[] {
  const data = (raw as Any)?.data ?? raw;
  const rows = list((data as Any)?.sources ?? (data as Any)?.source ?? (data as Any)?.resources);
  const out: StreamSource[] = [];
  for (const row of rows) {
    const url = str(row.url ?? row.link ?? row.src);
    if (!url || !/^https:\/\//.test(url)) continue;
    const resolution = str(row.resolution ?? row.quality ?? row.label);
    const format = str(row.format ?? row.ext ?? row.container);
    const sizeBytes = num(row.size ?? row.bytes);
    const durationSec = num(row.duration ?? row.seconds);
    out.push({
      resolution,
      format: format ? format.toUpperCase() : null,
      url,
      sizeBytes: sizeBytes !== null ? (sizeBytes < 1e7 ? sizeBytes : sizeBytes) : null,
      durationSec,
      codec: str(row.codec),
    });
  }
  return out;
}

/**
 * Source selection heuristic (pack 02 §5): drop entries that are BOTH short
 * (<~300s) AND small (<~50MB) — labelled-1080p trap previews.
 */
export function selectSources(sources: StreamSource[]): StreamSource[] {
  const viable = sources.filter((s) => {
    const short = s.durationSec !== null && s.durationSec < 300;
    const small = s.sizeBytes !== null && s.sizeBytes < 50 * 1024 * 1024;
    const unknown = s.durationSec === null && s.sizeBytes === null;
    return unknown || (!short && !small) || (short !== small);
  });
  const pool = viable.length ? viable : sources;
  const score = (s: StreamSource) => {
    const mp4 = s.format?.toUpperCase() === 'MP4' ? 1 : 0;
    const res = Number(String(s.resolution ?? '').replace(/\D/g, '')) || 0;
    return mp4 * 10000 + res;
  };
  return [...pool].sort((a, b) => score(b) - score(a));
}

export function normalizeCaptions(raw: unknown): Caption[] {
  const data = (raw as Any)?.data ?? raw;
  const rows = list((data as Any)?.captions ?? (data as Any)?.subtitles ?? (data as Any)?.tracks ?? data);
  const out: Caption[] = [];
  for (const row of rows) {
    const url = str(row.url ?? row.link ?? row.file ?? row.src);
    if (!url || !/^https:\/\//.test(url)) continue;
    out.push({
      language: str(row.language ?? row.lang ?? row.label) ?? 'Unknown',
      languageCode: str(row.languageCode ?? row.language_code ?? row.code ?? row.langCode),
      url,
      format: str(row.format ?? row.ext),
    });
  }
  return out;
}

export function normalizeHasResource(raw: unknown): boolean {
  const data = (raw as Any)?.data ?? raw;
  const flag = (data as Any)?.has_resource ?? (data as Any)?.hasResource;
  if (flag !== undefined) return Boolean(flag);
  return true;
}
