# MASTER BUILD PROMPT — PREMIUM MOBILE + ANDROID TV STREAMING PLATFORM

You are the lead product engineer, mobile architect, Android TV engineer, UI/UX designer, motion designer, and QA owner for this project.

Your task is to plan, implement, test, and document a complete standalone streaming application with two deliberately designed experiences:

1. **Android mobile app** — touch-first, portrait and landscape.
2. **Android TV / Google TV app** — television-first, landscape, operated entirely with a TV remote.

This is a new, independent streaming product. It is **not Hallyu**, not a Hallyu feature, and not a social network. Do not import Hallyu branding, navigation, backend assumptions, or unrelated features.

The product must feel like a premium, established streaming platform. A generic dark template with rows of posters is not an acceptable result. Design quality, motion, interaction detail, playback reliability, and television usability are core requirements.

---

# 1. HOW YOU MUST WORK

## 1.1 Inspect before changing anything

First inspect the repository, current branch, package manager, framework, build configuration, existing assets, and current app state.

- Identify whether this is an empty repository or an existing application.
- Preserve useful existing work.
- Do not overwrite working features or configuration without understanding them.
- Do not assume the current branch is the intended branch. Report the branch and repository before making changes.
- Do not claim a feature works unless it has been implemented and tested.
- Do not fabricate API responses, playback success, device pairing, or test results.
- Do not leave mock data, placeholder buttons, dead navigation, or fake success states in production paths.
- If a requirement cannot be completed because credentials, provider permission, platform support, or infrastructure are missing, explain the blocker and implement only the safe parts that can genuinely work.
- Work in small, verifiable phases. After each phase, run the relevant checks and report changed files, tests, and remaining blockers.
- Do not silently expand scope.

Before implementation, produce a concise technical assessment and proposed architecture. Then proceed unless a genuinely blocking decision requires the owner's input. Do not repeatedly ask questions whose answers are already in this brief.

## 1.2 Product quality standard

The quality bar is a polished commercial streaming product:

- Intentional visual hierarchy and editorial composition.
- Distinct mobile and TV layouts, not one layout stretched across devices.
- Consistent design tokens and reusable components.
- Thoughtful empty, loading, offline, error, and recovery states.
- Responsive, accessible interactions.
- Smooth but restrained animations.
- Performance suitable for mid-range and low-memory Android devices.
- Real-device testing, especially for Android TV playback and remote navigation.

Do not use excessive glassmorphism, excessive rounded cards, generic gradients, purple AI aesthetics, clutter, or animations that delay user input.

---

# 2. PRODUCT DEFINITION

Build a standalone, multi-device streaming application.

## Mobile
A premium touch-first app for discovering titles, viewing details, watching movies and series, choosing quality and subtitles, downloading where technically supported, and managing a local library.

## Android TV
A separate TV-first experience with large-screen composition, D-pad navigation, clear focus states, remote-controlled playback, and QR-based phone authorisation.

## Shared product capabilities
Both clients share the catalogue integration, data normalisation, playback-resolution rules, quality selection rules, subtitle handling, product identity, and (when implemented) synchronised device/account services.

The mobile and TV interfaces must be designed independently for their device conventions.

## Out of scope
- Hallyu social/community features.
- Social feeds, comments, reactions, follows, or creator tools.
- A web-only product in place of the native Android apps.
- Video transcoding or video proxying through our own backend.
- Megan streaming or Megan proxy.
- Fake licensing, fake partnership claims, or claims that the app is an official Moviebox product.
- Unapproved features added merely because they are common in streaming apps.

---

# 3. PROVIDER INTEGRATION — ZARHOSTING / MOVIEBOX API

The currently selected catalogue and stream-data provider is the public zarhosting Moviebox API described below.

**Base URL:**
`https://movieapi.zarhosting.dpdns.org/api/public/v1`

