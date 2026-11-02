/** Public provider API surface (pack 02 §2). */
import { encode, getJson } from './client';
import {
  normalizeCaptions,
  normalizeDetail,
  normalizeHasResource,
  normalizeHome,
  normalizeSearch,
  normalizeSources,
  selectSources,
} from './normalize';
import type { Caption, HomeSection, SearchResult, Season, StreamResolution, Title } from './types';

export async function fetchHome(signal?: AbortSignal): Promise<HomeSection[]> {
  const raw = await getJson('/home', signal);
  return normalizeHome(raw);
}

export async function searchTitles(query: string, page = 1, signal?: AbortSignal): Promise<SearchResult> {
  const raw = await getJson(`/search?q=${encode(query)}&page=${page}`, signal);
  const { titles, hasMore } = normalizeSearch(raw);
  return { titles, page, hasMore };
}

export async function fetchDetail(
  detailPath: string,
  signal?: AbortSignal,
): Promise<{ title: Title; seasons: Season[] }> {
  const raw = await getJson(`/detail/${encode(detailPath)}`, signal);
  const detail = normalizeDetail(raw);
  if (!detail) throw new Error('Unrecognised detail response');
  return detail;
}

export async function resolveStream(
  subjectId: string,
  detailPath: string,
  se: number,
  ep: number,
  signal?: AbortSignal,
): Promise<StreamResolution> {
  const raw = await getJson(
    `/stream/${encode(subjectId)}?detail_path=${encode(detailPath)}&se=${se}&ep=${ep}`,
    signal,
  );
  const sources = selectSources(normalizeSources(raw));
  return {
    sources,
    hasResource: normalizeHasResource(raw) && sources.length > 0,
    captions: normalizeCaptions(raw),
  };
}

export async function fetchCaptions(
  subjectId: string,
  detailPath: string,
  se: number,
  ep: number,
  signal?: AbortSignal,
): Promise<Caption[]> {
  const raw = await getJson(
    `/stream/${encode(subjectId)}/captions?detail_path=${encode(detailPath)}&se=${se}&ep=${ep}`,
    signal,
  );
  return normalizeCaptions(raw);
}
