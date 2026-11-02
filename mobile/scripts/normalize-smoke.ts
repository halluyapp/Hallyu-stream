/**
 * Normaliser smoke test against captured live provider payloads.
 * Run: bun scripts/normalize-smoke.ts
 * Refresh captures: curl -s "$BASE/detail/breaking-bad-ej6Bp0MCAo7" > /tmp/detail.json etc.
 */
import { readFileSync } from 'node:fs';
import { normalizeDetail, normalizeHome, normalizeSearch, normalizeSources, selectSources } from '../src/services/zarhosting/normalize';

function check(name: string, ok: boolean, detail?: string) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
}

const detail = JSON.parse(readFileSync('/tmp/detail.json', 'utf8'));
const d = normalizeDetail(detail);
check('detail parses', !!d);
if (d) {
  const t = d.title;
  check('detail title', t.title === 'Breaking Bad S1-S5', t.title);
  check('detail id', t.subjectId === '6207982430134357800');
  check('detail slug', t.detailPath === 'breaking-bad-ej6Bp0MCAo7');
  check('detail cover', !!t.cover && t.cover.startsWith('https://'));
  check('detail year', t.releaseYear === 2008, String(t.releaseYear));
  check('detail rating', t.rating === '9.5', String(t.rating));
  check('detail genres', t.genres.join(',') === 'Crime,Drama,Thriller', t.genres.join(','));
  check('detail series', t.contentType === 'series', String(t.contentType));
  check('detail seasons', d.seasons.length > 0 && d.seasons[0]!.seasonNumber === 1 && d.seasons[0]!.maxEpisodes === 7, JSON.stringify(d.seasons));
  check('detail subtitle langs', t.subtitleLanguages.includes('English'));
}

const home = JSON.parse(readFileSync('/tmp/home.json', 'utf8'));
const rows = normalizeHome(home);
check('home rows parsed', rows.length > 0, `${rows.length} rows`);
const banner = rows[0];
if (banner) {
  check('home banner label', /banner/i.test(banner.label), banner.label);
  check('home items', banner.titles.length > 0 && !!banner.titles[0]!.cover && !!banner.titles[0]!.detailPath, JSON.stringify(banner.titles[0]).slice(0, 160));
}

const search = JSON.parse(readFileSync('/tmp/search.json', 'utf8'));
const s = normalizeSearch(search);
check('search items', s.titles.length > 0);
const first = s.titles[0];
if (first) {
  check('search hasMore', s.hasMore === true, String(s.hasMore));
  check('search fields', !!first.detailPath && !!first.cover, `${first.title} / ${first.detailPath}`);
}

const stream = JSON.parse(readFileSync('/tmp/stream.json', 'utf8'));
const sources = selectSources(normalizeSources(stream));
check('stream sources', sources.length > 0, JSON.stringify(sources.map((x) => x.resolution)));
check('stream mp4-first', sources[0]?.format === 'MP4', String(sources[0]?.format));
check('no preview trap', (sources[0]?.durationSec ?? 0) > 300, String(sources[0]?.durationSec));
