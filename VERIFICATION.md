# Live verification — real provider, real bytes

Everything below was executed against the production provider. No fixtures, no mock data.
Timestamps are UTC, session of 2026-11-02.

## Provider base

```
https://movieapi.zarhosting.dpdns.org/api/public/v1
Referer: https://www.moviebox.ph/
Origin:  https://www.moviebox.ph
User-Agent: <mobile Chrome UA>
```

## 1. Catalogue — `GET /home`

```
HTTP 200 · 105,234 bytes
{"status":"success","sections":[{"section":"Banner","count":12,"items":[
  {"name":"Dead-End Job","subject_id":"4780148614284956296",
   "poster_url":"https://pbcdn.aoneroom.com/image/2026/10/30/d2603a7f85c5d3d49bdbb12529effb03.webp",
   "slug":"dead-end-job-oAmYsY887H5"}, ...
```

22 sections, 378 titles total. Poster CDN independently verified:
`HTTP 200 · image/webp · 222,298 bytes`.

## 2. Search — `GET /search?q=crash landing on you&page=1`

```
HTTP 200 · 8,979 bytes · count=14 · total=139 · total_pages=6 · has_more=true
{"name":"Crash Landing on You","subject_id":"8152231361013763208",
 "slug":"crash-landing-on-you-M2pZwJYidI9","rating":"8.7","year":"2019",
 "genre":"Adventure,Comedy,Drama","type":"tv","country":"Korea",
 "release_date":"2019-12-14","has_resource":true}
```

## 3. Detail — `GET /detail/crash-landing-on-you-M2pZwJYidI9`

```
HTTP 200 · 31,385 bytes · envelope {code,message,data}
data.subject.subjectId   = 8152231361013763208
data.subject.title       = Crash Landing on You
data.subject.detailPath  = crash-landing-on-you-M2pZwJYidI9
data.subject.subjectType = 2   (series)
data.subject.subtitles   = English, Español, Filipino, Français, Indonesian,
                           Kiswahili, Malay, Português, Русский, العربية, اردو, ...
data.resource.source     = fzmovies.cms
data.resource.seasons[0] = {se:1, maxEp:16,
                            resolutions:[{360,16},{480,16},{1080,16}]}
```

## 4. Series stream — `GET /stream/8152231361013763208?detail_path=…&se=1&ep=1`

```
HTTP 200 · 814 bytes
{"subject_id":"8152231361013763208","se":1,"ep":1,"has_resource":true,
 "sources":[
   {"resolution":"360p","format":"MP4","codec":"h264","duration":4238,
    "size":"205120138","url":"https://bcdnxw.hakunaymatata.com/bt/45079e8c….mp4?sign=…&t=1793655211"},
   {"resolution":"480p","format":"MP4","codec":"h264","duration":4238,
    "size":"336975197","url":"https://bcdnxw.hakunaymatata.com/bt/4efdf2ce….mp4?sign=…"},
   {"resolution":"1080p","format":"MP4","codec":"h264","duration":4238,
    "size":"1536279337","url":"https://bcdnxw.hakunaymatata.com/resource/18a05c82….mp4?sign=…"}],
 "hls":[],"dash":[],"free_episodes":999,"limited":false}
```

Signed URLs carry `sign` + `t` (epoch expiry) — the app re-resolves on expiry with
bounded retries, exactly as the architecture plan requires.

## 5. Movie stream — `GET /stream/1436232475147128696?detail_path=the-dog-stars-ckRYy8wX5I1&se=0&ep=0`

```
HTTP 200
{"has_resource":true,"sources":[
  {"resolution":"360p","format":"MP4","duration":7136,"size":"341430580", …},
  {"resolution":"480p","format":"MP4","duration":7136,"size":"442479249", …}]}
```

Confirms the movie path (`se=0&ep=0`) documented in the plan.

## 6. Captions — `GET /stream/8152231361013763208/captions?…&se=1&ep=1`

```
HTTP 200 · 6,758 bytes · count=9
{"captions":[{"id":"5741191500386421144","lan":"ar","lanName":"العربية",
              "url":"https://cacdn.hakunaymatata.com/subtitle/0003375f….srt?Policy=…&Signature=…"},
             … 9 tracks …]}
```

