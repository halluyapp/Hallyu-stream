# 02 — Integrations: Catalogue & Stream Provider

**Version:** 1.0  

## 1. Primary provider

| Item | Value |
|------|--------|
| Name | zarhosting Moviebox public API |
| Base URL | `https://movieapi.zarhosting.dpdns.org/api/public/v1` |
| Authentication (as tested) | None (no API key on tested public routes) |
| Role | Home, search, detail, stream metadata, captions metadata |

If the provider later requires a key, store it in secure app/backend config — never hardcode in source control.

## 2. Endpoints (required)

| Function | Request |
|----------|---------|
| Home | `GET /home` |
| Search | `GET /search?q={query}&page={page}` |
| Detail | `GET /detail/{detail_path}` |
| Stream | `GET /stream/{subject_id}?detail_path={detail_path}&se={season}&ep={episode}` |
| Captions | `GET /stream/{subject_id}/captions?detail_path={detail_path}&se={season}&ep={episode}` |

- URL-encode path and query values.
- Timeouts: recommend 12–15s for JSON; cancel on screen exit.
- Retry: at most one retry on transient 5xx/network; do not retry storms.
- Do not assume response shapes stay identical forever — normalise defensively.

## 3. Required identifiers

Always preserve and pass:

- `subjectId` (numeric string subject id)
- `detailPath` (slug, e.g. `breaking-bad-ej6Bp0MCAo7`)

**Stream and captions require both**, plus season and episode.

### Test fixture (not hard-coded production content)

| Field | Example value |
|-------|----------------|
| Title | Breaking Bad |
| subjectId | `6207982430134357800` |
| detailPath | `breaking-bad-ej6Bp0MCAo7` |
| se / ep | `1` / `1` |
| Observed | Multiple MP4 qualities; CDN host pattern `bcdnxw.hakunaymatata.com` |

Use only for integration tests and smoke checks.

## 4. Stream response (fields to consume)

From `sources[]` (names may vary slightly — map in normaliser):

| Field | Use |
|-------|-----|
| `resolution` | Quality label (360p, 480p, 720p, 1080p, …) |
| `format` | Prefer `MP4` when compatible |
| `url` | Signed HTTPS media URL for **device** player/downloader |
| `size` | Bytes (string or number) → derive size MB |
| `duration` | Seconds when present |
| `codec` | Informational |

Also: `has_resource` when present — if false / empty sources → no playable stream UI.

Caption entries: language / language code, subtitle file URL (often separate CDN host such as `cacdn.hakunaymatata.com` in tests).

## 5. Source selection rules

1. Prefer progressive **MP4** when available and playable on target devices.
2. Do **not** trust quality labels alone (short previews can be labelled 1080p).
3. Heuristic (product-tested):
   - **Keep** if `duration > ~300s` **OR** `size > ~50MB`
   - **Drop** only if **both** short and small
4. Sort: MP4 first, then higher resolution.
5. **Mobile default start quality:** 360p or 480p when available; user may select higher.
6. Never invent a quality not returned by the API.
7. Distinguish **Auto** (app default policy) from **manual** quality choice.

## 6. Movie vs series season/episode

- **Series:** use real `se` / `ep` from detail UI and `resource.seasons[]` (`se`, `maxEp`).
- **Movies:** centralise mapping in **one function** (e.g. `movieSeasonEpisode()`).  
  Provider examples have used `0/0` or `1/1` — **verify against live movie responses** before locking; do not scatter different assumptions across the app.

## 7. Normalised internal models (minimum)

**Title:** subjectId, detailPath, title, cover, backdrop?, description, genres, releaseYear, rating, contentType, seasons[]  

**Season:** seasonNumber, maxEpisodes  

**StreamSource:** resolution, format, url, size, duration, codec  

**Caption:** language, languageCode?, url, format?  

UI must depend on normalised models, not raw JSON.

## 8. Media request configuration (CDN)

Media files are served from provider CDN hosts (example observed: `bcdnxw.hakunaymatata.com`), not from the zarhosting JSON host.

Signed URLs **expire** — always re-call stream JSON for a fresh URL after failure/expiry.

### Headers (device media requests)

When the native player / download stack supports custom headers, set from **one module**:

```text
Referer: https://www.moviebox.ph/
Origin: https://www.moviebox.ph
User-Agent: <normal mobile browser UA>
```

- Change host only in that module if the public web origin changes.
- Verify on real devices whether headers apply to progressive playback and Range requests.
- If headers cannot be applied, document limitation; **do not** insert a server-side video proxy as a workaround.

## 9. Explicitly excluded integrations

| Integration | Status |
|-------------|--------|
| Megan `apis.megan.qzz.io` stream | Do not use (502 observed) |
| Megan moviebox proxy | Do not use (service suspended observed) |
| Our backend as video proxy | Forbidden |
| OpenSubtitles as **primary** captions | Optional fallback only; zarhosting captions first |

## 10. Provider client module responsibilities

```text
services/zarhosting/
  client.ts       # base URL, fetch, timeout, retry
  types.ts        # raw + normalised types
  normalize.ts    # home, search, detail, sources, captions
  config.ts       # ZAR_BASE, media headers, timeouts
```

## 11. Related

- Playback flow: `05-PLAYBACK_AND_OFFLINE.md`
- ADR: `docs/adr/001-device-direct-playback.md`