The API has been tested by the product owner for home, search, detail, stream resolution, and captions. It is an unofficial third-party integration. Before release, review the provider's current terms, rights, and permission to use its catalogue and media sources. Only stream or distribute content for which the product has the necessary rights. Do not bypass DRM, authentication, access controls, rate limits, anti-bot systems, or provider restrictions. Do not impersonate an official client to evade restrictions. If a provider requires particular request headers and explicitly permits their use, configure them transparently in one place and document the requirement.

No API key was required in the owner's tests, but do not assume this will remain true. Handle provider errors and changes safely.

## 3.1 Known endpoints

| Function | Request |
|---|---|
| Home | `GET /home` |
| Search | `GET /search?q={query}&page={page}` |
| Detail | `GET /detail/{detail_path}` |
| Stream | `GET /stream/{subject_id}?detail_path={detail_path}&se={season}&ep={episode}` |
| Captions | `GET /stream/{subject_id}/captions?detail_path={detail_path}&se={season}&ep={episode}` |

Use URL encoding for query values and path segments. Set sensible timeouts, cancellation, bounded retries, and clear error handling. Retry transient JSON/API failures cautiously; do not create retry storms.

## 3.2 Required identifiers

Preserve both:
- `subject_id` / `subjectId`
- `detail_path` / `detailPath` / slug

The stream endpoint requires both the subject ID and detail path, plus season and episode values. Do not assume the ID alone is enough.

An example tested title was Breaking Bad:
- subject ID: `6207982430134357800`
- detail path: `breaking-bad-ej6Bp0MCAo7`
- season 1, episode 1 returned multiple quality sources in the owner's test.

Treat that as a test fixture only, not as hard-coded production content.

## 3.3 Normalised internal models

Create typed internal models so UI components never depend directly on inconsistent raw provider JSON.

At minimum normalise:

**Title**
- `subjectId`
- `detailPath`
- `title`
- `cover`
- `backdrop` when available
- `description`
- `genres`
- `releaseYear`
- `rating`
- `contentType` (movie or series when known)
- `seasons[]`
- provider metadata needed for detail display

**Season**
- `seasonNumber`
- `maxEpisodes`
- episode metadata when provided

**Stream source**
- `resolution`
- `format`
- `url`
- `size`
- `duration`
- `codec`

**Caption**
- `language`
- `languageCode` when available
- `url`
- format/metadata when available

Normalisers must tolerate missing, null, renamed, or unexpected fields. Validate external URLs and only accept expected HTTPS media/subtitle hosts or explicitly configured provider-approved hosts. Never render untrusted provider text as executable content.

## 3.4 Source selection rules

- Prefer progressive MP4 when available and compatible.
- Do not trust a quality label alone.
- Use available duration and size metadata to avoid selecting obvious short previews.
- The owner's observed heuristic was to retain a source when duration is over roughly five minutes OR size is over roughly 50 MB, and drop a source only when it is both short and small. Treat this as a heuristic, not proof that a source is complete.
- Sort available qualities sensibly.
- Mobile default: 360p or 480p to reduce startup time and data use.
- Let users manually choose higher quality when actually available.
- Clearly distinguish Auto from a manually selected quality.
- Never invent a 1080p option if it is not returned by the API.

## 3.5 Movie season/episode convention

The API examples have not established one universal movie convention. Inspect the provider response and test known movie cases before choosing a rule. Centralise the movie season/episode mapping in one function. Do not scatter assumptions such as `0/0` or `1/1` through the app.

For series, use the actual selected season and episode values from the detail response and UI.

---

# 4. VIDEO DELIVERY AND PLAYBACK ARCHITECTURE

This architecture is mandatory:

**The app obtains JSON metadata from zarhosting. The playback device obtains the media bytes directly from the provider's media CDN, subject to provider permission and supported access requirements.**

The app's own backend must never proxy, relay, cache, transcode, or download full movie/video bytes.

Do not route video through:
- Supabase Edge Functions.
- Megan.
- A custom server.
- A server-side download worker.
- CI infrastructure as a playback proxy.