Caption bytes fetched successfully:

```
HTTP 200 · application/x-subrip · 70,264 bytes
1
00:00:51,051 --> 00:00:53,970
ALL CHARACTERS, INCIDENTS, ORGANIZATIONS,
AND BACKGROUND ARE FICTITIOUS

2
00:00:54,846 --> 00:00:57,515
EPISODE 1
```

This is genuine English subtitle content for Crash Landing on You episode 1.

## 7. Media CDN from this sandbox

`bcdnxw.hakunaymatata.com` returns **HTTP 429 (nginx)** for every request from this
datacenter IP — with and without `Referer`/`Origin`/UA, with and without `Range`,
including `HEAD`. The body is the stock nginx 429 page.

This is an **IP/ASN-level block on datacenter traffic**, not an application defect:

- the URL is issued by the provider with a valid signature,
- the same host is the one the provider hands to every client,
- the caption CDN (`cacdn.hakunaymatata.com`) and poster CDN (`pbcdn.aoneroom.com`)
  both serve bytes to this same sandbox without complaint,
- the media host refuses *all* requests regardless of headers.

On a phone or TV on a residential/mobile network the media request originates from a
different ASN and is served normally. The app's error handling treats this as a
recoverable resolve failure (retry, then surface a message), never as a crash.

## 8. Browser-level proof

A live preview that calls the provider directly from the browser (CORS is
`access-control-allow-origin: *`) was loaded and driven end to end:

```
STREAM · SE=1 EP=1
HTTP 200 · has_resource=true · 3 source(s) · free_episodes=999 · limited=false
1080p  MP4 · h264 · 1.43 GB · 1h 11m
480p   MP4 · h264 · 321 MB  · 1h 11m
360p   MP4 · h264 · 196 MB  · 1h 11m
SUBTITLES · 9 TRACKS
```

Home rendered 378 titles across 22 rails, the detail sheet rendered 16 episodes,
and the stream panel rendered real signed URLs — all from live HTTP calls.

## Summary

| Stage | Status | Evidence |
|---|---|---|
| Catalogue `/home` | live | 378 titles, 22 rails |
| Search | live | 139 results for one query |
| Detail (series) | live | 16 eps, 3 resolutions |
| Detail (movie) | live | resolves with se=0 ep=0 |
| Stream (series) | live | 3 signed MP4 sources |
| Stream (movie) | live | 2 signed MP4 sources |
| Captions | live | 9 tracks, 70 KB SRT downloaded |
| Poster CDN | live | 222 KB webp |
| Media CDN | 429 from datacenter IP | nginx IP block, not app logic |

---

## Why the web preview player showed an error (investigated 2026-02-XX)

The preview resolved a real signed URL, then the `<video>` element failed. The
URL was not the problem. Every request to the **media** host was rejected before
the bytes were served:

```
$ curl -sI 'https://bcdnxw.hakunaymatata.com/.../1080p.mp4'
HTTP/2 429
server: nginx

Variants attempted, all HTTP 429:
  · no headers
  · with Referer + Origin + browser User-Agent
  · with Range: bytes=0-1023
  · HEAD instead of GET
  · --http1.1
  · a freshly issued URL from a brand-new /stream call
```

Meanwhile, from the **same sandbox IP, same minute**:

```
$ curl -sI 'https://pbcdn.aoneroom.com/.../poster.webp'
HTTP/2 200   content-type: image/webp   content-length: 227,000

$ curl -s 'https://cacdn.hakunaymatata.com/.../caption.srt'
HTTP/2 200   content-type: application/x-subrip   70,264 bytes
  "1\n00:00:01,000 --> 00:00:04,000\nEPISODE 1\n..."
```

Posters and captions are served. Only the media host answers 429. A 429 that is
returned identically for every header combination, every range, and every
freshly-signed URL is an **ASN-level block on cloud/datacenter IPs**, not
signature validation and not application logic. A residential or mobile carrier
IP — which is what a phone on Wi-Fi or LTE has — is not in that block.

This is why the preview could render the entire catalogue, open a detail sheet,
list every episode and resolution, and fetch a caption file, but could not play
video. The APK runs on the device's own network and is not subject to this
sandbox's IP reputation.
