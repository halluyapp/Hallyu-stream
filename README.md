# HALLYU-STREAM

A standalone movie and television streaming application — **"The Screening Room"**: obsidian ground, one warm copper light, artwork presented as art.

- **Design source of truth:** [`HALLYU_STREAM_UI_UX_MASTER_PLAN.md`](./HALLYU_STREAM_UI_UX_MASTER_PLAN.md) (NOCTURNE / The Screening Room, v1.0)
- **Technical source of truth:** [`streaming-company-architecture/`](./streaming-company-architecture) (architecture pack + ADRs)
- **Client:** [`mobile/`](./mobile) — React Native (Expo SDK 54, TypeScript strict, expo-router)

## The mobile app

Touch-first Android client covering Delivery Phases 1–5 of the architecture pack:

- Provider client for the zarhosting public API (`/home`, `/search`, `/detail`, `/stream`, captions) with timeouts, single retry, and defensive normalisers (`mobile/src/services/zarhosting/`)
- Device-direct playback (ADR 001): signed CDN URLs are played by the device with the configured media headers — **no server ever touches video bytes**
- Stream source selection: MP4-first, short-preview heuristic, real qualities only, Auto default (360p/480p)
- Five-tab IA: Home · Explore · Search · Library · Settings (master plan §4.2)
- NOCTURNE tokens implemented verbatim (§9): obsidian `#0A0B0D`, ivory `#F4EFE7`, copper `#C97B4A`, Fraunces display serif + Inter UI
- Signatures: Marquee Hero (S1), smoked-glass chrome (S2), the copper thread (S3), reel labels (S4)
- Local-first SQLite library: progress keyed `subjectId|se|ep`, watchlist, history, search history, settings
- Player: auto-hiding chrome, tap-to-seek, ±10s transport, quality/subtitles sheets, bounded re-resolve on expiry, honest failure card
- Designed empty/loading/error states everywhere (§15) — no fake success paths

### Not in this phase (per pack 11)

Downloads/offline, phone↔TV pairing backend + QR, Android TV ten-foot client, companion remote.

## Building the APK

Every push to `main` that touches `mobile/**` triggers [`.github/workflows/android.yml`](./.github/workflows/android.yml):
typecheck → `expo prebuild -p android` → `gradlew assembleRelease` → APK uploaded as the
**`hallyu-stream-apk`** workflow artifact. It can also be run manually via *Run workflow*.

### Local development

```bash
cd mobile
bun install
bun start        # Expo dev server
bunx tsc --noEmit
```