The backend may handle pairing, account/device metadata, or watch-progress synchronisation later. It must not become a video delivery layer.

## 4.1 Stream resolution flow

When a user opens a movie or episode:

1. Obtain `subjectId`, `detailPath`, season, episode, and optional preferred quality.
2. Call the zarhosting stream JSON endpoint.
3. Validate and normalise the returned sources.
4. Filter obvious preview sources using available metadata.
5. Select a compatible source based on user preference and device capability.
6. Give the selected media URL directly to the native player on that device.
7. Load captions in parallel; subtitle failure must not block video startup.
8. Save playback progress locally.
9. On expired URL or recoverable media failure, request fresh stream JSON and retry in a bounded, user-visible recovery flow.
10. Avoid infinite retry loops. Offer another source/quality or a clear error when recovery fails.

Signed URLs may expire. Never persist a signed URL as a permanent media identifier. Store the title/episode identifiers and resolve a fresh URL when needed.

## 4.2 HTTP headers and CDN behaviour

The owner's tests noted that some CDN sources may expect browser-like request headers, including a Moviebox Referer/Origin. This is not permission to spoof an official client or bypass access restrictions.

- First inspect the provider's documented and permitted media-request requirements.
- If custom headers are explicitly supported and permitted, centralise them in one media-request configuration module.
- Do not scatter hostnames or header strings throughout the codebase.
- Do not put secrets in the app bundle.
- Verify whether the selected Android player can actually apply the required headers to both playback and range requests.
- If it cannot, document the limitation and test the supported provider-approved route. Do not silently insert a proxy.
- Test on real Android phones and Android TV hardware.

## 4.3 Player requirements

- Full-screen playback.
- Play/pause.
- Seek bar and elapsed/remaining time.
- Buffering indicator.
- Retry and source recovery.
- Quality selector.
- Subtitle selector and subtitle delay if supported.
- Landscape/fullscreen behaviour on mobile.
- Episode list and next episode for series.
- Resume playback.
- Audio-track selection when supplied by the source/player.
- Error messages with useful recovery actions.
- Controls fade away during playback and return on interaction.
- No heavy transitions that delay playback.

Optional gestures such as double-tap seeking and brightness/volume gestures should be added only if reliable and discoverable.

## 4.4 Playback progress

Use a stable key based on title/episode identifiers, not the signed URL.

Store:
- position
- duration when known
- last watched timestamp
- completion status
- season and episode for series

Save progress periodically and on pause/background/exit where possible. Avoid writing to storage on every playback tick.

---

# 5. SUBTITLES

Use the provider's captions endpoint first:

`GET /stream/{subject_id}/captions?detail_path={detail_path}&se={season}&ep={episode}`

The owner's tests returned multiple languages with SRT URLs. Do not hard-depend on OpenSubtitles or require an API key for the primary subtitle flow.

Requirements:
- Fetch captions for the active movie/episode.
- Present available languages clearly.
- Support the formats actually returned by the provider and the chosen player.
- Convert SRT to the player's supported format only when necessary and legally/technically appropriate.
- Load captions without blocking video startup.
- Remember the user's preferred subtitle language.
- Allow subtitles to be turned off.
- Handle missing or malformed subtitle files gracefully.
- Save a selected subtitle locally alongside a download only when permitted and technically supported.
- Do not claim subtitles are available until they have loaded successfully.

---

# 6. DOWNLOADS AND OFFLINE PLAYBACK

Downloads must happen on the user's device directly from an authorised media URL. No server-side video downloading.

Implement in stages:

**Stage 1**
- Foreground download.
- Progress display.
- Pause/cancel where supported.
- Retry.
- Storage accounting.
- Local file registration.
- Offline playback.

