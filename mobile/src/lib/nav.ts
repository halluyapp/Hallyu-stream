/** Route contracts (§7.1): stable IDs only — never a CDN URL as a key. */
import { router } from 'expo-router';

export interface TitleRef {
  subjectId: string;
  detailPath: string;
  title: string;
  cover?: string | null;
  contentType?: 'movie' | 'series' | null;
}

export function openTitle(ref: TitleRef) {
  router.push({
    pathname: '/detail/[subjectId]',
    params: {
      subjectId: ref.subjectId,
      detailPath: ref.detailPath,
      title: ref.title,
      cover: ref.cover ?? '',
      contentType: ref.contentType ?? '',
    },
  });
}

export function openPlayer(params: {
  subjectId: string;
  detailPath: string;
  title: string;
  season: number;
  episode: number;
  positionMs?: number;
  contentType?: string;
}) {
  router.push({
    pathname: '/player',
    params: {
      subjectId: params.subjectId,
      detailPath: params.detailPath,
      title: params.title,
      season: String(params.season),
      episode: String(params.episode),
      positionMs: params.positionMs ? String(Math.round(params.positionMs)) : '0',
      contentType: params.contentType ?? 'movie',
    },
  });
}
