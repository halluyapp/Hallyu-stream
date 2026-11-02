# HALLYU-STREAM — Android TV / Google TV client (`react-native-tvos`)

A **separate** React Native app. It shares `@hallyu/shared` and `@hallyu/ui` with the phone client, but not the phone layout (`04-CLIENT_ANDROID_TV.md` §7, master plan §5/P5).

## Run

```bash
cd apps/tv
npm install
cp .env.example .env   # fill SUPABASE_URL / PAIRING_CLIENT_KEY
npm run android         # requires Android SDK, Java, and a TV emulator or device
```

`react-native` is aliased to `react-native-tvos` in `package.json` so D-pad focus, `useTVEventHandler`, and TV hardware keys work natively. The manifest declares `android.software.leanback` and `LEANBACK_LAUNCHER`. `react-native-config` is pinned to `1.5.3`: it is the version whose Android project autolinks correctly with the React Native 0.76 community CLI, and its `dotenv.gradle` reads `apps/tv/.env` at build time.

## What this app injects

| Contract | TV implementation |
|---|---|
| Storage | `@react-native-async-storage/async-storage` |
| Secure storage | `react-native-keychain` (paired-TV device credential) |
| Player | `react-native-video` with provider media headers |
| QR | `react-native-qrcode-svg` |
| Remote keys | `useTVEventHandler` → arrow / select / back / play-pause / menu |
| Scanner / downloads | `null` — TV has neither in this architecture |

## TV-specific behaviour

- Unpaired TVs are gated behind Activation (QR + short code + countdown) before any catalogue surface.
- Pairing persists until unlink/revoke; no per-episode scanning.
- Persistent left rail, D-pad focus ring always visible, focus memory per pane, 2D grid movement, on-screen keyboard.
- Player overlays are reachable by remote only; no touch-only path.

## GitHub Actions APK

The root workflow `.github/workflows/build-apk.yml` builds this app from the checked-in `android/` project:

```bash
npm ci
npm ci --prefix apps/tv
# build-time .env is written from GitHub Actions variables
gradle --project-dir apps/tv/android assembleDebug assembleRelease
```

Debug and release APKs are uploaded as workflow artifacts. Release signing is optional and driven by `HALLYU_SIGNING_*` environment variables; CI generates an ephemeral keystore, and production should use a real keystore. The checked-in `gradle.properties` disables Jetifier and allocates a 4 GB Gradle heap; Jetifier otherwise exhausts memory transforming the large `react-native-tvos` AAR.

## Honesty

- No fake pairing: Activation only succeeds after the Supabase Edge Function returns `approved` with a one-time device token.
- No media proxy: the TV resolves stream JSON and plays CDN bytes directly.
- This sandbox has no Java/Android SDK, so no APK was built locally and no CI artifact is claimed yet. TV focus visibility at 3 metres and physical playback remain hardware QA items (`10-NFR_AND_TESTING.md`).
- Fonts: copy Fraunces/Inter TTFs into `android/app/src/main/assets/fonts/` and link with `react-native-asset` before a release build; the shared token layer already names them.