**Stage 2**
- Reliable resume using HTTP Range only when the media server supports it.
- Validate range responses and content identity before appending bytes.
- Handle expired signed URLs by resolving a fresh URL and resuming only when the server's range semantics and file identity make it safe.
- Prevent corrupt partial files from being marked complete.
- Background download support using appropriate native Android capabilities.
- Android notification showing download progress and completion.
- Recovery after app process termination or device restart where supported.

Do not promise reliable background downloads until implemented and tested on physical devices. Native Android DownloadManager or another maintained native download solution may be appropriate; assess compatibility with the app framework and required headers first.

Downloads UI:
- Active queue.
- Progress percentage and transferred size.
- Download speed and estimated time only when measured reliably.
- Pause/resume/cancel.
- Failed and retry states.
- Completed downloads.
- Delete file.
- Storage used and remaining space where available.
- Offline playback.

---

# 7. LIBRARY AND LOCAL DATA

Start local-first. Do not require an account just to use basic catalogue and playback functions unless a genuine product requirement emerges.

Library sections:
- Continue Watching.
- Watchlist / My List.
- Viewing History.
- Downloads.
- Recently Added or other provider-backed collections when available.

Use a durable local database/storage layer appropriate to the framework. Define migrations and handle app upgrades. Keep catalogue cache, playback progress, watchlist, and download metadata separate.

Optional later cloud sync may synchronise user metadata only. It must never upload or proxy video files.

---

# 8. QR-BASED PHONE-TO-TV PAIRING

This is a key product feature.

The TV app must display a QR code and short activation code before an unpaired TV can access the authorised viewing experience.

## 8.1 Intended user journey

1. User opens the TV app.
2. TV displays a pairing screen with QR code, short human-readable code, and expiry countdown.
3. User opens the mobile app and scans the QR code.
4. Mobile app displays the TV/device name and asks the user to approve the pairing.
5. User confirms.
6. TV receives the authorised pairing result.
7. TV enters the streaming home screen.
8. The trusted TV remains linked until the user unlinks it, the token is revoked, or the security policy requires reauthorisation.

Do not require scanning for every episode. Pair once, then allow device management and revocation. An optional setting may require phone approval before playback sessions.

## 8.2 Security requirements

QR pairing must be implemented as a real, secure protocol, not a visual mockup.

- Generate high-entropy, short-lived, single-use pairing challenges.
- Do not place permanent access tokens, passwords, or media URLs in the QR code.
- Bind approval to the exact pending TV session.
- Expire unused challenges.
- Prevent replay and duplicate approval.
- Rate-limit code guessing and pairing attempts.
- Use HTTPS.
- Store TV credentials securely on the TV.
- Allow users to see and revoke paired devices.
- Do not expose one user's device list or credentials to another.
- Display a meaningful confirmation on the phone before approval.
- Handle expired codes, rejected requests, network loss, and already-paired devices.

A minimal pairing/signalling backend is permitted and may be necessary. It may exchange pairing challenges, device authorisation, and account metadata only. **It must never carry video bytes or become a media proxy.**

Do not pretend secure pairing works with local-only state across two devices. If backend selection or credentials are missing, implement the UI and a clearly marked integration boundary, then report what infrastructure is needed. Do not ship a fake pairing success state.

## 8.3 Phone as companion remote

After pairing, consider an optional phone companion mode:
- Play/pause.
- Directional navigation.
- Back/select.
- Volume only if supported by the TV/platform.
- Keyboard input for TV search.
- Now-playing information.

This is secondary to the TV's own remote and must not be required for normal TV operation.

---

# 9. FULL MOBILE UI/UX SPECIFICATION

The mobile experience must be designed as a premium product, not a generic catalogue template.

## 9.1 Visual direction

Proposed direction: **premium cinematic luxury**.

Design foundations:
- Dark-first visual system using deep black, charcoal, and graphite.
- One distinctive signature accent colour selected during visual exploration.
- High-quality cinematic artwork.
- Strong editorial typography and intentional hierarchy.
- Clear contrast and legibility.
- Restrained gradients and layered depth.
- Consistent iconography.
- Deliberate spacing and alignment.
- Minimal, refined surfaces rather than cards around everything.

