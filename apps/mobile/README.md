# HALLYU-STREAM — Android phone client (React Native / Expo)

Standalone touch-first app. It is **not** the TV layout and **not** a web app.

## Run

```bash
cd apps/mobile
npm install
cp ../../.env.example ../../.env   # fill EXPO_PUBLIC_* values
npm run android                    # requires Android SDK + Java
```

`npm start` opens Expo Dev Client. Use a development build, not Expo Go, because `react-native-video`, `expo-camera`, and `expo-secure-store` need native modules.

## What this app injects

`src/platform.tsx` provides the real device implementations to `@hallyu/ui`:

| Contract | Device implementation |
|---|---|
| Storage | `@react-native-async-storage/async-storage` |
| Secure storage | `expo-secure-store` (installation id, TV credentials if ever needed) |
| Player | `react-native-video` with `MEDIA_REQUEST_HEADERS` from the single config module |
| QR | `react-native-qrcode-svg` (also used by the TV build) |
| Scanner | `expo-camera` (permission primer lives in the UI) |
| Downloads | `expo-file-system` foreground download + integrity-checked completion |
| Haptics | `expo-haptics` |
| Back key | `BackHandler` → mobile navigator back |

## Hard rules honoured

- Catalogue/stream JSON is fetched by the device from zarhosting.
- Video bytes go CDN → device. No proxy, no Supabase media path.
- Signed URLs are never persisted; stream re-resolve is bounded and user-visible.
- Progress is keyed by `subjectId|se|ep`.
- Pairing is only real when the Supabase Edge Function confirms it.

## Not verified here

This sandbox has no Java/Android SDK, so no APK was built. Physical-device checks (camera permission, low-RAM performance, CDN playback with custom headers) remain on the QA matrix in `10-NFR_AND_TESTING.md`.
