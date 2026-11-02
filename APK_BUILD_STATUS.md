# HALLYU-STREAM APK build status

**Result:** GitHub Actions built and uploaded APK artifacts successfully.

| Field | Value |
|---|---|
| Workflow | `.github/workflows/build-apk.yml` — “Build Android APKs” |
| Successful run | [41509904497](https://github.com/halluyapp/hallyu-stream/actions/runs/41509904497) |
| Commit | `68f2f75c7f3bac570edfc06c693494499becdd11` |
| Branch | `arena/69ba68a7-hallyu-stream` |
| Trigger | `push` |
| Conclusion | `success` |

## Uploaded artifacts

| Artifact | Size | Contents |
|---|---:|---|
| `hallyu-stream-mobile-apk-68f2f75c7f3bac570edfc06c693494499becdd11` | 101,042,925 bytes | Expo/React Native phone debug + release APKs |
| `hallyu-stream-tv-apk-68f2f75c7f3bac570edfc06c693494499becdd11` | 62,082,652 bytes | `react-native-tvos` Android TV debug + release APKs |
| `hallyu-stream-preview-dist-68f2f75c7f3bac570edfc06c693494499becdd11` | 299,950 bytes | Browser review harness production build |

Artifacts are retained for 14 days and are downloadable from the run’s Artifacts section in the GitHub Actions UI.

## Jobs

- `verify` — strict TypeScript check, shared-layer smoke test, preview production build: **passed**
- `build-mobile-apk` — Expo prebuild + Gradle debug/release APKs: **passed**
- `build-tv-apk` — checked-in `android/` project + Gradle debug/release APKs: **passed**
- `release` — skipped, because this was not a `v*` tag push

## What was fixed to get here

1. Added the GitHub Actions workflow, native lockfiles, optional signing, and artifact upload.
2. Aligned Expo SDK 52’s Kotlin plugin to `1.9.25` and raised Gradle heap to 4 GB.
3. Disabled Jetifier for the TV project to avoid an OOM transforming the large `react-native-tvos` AAR.
4. Pinned RN 0.76-compatible native modules (`react-native-svg@15.8.0`, `react-native-video@6.9.0`, `react-native-qrcode-svg@6.3.0`, `@react-native-async-storage/async-storage@2.1.0`) after newer `^` ranges pulled in incompatible Paper interfaces.
5. Added `expo-asset@11.0.5` as a direct phone dependency so `@expo/metro-config` could resolve its asset plugin during release JS bundling.

## Honest limits

- APKs were built on GitHub’s Ubuntu runner, not in this sandbox and not locally.
- Release APKs are signed with an ephemeral CI keystore, **not** a production keystore.
- No physical-device installation, playback, camera permission, TV D-pad focus, or CDN playback has been verified.
- The Supabase pairing backend remains undeployed by the earlier explicit decision; pairing screens still show honest errors rather than fake approval.