Do not lock the accent colour or brand identity without presenting a considered visual direction. The final brand name, logo, and icon must be confirmed by the owner; do not invent a permanent brand identity.

## 9.2 Mobile screens

Design and implement all of these:

1. **Splash:** brand reveal, loading state, graceful transition.
2. **Onboarding:** concise product introduction and essential setup.
3. **Home:** featured hero, curated shelves, trending/popular collections where provider data supports them, continue watching, and recommendations.
4. **Explore:** categories, genres, collections, filters.
5. **Search:** active search, suggestions, history, results, empty state.
6. **Title details:** poster/backdrop, title, synopsis, metadata, genres, play action, watchlist, seasons and episodes.
7. **Player:** full-screen playback and all controls described above.
8. **Downloads:** queue, progress, completed, failed, storage and offline playback.
9. **My Library:** continue watching, watchlist, history and downloads.
10. **Settings:** quality, subtitle language, storage, playback preferences, devices, privacy, about.
11. **Device management:** paired TV list, device names, last active information when available, unlink/revoke.
12. **Pairing scanner and approval:** camera permission, QR scanner, TV confirmation, success/failure/expiry.
13. **Optional companion remote:** controls for a paired TV.

Proposed bottom navigation:
- Home
- Explore
- Search
- My Library
- Profile/Settings

The exact navigation and whether Profile is separate from Settings must be resolved in the UX design, not guessed during coding.

## 9.3 Mobile interactions

- Touch targets must be comfortable.
- Use appropriate haptic feedback where supported and useful.
- Poster taps should lead to a deliberate detail transition.
- Long lists must scroll smoothly.
- Preserve scroll position when returning from details where appropriate.
- Avoid accidental playback when users intend to inspect a title.
- Use bottom sheets or dialogs only where they improve the task.
- Respect system back navigation.
- Handle keyboard appearance and safe areas.
- Support small Android screens and low-memory devices.

---

# 10. FULL ANDROID TV UI/UX SPECIFICATION

The TV app is a first-class product, not a scaled-up mobile app.

## 10.1 TV design direction

- Landscape 16:9 composition.
- Cinematic artwork and large readable typography.
- Comfortable viewing distance.
- Clear hierarchy and generous spacing.
- Focus states visible from across a room.
- No touch-only controls.
- No tiny text or dense mobile-style layouts.
- Keep important content within television safe areas.

## 10.2 TV screens

1. TV splash/loading.
2. First-launch welcome and QR activation.
3. Pairing pending, approved, expired, rejected, and network-error states.
4. TV home.
5. Browse/Explore.
6. Search with remote-friendly on-screen keyboard.
7. Search results.
8. Movie/series details.
9. Season and episode selection.
10. Full-screen TV player.
11. Playback settings overlay.
12. Subtitle and quality menus.
13. Continue Watching.
14. Watchlist/library.
15. Settings.
16. Paired-device/account status and unlink flow.

## 10.3 TV remote behaviour

All key functions must work using a standard TV remote:
- Up/down/left/right.
- Select/OK.
- Back.
- Play/pause where available.
- Seek and playback controls.
- Menu/settings navigation.

Implement predictable focus order. The focused item must be visually obvious. Focus must not disappear when a dialog opens or closes. Back must close the topmost overlay before leaving the current screen. Handle remote key repeat without accidental multiple activations.

TV poster focus may use a restrained scale/elevation animation, but must not cause layout jumps or obscure adjacent content.

---

# 11. ANIMATION AND MOTION DESIGN SYSTEM

Motion is a major part of the product identity. It must feel deliberate, cinematic, responsive, and technically light.

Create a central motion specification with reusable durations, easing curves, and transition patterns.

