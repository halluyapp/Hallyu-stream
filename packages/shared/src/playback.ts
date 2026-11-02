import { getRuntime } from './config';
import type { Season, StreamSource, Title } from './types';

/** Stable progress key — never the signed CDN URL (`05` §3, `08` §6). */
export function progressKey(subjectId: string, season: number, episode: number): string {
  return `${subjectId}|${season}|${episode}`;
}

export function parseProgressKey(key: string): { subjectId: string; season: number; episode: number } | null {
  const parts = key.split('|');
  if (parts.length !== 3) return null;
  const [subjectId, se, ep] = parts;
  const season = Number(se);
  const episode = Number(ep);
  if (!subjectId || !Number.isFinite(season) || !Number.isFinite(episode)) return null;
  return { subjectId, season, episode };
}

/**
 * ONE central movie convention (`02` §6). Provider examples used 0/0 or 1/1;
 * configurable until verified against a live movie response (Appendix D #2).
 */
export function movieSeasonEpisode(): { season: number; episode: number } {
  const { movieSeason, movieEpisode } = getRuntime();
  return { season: movieSeason ?? 0, episode: movieEpisode ?? 0 };
}

export function seasonEpisodeForTitle(
  title: Pick<Title, 'contentType'>,
  explicit?: { season?: number; episode?: number },
): { season: number; episode: number } {
  if (explicit?.season !== undefined && explicit.episode !== undefined) {
    return { season: explicit.season, episode: explicit.episode };
  }
  if (title.contentType === 'movie') return movieSeasonEpisode();
  return { season: 1, episode: 1 };
}

export function formatTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '0:00';
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatBytes(bytes?: number): string {
  if (bytes === undefined || !Number.isFinite(bytes) || bytes <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  const digits = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(digits)} ${units[i]}`;
}

export function remainingLabel(positionMs: number, durationMs?: number): string {
  if (!durationMs || durationMs <= positionMs) return '—';
  const minutes = Math.max(1, Math.round((durationMs - positionMs) / 60_000));
  return `${minutes} min left`;
}

export function qualityRank(source: StreamSource): number {
  if (!source.resolution) return 0;
  const match = /(\d{3,4})\s*[pP]?/.exec(source.resolution);
  if (match) return Number(match[1]);
  const lower = source.resolution.toLowerCase();
  if (lower.includes('4k') || lower.includes('uhd')) return 2160;
  if (lower.includes('1080')) return 1080;
  if (lower.includes('720')) return 720;
  if (lower.includes('480')) return 480;
  if (lower.includes('360')) return 360;
  return 0;
}

export function isMp4(source: StreamSource): boolean {
  return (source.format || '').toUpperCase().includes('MP4') || /\.mp4(\?|$)/i.test(source.url);
}

/** `02` §5: drop only when BOTH short and small; prefer MP4, then higher resolution. */
export function selectSources(sources: StreamSource[]): StreamSource[] {
  const kept = sources.filter((source) => {
    if (!isHttpsMediaUrl(source.url)) return false;
    const short = source.duration !== undefined && source.duration <= 300;
    const small = source.size !== undefined && source.size <= 50 * 1024 * 1024;
    return !(short && small);
  });
  return kept.sort((a, b) => {
    const mp4 = Number(isMp4(b)) - Number(isMp4(a));
    if (mp4 !== 0) return mp4;
    return qualityRank(b) - qualityRank(a);
  });
}

/** Auto default on mobile: 480p → 360p → first real source (`02` §5, `13.4`). */
export function pickAutoSource(sources: StreamSource[]): StreamSource | undefined {
  const ordered = selectSources(sources);
  return (
    ordered.find((s) => qualityRank(s) === 480) ||
    ordered.find((s) => qualityRank(s) === 360) ||
    ordered[0]
  );
}

export function pickManualSource(sources: StreamSource[], quality: string): StreamSource | undefined {
  return selectSources(sources).find(
    (s) => (s.resolution || '').toLowerCase() === quality.toLowerCase(),
  );
}

export function isHttpsMediaUrl(url: string): boolean {
  // Avoid URL global (not present in every RN runtime); reject cleartext (`09` §2).
  return /^https:\/\/[^\s]+$/i.test(url);
}

export function nextEpisode(
  seasons: Season[],
  season: number,
  episode: number,
): { season: number; episode: number } | null {
  const current = seasons.find((s) => s.seasonNumber === season);
  if (current && episode < current.maxEpisodes) return { season, episode: episode + 1 };
  const sorted = [...seasons].sort((a, b) => a.seasonNumber - b.seasonNumber);
  const nextSeason = sorted.find((s) => s.seasonNumber > season && s.maxEpisodes > 0);
  if (nextSeason) return { season: nextSeason.seasonNumber, episode: 1 };
  return null;
}

export function episodeLabel(season: number, episode: number): string {
  return `S${season}:E${episode}`;
}

export function groupShortCode(code: string): string {
  const clean = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, 3)}-${clean.slice(3, 6)}`;
}
