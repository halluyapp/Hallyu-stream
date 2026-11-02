# HALLYU-STREAM

A React Native streaming client for Korean drama and film — one codebase, one APK,
two experiences: a phone/tablet app and a ten-foot Android TV app. It ships with its
own pairing backend, which is signalling-only: it never touches media bytes.

```
hallyu-stream/
├── mobile/                  React Native 0.76 app (Android phone + Android TV)
├── backend/                 Node 22 pairing service (Express + node:sqlite)
├── HALLYU_STREAM_UI_UX_MASTER_PLAN.md
├── streaming-company-architecture/
└── .github/workflows/       android.yml · backend.yml
```

## The design — NOCTURNE / "The Screening Room"

Every colour, radius, space and duration lives in `mobile/src/theme/index.tsx`.
Screens are not allowed to hard-code a hex value or a millisecond.

| Token | Value | Use |
| --- | --- | --- |
| obsidian | `#0A0B0D` | app background |
| surface | `#111318` | cards, sheets |
| elevated | `#171A21` | raised surfaces, low-tier glass fallback |
| ivory | `#F4EFE7` | primary text |
| muted / faint | `#A8A199` / `#6E6862` | secondary / tertiary text |
| copper | `#C97B4A` | the single accent per region |
| copperTint | `rgba(201,123,74,0.14)` | focus wash, progress track |

Four signatures carry the identity: **S1 Marquee Hero** (full-bleed backdrop with a
bottom scrim), **S2 smoked-glass chrome** (nav bar, player chrome, sheet grabbers,
TV rail, pairing panels only), **S3 the copper thread** (exactly one copper element
per region), and **S4 reel labels** (letterspaced caps above a hairline rule).

Type is Fraunces for display and Inter for UI, weights 400/500/600 only. The mobile
scale runs 32 → 11; the TV scale runs 56 → 16 with hard floors (body ≥ 20sp, nothing
below 16sp).

## One APK, two form factors

`detectFormFactor()` in `mobile/src/core/platform.ts` decides at runtime:

1. `Platform.isTV` (the `uiMode` / leanback flag), or
2. a landscape screen wider than 900dp with no touch input.

The result selects `MobileNavigator` (bottom tabs: Home, Explore, Search, Library,
Settings) or `TvNavigator` (left rail, D-pad focus model, on-screen A–Z keyboard,
QR activation gate). Both share the theme, provider client, pairing client and state.

The manifest declares both `LAUNCHER` and `LEANBACK_LAUNCHER` intent filters, a TV
banner, and marks leanback/touchscreen/camera as `required="false"`, so the same
artefact installs everywhere.

## Architecture rules (enforced in code)

- Provider JSON is resolved **on the device**. The backend never proxies or
  transcodes media.
- Media bytes travel CDN → device. Signed URLs expire, so the player re-resolves
  stream JSON with bounded retries (`MAX_RETRIES = 2`) and resumes at the last
  known position.
- Stable IDs are `subjectId|detailPath|se|ep`; progress is keyed
  `{subjectId}|{season}|{episode}`.
- Source selection prefers MP4 over HLS, discards stubs (duration ≤ 300 s **and**
  size ≤ 50 MB), sorts by resolution, and never invents a quality that the provider
  did not return. Movies are requested with `se=0&ep=0`.
- Media requests carry the provider's required `Referer` / `Origin` / browser UA
  (`MEDIA_HEADERS` in `mobile/src/api/provider.ts`).

## The pairing backend

`backend/` is a small Express service on Node 22 using the built-in `node:sqlite`
driver. It issues a challenge (QR payload + 6-character code + 600 s TTL), the phone
approves it, and the TV receives a device credential **once**; the delivery token is
then wiped. Poll tokens travel in the `x-poll-token` header, never a query string.

```bash
cd backend
npm ci
npm test          # 6 node:test cases
npm start         # http://localhost:8787
```

`GET /health` returns `{"ok":true,"mediaProxy":false,…}`. There is deliberately no
media route — `/stream/*` is a 404, and CI asserts it.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/auth/device` | create/reuse the account that owns a device list |
| POST | `/pairing/sessions` | TV opens a challenge |
| GET | `/pairing/sessions/:id` | public challenge metadata |
| GET | `/pairing/sessions/:id/status` | TV polls (`x-poll-token`) |
| POST | `/pairing/lookup` | phone resolves a 6-char code |
| POST | `/pairing/sessions/:id/approve` | phone approves |
| POST | `/pairing/sessions/:id/reject` | phone declines |
| GET | `/devices` | list paired devices |
| DELETE | `/devices/:id` | revoke |
| POST | `/devices/heartbeat` | last-seen update |

## Building

### Locally

```bash
cd mobile
npm ci
npx tsc --noEmit
npx react-native run-android
```

Point the app at your pairing service in Settings → Devices → Service, or bake a
default in with `-PpairingBaseUrl=https://pair.example.com`.

### CI (the supported path)

`.github/workflows/android.yml` runs on every push touching `mobile/`:

1. **verify** — `npm ci`, `tsc --noEmit`, and a production Metro bundle.
2. **build** — JDK 17, Gradle cache, `:app:assembleDebug :app:assembleRelease`, then
   uploads `hallyu-stream-1.0.0-debug.apk` and `hallyu-stream-1.0.0-release.apk`.

Release signing uses the debug key unless these repository secrets exist:
`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`,
`ANDROID_KEY_PASSWORD`. Set the `PAIRING_BASE_URL` repository variable to bake in a
production pairing endpoint.

`.github/workflows/backend.yml` runs the test suite, boots the service and probes
`/health` plus the media 404, then builds the Docker image.

## Status

- Backend: complete, 6/6 tests passing, live smoke-tested (challenge → approve →
  one-time credential → wipe → 403 on a bad poll token → 404 on media).
- Mobile app: complete — 9 phone screens, the player, and the full TV experience.
  `tsc --noEmit` is clean and Metro produces a 2.7 MB production bundle.
- APK: built by GitHub Actions (a local Gradle build is not possible in this
  sandbox — ~0.9 GB free disk and no NDK).