Suggested starting ranges (tune through device testing):
- Micro-interactions: 120–220 ms.
- Standard transitions: 220–400 ms.
- Cinematic transitions: 400–700 ms.

Required motion:
- Splash logo reveal.
- Onboarding transitions.
- Navigation transitions.
- Hero artwork changes.
- Poster press/focus response.
- Poster-to-detail transition where technically reliable.
- Search activation and result appearance.
- Button press feedback.
- Skeleton/loading shimmer or another lightweight loading treatment.
- Download progress and completion.
- Player controls fade in/out.
- Playback settings panel.
- Subtitle selection.
- QR code reveal and pairing progress.
- Pairing success and failure.
- TV D-pad focus transitions.
- Dialog and bottom-sheet presentation.

Motion rules:
- Never delay essential actions for an animation.
- Avoid excessive parallax, blur, particles, or continuous decorative movement.
- Avoid heavy animated backgrounds.
- Respect reduced-motion preferences.
- Use native/compositor-friendly properties where possible.
- Test on low-memory Android devices and real TV hardware.
- Provide static fallbacks if animation support is limited.

---

# 12. DESIGN SYSTEM AND COMPONENT LIBRARY

Build reusable tokens and components before duplicating screen-specific styles.

## Tokens
- Colour palette and semantic colours.
- Typography scale and font weights.
- Spacing scale.
- Layout widths and safe areas.
- Corner radii.
- Elevation/shadows.
- Borders and dividers.
- Icon sizes.
- Motion durations and easing.
- Focus-ring styles for TV.

## Components
- Primary, secondary, icon, and destructive buttons.
- Movie poster cards.
- Featured hero.
- Horizontal content shelves.
- Episode rows/cards.
- Metadata labels.
- Progress bars.
- Search field and keyboard.
- Bottom navigation.
- TV side navigation/top navigation as appropriate.
- Dialogs and sheets.
- Quality selector.
- Subtitle selector.
- Player controls.
- Download item and progress indicator.
- Empty/error/loading states.
- QR pairing card and device row.
- TV focusable controls.

Components should support mobile and TV variants where appropriate, but do not force identical layouts on both platforms.

---

# 13. ALL UX STATES MUST BE DESIGNED

Do not design only the happy path.

Cover:
- First launch.
- Loading home.
- Slow API.
- API unavailable.
- Empty catalogue section.
- No search results.
- Missing artwork.
- Missing detail metadata.
- No stream sources.
- Expired stream URL.
- CDN/network playback failure.
- Buffering.
- Subtitle unavailable or malformed.
- Download interrupted.
- Resume unsupported.
- Storage full.
- Offline mode.
- No watchlist items.
- No viewing history.
- QR scan permission denied.
- Invalid QR.
- Pairing code expired.
- Pairing rejected.
- TV offline.
- Pairing service unavailable.
- TV already linked.
- Device revoked.
- App update/migration failure where relevant.

Every error must explain what happened in plain language and offer a sensible next action. Never show raw stack traces to users.

---

# 14. TECHNICAL ARCHITECTURE AND PROJECT STRUCTURE

Choose the implementation stack after inspecting the repository.

The initial preference is an Expo/React Native family stack because the product owner has used it before. However, do not assume standard Expo alone provides everything needed for Android TV. Evaluate actual support for:
- Android TV targets and manifests.
- D-pad/focus navigation.
- Native video playback.
- Custom media request headers when permitted.
- Background downloads.
- Orientation.
- Camera/QR scanning.
- Secure credential storage.

If one shared React Native codebase cannot deliver a reliable Android TV app, propose a clearly separated TV client while sharing API types, normalisation, business rules, and design tokens. Do not force an unsupported framework choice merely to claim one codebase.

Suggested logical modules:

```text
src/
  app/
    mobile/
    tv/
  components/
    shared/
    mobile/
    tv/
  design/
    tokens/
    typography/
    motion/
    icons/
  services/
    zarhosting/
      client
      types
      normalize
    playback/
      resolveStream
      pickQuality
      sourceValidation
      progress
    captions/
    downloads/
    pairing/
    library/
  storage/
  navigation/
  hooks/
  utils/
  tests/
```

