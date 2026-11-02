/**
 * Offline smoke check for the shared layer — uses the TEST FIXTURE only, never production content.
 * Verifies the defensive normalisers and the `02` §5 source-selection rules.
 */
import assert from 'node:assert/strict';
import { normalizeHome, normalizeDetail, normalizeSearch, normalizeStream } from '../packages/shared/src/provider/normalize';
import { rawHomeFixture, rawDetailFixture, rawSearchFixture, rawStreamFixture, testFixture } from '../packages/shared/src/fixtures';
import { pickAutoSource, progressKey, movieSeasonEpisode, isHttpsMediaUrl } from '../packages/shared/src/playback';

const home = normalizeHome(rawHomeFixture, 1);
assert.equal(home.shelves.length, 2, 'home rows normalise into shelves');
assert.equal(home.shelves[0].label, 'Trending');
assert.equal(home.shelves[0].titles[0].subjectId, testFixture.subjectId);
assert.equal(home.shelves[0].titles[0].contentType, 'series');
assert.equal(home.shelves[0].titles[0].seasons.length, 2);
assert.equal(home.shelves[0].titles[0].releaseYear, 2008);

const detail = normalizeDetail(rawDetailFixture);
assert.ok(detail, 'detail normalises');
assert.equal(detail.title.title, testFixture.title);
assert.equal(detail.similar.length, 1);

const search = normalizeSearch(rawSearchFixture, 'breaking', 1);
assert.equal(search.titles.length, 1);
assert.equal(search.hasMore, false);

const stream = normalizeStream(rawStreamFixture);
assert.equal(stream.hasResource, true);
assert.equal(stream.captions.length, 1);
assert.equal(stream.sources.length, 3, 'cleartext + short-and-small trap are dropped');
assert.ok(stream.sources.every((s) => isHttpsMediaUrl(s.url)), 'only HTTPS media URLs survive');
assert.equal(stream.sources[0].resolution, '1080p', 'MP4 first, then higher resolution');
assert.equal(stream.sources[1].resolution, '480p');
assert.equal(stream.sources[2].url.includes('720.m3u8'), true, 'HLS kept but ranked after MP4');

const auto = pickAutoSource(stream.sources);
assert.equal(auto?.resolution, '480p', 'Auto starts at 480p on mobile');

assert.equal(progressKey('abc', 1, 2), 'abc|1|2');
assert.deepEqual(movieSeasonEpisode(), { season: 0, episode: 0 });
assert.equal(isHttpsMediaUrl('http://cdn.example.test/a.mp4'), false);

console.log('✓ shared normalisers, source selection, progress keys, HTTPS validation');
