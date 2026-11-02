# 01 — System Architecture

**Version:** 1.0  

## 1. Purpose and scope

This document defines the system architecture for the **standalone streaming platform**:

- Android **mobile** app (touch-first)
- Android **TV / Google TV** app (remote-first)
- Optional **backend** for pairing, devices, and later account/progress sync only

This product is **not** a social network and is **not** a module inside another social app.

## 2. Product principles (non-negotiable)

1. **Catalogue and stream metadata** come from the configured provider API (zarhosting — see `02-INTEGRATIONS_CATALOGUE.md`).
2. **Media bytes** are fetched by the **playback device** from the provider media CDN — not through our servers.
3. **Mobile and TV** are first-class clients with **separate UX**; shared rules for data, playback, and branding.
4. **Signed URLs expire** — always store stable IDs (`subjectId`, `detailPath`, season, episode), never treat a CDN URL as a permanent key.
5. **Pairing** authorises a TV via the phone; the pairing channel never carries video.
6. **Premium product quality** — cinema-grade UI, full error/empty/loading states, no placeholder success paths.

## 3. System context

```text
[ Mobile app ]──── JSON ────►[ zarhosting API ]
[ TV app     ]──── JSON ────►[ zarhosting API ]
      │                              │
      │                              │ returns signed media URLs
      │                              ▼
      │                      [ metadata only ]
      │
      ├── media bytes ──────────────►[ Media CDN e.g. bcdnxw.hakunaymatata.com ]
      │
      └── pairing / devices ────────►[ Our backend — signalling only ]
```

## 4. Logical layers

| Layer | Responsibility |
|-------|----------------|
| Presentation | Mobile UI, TV UI, focus, motion |
| Application | Navigation, library, downloads orchestration, pairing UX |
| Domain | Title/season/source models, quality selection, progress keys |
| Integration | zarhosting client, normalisers, media header config |
| Platform | Player, filesystem, secure storage, QR camera |
| Backend (ours) | Pairing challenges, device registry, optional user sync |

## 5. Must / must not

### Must

- Call provider **JSON** APIs from the client (or a non-media BFF if introduced later for caching only).
- Hand the selected **HTTPS media URL** to the native player / downloader on device.
- Centralise provider base URL, timeouts, and media request headers in **one config module**.
- Re-resolve stream JSON when playback fails for expiry or recoverable media errors (bounded retries, user-visible).
- Support movies and series with explicit season/episode handling.
- Implement Android TV as a **TV-native** experience (D-pad, focus, 16:9).

### Must not

- Proxy, relay, cache, or transcode **full video files** on our backend.
- Route video through Supabase Edge Functions, Megan, CI runners, or any custom media gateway.
- Depend on Megan stream or Megan proxy (historically 502 / service suspended).
- Ship mock catalogue, fake playback success, or fake pairing approval.
- Use one responsive layout as both phone and TV.

## 6. Historical constraints (engineering lessons)

These are retained as architecture constraints because they were validated in product experiments:

| Lesson | Architectural consequence |
|--------|---------------------------|
| Megan stream 502 / proxy suspended | Do not use Megan for playback |
| Server/datacenter fetch of CDN → 429 or block | Do not put our servers in the media path |
| zarhosting returns real `sources[]` MP4 URLs | Client resolves stream JSON; device plays URL |
| CDN may expect browser-like Referer/Origin | Optional configured headers on device media requests |
| Stream needs `subjectId` + `detailPath` + se/ep | Never stream with ID alone |
| Hallyu-style edge video proxy failed CI/product | Forbidden pattern for this product |

## 7. High-level module map

```text
clients/
  mobile/
  tv/
shared/
  catalogue/          # types, normalise, zarhosting client
  playback/           # resolveStream, pickQuality, progress
  captions/
  downloads/
  library/
backend/              # pairing + devices (+ optional accounts)
  pairing/
  devices/
```

## 8. Related documents

- Integrations: `02-INTEGRATIONS_CATALOGUE.md`
- Playback: `05-PLAYBACK_AND_OFFLINE.md`
- Backend: `06-BACKEND_OVERVIEW.md`, `07-PAIRING_SERVICE.md`
- ADR: `docs/adr/001-device-direct-playback.md`