Adapt this structure to the actual framework. Do not create empty folders just to imitate this tree.

Keep provider configuration in one location:
- API base URL.
- Approved media hosts.
- Provider-approved request requirements.
- Timeout and retry policy.

Keep stream resolution, source selection, and movie episode mapping in dedicated modules.

---

# 15. PERFORMANCE, ACCESSIBILITY, AND DEVICE SUPPORT

The owner uses a low-memory Android phone, so performance is not optional.

- Avoid huge image downloads and unbounded image caches.
- Use poster/backdrop sizes appropriate to the display.
- Lazy-load long content shelves.
- Virtualise long lists.
- Avoid unnecessary state updates during playback.
- Avoid expensive blur and layered shadows.
- Release player resources when leaving playback.
- Handle app background/foreground transitions.
- Handle Android memory pressure.
- Avoid excessive startup network calls.
- Cache catalogue JSON sensibly with expiry and refresh.
- Provide loading placeholders that preserve layout.
- Keep touch targets accessible.
- Provide readable contrast and scalable text.
- Respect reduced-motion settings.
- TV UI must be readable at normal viewing distance.

Test at minimum:
- A low-memory Android phone.
- A modern Android phone.
- Android TV / Google TV device or emulator.
- Slow and unstable network.
- Offline mode.
- App backgrounding during playback/download.
- Rotation and TV remote navigation.

Do not claim hardware compatibility based only on an emulator.

---

# 16. PRIVACY, SECURITY, AND LEGAL HONESTY

- Do not claim official Moviebox or zarhosting affiliation.
- Do not fabricate a permission letter or licence.
- Do not claim that public API access proves content distribution rights.
- Confirm the legal right to stream, cache, and download each content source before public release.
- Do not bypass DRM, access controls, authentication, rate limits, or anti-abuse restrictions.
- Do not expose credentials or private pairing tokens in logs.
- Do not store permanent secrets in the client.
- Use secure storage for device credentials.
- Minimise analytics and personal data.
- Make device unlinking/revocation available.
- Clearly explain permissions such as camera and storage/media access.
- Provide an About/Legal section with truthful product and provider disclosures.

If rights to the provider's content cannot be established, do not launch public streaming of that content. Keep the app architecture provider-agnostic so a licensed source can replace the current integration.

---

# 17. TESTING AND ACCEPTANCE CRITERIA

A feature is complete only when the real behaviour has been tested.

## Provider/catalogue
- Home loads from the real API.
- Search returns real results.
- Detail pages use the correct detail path.
- Season and episode data are mapped correctly.
- Missing or malformed fields do not crash the app.

## Playback
- A permitted test title resolves a real source.
- Playback works on a physical Android phone.
- Playback works on a physical Android TV/Google TV device.
- Quality selection uses actual returned sources.
- Expired URLs trigger a fresh stream resolution.
- Failed recovery produces a useful error.
- Playback progress survives app restart.
- Series episode navigation uses correct identifiers.
- No video bytes pass through our backend.

## Subtitles
- Captions load independently of video startup.
- Available languages are shown accurately.
- Subtitle synchronisation is verified.
- Missing captions do not break playback.

## Downloads
- File size/progress is measured from actual transfer.
- Interrupted downloads are not marked complete.
- Resume is used only when supported and verified.
- Completed files play offline in airplane mode.
- Background behaviour is tested on real Android hardware before being advertised.

## Pairing
- TV produces a unique expiring pairing challenge.
- Phone scans and identifies the correct TV.
- Approval is explicit.
- TV changes state only after valid approval.
- Expired/replayed/rejected challenges fail safely.
- User can revoke a paired TV.
- No permanent secret is embedded in the QR code.
- Pairing backend never handles media bytes.

