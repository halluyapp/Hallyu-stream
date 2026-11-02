# HALLYU-STREAM APK build status

**Result:** GitHub Actions built phone + TV debug/release APKs and published all four as direct `.apk` assets on the `v0.1.1` Release.

| Field | Value |
|---|---|
| Workflow | `.github/workflows/build-apk.yml` — “Build Android APKs” |
| First green run | [41509904497](https://github.com/halluyapp/hallyu-stream/actions/runs/41509904497) |
| Clean re-run | [41514853664](https://github.com/halluyapp/hallyu-stream/actions/runs/41514853664) |
| Release publisher run | [41521621257](https://github.com/halluyapp/hallyu-stream/actions/runs/41521621257) |
| Published release | [v0.1.1](https://github.com/halluyapp/hallyu-stream/releases/tag/v0.1.1) |
| Commit / ref | `68f2f75`, `ca03757`, `v0.1.1` |
| Branch | `main` (after PRs #3–#5) and `arena/69ba68a7-hallyu-stream` |
| Trigger | `push`, `v*` tag, `repository_dispatch` |
| Conclusion | `success` |

## Uploaded artifacts

| Artifact | Size | Contents |
|---|---:|---|
| `hallyu-stream-mobile-apk-68f2f75c7f3bac570edfc06c693494499becdd11` | 101,042,925 bytes | Expo/React Native phone debug + release APKs |
| `hallyu-stream-tv-apk-68f2f75c7f3bac570edfc06c693494499becdd11` | 62,082,652 bytes | `react-native-tvos` Android TV debug + release APKs |
| `hallyu-stream-preview-dist-68f2f75c7f3bac570edfc06c693494499becdd11` | 299,950 bytes | Browser review harness production build |

Artifacts are retained for 14 days and are downloadable from the run’s Artifacts section in the GitHub Actions UI.

## Fresh clean re-run (after the user-reported failure)

| Field | Value |
|---|---|
| Run | [41514853664](https://github.com/halluyapp/hallyu-stream/actions/runs/41514853664) |
| Commit | `ca03757a89db4ac8ea77ea8f21f3380f1e15a98c` |
| Trigger | `push` to `arena/69ba68a7-hallyu-stream` |
| Conclusion | `success` |
| Jobs | `verify` ✅ · `build-mobile-apk` ✅ · `build-tv-apk` ✅ · `release` skipped (not a tag) |
| Artifacts | phone `101,044,592` bytes · TV `62,082,867` bytes · preview `299,950` bytes |

The three red runs earlier in this workflow’s history (`41505221946`, `41506666652`, `41508210622`) are superseded iterations. Their causes — Kotlin 1.9.25 alignment, TV Jetifier OOM, RN 0.76 native-module pins, and the missing `expo-asset` release dependency — were fixed in the following commits. They are not the current build.

## Direct APK downloads — use `v0.1.1`

GitHub Actions artifacts are zipped and served from Azure blob storage; that download is blocked from some networks and can present as a failed download even when the run is green. Use the direct Release assets instead.

| Asset | Size | Direct link |
|---|---:|---|
| `hallyu-stream-phone-debug.apk` | 149,492,230 bytes | [download](https://github.com/halluyapp/hallyu-stream/releases/download/v0.1.1/hallyu-stream-phone-debug.apk) |
| `hallyu-stream-phone-release.apk` | 88,363,807 bytes | [download](https://github.com/halluyapp/hallyu-stream/releases/download/v0.1.1/hallyu-stream-phone-release.apk) |
| `hallyu-stream-tv-debug.apk` | 114,316,091 bytes | [download](https://github.com/halluyapp/hallyu-stream/releases/download/v0.1.1/hallyu-stream-tv-debug.apk) |
| `hallyu-stream-tv-release.apk` | 53,903,665 bytes | [download](https://github.com/halluyapp/hallyu-stream/releases/download/v0.1.1/hallyu-stream-tv-release.apk) |

The first `v0.1.0` release attached only two `app-*.apk` files because both Gradle projects used identical filenames; that release and tag were deleted. The `v0.1.1` tag build produced correctly named artifacts but was cancelled before its release job, so [run 41521621257](https://github.com/halluyapp/hallyu-stream/actions/runs/41521621257) published those already-uploaded artifacts via `publish-release.yml`.

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
6. Consolidated the repo onto one Android workflow, removed the conflicting `main` `android.yml`/`mobile/` build, and added `main` as a push trigger.
7. Renamed phone/TV outputs to `hallyu-stream-phone-*.apk` / `hallyu-stream-tv-*.apk` so `merge-multiple: true` cannot overwrite one client with the other.
8. Added `publish-release.yml` to attach already-uploaded artifacts to an existing tag without rebuilding.
9. Deleted the incomplete `v0.1.0` release/tag and published the corrected `v0.1.1` Release with four direct APK assets.

## Honest limits

- APKs were built on GitHub’s Ubuntu runner, not in this sandbox and not locally.
- Release APKs are signed with an ephemeral CI keystore, **not** a production keystore.
- No physical-device installation, playback, camera permission, TV D-pad focus, or CDN playback has been verified.
- The Supabase pairing backend remains undeployed by the earlier explicit decision; pairing screens still show honest errors rather than fake approval.
