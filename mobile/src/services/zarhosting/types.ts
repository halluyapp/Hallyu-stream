/** Normalised internal models (pack 02 §7). UI depends on these, never raw JSON. */

export interface Season {
  seasonNumber: number;
  maxEpisodes: number;
}

export interface Title {
  subjectId: string;
  detailPath: string;
  title: string;
  cover: string | null;
  backdrop: string | null;
  description: string | null;
  genres: string[];
  releaseYear: number | null;
  rating: string | null;
  contentType: 'movie' | 'series' | null;
  seasons: Season[];
  /** Subtitle language names advertised by the provider (no track URLs in v1). */
  subtitleLanguages: string[];
  /** Loose category/collection hints carried by home rows (for Explore). */
  categories: string[];
}

export interface StreamSource {
  resolution: string | null;
  format: string | null;
  url: string;
  sizeBytes: number | null;
  durationSec: number | null;
  codec: string | null;
}

export interface Caption {
  language: string;
  languageCode: string | null;
  url: string;
  format: string | null;
}

export interface HomeSection {
  key: string;
  label: string;
  titles: Title[];
}

export interface SearchResult {
  titles: Title[];
  page: number;
  hasMore: boolean;
}

export interface StreamResolution {
  sources: StreamSource[];
  hasResource: boolean;
  captions: Caption[];
}
