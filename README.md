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

# Native clients have their own package.json (not installed in this sandbox):
cd apps/mobile && npm install && npm run android
cd apps/tv     && npm install && npm run android
```

Native builds require a local Android SDK/NDK and Java. This sandbox has **no Java/Android SDK**, so APKs are not built or claimed here; the source, manifests, and build configs are provided.

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
| 9 QA matrix + release builds | Blocked on hardware/Android SDK |

### Blocker: Supabase project creation

`create_project` was refused: the `Hallyu-grok` organisation has reached the **free-project limit** (it already has `psmxekrmoltwabefgqpd` and `kzxlbscfkixnswurpkzb`). Per the connector’s instruction I have **not** deleted, paused, upgraded, or retried with different arguments.

**Decision (2026-11-02):** leave the backend source undeployed for now. No Supabase project was created, paused, deleted, or modified. The SQL migration and Edge Function remain ready in `supabase/` for a later deployment; until then, pairing screens show the designed honest error/retry states rather than any simulated approval.

### Verified vs assumed

- **Verified:** repository contents, tooling availability, Supabase org/project list, free-limit refusal, TypeScript strictness of the shared layer.
- **Assumed / unverified:** live `zarhosting` response shapes (normalisers are defensive), live CDN playback, physical low-RAM phone behaviour, Android TV focus on hardware, QR camera permission flow on device. The spec’s own Appendix D lists these as open items.
- **Not claimed:** any APK, any real playback, any successful pairing, any provider smoke test from this sandbox (outbound network here is restricted to package registries/GitHub).

---

## Honesty notes

- `apps/preview` never renders a fake “paired” state or a fake successful stream. If the provider or pairing API is unreachable, it shows the designed error/empty state with Retry.
- Downloads in the browser preview are explicitly labelled “device-only”; no false “complete” state exists (`05` §6, `15.2` #12).
- The About copy carries the independence disclaimer required by `09-SECURITY_AND_PRIVACY.md` and Appendix A.
