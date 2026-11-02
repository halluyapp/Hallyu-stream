/**
 * Defensive normalisers (`02` §2/§7: "do not assume response shapes stay identical forever").
 * The live provider is not reachable from this sandbox, so every field is discovered by
 * several common key names and every gap becomes `undefined` — never invented data (`15.3`).
 */

import { selectSources } from '../playback';
import type {
  Caption,
  ContentType,
  DetailPayload,
  HomePayload,
  HomeShelf,
  SearchResult,
  Season,
  StreamSource,
  Title,
} from '../types';

type Rec = Record<string, unknown>;

function isRecord(value: unknown): value is Rec {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function str(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

function num(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim();
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function bool(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1' || value === 'true') return true;
  if (value === 0 || value === '0' || value === 'false') return false;
  return undefined;
}

function first<T>(...values: Array<T | undefined>): T | undefined {
  for (const value of values) if (value !== undefined) return value;
  return undefined;
}

function field(obj: Rec, ...keys: string[]): unknown {
  for (const key of keys) {
    if (key in obj && obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
}

/** Search common container keys for the first array, one/two levels deep. */
function pickArray(root: unknown, keys: string[]): unknown[] {
  if (Array.isArray(root)) return root;
  if (!isRecord(root)) return [];
  for (const key of keys) {
    const value = root[key];
    if (Array.isArray(value)) return value;
  }
  for (const key of ['data', 'result', 'response', 'payload', 'page', 'body']) {
    const nested = root[key];
    if (isRecord(nested)) {
      const found = pickArray(nested, keys);
      if (found.length) return found;
    }
  }
  for (const value of Object.values(root)) {
    if (Array.isArray(value) && value.length && value.every((v) => isRecord(v) || typeof v === 'string')) {
      return value;
    }
  }
  return [];
}

function parseYear(value: unknown): number | undefined {
  const direct = num(value);
  if (direct && direct > 1800 && direct < 2200) return Math.round(direct);
  const text = str(value);
  if (text) {
    const match = /(18|19|20|21)\d{2}/.exec(text);
    if (match) return Number(match[0]);
  }
  return undefined;
}

function parseRating(value: unknown): number | undefined {
  const direct = num(value);
  if (direct !== undefined) return direct > 10 ? direct / 10 : direct;
  return undefined;
}

function parseSize(value: unknown): number | undefined {
  const direct = num(value);
  if (direct !== undefined) return direct > 0 ? Math.round(direct) : undefined;
  const text = str(value);
  if (!text) return undefined;
  const match = /([\d.,]+)\s*(B|KB|MB|GB|TB)/i.exec(text);
  if (!match) return undefined;
  const amount = Number(match[1].replace(/,/g, ''));
  const unit = match[2].toUpperCase();
  const multiplier: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 ** 2,
    GB: 1024 ** 3,
    TB: 1024 ** 4,
  };
  return Math.round(amount * (multiplier[unit] || 1));
}

function parseDuration(value: unknown): number | undefined {
  const direct = num(value);
  if (direct !== undefined && direct > 0) return Math.round(direct);
  const text = str(value);
  if (!text) return undefined;
  const parts = text.split(':').map((p) => Number(p));
  if (parts.some((p) => !Number.isFinite(p))) return undefined;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return undefined;
}

function normalizeGenres(value: unknown): string[] {
  if (typeof value === 'string') {
    return value
      .split(/[,|/]/)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return asArray(value)
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (isRecord(item)) return str(field(item, 'name', 'title', 'genreName', 'label', 'value'));
      return undefined;
    })
    .filter((item): item is string => Boolean(item));
}

function normalizeSeasons(value: unknown): Season[] {
  return asArray(value)
    .map((raw, index) => {
      if (!isRecord(raw)) return null;
      const seasonNumber = first(
        num(field(raw, 'se', 'season', 'seasonNumber', 'season_number', 'number', 'id')),
        index + 1,
      );
      const episodeField = field(raw, 'episodes', 'episodeList', 'list', 'items');
      const maxEpisodes = first(
        num(field(raw, 'maxEp', 'max_ep', 'maxEpisodes', 'max_episodes', 'episodeCount', 'totalEpisodes')),
        Array.isArray(episodeField) ? episodeField.length : undefined,
      );
      if (seasonNumber === undefined || maxEpisodes === undefined) return null;
      return { seasonNumber: Math.round(seasonNumber), maxEpisodes: Math.round(maxEpisodes) };
    })
    .filter((item): item is Season => item !== null)
    .sort((a, b) => a.seasonNumber - b.seasonNumber);
}

function detectContentType(raw: Rec): ContentType {
  const text = [
    str(field(raw, 'contentType', 'type', 'subjectType', 'subject_type', 'category')),
    str(field(raw, 'resource', 'has_resource')),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (/series|tv|show|season|episode|剧集|电视剧/.test(text)) return 'series';
  if (/movie|film|single|电影/.test(text)) return 'movie';
  if (normalizeSeasons(field(raw, 'seasons', 'seasonList', 'resource')).length > 0) return 'series';
  return 'unknown';
}

function imageUrl(value: unknown): string | undefined {
  if (typeof value === 'string') return value.trim() || undefined;
  if (isRecord(value)) {
    return str(field(value, 'url', 'src', 'link', 'path', 'image', 'original', 'large', 'medium'));
  }
  return undefined;
}

export function normalizeTitle(raw: unknown): Title | null {
  if (!isRecord(raw)) return null;
  const subjectId = str(field(raw, 'subjectId', 'subject_id', 'sid', 'id', 'subject_id_str'));
  const detailPath = str(field(raw, 'detailPath', 'detail_path', 'path', 'slug', 'url', 'link'));
  const title = str(field(raw, 'title', 'name', 'subjectName', 'subject_title', 'originalName'));
  if (!subjectId || !detailPath || !title) return null;

  const resource = isRecord(raw.resource) ? raw.resource : undefined;
  const nestedSubject = isRecord(raw.subject) ? raw.subject : undefined;
  const seasonsRaw = first(
    field(raw, 'seasons', 'seasonList', 'season_list'),
    resource ? field(resource, 'seasons', 'seasonList') : undefined,
    nestedSubject ? field(nestedSubject, 'seasons') : undefined,
  );
  const hasResource = first(
    bool(field(raw, 'has_resource', 'hasResource', 'hasSource')),
    resource ? bool(field(resource, 'has_resource', 'hasResource')) : undefined,
  );

  return {
    subjectId,
    detailPath,
    title,
    cover: imageUrl(field(raw, 'cover', 'poster', 'image', 'coverUrl', 'cover_url', 'verticalPoster', 'posterPath', 'img')),
    backdrop: imageUrl(
      field(raw, 'backdrop', 'backdropPath', 'backdrop_path', 'banner', 'landscapePoster', 'screenshot', 'still'),
    ),
    description: str(field(raw, 'description', 'overview', 'synopsis', 'intro', 'summary', 'plot')),
    genres: normalizeGenres(field(raw, 'genres', 'genre', 'tags', 'categoryList')),
    releaseYear: parseYear(field(raw, 'releaseYear', 'release_year', 'year', 'releaseDate', 'release_date')),
    rating: parseRating(field(raw, 'rating', 'imdb', 'imdbRating', 'score', 'douban')),
    contentType: detectContentType(raw),
    seasons: normalizeSeasons(seasonsRaw),
    hasResource: hasResource ?? undefined,
  };
}

const ROW_KEYS = ['rows', 'sections', 'groups', 'collections', 'banners', 'topList', 'lists', 'modules', 'data', 'list', 'items'];
const TITLE_KEYS = ['list', 'items', 'subjects', 'movies', 'titles', 'contents', 'data', 'content', 'results'];

export function normalizeHome(raw: unknown, fetchedAt = Date.now()): HomePayload {
  const rows = pickArray(raw, ROW_KEYS);
  const shelves: HomeShelf[] = [];

  rows.forEach((row, index) => {
    if (!isRecord(row)) return;
    const titlesRaw = pickArray(row, TITLE_KEYS);
    const titles = titlesRaw
      .map((item) => normalizeTitle(item))
      .filter((item): item is Title => item !== null);
    if (!titles.length) return;
    const label = str(field(row, 'title', 'label', 'name', 'categoryName', 'subjectName', 'header')) || `Collection ${index + 1}`;
    shelves.push({
      id: `shelf-${index}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      label,
      titles,
      category: str(field(row, 'category', 'categoryId', 'genre', 'collection', 'id')),
    });
  });

  // Fallback: a bare array of titles becomes one "Featured" shelf (Explore ladder step 3).
  if (!shelves.length) {
    const titles = asArray(isRecord(raw) ? field(raw, 'titles', 'subjects', 'items', 'list') : raw)
      .map((item) => normalizeTitle(item))
      .filter((item): item is Title => item !== null);
    if (titles.length) {
      shelves.push({ id: 'featured', label: 'Featured', titles });
    }
  }

  return { shelves, fetchedAt };
}

export function normalizeSearch(raw: unknown, query: string, page = 1): SearchResult {
  const titlesRaw = pickArray(raw, ['results', 'list', 'items', 'subjects', 'titles', 'data', 'searchResults', 'records']);
  const titles = titlesRaw
    .map((item) => normalizeTitle(item))
    .filter((item): item is Title => item !== null);
  const root = isRecord(raw) ? raw : {};
  const totalPages = num(field(root, 'totalPages', 'total_pages', 'pages', 'pageCount'));
  const hasMore = first(
    bool(field(root, 'hasMore', 'has_more', 'hasNext', 'has_next', 'nextPage')),
    totalPages !== undefined ? page < totalPages : undefined,
  );
  return {
    query,
    page,
    titles,
    hasMore: hasMore ?? titles.length >= 20,
    total: num(field(root, 'total', 'totalCount', 'total_count', 'count')),
  };
}

export function normalizeDetail(raw: unknown): DetailPayload | null {
  const root = isRecord(raw) ? raw : {};
  const candidate = first(
    isRecord(root.subject) ? root.subject : undefined,
    isRecord(root.detail) ? root.detail : undefined,
    isRecord(root.data) ? root.data : undefined,
    root,
  );
  const title = normalizeTitle(candidate);
  if (!title) return null;
  const similarRaw = pickArray(root, ['similar', 'recommends', 'recommendations', 'related', 'like', 'moreLikeThis']);
  const similar = similarRaw
    .map((item) => normalizeTitle(item))
    .filter((item): item is Title => item !== null && item.subjectId !== title.subjectId);
  return { title, similar };
}

function normalizeSources(raw: unknown): StreamSource[] {
  const list = pickArray(raw, ['sources', 'streams', 'list', 'items', 'data', 'qualities', 'videos', 'urls']);
  return list
    .map((item): StreamSource | null => {
      if (!isRecord(item)) {
        const url = str(item);
        return url ? { url } : null;
      }
      const url = imageUrl(field(item, 'url', 'link', 'src', 'playUrl', 'play_url', 'downloadUrl', 'file'));
      if (!url) return null;
      return {
        url,
        resolution: str(field(item, 'resolution', 'quality', 'label', 'name', 'definition')),
        format: str(field(item, 'format', 'type', 'ext', 'container', 'mimeType')),
        size: parseSize(field(item, 'size', 'bytes', 'fileSize', 'file_size', 'sizeText')),
        duration: parseDuration(field(item, 'duration', 'length', 'durationSeconds', 'time')),
        codec: str(field(item, 'codec', 'videoCodec')),
      };
    })
    .filter((item): item is StreamSource => item !== null);
}

export function normalizeCaptions(raw: unknown): Caption[] {
  const list = pickArray(raw, ['captions', 'subtitles', 'list', 'items', 'data', 'tracks']);
  return list
    .map((item): Caption | null => {
      if (!isRecord(item)) return null;
      const url = imageUrl(field(item, 'url', 'link', 'src', 'file', 'subtitleUrl'));
      if (!url) return null;
      return {
        url,
        language: str(field(item, 'language', 'lang', 'name', 'label', 'languageName')) || 'Unknown',
        languageCode: str(field(item, 'languageCode', 'language_code', 'code', 'iso', 'langCode')),
        format: str(field(item, 'format', 'ext', 'type')),
      };
    })
    .filter((item): item is Caption => item !== null);
}

export function normalizeStream(raw: unknown): {
  sources: StreamSource[];
  hasResource: boolean;
  captions: Caption[];
} {
  const root = isRecord(raw) ? raw : {};
  const sources = selectSources(normalizeSources(raw));
  const declared = first(
    bool(field(root, 'has_resource', 'hasResource', 'hasSource', 'playable')),
    isRecord(root.resource) ? bool(field(root.resource, 'has_resource', 'hasResource')) : undefined,
  );
  return {
    sources,
    hasResource: declared ?? sources.length > 0,
    captions: normalizeCaptions(first(field(root, 'captions', 'subtitles'), raw)),
  };
}
