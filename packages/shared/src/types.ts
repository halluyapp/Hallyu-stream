/**
 * Normalised internal models.
 * UI depends on these — never on raw provider JSON (`02-INTEGRATIONS_CATALOGUE.md` §7).
 */

export type ContentType = 'movie' | 'series' | 'unknown';

export interface Season {
  seasonNumber: number;
  maxEpisodes: number;
}

export interface Title {
  subjectId: string;
  detailPath: string;
  title: string;
  cover?: string;
  backdrop?: string;
  description?: string;
  genres: string[];
  releaseYear?: number;
  rating?: number;
  contentType: ContentType;
  seasons: Season[];
  /** `has_resource` when the provider exposes it; undefined means "not reported". */
  hasResource?: boolean;
}

export interface HomeShelf {
  id: string;
  label: string;
  titles: Title[];
  /** Category/collection metadata when the provider supplies it (Explore fallback ladder). */
  category?: string;
}

export interface HomePayload {
  shelves: HomeShelf[];
  fetchedAt: number;
}

export interface SearchResult {
  query: string;
  page: number;
  titles: Title[];
  hasMore: boolean;
  total?: number;
}

export interface DetailPayload {
  title: Title;
  /** From home/category data; hidden entirely when unavailable (Appendix C). */
  similar: Title[];
}

export interface StreamSource {
  resolution?: string;
  format?: string;
  url: string;
  size?: number;
  duration?: number;
  codec?: string;
}

export interface Caption {
  language: string;
  languageCode?: string;
  url: string;
  format?: string;
}

export interface StreamPayload {
  subjectId: string;
  detailPath: string;
  season: number;
  episode: number;
  sources: StreamSource[];
  hasResource: boolean;
  captions: Caption[];
  resolvedAt: number;
}

export type PairingStatus = 'pending' | 'approved' | 'expired' | 'rejected' | 'revoked';

export interface PairingSession {
  challengeId: string;
  shortCode?: string;
  expiresAt: string;
  qrPayload?: string;
  tvName?: string;
  tvModel?: string;
  status: PairingStatus;
  /** Returned exactly once to the TV after approval; never stored in the client long-term. */
  deviceToken?: string;
  deviceId?: string;
  ttlSeconds?: number;
}

export interface PairedDevice {
  id: string;
  displayName: string;
  model?: string;
  lastSeenAt?: string;
  createdAt: string;
  revokedAt?: string;
}

export interface ProgressEntry {
  /** `${subjectId}|${season}|${episode}` — never a signed URL (`05` §3). */
  key: string;
  subjectId: string;
  detailPath: string;
  title: string;
  cover?: string;
  season: number;
  episode: number;
  positionMs: number;
  durationMs?: number;
  updatedAt: number;
  completed: boolean;
}

export interface WatchlistItem {
  subjectId: string;
  detailPath: string;
  title: string;
  cover?: string;
  addedAt: number;
}

export interface HistoryEntry {
  key: string;
  subjectId: string;
  detailPath: string;
  title: string;
  cover?: string;
  season: number;
  episode: number;
  watchedAt: number;
}

export type DownloadStatus =
  | 'queued'
  | 'downloading'
  | 'paused'
  | 'complete'
  | 'failed'
  | 'interrupted';

export interface DownloadEntry {
  id: string;
  subjectId: string;
  detailPath: string;
  title: string;
  cover?: string;
  season: number;
  episode: number;
  quality?: string;
  /** Local file path on the device; never a CDN URL. */
  localPath?: string;
  bytes?: number;
  totalBytes?: number;
  status: DownloadStatus;
  reason?: string;
  updatedAt: number;
}

export interface Settings {
  /** `auto` or a real resolution string from sources[]. */
  defaultQuality: string;
  /** `off` or a caption language code/label seen from the provider. */
  subtitleLanguage: string;
  autoplayNext: boolean;
  wifiOnlyDownloads: boolean;
  reduceMotion: boolean;
  captionSize: 'default' | 'large';
  /** Low-memory tier: collapses the glass budget to opaque (`9.7`, `17.3`). */
  lowTier: boolean;
}

export interface ProviderError extends Error {
  status?: number;
  retryable: boolean;
  kind: 'network' | 'http' | 'parse' | 'invalid' | 'no-source';
}

export interface PairingApiError extends Error {
  status?: number;
  code?: string;
}
