# HALLYU-STREAM — implementation workspace

This repository started as **specification only**:

- `HALLYU_STREAM_UI_UX_MASTER_PLAN.md` — the design source of truth (NOCTURNE → “The Screening Room”, §1–20, appendices A–D).
- `streaming-company-architecture/` — the technical source of truth (11 standards + 2 ADRs).

Everything under `packages/`, `apps/` and `supabase/` is the implementation built from those documents. The original docs are untouched.

---

## Stack decision (Phase 0/1 audit)

| Layer | Choice | Why |
|---|---|---|
| Phone client | **React Native + Expo (Android)** | `03-CLIENT_MOBILE.md`; one touch-first app with local-first storage, camera, downloads, player. |
| TV client | **React Native for Android TV (`react-native-tvos`)** — separate app | `04-CLIENT_ANDROID_TV.md` §7: “If one codebase cannot deliver reliable focus and TV playback, ship a separate TV client sharing types, normalisers, and design tokens — do not fake TV support.” TV has its own rail, focus manager, on-screen keyboard, and 10-foot composition. |
| Shared code | `@hallyu/shared` (pure TS) + `@hallyu/ui` (RN primitives/screens) | `01-SYSTEM_ARCHITECTURE.md` §7 module map; `08-DATA_AND_APIS.md` normalised models. |
| Backend | **New Supabase project**, Postgres + one Edge Function (`pairing-api`) | ADR 002 / `06-BACKEND_OVERVIEW.md`: signalling only. No media proxy, no video bytes, no Edge Function that fetches CDN URLs. |
| Catalogue / stream | Device calls `movieapi.zarhosting.dpdns.org` JSON directly | ADR 001. Media bytes go CDN → device. |
| Review harness | `apps/preview` (Vite + `react-native-web`) | Browser preview of the RN screens for this workspace. **It is a review tool, not the product.** The architecture pack explicitly rules out “web-only product replacing native Android apps”. |

### Hard rules encoded in code

