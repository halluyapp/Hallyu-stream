/**
 * TEST FIXTURE ONLY — not production content (`02` §3, `11` §6: "no placeholder catalogue in release builds").
 * Synthetic provider-shaped payloads used to verify defensive normalisers offline.
 * Real catalogue always comes from the live provider JSON API.
 */

export const testFixture = {
  title: 'Breaking Bad',
  subjectId: '6207982430134357800',
  detailPath: 'breaking-bad-ej6Bp0MCAo7',
  se: 1,
  ep: 1,
} as const;

const firstTitle = {
  subjectId: testFixture.subjectId,
  detailPath: testFixture.detailPath,
  title: testFixture.title,
  cover: { url: 'https://images.example.test/bb-poster.jpg' },
  backdrop: 'https://images.example.test/bb-backdrop.jpg',
  description: 'A chemistry teacher turns to a life of crime.',
  genres: ['Drama', 'Crime'],
  releaseYear: 2008,
  rating: 8.6,
  type: 'series',
  has_resource: true,
  resource: {
    seasons: [
      { se: 1, maxEp: 7 },
      { se: 2, maxEp: 13 },
    ],
  },
};

const secondTitle = {
  id: '999',
  slug: 'sample-film',
  name: 'Sample Film',
  poster: 'https://images.example.test/film.jpg',
  year: '2021',
  imdbRating: '7.2',
  type: 'movie',
};

const thirdTitle = { subjectId: '123', detail_path: 'another-title', name: 'Another Title' };

export const rawHomeFixture = {
  code: 0,
  data: {
    rows: [
      {
        title: 'Trending',
        category: 'trending',
        list: [firstTitle, secondTitle],
      },
      {
        label: 'New this week',
        items: [thirdTitle],
      },
    ],
  },
};

export const rawDetailFixture = {
  subject: firstTitle,
  similar: [thirdTitle],
};

export const rawStreamFixture = {
  has_resource: true,
  sources: [
    { resolution: '1080p', format: 'MP4', url: 'https://cdn.example.test/1080.mp4?sig=abc', size: '1.4 GB', duration: 2820 },
    { resolution: '480p', format: 'MP4', url: 'https://cdn.example.test/480.mp4?sig=abc', size: 320 * 1024 * 1024, duration: 2820 },
    { resolution: '720p', format: 'HLS', url: 'https://cdn.example.test/720.m3u8?sig=abc' },
    // Short AND small → dropped by the `02` §5 heuristic (trap preview).
    { resolution: '1080p', format: 'MP4', url: 'https://cdn.example.test/trap.mp4?sig=abc', size: 2 * 1024 * 1024, duration: 20 },
    { resolution: '360p', format: 'MP4', url: 'http://cdn.example.test/cleartext.mp4', size: 100 * 1024 * 1024 },
  ],
  captions: [
    { language: 'English', languageCode: 'en', url: 'https://cacdn.example.test/en.srt', format: 'srt' },
  ],
};

export const rawSearchFixture = {
  results: [firstTitle],
  total: 1,
  hasMore: false,
};