## UI/UX
- Every visible control has a working action.
- Mobile navigation works.
- TV remote navigation works throughout the app.
- Focus is always visible on TV.
- Loading, empty, offline, and error states are implemented.
- Animations do not block input.
- Layouts work on small mobile screens and 16:9 TV displays.

## Build/release
- Android build completes reproducibly.
- No known critical crash remains.
- Dependencies and native configuration are documented.
- App permissions are minimal and justified.
- Release signing is configured only with owner-provided credentials.
- Do not invent signing credentials or commit secrets.

---

# 18. IMPLEMENTATION PHASES

Execute in this order. Do not skip the design work.

**Phase 0 — Repository and feasibility audit**
- Inspect project, branch, framework, build tooling, assets, and constraints.
- Verify current provider response shapes.
- Evaluate Android TV framework support and native player options.
- Identify legal/provider permission blockers.
- Present the architecture and implementation risks.

**Phase 1 — Product identity and design foundation**
- Establish visual direction options.
- Confirm brand name, logo direction, accent colour, typography, spacing, and icon system with the owner.
- Create design tokens and motion tokens.
- Define separate mobile and TV navigation models.

**Phase 2 — Screen blueprints and interaction flows**
- Design every mobile screen.
- Design every TV screen.
- Specify all transitions, focus behaviour, gestures, loading states, errors, and empty states.
- Review the design before large-scale implementation.

**Phase 3 — App foundations**
- App shell.
- Navigation.
- Design system components.
- Storage layer.
- Platform detection and mobile/TV separation.

**Phase 4 — Provider and catalogue**
- Typed zarhosting client.
- Normalisers.
- Home, search, and details.
- Error handling and caching.

**Phase 5 — Playback**
- Source validation and quality selection.
- Native mobile player.
- TV player.
- Subtitle integration.
- Resume progress.
- Real-device verification.

**Phase 6 — Library and downloads**
- Continue Watching.
- Watchlist.
- History.
- Download queue.
- Offline playback.
- Background/resume capabilities only after native feasibility testing.

**Phase 7 — TV pairing**
- Secure pairing service.
- QR generation and scanning.
- Approval and device registration.
- Revocation.
- Optional phone companion remote.

**Phase 8 — Motion and polish**
- Implement the approved motion system.
- Refine transitions and focus states.
- Optimise artwork loading and performance.
- Verify reduced-motion behaviour.

**Phase 9 — QA and release preparation**
- Run the complete acceptance checklist.
- Test on physical devices.
- Fix critical and high-priority issues.
- Document limitations and release requirements.
- Produce reproducible Android builds.

---

# 19. REQUIRED REPORTING FORMAT

At the end of each phase, report:

1. What was completed.
2. Important design/architecture decisions.
3. Files created or changed.
4. Commands/builds/tests actually run.
5. Test results, including failures.
6. Remaining blockers.
7. Next phase.

Separate verified facts from assumptions. Never label an untested feature as complete.

---

# 20. FINAL PRODUCT STANDARD

The finished product must have:

- A premium, distinctive streaming identity.
- A complete, polished Android mobile experience.
- A genuinely TV-native Android TV experience.
- Reliable remote navigation.
- Secure QR-based phone-to-TV authorisation.
- Real provider-backed catalogue and details.
- Direct device-to-CDN playback, where legally authorised and technically supported.
- Quality selection and robust playback recovery.
- Subtitles.
- Local library and playback progress.
- Reliable downloads and offline playback to the extent supported by the provider and Android platform.
- Carefully designed animations and micro-interactions.
- Complete loading, empty, error, and offline states.
- Real-device test evidence.
- No fake buttons, fake data, fake pairing, or fake success messages.

**The central instruction:** Do not optimise for the fastest demo. Build the correct foundation, make the experience visually exceptional, and verify that the actual product works. Preserve the separation between mobile and TV UX, and never put video traffic through our backend.