- `subjectId` + `detailPath` + `se`/`ep` are the stable keys; signed CDN URLs are never persisted (`08` §6).
- `movieSeasonEpisode()` is the single movie se/ep convention and is runtime-configurable until verified against a live movie response (`02` §6, Appendix D #2).
- Source selection: MP4 first, drop only short **and** small previews, Auto starts at 360p/480p, never invent a quality (`02` §5).
- Media headers (`Referer`/`Origin`) live in **one** config module; browsers cannot set them on `<video>`, so the preview says so honestly instead of adding a proxy (`02` §8, ADR 001).
- Pairing challenges: short TTL, single use, hashed short codes, rate limits, explicit phone approval, revocation, no fake success (`07`, `09`, ADR 002).
- Design tokens are transcribed verbatim from master plan §9–10 (`packages/shared/src/tokens.ts`).

---

## Repository layout

```
packages/shared/         types, tokens, microcopy, storage contract, library store,
                         zarhosting client + defensive normalisers, playback keys,
                         pairing API client
packages/ui/             RN design system + mobile screens + TV screens (shared tokens)
apps/mobile/             Expo Android phone app (standalone project)
apps/tv/                 react-native-tvos Android TV app (standalone project)
apps/preview/            Vite + react-native-web review harness
supabase/migrations/     pairing_sessions, devices, rate limits, SQL functions, RLS
supabase/functions/      pairing-api Edge Function (Deno/TypeScript)
```

---

## Commands

```bash
npm install                 # installs workspace deps for shared/ui/preview
npm run typecheck           # TS strict check across shared + ui + preview
npm run preview             # starts the browser review harness on 0.0.0.0:5173
npm run build:preview

# Native clients have their own package.json + lockfile:
cd apps/mobile && npm ci && npm run android
cd apps/tv     && npm ci && npm run android
```

Native builds require a local Android SDK/NDK and Java. The TV app aliases `react-native` to `react-native-tvos`, so install it with `NPM_CONFIG_LEGACY_PEER_DEPS=true` (the CI workflow already sets this). This sandbox has **no Java/Android SDK**, so APKs are built by the GitHub Actions workflow, not locally; the source, manifests, and build configs are provided here.

---

## APK builds via GitHub Actions

`.github/workflows/build-apk.yml` is the release-build automation. It runs on pushes to `arena/69ba68a7-hallyu-stream`, on `v*` tag pushes, on PRs to `main`, and on manual `workflow_dispatch`.

Jobs:

1. `verify` — strict TypeScript check, shared-layer smoke test, and production build of the review harness.
2. `build-mobile-apk` — installs the phone project, runs `expo prebuild --platform android --clean`, then builds debug + release APKs with Gradle.
3. `build-tv-apk` — installs the TV project, writes a build-time `.env`, then builds debug + release APKs from the checked-in `android/` project.
4. `release` — only on `refs/tags/v*`, attaches all downloaded APKs to a GitHub Release.

Artifacts are uploaded as `hallyu-stream-mobile-apk-<sha>` and `hallyu-stream-tv-apk-<sha>` (14-day retention). Release APKs are signed with an ephemeral CI key generated on the runner; **replace this with a real production keystore before store distribution**. No keystore or secret is committed.

Optional GitHub Actions repository variables (not secrets) supply build-time config without hardcoding endpoints:

| Variable | Used by |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | phone, TV fallback |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | phone, TV fallback |
| `EXPO_PUBLIC_PAIRING_CLIENT_KEY` | phone, TV fallback |
| `EXPO_PUBLIC_ZAR_BASE_URL` | phone, TV fallback |
| `EXPO_PUBLIC_MOVIE_SEASON` / `EXPO_PUBLIC_MOVIE_EPISODE` | phone, TV fallback |
| `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` / `PAIRING_CLIENT_KEY` | TV native `.env` |
| `ZAR_BASE_URL` / `MOVIE_SEASON` / `MOVIE_EPISODE` | TV native `.env` |

Missing variables fall back to empty strings / `0`, so the APK still builds while pairing correctly reports an unconfigured backend. See `.github/workflows/README.md` for the exact CI commands and notes.

**Status:** the workflow ran successfully on `68f2f75` — [run 41509904497](https://github.com/halluyapp/hallyu-stream/actions/runs/41509904497). Debug and release APK artifacts were uploaded for both clients: `hallyu-stream-mobile-apk-68f2f75…` and `hallyu-stream-tv-apk-68f2f75…` (14-day retention). Download them from the run’s Artifacts section. This is a CI build, not a store-ready signed release: production distribution still needs a persistent keystore and hardware QA.

---

## Environment

Copy `.env.example` → `.env` (gitignored) and fill:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_PAIRING_CLIENT_KEY`
- server-only `PAIRING_CODE_SECRET`, `PAIRING_CLIENT_KEY` for the Edge Function

No service-role key, DB password, or signed media URL is ever placed in client code or source control.

---

## Delivery status (from `11-DELIVERY_AND_OPS.md`)

| Phase | Status |
|---|---|
| 0 Repo audit, provider smoke, TV feasibility, risks | **Done** (docs read; runtime/tooling audit; TV decision recorded) |
| 1 Brand/tokens/motion direction | **Done** (`tokens.ts`, `copy.ts`) |
| 2 Full mobile + TV blueprints | **Supplied by the master plan** |
| 3 App shells, nav, design system, storage | **In progress** |
| 4 zarhosting client + home/search/detail | **Shared layer done; screens in progress** |
| 5 Playback mobile + TV + captions + resume | Planned |
| 6 Library + downloads + offline | Local store done; device download manager planned |
| 7 Pairing backend + QR + revoke | **Backend source written; deployment blocked — see below** |
| 8 Motion polish + performance pass | Planned |
| 9 QA matrix + release builds | **GitHub Actions APK build succeeded; debug + release artifacts uploaded. Hardware QA and production signing still pending** |

### Blocker: Supabase project creation

`create_project` was refused: the `Hallyu-grok` organisation has reached the **free-project limit** (it already has `psmxekrmoltwabefgqpd` and `kzxlbscfkixnswurpkzb`). Per the connector’s instruction I have **not** deleted, paused, upgraded, or retried with different arguments.

**Decision (2026-11-02):** leave the backend source undeployed for now. No Supabase project was created, paused, deleted, or modified. The SQL migration and Edge Function remain ready in `supabase/` for a later deployment; until then, pairing screens show the designed honest error/retry states rather than any simulated approval.

### Verified vs assumed

- **Verified:** repository contents, tooling availability, Supabase org/project list, free-limit refusal, TypeScript strictness of the shared layer, preview production build, offline smoke test, local validation of the GitHub Actions workflow YAML, and a successful GitHub Actions run that built and uploaded phone + TV debug/release APK artifacts ([run 41509904497](https://github.com/halluyapp/hallyu-stream/actions/runs/41509904497)).
- **Assumed / unverified:** live `zarhosting` response shapes (normalisers are defensive), live CDN playback, physical low-RAM phone behaviour, Android TV focus on hardware, QR camera permission flow on device, and installation/playback of the CI APKs on real hardware. The spec’s own Appendix D lists hardware items as open.
- **Not claimed:** real playback, successful pairing, provider smoke test from this sandbox (outbound network here is restricted to package registries/GitHub), or store-ready production signing. APK artifacts exist but have not been exercised on a physical device.

---

## Honesty notes

- `apps/preview` never renders a fake “paired” state or a fake successful stream. If the provider or pairing API is unreachable, it shows the designed error/empty state with Retry.
- Downloads in the browser preview are explicitly labelled “device-only”; no false “complete” state exists (`05` §6, `15.2` #12).
- The About copy carries the independence disclaimer required by `09-SECURITY_AND_PRIVACY.md` and Appendix A.
