# HALLYU-STREAM — UI/UX MASTER PLAN

**Creative foundation: NOCTURNE, developed into “The Screening Room”**

| Meta | Value |
|---|---|
| Document | `HALLYU_STREAM_UI_UX_MASTER_PLAN.md` |
| Version | 1.0 |
| Date | 2026-11-02 |
| Status | Design blueprint for Delivery Phases 1–2 (see `11-DELIVERY_AND_OPS.md`) |
| Platforms | Android mobile (touch-first) · Android TV / Google TV (remote-first) |
| Companion document | `streaming-company-architecture/` — the technical source of truth |
| Scope | **Planning only.** This document contains no application code. |

---

## How to read this document

This is the single design source of truth for HALLYU-STREAM. It is written so that a designer or developer who has never seen this project can build the interface without further explanation. It is a **design** document: it defines what the product looks, feels and behaves like. It never defines backend behaviour, and it never asks the reader to infer design from a placeholder.

Read in order, or jump by need:

- **Strategic:** §1–3 (vision, NOCTURNE development, brand).
- **Systemic:** §7–12 (navigation, journeys, tokens, type, components, motion).
- **Concrete:** §4–6 (screen-by-screen specifications).
- **Defensive:** §13–16 (states, accessibility, responsive, consistency).
- **Closing:** §17–20 (acceptance, next phase) and Appendices A–D.

### Deliverable coverage map (required contents)

| # | Required content | Where |
|---|---|---|
| 1 | Product design vision | §1 |
| 2 | NOCTURNE creative direction development | §2 |
| 3 | Brand identity and visual principles | §3 |
| 4 | Mobile experience specification | §4 |
| 5 | Android TV experience specification | §5 |
| 6 | Screen-by-screen design descriptions | §6 |
| 7 | Navigation architecture | §7 |
| 8 | User journey diagrams | §8 |
| 9 | Complete design token specification | §9 |
| 10 | Typography system | §10 |
| 11 | Component library specification | §11 |
| 12 | Motion and transition guidelines | §12 |
| 13 | Playback interface design | §13 |
| 14 | Device pairing experience | §14 |
| 15 | Empty, loading, error and success states | §15 |
| 16 | Accessibility guidelines | §16 |
| 17 | Responsive design principles | §17 |
| 18 | Design consistency rules | §18 |
| 19 | Design acceptance criteria | §19 |
| 20 | Recommendations for the next design phase | §20 |
| — | Microcopy bank · Icon inventory · Data-availability matrix · Open questions | Appendices A–D |

---

# 1. Product design vision

## 1.1 What HALLYU-STREAM is

A **standalone movie and television streaming application** for Android phone and Android TV. It is a separate product from the Hallyu social community app — no feeds, no follows, no comments, no creator tools. Its catalogue and stream metadata come from the configured provider; video bytes travel from the media CDN **directly to the viewing device**; a small backend exists only to pair phones with TVs.

## 1.2 The design idea in one sentence

> **HALLYU-STREAM is a private screening room in your pocket and on your wall — the lights are down, the artwork is lit, and nothing stands between you and the film.**

Every decision in this document serves that sentence. A streaming app cannot out-content the giants; it can out-*experience* them. Where template streaming UIs shout with colour, rows of identical tiles and permanent chrome, HALLYU-STREAM behaves like a considered cinema: darkness with purpose, one warm light, artwork presented as art, and interaction that gets out of the way.

## 1.3 Experience principles

These are the product's non-negotiable design values. When two ideas conflict, the higher principle wins.

| # | Principle | What it means in the UI | What it forbids |
|---|---|---|---|
| P1 | **The screen is a stage** | Artwork is the hero of every surface. UI recedes: obsidian ground, quiet type, chrome that appears when needed and fades when not. | Busy headers, competing accent colours, decorative shapes over artwork |
| P2 | **One warm light** | Copper is the only accent. It marks the single most important action or state on screen and nothing else. | Rainbow badges, coloured genre chips, accent-coloured headings |
| P3 | **Honesty is a feature** | Every state tells the truth: real progress, real errors, real empty screens. If the app doesn't know, it says so. | Fake success, placeholder content as product, optimistic “paired” states |
| P4 | **Confidence through calm** | Motion is brief, purposeful and quiet. Layouts breathe. Nothing pulses forever. | Perpetual animations, bouncy springs everywhere, carousel auto-rotation |
| P5 | **Each room is built for its seat** | Phone and TV share one identity but not one layout. TV is designed at ten feet; the phone at arm's length. | Stretching the phone layout onto TV; shrinking TV type onto phone |
| P6 | **Performance is design** | A gorgeous frame that stutters is a failed frame. Blur budgets, image discipline and reduced-motion are part of the visual system. | Heavy blur on content, full-viewport perpetual effects, unbounded image caches |
| P7 | **Respect the viewer** | No dark patterns, no fake urgency, no permission requests without explanation, no claiming partnerships that don't exist. | Pre-checked anything, misleading About copy, surprise paywalls |

## 1.4 What premium means here

Premium is **not** more effects. It is:

- **Art direction** — consistent colour grading of interface surfaces, disciplined type, spacing rhythm (§9–10).
- **Restraint** — glass and blur where they earn their place (§9.7), silence everywhere else.
- **Craft in states** — the empty screen, the error screen and the loading screen are designed with the same care as Home (§15).
- **Specificity** — copy written for this product (Appendix A), icons drawn for this product (Appendix B), motion tuned per platform (§12).

---

# 2. NOCTURNE creative direction development

This section documents the creative work behind the final direction. It exists so the identity is *argued*, not assumed.

## 2.1 Auditing NOCTURNE

NOCTURNE (deep obsidian surfaces, smoked glass, warm ivory and copper, cinematic artwork, layered depth, elegant type, controlled light, subtle motion, spacious layouts) was taken as a starting point and audited before adoption.

**Strengths (kept):**

| Strength | Why it works for HALLYU-STREAM |
|---|---|
| Deep obsidian / near-black ground | Movie art is colour-graded for dark environments; near-black makes posters and backdrops glow like lit frames |
| Warm ivory + copper restraint | Ivory reads as printed programme text; copper reads as lamplight/brass — warmth without noise |
| Cinematic artwork presentation | The product *is* artwork presentation; this aligns UI with content |
| Layered visual depth | Depth separates “content” from “chrome” without drawing lines everywhere |
| Elegant typography | Typography is the cheapest luxury signal; it differentiates from sans-only streaming UIs |
| Spacious layouts | Shelf rhythm and generous margins signal confidence and aid TV readability |

**Weaknesses and risks (designed against):**

| Risk | Failure mode | How this plan resolves it |
|---|---|---|
| Glassmorphism trap | Everything becomes translucent, blurred, rounded — the “cheap glass template” | **Glass budget (§9.7):** glass only on chrome (nav, player controls, sheets, pairing panels). Content surfaces are opaque |
| Blur cost | Gaussian blur is expensive on low-RAM phones (an owner-mandated target) | Blur confined to small surfaces, 12–20dp radius, single layer; **low-tier fallback** replaces blur with opaque elevated fill + hairline |
| Dark-UI contrast failure | Grey-on-grey text, unreadable metadata | Ivory family with enforced contrast ratios (§9.2, §16); muted text never below 4.5:1 for body |
| “Just another dark streaming app” | Indistinguishable from every other black + neon product | Editorial serif display type (§10), the copper thread (§3.3), signature compositions (§2.4) |
| Oversized rounded cards everywhere | Toy-like, content-hostile | Radius scale with explicit policy (§9.5): one dominant radius per region, posters at 12dp, never pill-cards |
| Accent sprawl | Copper leaks into decoration | Copper reserved for: primary action, focus, progress, active state. Never gradients, never large fills |

## 2.2 Explorations within the identity

Three compositions were explored inside the NOCTURNE language before selection.

**A — “Theatre Lobby”.** A dominant full-bleed hero above stacked shelves; chrome minimal; the feeling of standing in a cinema lobby under one marquee.
*Strengths:* immediate drama, obvious hierarchy, TV-native. *Weaknesses:* hero-first homes can hide catalogue depth; risks Netflix-like familiarity if type is generic.

**B — “Editorial Cut”.** Asymmetric magazine grid: large serif titles beside artwork, numbered sections, mixed poster/landscape crops like a film journal.
*Strengths:* unmistakably distinctive; great use of typography. *Weaknesses:* denser to scan; shelves of equal items (the core of a catalogue) are its weakest pattern; risk of feeling “blog-like” on TV.

**C — “Dark Gallery”.** Near-empty obsidian field with floating posters as exhibits, almost no chrome, navigation hidden in gestures.
*Strengths:* maximal artwork focus; serene. *Weaknesses:* discoverability suffers (low-information scent), gestures break TV remotes, empty states feel accidental.

**Selection: A as the structural base, with B's typographic system fused in — named internally “The Screening Room”.** C's calm is absorbed into spacing and chrome discipline, not its structure.

Rationale:
1. The core job of the product is **browsing a catalogue and starting playback fast** (architecture pack §03/04). Theatre-Lobby structure serves that job with the clearest hierarchy.
2. The editorial type system (display serif + letterspaced reel labels + credits-style metadata) is the cheapest, most durable differentiator against template streaming UIs.
3. A + B hybrid survives the platform split: the same identity scales down to a phone screen and up to a ten-foot TV without stretching (§4–5).
4. C's hidden-chrome idea becomes the **player and focus behaviour** (controls appear on demand), where it is safe on both touch and D-pad.

## 2.3 Distinctiveness test

The direction is only accepted if it fails the “would anyone else ship this exact screen?” test at least three times. The three signatures below are the outcome.

## 2.4 Signature system — the four marks of HALLYU-STREAM

| # | Signature | Description | Where it appears |
|---|---|---|---|
| S1 | **The Marquee Hero** | A cinematic still occupying the top of Home, graded darker at the lower edge where it dissolves into pure obsidian; the title set in display serif like a film title card; a “credits line” of metadata beneath; one copper Play CTA sitting where the light falls | Home (both platforms), TV sleep/ambient moment |
| S2 | **Smoked-glass chrome** | Navigation, player controls and sheets are smoked-glass slabs: translucent ink fill, a single hairline of light along the top edge, no borders on the other three sides | Bottom nav, player chrome, sheets, TV rail active surface |
| S3 | **The copper thread** | One accent, used like a lighting cue: Play, focus rings, progress bars, active nav. If copper appears twice on a screen, one of them is wrong | Everywhere, sparingly |
| S4 | **Reel labels** | Shelf/section names as small letterspaced caps (e.g. `C O N T I N U E   W A T C H I N G`) with a thin rule extending to the edge — the rhythm of a film-strip margin | All shelves and settings groups |

These four marks, applied consistently, make the product recognisable in a screenshot before any logo is visible.

---

# 3. Brand identity and visual principles

## 3.1 Identity positioning

HALLYU-STREAM is **international premium cinema with a subtle Korean-wave heritage** — the name carries 한류 (Hallyu, “Korean Wave”) and the identity nods to it with restraint: it must read as a world-class film service first, and only then reveal its heritage in crafted details. The product streams global content (the test fixture is *Breaking Bad*); the identity must not imply a Korean-only catalogue.

## 3.2 Wordmark and lockups

| Element | Specification |
|---|---|
| Wordmark | `HALLYU-STREAM` — display serif (Fraunces direction, §10), semibold, letterspacing 0.04em, ivory `#F4EFE7`. Hyphen stays: it reads as “Hallyu · stream”, a rhythm break between two words |
| Brand rule | A 2dp copper rule the width of `STREAM` sits 6dp below the wordmark — the “last light of the screening room” |
| Hangul lockup | 한류 스트림 set small (≈30% of wordmark height), letterspaced 0.3em, ivory at 60% opacity — **only** on: splash, About screen, TV activation. Never inside functional UI |
| App icon | Obsidian rounded square (radius 22%), a single copper serif “H” centred, no gradients, no glass. Legible at 48dp |
| Voice | Assured, cinematic, understated. Short sentences. No exclamation marks. No “binge”, no “content” as a word for films — say *title*, *film*, *episode* |

## 3.3 The copper thread (brand colour rule)

Copper `#C97B4A` is the brand's single voice. It is lamplight in a dark room. Discipline: **one primary copper element per screen region.** Examples: on Detail, the Play button owns copper and the progress bar is copper only while playing; on Home, the active nav icon is copper while the Play CTA is copper — these are separate regions (content vs chrome). Full rules in §18.

## 3.4 Artwork direction

The interface does not impose a grade on studio artwork. Posters and backdrops arrive as-is from the provider. Branding is applied by **frame and light**, not by filter:

- All artwork sits in consistent frames (§9.6) with 12dp radius on posters.
- Backdrops are always dissolved into obsidian with a two-stop scrim (transparent → `#0A0B0D`), never left with a hard edge.
- Fallback tiles (missing artwork) are typographic: obsidian-elevated ground, title in display serif, a faint copper rule — a title card, not a grey box (§15.3).

## 3.5 Brand moments

Five moments carry the full identity; everything else stays quiet: **splash** (wordmark + brand rule, single light sweep), **onboarding cards** (full-bleed stills + serif lines), **Marquee Hero** (S1), **TV activation** (identity + QR panel), **About screen** (full lockup with Hangul).

## 3.6 What HALLYU-STREAM deliberately is not

Not a social product (no avatars in main flows, no activity feeds). Not a neon “cyber” product. Not a glass-everything showcase. Not a playful, rounded, colourful product. Not a stretched website. The About screen must state this is an independent experience, not affiliated with or endorsed by Moviebox (per architecture `09-SECURITY_AND_PRIVACY`).


---

# 4. Mobile experience specification (Android phone)

## 4.1 Role of the mobile app

Touch-first companion and standalone player: discover, search, read details, play, download, manage a personal library, and pair/control the TV. Mobile is **not** a remote control with a screen bolted on — it is a complete product. Pairing is an enhancement, never a requirement to watch on the phone.

## 4.2 Information architecture (decision)

The architecture pack leaves one IA choice open: “Settings (or Profile + Settings — pick one.”). **Decision: five-tab bottom navigation — Home · Explore · Search · Library · Settings. No separate Profile tab.**

Rationale:
1. The product is **local-first** (pack `08`, `09`): no account is required to watch. A Profile tab would be an empty room.
2. When optional accounts arrive later, the account surface lives at the top of Settings as “Sign in (optional)” — one obvious home, no phantom tab.
3. Five tabs is the maximum that keeps each tab label legible on compact phones (§17).

| Tab | Root screen | Purpose |
|---|---|---|
| Home | §6.1.3 | Personalised front page: Marquee Hero, Continue Watching, catalogue shelves |
| Explore | §6.1.4 | Deliberate browsing: categories/collections when data allows |
| Search | §6.1.5 | Find a title fast |
| Library | §6.1.15 | The viewer's shelf: Continue, Watchlist, History, Downloads |
| Settings | §6.1.17 | Playback defaults, subtitles, storage, devices, about |

**Stack routes** (push over any tab): Title detail, Series detail, Player (fullscreen), Downloads manager, Pairing hub, QR scanner, Pairing approval, Device management, Settings sub-screens. **Modal surfaces:** bottom sheets (quality, subtitles, episodes, filters), dialogs (destructive confirm), full-screen player.

## 4.3 Global mobile behaviours

| Behaviour | Rule |
|---|---|
| Touch targets | Minimum 48dp hit area; icon buttons render 24dp glyphs inside 48dp boxes |
| Thumb zone | Primary actions (Play, Resume, Approve) sit in the lower 40% of the viewport wherever layout allows |
| Back | Closes sheet/dialog first, then pops the stack; on Player, back exits the player (after any confirm-if-accidental rule in §13.7); on Home root, back exits app |
| Orientation | Detail and browsing = portrait-locked. Player = orientation follows the content: portrait shows a contained player with metadata below; tapping the expand control or rotating to landscape enters fullscreen |
| Gestures | Tap only in browsing. Player supports tap-to-toggle controls, double-tap seek ±10s (left/right half), drag-on-vertical for brightness (left) and volume (right) **only after** reliability validation (§20); swipe-down to exit is disabled (too error-prone) |
| Edge-to-edge | All screens draw behind system bars; content respects insets via safe areas (§9.6). The player is always edge-to-edge |
| Haptics | Light impact on: Play tap, favourite toggle, pair success. Never on scrolling |
| System back during download | No interruption to downloads (design never implies otherwise) |

## 4.4 Performance posture (owner constraint: low-memory phones)

Design-level rules that the visual system must respect (expanded in §17.3):

- No blur outside the glass budget (§9.7). On `lowTier` devices the budget collapses to zero blur.
- Shelf images are sized to their frames; the design specifies **exact render sizes** so art is never decoded at hero scale into a thumbnail.
- Shelves lazy-render; Home shows skeleton shelves matching final layout (§15.2) so nothing jumps.
- The hero image is the only full-bleed artwork on Home; no second competing masthead.
- All perpetual motion is banned; shimmer skeletons are the only looping animation and stop on content load.

---

# 5. Android TV / Google TV experience specification

## 5.1 Role of the TV app

A first-class, television-native product. It shares catalogue, playback rules and brand identity with mobile, but **nothing about its layout**. It is operated entirely by D-pad remote and watched from a sofa (the “ten-foot” condition). After pairing, the TV is fully usable **without the phone**.

## 5.2 Ten-foot interface principles

| # | Principle | Specification |
|---|---|---|
| T1 | One focus, always visible | Exactly one focused element at all times. Focus is unmistakable from 3 metres: 3dp copper ring + 1.04 scale + elevation lift (§5.5) |
| T2 | Large type, few words | Body text never below 20sp at 1080p baseline (§10.2). Copy is cut down, not scaled down |
| T3 | 16:9 composition, overscan-safe | All content inside a 5% overscan safe area (96px left/right, 54px top/bottom at 1080p). No essential element in the outer band |
| T4 | Horizontal shelves, vertical stack | The TV mental model is “rows on a wall”. Navigation is left rail (persistent) + content panes |
| T5 | Artwork at television scale | Posters are 2:3 at ~260dp width on Home shelves (≈2.3 per screen); heroes are full-width 16:9 crops with lower-edge dissolve |
| T6 | Motion is light, not layout | Focus movement animates scale/elevation only; neighbours never reflow. No page-swipe transitions that teleport focus |
| T7 | Remote-first completeness | Every journey in §8 is completable with D-pad + Select + Back + Play/Pause only |

## 5.3 Navigation model (decision)

**Persistent left rail** (icon + label), content pane to the right. The architecture pack rules out mobile bottom tabs on TV; between “top rows” and “left rail”, the rail wins: it survives long lists, it keeps focus memory per section, and it is the established TV pattern users already know. Rail items: **Home · Explore · Search · Library · Settings · Devices**.

- Collapsed width 96dp (icons), expands to 240dp when focused (labels slide in) — the expansion is part of S2 smoked-glass chrome.
- The rail is a smoked-glass slab against the obsidian wall.
- Selecting a rail item swaps the content pane **in place** (no screen wipe); the pane's first focusable row receives focus, and focus memory per rail item is preserved.

## 5.4 Remote-control map

| Input | Global behaviour | Player behaviour |
|---|---|---|
| D-pad | Move focus predictably (see §5.6 focus rules) | Left/Right: seek ±10s (repeat ramps to ±30s after 2 holds); Up: reveal controls; Down: episode list (series) |
| Select / OK | Activate focused item | Play/pause when controls hidden; activate when controls visible |
| Back | Dismiss top overlay → pop pane → exit app from root (with confirm only if playback is active) | Hide controls; then exit player |
| Play/Pause | — | Toggle playback |
| Menu / Settings key | Open quick settings overlay (quality, subtitles) | Same |
| Key repeat | Debounced: one action per press; repeats only for seek/scroll | Same |

## 5.5 Focus system (designed)

| Property | Specification |
|---|---|
| Focus ring | 3dp solid `#C97B4A` outline, 4dp offset, corner radius follows the focused component's radius |
| Focus scale | 1.04 on cards/posters; 1.02 on buttons/rail items. Scale is applied to the focused element only, and shelves reserve 4dp padding so scaled items never clip or push neighbours |
| Focus elevation | Focused card lifts to elevation-2; unfocused cards stay elevation-0 with a 60% brightness veil (the “dark room” — only the focused art is fully lit) |
| Focus memory | Each shelf remembers its last focus position when focus leaves and returns; each rail item remembers its pane position |
| Focus recovery | Closing a dialog returns focus to the **trigger**; closing the player returns to the exact detail position; after an error screen action, focus lands on the primary action |
| Focus never dies | No state change may leave the UI without focus (loading, errors, empty). On content replace, focus moves to the nearest logical neighbour |
| Unfocusable | Purely decorative elements (backgrounds, rules, scrims) are skipped by the focus engine |

## 5.6 Directional focus rules

- Horizontal shelves: Up/Down moves between shelves, preserving horizontal position where possible; Left/Right walks items; hitting the shelf edge does **not** wrap (prevents mis-clicks), except within the left rail which does wrap vertically.
- Grids (results, explore): full 2D movement, row heights equal so the focus never jumps vertically mid-row.
- Dialogs: focus trapped inside; Back closes; the trigger regains focus.
- The on-screen keyboard (§6.2.7) is a standard row grid with explicit “OK” and “Space” rows; Back closes the keyboard before leaving the screen.

## 5.7 TV global behaviours

- **Screensaver/ambient:** after 5 minutes idle in non-playback screens, the hero fades to a dimmed Marquee still with the wordmark at 40% opacity; any key dismisses. (Prevents burn-in on OLED; keeps the room cinematic.)
- **Overscan:** all layout in §6.2 is drawn to the safe area; the hero artwork may bleed to the true edge (it is decorative), but titles and controls never do.
- **720p / 1080p / 4K:** the design is specified at 1080p dp-baseline; all sizes are dp and scale proportionally. At 720p, type floors (T2) are enforced by the type scale's minimums, not by designer discretion.
- **Pairing gate:** an unpaired TV shows Activation (§6.2.2) before any catalogue surface. After pairing, no per-episode scanning, ever (pack `07`).

## 5.8 TV performance posture

Focus animations run on the compositor (transform/opacity only). Hero artwork decodes at pane size. Shelves render one screen-row ahead. No blur behind the rail on low-tier TV hardware — the rail becomes opaque `#111318` with the same hairline (§9.7 fallback).


---

# 6. Screen-by-screen design descriptions

Every screen is specified with the same template: **Purpose · First focus · Layout · Hierarchy & components · Interactions · Transitions · States.** Component names map to §11; tokens map to §9–10; copy lines map to Appendix A. The player is specified once in §13 and referenced here.

ASCII diagrams are top-down, not to scale. `░` = glass chrome, `▓` = artwork, `─` = rules/edges.

## 6.1 Mobile screens

### 6.1.1 Splash

- **Purpose:** brand moment + technical warm-up (first catalogue fetch begins behind it).
- **First focus:** the wordmark, centred on pure obsidian.
- **Layout:** full obsidian; `HALLYU-STREAM` wordmark centred; copper brand rule under `STREAM`; Hangul lockup 한류 스트림 beneath at 60% opacity, 30% size. Nothing else.
- **Hierarchy & components:** Wordmark (§11.1). A single light sweep (S1 at micro scale) passes once across the wordmark over 800ms and stops — the “projector lamp” moment.
- **Interactions:** none. Splash auto-advances (≤1.5s) to Onboarding (first launch) or Home (returning).
- **Transitions:** crossfade to next screen (320ms); never a spinner on brand.
- **States:** if warm-up fails, splash still exits — errors surface on Home (§15), not here.

### 6.1.2 Onboarding / brand introduction

- **Purpose:** one-time, ≤3 cards that state what the product is; skippable in one tap.
- **First focus:** card 1 artwork and its serif line.
- **Layout:** full-bleed cinematic still per card, bottom scrim to obsidian; display-serif headline (one line); one supporting line in body ivory-muted; page dots (copper active); `Skip` top-right; `Continue` copper CTA in the thumb zone. Card 3's CTA reads `Enter`.
- **Card content (final copy):**
  1. *“The lights go down.”* / “A cinema built for your phone and your TV.”
  2. *“Every title, lit like art.”* / “Browse, save, and pick up where you left off.”
  3. *“Your phone meets your TV.”* / “Pair once with a code. Watch anywhere.”
- **Hierarchy & components:** OnboardingCard ×3, PageDots, PrimaryButton, TextButton(Skip).
- **Interactions:** swipe between cards; Skip → Home immediately; Continue advances; Enter → Home.
- **Transitions:** horizontal slide 320ms with artwork crossfade.
- **States:** images may arrive slow — each card shows its scrim + type immediately over an elevated placeholder; never a blank black card.

### 6.1.3 Home

- **Purpose:** the front page of the screening room: what to watch now, and where you left off.
- **First focus:** the Marquee Hero title area (tapping anywhere on hero art opens detail).
- **Layout:**

```
┌────────────────────────────┐
│ ▓▓▓▓▓▓▓ MARQUEE HERO ▓▓▓▓▓│  ~56vh, backdrop dissolves ↓
│ ▓▓  Title (serif)      ▓▓▓ │
│ ▓▓  2008 · TV-MA · ★8.6 ▓▓ │  credits line
│ ▓▓  [▶ Play]  [+ My List] ▓▓│  copper CTA + ghost icon
│ ── C O N T I N U E  W A T C H I N G ──────│
│ [card 45%] [card] [card]   │  landscape cards w/ progress
│ ── T R E N D I N G ────────────────────────│
│ [poster][poster][poster]…  │  2:3 shelf
│ ── N E W   T H I S   W E E K ──────────────│
│ [poster][poster][poster]…  │
│ …                          │
│ ░░ Home  Explore  Search  Library  Settings ░│  glass nav
└────────────────────────────┘
```

- **Hierarchy & components:** MarqueeHero (S1), ReelLabel shelves (S4), ContinueCard (landscape + copper progress hairline), PosterCard shelves, GlassBottomNav (S2).
- **Shelf order (data-driven):** Continue Watching (only if entries exist — first shelf, always) → provider home rows in `/home` order, normalised into shelves (Trending, New, genres…). If `/home` rows carry category metadata, Explore deep-links from reel labels.
- **Interactions:** hero tap → detail; Play → player with resume if progress exists; `+ My List` toggles watchlist (icon → filled + haptic); shelf scroll horizontal with edge fade; nav tap switches tab; reel label tap → Explore filtered (when category data exists, else non-interactive label).
- **Transitions:** entering Home, hero fades in from obsidian (400ms), shelves rise 8dp staggered 40ms; detail push from any card is a shared-element poster expansion (§12.2).
- **States:** loading = skeleton of the exact final layout (hero block + 2 skeleton shelves, shimmer once then hold); catalogue error = full-viewport state §15.1; slow images = elevated placeholder inside each frame, never layout shift.

### 6.1.4 Explore

- **Purpose:** deliberate browsing when the user isn't chasing a title.
- **First focus:** category chip row.
- **Layout:** top: screen title `Explore` (serif display, 28sp); chip row (All, Films, Series, genres from data); below: 2-column poster grid (posters 2:3, gap 12dp) grouped by ReelLabels when collections exist; grid-only mode otherwise.
- **Data reality (Appendix C):** the documented provider surface has no dedicated browse endpoint. Explore is built from category/collection metadata in `/home` payloads. **Fallback ladder:** (1) collections + genres → chips + labelled groups; (2) genres only → chips + filtered grid; (3) nothing → Explore shows “Featured” grid (all titles from home rows, deduped) and a quiet note “More categories as they become available.”
- **Hierarchy & components:** ScreenTitle, ChipRow (single-select filter), ReelLabel, PosterGrid, EmptyState.
- **Interactions:** chip filters the grid in place (120ms crossfade); poster tap → detail; pull-to-refresh re-fetches home data.
- **Transitions:** chips animate selection with copper underline; grid filter crossfades.
- **States:** loading = 6 skeleton posters; empty filter = EmptyState (“Nothing in this category yet”); error = inline retry card, filters preserved.

### 6.1.5 Search

- **Purpose:** find a title in seconds; make typing feel cinematic, not clerical.
- **First focus:** the search field (keyboard opens on entry).
- **Layout:** search field pinned top (glass-quiet, 52dp, copper caret); below: before typing → `Recent` (ReelLabel + query rows with remove icons) and `Popular searches` (chip cloud from home data); while typing → live results begin after 2 characters (300ms debounce).
- **Hierarchy & components:** SearchField, QueryRow, Chip, PosterGrid (results), SkeletonRows.
- **Interactions:** submit/click result → detail; `X` clears field; recent query tap re-runs; each result row swipe-left → add to watchlist (discovery shortcut); history stored locally (§`08` schema).
- **Transitions:** field expands from the nav on first entry (240ms); results crossfade per debounce.
- **States:** idle, typing (skeleton rows), results, **no results** (Appendix A copy + “Check spelling or try fewer words”), error (inline, query preserved).

### 6.1.6 Search results

- **Purpose:** scan and compare matches.
- **Layout:** filter chips (All · Films · Series); results as **list rows** (landscape thumb 96×54, title, credits line, chevron) — rows beat grids for fast vertical scanning of matches; grid toggle available as icon button (grid = 3-col posters).
- **Interactions:** row tap → detail; filter chips; sort is not offered (provider relevance order is trusted).
- **States:** pagination footers use a small copper ring; end-of-list shows a quiet “That's everything for ‘…’”.

### 6.1.7 Movie detail

- **Purpose:** decide and play. The most art-directed non-player screen.
- **First focus:** Play button in the thumb zone (visually: the title).
- **Layout:**

```
┌────────────────────────────┐
│ ▓▓▓▓▓ backdrop (16:9) ▓▓▓▓ │  dissolves to obsidian at 65%
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│  Title (serif display 32sp) │
│  2008 · TV-MA · ★8.6 · 1h48 │  credits line
│  [ ▶ Play ]   [ ↓ Download ]│  copper CTA + ghost
│  [ + My List ]  [ Cast? no ]│  icon row (see below)
│  Overview body (5 lines + …)│
│  ── T I T L E S   L I K E ──│
│  [poster][poster][poster]   │
└────────────────────────────┘
```

- **Hierarchy & components:** BackdropHeader (S1 grammar), DisplayTitle, CreditsLine, PrimaryButton(Play), SecondaryButton(Download — only when downloadable sources exist), IconActions (My List bookmark, Share omitted — no social), OverviewBody (collapsible at 5 lines), ReelLabel shelf `Titles like this` (from home/category data; hidden if unavailable).
- **Interactions:** Play → player (resolves stream; if prior progress → button reads `Resume ▶ from 42:10` and a `Start over` text link appears); Download opens quality sheet (§6.1.11 variant) then adds to Downloads; My List toggles with haptic; back returns to the exact originating shelf position.
- **Transitions:** shared-element from poster/backdrop (320ms); title rises 12dp into place after art settles.
- **States:** loading = skeleton (backdrop block + 3 type bars); metadata gaps = “—” placeholders, never invented data; error = §15.1 variant with Retry; no sources (`has_resource` false) → Play disabled with honest label `Not available to play` and Download hidden.

### 6.1.8 Series detail

- **Purpose:** same as movie detail plus season/episode navigation.
- **Differences from 6.1.7:** Play becomes `Resume S2:E4` (from progress key `subjectId|se|ep`); below Overview sits a **seasons block**: season selector (pills or dropdown per platform width) + episode list preview (first 3 episodes as rows); `See all episodes` opens the episode sheet (§6.1.9).
- **Episode row anatomy (preview):** landscape still 128×72 (radius 8), `E4` micro-label copper when in-progress, episode title (body semibold), duration meta, one-line synopsis (meta, 1 line).
- **States:** season with zero episodes → “Episodes for this season aren't available yet.”; missing stills → typographic fallback tile with `E{n}`.

### 6.1.9 Season & episode selection (bottom sheet + full list)

- **Purpose:** choose an episode without losing the detail context.
- **Layout:** bottom sheet at 85vh: grabber, `Season {n}` dropdown (menu), full episode rows (scroll), each with progress hairline if watched.
- **Interactions:** row tap → player for that episode; season change reloads list; drag-down or backdrop tap closes.
- **Transitions:** sheet slides 240ms (§12.4); list crossfade on season change.
- **States:** loading rows skeleton; error = inline retry within sheet; watched episodes show an ivory “watched” check (not copper — copper is reserved).


### 6.1.10 Player (fullscreen)

- **Purpose:** watch. Specified in full in **§13** (chrome, controls, states). Summary: edge-to-edge video, smoked-glass control chrome (S2) revealed on tap and auto-hidden after 3.5s of playback; top bar = back · title · subtitle · quality; bottom = seek bar with copper progress, elapsed/remaining, transport; double-tap ±10s; portrait = contained player + detail below, landscape = immersive.
- **Entry transitions:** controls fade in 180ms; video crossfades from the detail backdrop (matched dissolve).
- **States:** loading ring + “Preparing the stream…”; buffering = inline; errors/re-resolve = §13.5; complete = next-episode overlay (series) or `Watch again` card (movie).

### 6.1.11 Playback settings sheets (quality · subtitles · audio)

- **Purpose:** change stream behaviour without leaving playback.
- **Layout:** bottom sheet over the paused player: segmented header `Quality | Subtitles | Audio` (audio tab hidden when the provider returns a single track).
  - **Quality:** radio list of **real sources only** (never invented qualities — pack `02`): `Auto (recommended)` + each resolution with size meta (`1080p · 1.4 GB`). Auto shows a small copper “current” dot on the resolution being used.
  - **Subtitles:** `Off` + languages from captions endpoint; remembered preference is pre-selected; missing captions → the tab shows “No subtitles for this title” (video must never block).
  - **Audio:** track list when present.
- **Interactions:** selection applies instantly and closes the sheet; quality change re-resolves only if needed (§13.4).
- **States:** loading = skeleton rows; captions fetch failure = subtitles tab shows retry, video unaffected.

### 6.1.12 Next-episode overlay

- **Purpose:** keep a series moving without a cliffhanger menu. Detailed timing in §13.6.
- **Layout:** final 20s of an episode (or on completion): smoked-glass card lower-third: next episode still, `Up next · S2:E5`, title, countdown ring (10s copper ring), `Play now` copper + `Cancel` ghost.
- **Interactions:** auto-plays next after countdown (only for consecutive episodes); Cancel dismisses to the completed state; countdown pauses when the overlay has focus/attention.
- **States:** no next episode → no overlay (movie behaviour); if next episode has no stream → overlay shows `Next episode unavailable` + `Back to series`.

### 6.1.13 Watchlist

- **Purpose:** the “saved for later” shelf.
- **Layout:** ScreenTitle `My List`; 2-column poster grid; each tile long-press → remove menu; header shows count.
- **Interactions:** tile tap → detail; remove via long-press menu or swipe (with undo snackbar, 5s).
- **States:** empty = EmptyState (§15.1) “Your list is empty / Save anything for later — tap the bookmark on any title.” with a `Browse Home` CTA; loading skeletons; local store error = rare, copy “We couldn't load your list on this device.”

### 6.1.14 Continue Watching

- **Purpose:** one-tap resume — the most-used surface after Home.
- **Layout:** accessible as Library tab section **and** as its own pushed screen from Home's reel label; rows = landscape cards with copper progress hairline, title, `S2:E4 · 42 min left` meta, `×` remove-from-history (with confirm).
- **Interactions:** tap → player at saved position (`subjectId|se|ep` key, pack `05`); remove clears progress entry only.
- **States:** empty (“Nothing in progress / Your place is kept automatically when you watch.”); stale entries (title no longer resolvable) stay visible with an `Unavailable` tag and remain removable.

### 6.1.15 Library

- **Purpose:** the viewer's shelf — everything personal in one tab.
- **Layout:** ScreenTitle `Library`; segmented tabs (pill chips): **Continue · My List · History · Downloads**; each segment = its own scroll area (position preserved per segment).
- **Hierarchy & components:** SegmentChips, then the segment's content (6.1.14 / 6.1.13 / history rows / downloads summary card → Downloads manager).
- **History:** reverse-chronological rows (title, watched date meta, rewatch play icon).
- **Downloads summary card:** storage meter (§11.24) + `Manage` → Downloads manager.
- **States:** each segment carries its own empty state; Library never shows a single generic blank.

### 6.1.16 Downloads manager

- **Purpose:** control offline content with total honesty about state (pack `05`: no false “complete”).
- **Layout:** top: storage meter (`12.4 GB used · 8.1 GB free` with copper-on-ink bar); sections: **Downloading** (rows with pause/cancel), **Available offline** (rows with size + play), **Needs attention** (failed rows with reason + Retry).
- **Download row anatomy:** poster thumb 48×72, title, `S2:E4 · 1080p · 720 MB`, progress hairline + `%` when bytes are known.
- **Interactions:** pause/resume/cancel (cancel → confirm dialog); row tap → play offline; Retry on failed rows re-resolves a fresh URL (expired signed URLs — pack `05`) and resumes only if Range is verified; `Free up space` → Settings → Storage.
- **States:** downloading / paused / complete (integrity-checked) / failed / interrupted / storage full (§15 rows). Stage-2 background downloads are labelled `Background downloads are experimental` until proven on hardware — the design never promises reliability that isn't there.

### 6.1.17 Settings

- **Purpose:** quiet administration, same design language, no new visual ideas.
- **Layout:** ScreenTitle `Settings`; grouped list rows (ReelLabel group headers):
  - **Playback** — Default quality (Auto), Subtitle language, Autoplay next episode (on)
  - **Downloads** — Download quality (Wi-Fi only toggle), Storage (→ sub-screen)
  - **Devices** — Connected TVs (→ Device management), Pair a TV (→ Pairing hub)
  - **App** — Reduce motion (follows system, can force), Clear search history, About (→ About)
- **Row anatomy:** label (body) + current value (meta, muted) + chevron. Toggles are copper when on.
- **States:** values loading from local DB show `—`; destructive rows (Clear search history) confirm via dialog.

### 6.1.18 Settings sub-screens

- **Playback defaults:** radio lists mirroring §6.1.11 (quality: Auto + real resolutions; subtitle language: Off + languages seen from provider), each with one-line explanatory meta.
- **Storage:** big number (used/free), per-category breakdown (Downloads, Cache), actions: `Clear image cache` (with copy that offline files are not touched), `Remove all downloads` (destructive, confirmed). Insufficient-space education line for future downloads.
- **About:** full brand lockup (wordmark + brand rule + Hangul), version, honest paragraph (Appendix A), open-source licences row, privacy summary row (camera=pairing scan, storage=downloads only — pack `09`).
- **Transitions:** standard push 320ms; back preserves scroll.

### 6.1.19 Pairing hub (Connect to TV)

- **Purpose:** one obvious place for the phone↔TV story.
- **Layout:** ScreenTitle `Connect to TV`; large pairing panel (QR scan CTA copper, `Enter code instead` secondary); **Paired devices** section below (DeviceCards, §11.22) with per-device status; empty devices → explanatory empty state before the CTA, not after.
- **Interactions:** Scan → QR scanner (§6.1.20); Enter code → 6-character code field (auto-uppercase, grouped `XXX-XXX`); device card → Device management detail; `Unpair` per device via sheet with consequences spelled out (“This TV will need a new code to sign in.”).
- **States:** pairing service unavailable = panel shows honest error + Retry (never fake pairing — pack `07`); offline = disabled CTA + copy.

### 6.1.20 QR scanner

- **Purpose:** scan the TV's activation code.
- **Layout:** full-screen camera preview; darkened with a 260dp clear window; copper corner brackets (4, unconnected, 24dp arms); instruction line above (“Point at the code on your TV”), `Enter code instead` + flash toggle below. **Never a fake camera preview** if permission is denied — see states.
- **Interactions:** detect → haptic + auto-navigate to Pairing approval; torch toggle; back exits.
- **Permission flow (pack `09`):** first entry shows a **priming sheet** (“Camera access is used only to scan the TV code”) → system prompt → denied state offers `Enter code instead` and `Open settings`.
- **States:** scanning / matched / no-permission / invalid code (“That doesn't look like an HALLYU-STREAM pairing code.” + Rescan) / service unreachable after scan.

### 6.1.21 Pairing approval

- **Purpose:** explicit, honest consent for binding a TV (pack `07` — no auto-approve).
- **Layout:** device card on obsidian-elevated: TV glyph, name (`Living Room TV`), model meta, and the line “This code was generated on your TV. Approving links it to this phone.”; **Approve** (copper, dominant) + **Reject** (ghost); a 30-second countdown mirrors the TV's remaining TTL.
- **Interactions:** Approve → success state (haptic + “Living Room TV connected” + `Done` → Pairing hub); Reject → returns to scanner with toast “Connection declined”.
- **States:** pending / approved / rejected / expired (“This code expired. Request a new one on the TV.”) / service error. Approval is never simulated before backend confirmation.

### 6.1.22 Device management

- **Purpose:** list and revoke paired TVs (the revocation path is mandatory — pack `09`).
- **Layout:** DeviceCards list: name, type glyph, `Last seen 2 days ago` meta, `Unpair` per card; footer note about what unpairing does.
- **Interactions:** Unpair → confirm dialog → card leaves with undo snackbar (revocation itself is immediate; undo re-pairs only via new scan — copy says so honestly).
- **States:** empty (no devices), loading, error, offline.

### 6.1.23 Companion remote (optional concept, later phase)

- **Purpose:** optional control of a paired TV from the phone (play/pause, D-pad, type-into-search). **Never required** for core TV use (pack `04/07`).
- **Concept layout:** obsidian canvas; circular D-pad glass ring (S2); transport row (play/pause, ±10s); keyboard sheet for text entry into the TV's search field; persistent TV name + connection status at top.
- **Constraints (design-level):** sends **intent metadata only** (subjectId/detailPath/se/ep, key events) — never media URLs (ADR 001); latency affordance (button press states persist 120ms minimum so taps don't feel lost); disconnect = honest state + reconnect CTA.
- **Status in this plan:** designed at concept level; production design is deferred (§20).

## 6.2 Android TV / Google TV screens

TV screens follow the same template but add **Focus** to every spec.

### 6.2.1 Splash / loading

- **Purpose:** brand + app warm-up on the big screen.
- **Layout:** obsidian wall; wordmark + brand rule centred (wordmark at 64sp equivalent); after 2s of loading, a quiet tagline fades in under it (“Your screening room is opening.”). No spinner; a slow copper light sweep crosses once every 3s **at most** (a permanent sweep would violate P4).
- **Focus:** none yet (no interactive elements).
- **States:** >8s load → the tagline becomes “Still opening… your catalogue is on its way.”; failure routes to §6.2.16.

### 6.2.2 Activation & pairing welcome

- **Purpose:** authorise this TV via the phone before the catalogue (pack `04` §5). Full state machine in **§14**.
- **Layout (16:9 safe area):**

```
┌────────────────────────────────────────────┐
│  HALLYU-STREAM                    08:42 left│  brand + countdown
│                                            │
│   ┌──────────┐      Connect your phone     │
│   │  ▓QR▓▓  │      1. Open HALLYU-STREAM   │
│   │  ▓▓▓▓▓  │      2. Tap Connect to TV   │
│   └──────────┘      3. Scan this code      │
│   ┌──────────┐                             │
│   │ K7M-2Q4 │      Or enter this code     │
│   └──────────┘                             │
│   one-time code · never contains video     │  security microcopy
└────────────────────────────────────────────┘
```

- **Hierarchy & components:** QRPanel (smoked glass, S2 — the only glass on screen), ShortCode (serif mono, huge), CountdownRing (copper), numbered steps (body, 22sp), security microcopy (meta, muted).
- **Focus:** before approval the focusable set is minimal (`Regenerate code`, `Settings`); the QR panel itself is focusable and reveals the enlarged code overlay when selected (for users who can't scan).
- **Interactions:** code expires → auto-refresh with visible new countdown; Select on QR → zoom overlay; Back → no exit (activation is the gate) but opens Settings for network help.
- **States:** pending / approved (see 6.2.3 entry) / expired / rejected / network error / pairing-service-unavailable — each with plain-language copy per Appendix A.

### 6.2.3 Home (TV)

- **Purpose:** the ten-foot Marquee. Same content architecture as mobile Home, radically different composition.
- **Layout:** left rail (S2, expanded on focus); content pane: full-width Marquee Hero (backdrop 16:9, lower dissolve, title 56sp serif, credits line, copper `Play` + ghost `More info`); below: shelves at TV scale (poster 260dp, gap 24dp) — Continue Watching first (if any), then `/home` rows.
- **Focus:** entry lands on the hero Play button; Up from the top shelf returns to hero actions; Down walks shelves; shelf items scale 1.04 with the unfocused veil (§5.5).
- **Interactions:** Select on hero Play → player; More info → detail; poster → detail; shelf edge scrolls shelf one card-group at a time with focus leading.
- **Transitions:** hero crossfades when the focused hero dot changes (manual dots — no auto-rotation); pane swaps in place; card → detail = art crossfade 240ms (no shared-element gymnastics at ten feet).
- **States:** skeleton shelves (static, no shimmer at distance — shimmer is optically noisy on TV); catalogue error → §6.2.16 with focus on Retry.

### 6.2.4 Explore (TV)

- **Layout:** rail + pane: chip row (focusable genres/collections), grid 6×2 posters per screen; ReelLabel group headers when collections exist. Same fallback ladder as mobile (§6.1.4).
- **Focus:** 2D grid movement with equal row heights; edge rows scroll the grid without focus loss.

### 6.2.5 Search (TV)

- **Layout:** query line at top with live result count; results grid (3×2 landscape cards) updating as the query grows; keyboard at bottom of screen (§6.2.7) while the query is active.
- **Interactions:** type via keyboard grid; Select result → detail; Back hides keyboard first, then exits Search.

### 6.2.6 Search results (TV)

- **Layout:** full grid of landscape cards (title + credits line under each); count line “12 results for ‘breaking’”; empty state card centred with focusable `Clear search`.
- **Focus:** grid 2D; after clearing, focus returns to the keyboard.

### 6.2.7 On-screen keyboard

- **Layout:** QWERTY grid rows + bottom row (`?123` · space · `Clear` · `OK`), keys 6dp radius, 28sp labels; focused key = copper ring + fill at copper-tint.
- **Behaviour:** standard focus grid; long-press repeats disabled (one char per press); voice typing is not offered (no microphone dependency in the architecture).
- **States:** disabled while a search request is in flight only for `OK` (typing stays live).

### 6.2.8 Movie detail (TV)

- **Layout:** backdrop occupies the top 60% with dissolve; content column left-aligned at safe margin: title 48sp serif, credits line, action row (`▶ Play` copper · `＋ My List` · `↓ Download` hidden on TV — TV has no downloads in this architecture), overview clamped to 4 lines + `More` expansion; bottom: `Titles like this` shelf.
- **Focus order:** Play → My List → More → shelf. Restore exact focus on return from player.
- **States:** as mobile 6.1.7, including `Not available to play` when no sources.

### 6.2.9 Series detail & episodes (TV)

- **Layout:** as 6.2.8; below overview a **season strip** (pill selectors) and an episode shelf (landscape cards with episode stills 320×180, `E{n}` labels, progress hairlines).
- **Interactions:** Select episode → player; season change re-renders episode shelf in place; Play resumes `S2:E4` with visible position meta.
- **Focus:** season strip and episode shelf are separate focus rows; episode card focus lifts and shows a 2-line synopsis in a fixed caption strip (so focus movement never reflows the shelf).

### 6.2.10 Player (TV) & 6.2.11 Player overlays

- **Purpose:** ten-foot playback. Full spec in §13.3/§13.7.
- **Summary:** video full-bleed; controls overlay (S2 smoked glass) on Up/Select, auto-hide 5s; bottom bar: title + `S2:E4`, seek bar (copper fill, focusable scrubber), elapsed/remaining, transport glyphs 40dp; overlays: quality/subtitles/settings panels stack from the bottom with focus trap; Back hides the top overlay first.
- **Focus:** scrubber is focusable (Left/Right seek); transport row focusable; overlays return focus to their trigger (§5.5).

### 6.2.12 Continue Watching (TV)

- **Layout:** shelf-first screen: large landscape cards (560×315) with progress hairlines, `42 min left` meta; card focus shows episode synopsis in caption strip.
- **Interactions:** Select → resume; long-press-equivalent (`Menu` key) → remove-from-history dialog.

### 6.2.13 Watchlist & Library (TV)

- **Layout:** single Library pane with focusable segment chips (My List · History); **no Downloads segment on TV** (device-direct architecture keeps offline on phones — pack `04` lists no TV downloads).
- **Focus:** chips row then grid; empty segment shows a centred empty-state card with a focusable CTA.

### 6.2.14 Settings (TV)

- **Layout:** two-column: focusable group list (Playback, Subtitles, Devices, App) left; detail panel right. All rows ≥ 22sp; toggles are large switch glyphs with copper on-state.
- **Focus:** left list drives the right panel; Right enters the panel; Back returns to the list.

### 6.2.15 Devices & account status

- **Purpose:** this TV's own status: paired as `Living Room TV`, last sync, `Unpair this TV` (destructive → dialog), plus the pairing microcopy reminder.
- **Also lives here:** network status line and `Show pairing code` (re-activation if unpaired).

### 6.2.16 Error & recovery screens (TV)

- **Purpose:** one designed error surface reused platform-wide (§15 patterns): centered card on obsidian: display-serif line (“The screen is quiet.”), body explanation, focusable primary action (Retry / Open settings / Enter code), secondary text.
- **Variants:** catalogue unavailable, network offline, player failure, pairing service unavailable, update-required placeholder (future-proofed).
- **Focus:** lands on the primary action on render; Retry re-issues the failed request and shows loading state in place.


---

# 7. Navigation architecture

## 7.1 Mobile route map

```
                        ┌───────────┐
      first launch ───► │  Splash   │
                        └─────┬─────┘
              ┌───────────────┴───────────────┐
              ▼ (first launch)                ▼ (returning)
        ┌───────────┐                  ┌─────────────┐
        │Onboarding │──── skip/enter──►│   HOME      │◄────┐
        └───────────┘                  └──┬──┬──┬──┬─┘     │
        tab bar:  Home · Explore · Search · Library · Settings
              │        │        │        │        │
              ▼        ▼        ▼        ▼        ▼
          [roots of each tab — each owns its own stack]

push routes (any tab):            modal routes:
  Title detail  ◄─ shared element ─  Player (fullscreen)
  Series detail ─► Episode sheet    Quality/Subtitles sheet
  Downloads manager                 Filter/Remove sheet
  Pairing hub ─► QR scanner         Confirm dialogs
  Pairing approval                  Permission priming
  Device management                 Snackbars (undo)
  Settings sub-screens
```

**Route contracts (design-level):**

| Route | Params | Notes |
|---|---|---|
| `detail` | `subjectId`, `detailPath`, `contentType` | Stable IDs only (pack `08`) — never a CDN URL |
| `player` | + `season`, `episode`, `startPositionMs?` | Position optional (resume) |
| `pairing/scanner`, `pairing/approve` | `challengeId` (from QR) | QR payload carries challenge/deep-link only — never secrets |
| `downloads` | — | Also reachable from Library segment |

## 7.2 TV route map

```
  Splash ─► Activation (unpaired) ─► [approve] ─► HOME
                                       │
  left rail (persistent):   Home · Explore · Search · Library · Settings · Devices
  pane stack (per rail item):  root ─► detail ─► player
  overlays (stacked above all): dialogs, player menus, keyboard, QR zoom
```

**Back-stack rules (TV):** overlay ▸ pane-stack ▸ rail root ▸ exit-confirm (only during playback). Dialog close → focus to trigger (§5.5). Player exit → previous pane with focus memory intact.

## 7.3 Cross-platform rules

| Rule | Specification |
|---|---|
| Back is sacred | Back never destroys unsaved input without warning (only pairing code entry counts here); Back never closes more than one layer |
| Deep links | Every `detail` route is addressable by `subjectId|detailPath`; future “Play on TV” handoff (§8.5) reuses these contracts as **intent metadata** |
| Focus/scroll preservation | Switching tabs (mobile) or rail items (TV) preserves scroll + focus; pushing detail then returning restores the exact shelf position |
| No dead ends | Every root screen has at least one onward path; every error state offers a route back to content |

---

# 8. User journey diagrams

Journeys are the acceptance stories of the design. Each lists the happy path, the states it can land in, and the simplification decisions taken. Step counts are design commitments: extra steps must be argued for.

## 8.1 Opening the app for the first time

```
Splash (≤1.5s) ► Onboarding 1 ► 2 ► 3 ► HOME
                 └──────── skip ────────────┘
HOME (first data load: skeletons ► shelves)
```

- **Simplifications:** onboarding is 3 cards and skippable at any point; no account wall, no permission requests on launch (permissions are asked at the moment of use — pack `09`).
- **Failure lands on:** Home error state with Retry (never on splash).

## 8.2 Discovering a movie

```
HOME ── browse shelves ──► tap poster ──► Detail ──► ▶ Play ──► Player
  │                        (shared-element)   │
  └── hero Play (1 tap) ─────────────────────►│
```

- **Commitment:** from Home to playback is **1–2 taps** (hero Play = 1 tap; poster → Play = 2).
- **States:** detail error (Retry), no-source (honest disabled Play).

## 8.3 Searching for a series

```
Search tab ── type ≥2 chars ──► live results ──► tap row ──► Series detail
     │              │
     └─ recent query (1 tap re-run)
```

- **Simplifications:** no search filters beyond Films/Series; results are rows not grids (scan speed); history is local and clearable in Settings.

## 8.4 Starting playback & selecting an episode

```
Series detail ── Resume S2:E4 ──► Player (position restored)
     │
     └─ See all episodes ──► Episode sheet ── tap E6 ──► Player S2:E6
```

- **Commitment:** resuming a series is **1 tap** from detail; switching episodes is 2 taps (sheet + episode).
- **States:** stream resolve (loading ring), expiry re-resolve (§13.5), next-episode overlay (§13.6).

## 8.5 Changing subtitles / quality

```
Player ── tap (controls) ── ⚙/CC ── Settings sheet ── select ── applies & closes
```

- **Commitment:** 3 taps from playback, player never hides behind a settings screen; preference remembered (§6.1.11).

## 8.6 Adding to watchlist / My List

```
Any detail ── ＋ My List ──► icon fills + haptic (+ undo snackbar if from a card long-press)
Library ── My List segment shows it immediately (local-first, no sync wait)
```

## 8.7 Resuming playback

```
Home Continue shelf ── tap card ──► Player at saved position
```

- **Commitment:** **1 tap** from app open to resume. Progress saves periodically + on pause/background/exit (pack `05`).

## 8.8 Managing downloads

```
Detail ── ⬇ ── quality sheet ── queue ── Downloads manager
   manager: pause / resume / cancel / retry (fresh URL) / play offline
Settings ── Storage: cache & space management
```

- **States honoured:** interrupted, failed, storage-full, expired-URL retry, integrity-checked complete only (§6.1.16, §15).

## 8.9 Connecting a phone to a TV

```
TV: open app ── Activation (QR + code + countdown)
Phone: Pairing hub ── Scan ── priming sheet ── camera ── match ── Approval ── Approve
TV: pending ──► approved ──► HOME (toast: “Living Room TV connected”)
```

- **Commitment:** one deliberate approval, zero typing on the TV, pairing persists (never per-episode).
- **Alternatives:** `Enter code instead` path (6 chars) for camera-less situations — same approval step.
- **Security visible in UI:** countdown, one-time code, “never contains video” microcopy (§14.3).

## 8.10 Starting playback on TV (remote journey)

```
TV HOME ── D-pad to shelf ──► detail ──► ▶ Play ──► Player
   or: hero Play (1 press from Home entry)
```

- **Commitment:** 1–3 presses from Home to playback; every press has visible focus (§5.5).

## 8.11 Navigating TV with the remote

```
Rail ◄──► panes ──► overlays (dialogs, player menus)
Back: overlay ▸ pane ▸ root ▸ exit
```

- **Commitment:** no journey requires long-press, gestures, or the phone; focus never disappears; edges never trap.

## 8.12 Managing connected devices

```
Phone: Pairing hub / Settings ── Devices ── device card ── Unpair ── confirm ── revoked
TV: Devices pane shows this TV's status; unpairing remotely flips TV to Activation state
```

## 8.13 Play-on-TV handoff (optional, later phase — intent only)

```
Phone detail ── “▷ Play on TV” (only when a TV is paired) ── intent{subjectId, detailPath, se, ep}
TV: receives intent ── resolves stream itself ── player
```

- **Architecture-safe:** the intent carries **metadata only**; video bytes still flow CDN→TV (ADR 001). Designed as a ghost action next to Play; hidden entirely when no TV is paired. Deferred (§20).

## 8.14 Journey simplification summary

| Removed step | Because |
|---|---|
| Account creation on launch | Local-first product (pack `09`) — never gate watching |
| Per-episode pairing | Pairing persists (pack `07`) |
| Settings screen before playback | Quality defaults exist (Auto) — power users adjust in-player |
| Separate Profile tab | Accounts optional; Profile would be empty |
| Search typing on TV remote beyond keyboard grid | Standard keyboard grid is the fastest known D-pad pattern |
| Downloads on TV | Not in TV architecture (pack `04`); phones own offline |


---

# 9. Complete design token specification

Tokens are named in `domain.element.variant` form. They are the only legal sources of colour, space, shape and depth in the product. Hex values below are normative.

## 9.1 Colour — surfaces & ink

| Token | Value | Use |
|---|---|---|
| `color.bg.obsidian` | `#0A0B0D` | App background on every screen; the “wall” of the screening room |
| `color.bg.surface` | `#111318` | Content containers: cards, sheets body, rows |
| `color.bg.elevated` | `#171A21` | Dialogs, focused panels, fallback tiles, unfocused veil base |
| `color.bg.glass` | `rgba(17, 19, 24, 0.72)` | Smoked-glass chrome fill (S2) — nav, player chrome, sheets header |
| `color.bg.glassLow` | `rgba(17, 19, 24, 0.48)` | Player chrome over video only (needs more video show-through) |
| `color.bg.scrim` | `linear-gradient(180deg, rgba(10,11,13,0) 40%, #0A0B0D 100%)` | Backdrop/hero dissolve to obsidian (always the last 45% of the artwork height) |
| `color.bg.veil` | `rgba(10, 11, 13, 0.60)` | Unfocused TV artwork veil (§5.5); press-state dim |

**Rationale:** obsidian `#0A0B0D` is pure enough to make artwork glow but not a dead `#000` (which crushes shadow detail in posters and bands on OLED).

## 9.2 Colour — text

| Token | Value | Contrast vs `bg.obsidian` | Use |
|---|---|---|---|
| `color.text.primary` | `#F4EFE7` | ≈ 17:1 | Titles, body, button labels on ink |
| `color.text.muted` | `#A8A199` | ≈ 7.7:1 | Metadata, supporting copy, credits lines |
| `color.text.faint` | `#6E6862` | ≈ 3.6:1 | Disabled, placeholder, decorative labels only — **never body copy** |
| `color.text.onAccent` | `#120D09` | ≈ 6:1 on copper | Button labels on copper fills |
| `color.text.inverse` | `#0A0B0D` | — | Text on light sheets (future-proofing; no light sheets today) |

## 9.3 Colour — accent (the copper thread)

| Token | Value | Use |
|---|---|---|
| `color.accent.copper` | `#C97B4A` | Primary CTA fill, focus rings, progress fill, active nav |
| `color.accent.copperLight` | `#E0A277` | Hover/TV-focus brightening of copper; link text on ink (≈ 8:1) |
| `color.accent.copperDeep` | `#8F5230` | Pressed state of copper fills; progress track shadow |
| `color.accent.copperTint` | `rgba(201, 123, 74, 0.14)` | Selected chip fill, keyboard key fill, radio selection |

**Accent discipline (enforced in §18):** one primary copper element per screen region. Copper is never a background, never a gradient, never decorative.

## 9.4 Colour — states

| Token | Value | Pairing rule |
|---|---|---|
| `color.state.error` | `#D9584B` | Error icon + error text with `text.primary` body; fills only for destructive buttons (with `text.onAccent` ≈ 4.9:1) |
| `color.state.warning` | `#D9A441` | Warning chips/icons only; body text stays ivory |
| `color.state.success` | `#7FA877` | Success confirmations (download complete, paired); never buttons except rare confirm |
| `color.state.info` | `#6E8CA8` | Informational chips (e.g. “Unavailable”) — used sparingly |
| `color.state.progress` | `#C97B4A` | Progress bars = accent copper (progress is a primary signal, so it earns copper) |

## 9.5 Shape — radius

| Token | Value | Use |
|---|---|---|
| `radius.xs` | `8dp` | Chips, tags, episode stills, keyboard keys |
| `radius.sm` | `12dp` | Posters, buttons, inputs, landscape cards |
| `radius.md` | `16dp` | Large cards, glass slabs, dialogs, QR panels |
| `radius.lg` | `24dp` | Bottom sheet top corners only |
| `radius.pill` | `999dp` | Chips, segmented controls, countdown rings only |

**Radius policy:** a screen region uses one dominant radius. Buttons are `sm` (12dp) — deliberately **not** pills — so copper CTAs read as film-sticker labels, not app-store candy. Posters never exceed `sm`. No card-in-card rounding.

## 9.6 Layout, spacing, safe areas

| Token | Value | Use |
|---|---|---|
| `space.1 … space.16` | `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 dp` | Vertical rhythm on a 4dp grid |
| `layout.margin.mobile` | `20dp` (16dp compact, 24dp large — §17) | Screen side margins |
| `layout.margin.tv` | `48dp` (safe area: 5% overscan) | TV side margins |
| `layout.gap.shelf` | `12dp` mobile / `24dp` TV | Between shelf cards |
| `layout.gap.shelfStack` | `28dp` mobile / `48dp` TV | Between shelves |
| `layout.poster.ratio` | `2:3` | All poster art frames |
| `layout.landscape.ratio` | `16:9` | Episode/continue stills |
| `layout.hero.mobile` | full-bleed, visible art ≈ 56vh, dissolve in last 45% | Home hero |
| `layout.hero.tv` | full-bleed 16:9, dissolve in last 40% | TV hero |
| `layout.nav.height` | `64dp` + inset | Mobile glass bottom nav |
| `layout.touch.min` | `48dp` | All hit areas |
| `layout.focus.offset` | `4dp` | Focus ring offset (TV) |

**Image render sizes (normative — performance, §4.4):** shelf poster mobile `120×180dp`, featured `140×210dp`, TV poster `260×390dp`, continue card mobile `240×135dp`, episode still `128×72dp` mobile / `320×180dp` TV. Art is requested at 2× these sizes maximum and never decoded larger than its frame.

## 9.7 Shape & depth — glass, blur, elevation, light

| Token | Value | Use |
|---|---|---|
| `blur.chrome` | `16dp` (mobile) / `24dp` (TV) | Glass chrome only |
| `elevation.0` | none | Content cards at rest |
| `elevation.1` | `0 2px 8px rgba(0,0,0,0.40)` | Glass slabs, raised sheets |
| `elevation.2` | `0 8px 24px rgba(0,0,0,0.50)` | Dialogs, focused TV cards |
| `elevation.3` | `0 16px 48px rgba(0,0,0,0.60)` | Player overlays |
| `stroke.hairline` | `1px solid rgba(244, 239, 231, 0.10)` | Glass top edge (S2) and subtle dividers |
| `light.topHighlight` | `inset 0 1px 0 rgba(244, 239, 231, 0.08)` | Every glass slab (the “lit edge”) |

### The glass budget (normative)

Glass is **allowed on exactly these surfaces** and nowhere else:

| Allowed | Forbidden |
|---|---|
| Mobile bottom nav | Content shelves and list rows |
| Player control chrome & menus | Detail backgrounds |
| Bottom sheet grabber/header strip | Posters and artwork |
| TV left rail (active surface) | Buttons other than player controls |
| Pairing panels (QR panel, approval card) | Whole-screen washes |
| Countdown rings, toast glass (rare) | Stacked glass (glass over glass) |

Additional limits: **one blur layer per viewport region**; blur radius fixed (no animated blur); on `lowTier` devices (or when the system “reduce transparency”-style setting is on), glass renders as `color.bg.elevated` at 96% opacity + `stroke.hairline` — visually calm, computationally free.

## 9.8 Iconography

| Property | Specification |
|---|---|
| Style | Line icons, 1.75dp stroke, rounded caps/joins; no filled glyphs except active nav state and toggles |
| Grid | 24dp base (mobile), 32dp (TV); glyph sits in a 48dp hit box (mobile) |
| Nav icons | Home (marquee arch) · Explore (compass-rose frame) · Search (lens) · Library (stacked frames) · Settings (aperture) |
| Playback icons | Play/pause/skip (standard shapes), ±10s (arc arrows with numeral), quality (signal bars), subtitles (CC in frame), audio (waveform) |
| TV focus | Focused icon gains copper stroke (from ivory) + sits inside the focus ring; unfocused icons at `text.muted` |
| Custom icons | Bookmark, download (arrow into tray), device-TV, QR frame — drawn to the same stroke rules in Appendix B |

## 9.9 Motion tokens (preview — full choreography in §12)

| Token | Value | Use |
|---|---|---|
| `motion.duration.1` | `120ms` | Press feedback, toggles |
| `motion.duration.2` | `180ms` | State changes, control reveal |
| `motion.duration.3` | `240ms` | Sheets, dialogs |
| `motion.duration.4` | `320ms` | Screen transitions |
| `motion.duration.5` | `400ms` | Hero/artwork settles |
| `motion.ease.standard` | `cubic-bezier(0.20, 0, 0, 1)` | Default (decelerate into place) |
| `motion.ease.emphasis` | `cubic-bezier(0.05, 0.7, 0.1, 1)` | Shared-element, hero |
| `motion.ease.exit` | `cubic-bezier(0.30, 0, 0.80, 0.15)` | Dismissals |

---

# 10. Typography system

## 10.1 Font direction (decision)

| Role | Direction font | Fallbacks | Why |
|---|---|---|---|
| **Display** (S1/S4 moments: hero titles, detail titles, wordmark, splash) | **Fraunces** (variable; optical size axis used at display sizes) | Playfair Display → Georgia | High-contrast serif with cinematic warmth; it reads as a title card, the single strongest differentiator from sans-only streaming UIs |
| **UI** (everything functional) | **Inter** | Roboto → system sans | Neutral, superb small-size legibility on dark, wide language coverage |

Korean heritage detail (subtle, §3.2): the Hangul lockup uses the UI family at heavy letterspacing — no decorative Korean font — so 한류 스트림 reads as a quiet signature, not a second identity.

**Rules:** display serif is never used for functional labels, buttons or metadata. UI sans is never used for hero titles. Numerals in the player use tabular figures (Inter `tnum`) so times don't jitter.

## 10.2 Mobile type scale (sp)

| Token | Size/line | Weight | Tracking | Use |
|---|---|---|---|---|
| `type.display.xl` | 32/36 | 600 (Fraunces) | -0.01em | Hero title, detail title |
| `type.display.l` | 28/32 | 600 (Fraunces) | -0.01em | Screen titles (Library, Settings…), empty-state lines |
| `type.h1` | 22/28 | 600 (Inter) | 0 | Dialog titles, sheet titles |
| `type.h2` | 18/24 | 600 (Inter) | 0 | Row group titles, card titles (large) |
| `type.body` | 15/22 | 400 (Inter) | 0 | Overview, explanations |
| `type.bodyStrong` | 15/22 | 600 (Inter) | 0 | Episode titles, emphasis |
| `type.meta` | 13/18 | 400 (Inter) | 0 | Credits lines, durations, sizes |
| `type.label` | 12/16 | 600 (Inter) | 0.14em, caps | Reel labels (S4), group headers |
| `type.button` | 14/18 | 600 (Inter) | 0.01em | Button labels |
| `type.micro` | 11/14 | 500 (Inter) | 0.02em | `E4` tags, countdown numerals, hints |

Font-scale support: all sizes are `sp`; layouts reflow at 1.3× system scale (§16.3).

## 10.3 TV type scale (1080p baseline, dp)

| Token | Size/line | Weight | Use |
|---|---|---|---|
| `type.tv.display` | 56/62 | 600 (Fraunces) | Hero titles |
| `type.tv.h1` | 40/48 | 600 (Fraunces) | Detail titles, screen titles |
| `type.tv.h2` | 28/36 | 600 (Inter) | Section/dialog titles |
| `type.tv.body` | 22/30 | 400 (Inter) | Descriptions, step copy |
| `type.tv.bodyStrong` | 22/30 | 600 (Inter) | Episode titles |
| `type.tv.meta` | 18/24 | 400 (Inter) | Credits lines, counts |
| `type.tv.label` | 20/24 | 600 (Inter) | Rail labels, buttons (caps only for reel labels at 16sp/0.14em) |
| `type.tv.code` | 64/72 | 600 (Fraunces) | Pairing short code (mono-feel via tabular figures + 0.2em tracking) |

**Ten-foot floors (normative):** no text below 16sp at 1080p under any circumstance; body copy never below `type.tv.body`. At 720p everything scales proportionally — the floors hold because dp scale is relative to the 1080p baseline with TV density adjustment.

## 10.4 Weight hierarchy

Three weights only: **400 / 500 / 600** (Fraunces 600 for display). Hierarchy is built from size, colour and family — not from adding weights or italics. Italic display serif is permitted for one purpose only: the “Titles like this” editorial flourish on empty states. No all-caps beyond reel labels and button labels on TV.


---

# 11. Component library specification

Components are named in `PascalCase`. Each entry: **anatomy · variants · states · mobile vs TV**. Tokens referenced from §9–10. Every component respects the glass budget (§9.7).

## 11.1 Navigation systems

### `GlassBottomNav` (mobile) / `LeftRail` (TV) — S2

- **Anatomy:** smoked-glass slab (`color.bg.glass` + `blur.chrome` + `stroke.hairline` top + `light.topHighlight`); items = icon (24dp) + micro label; active item copper icon + label, inactive `text.muted`.
- **Variants:** mobile bar (5 items, 64dp + inset, elevation.1); TV rail (collapsed 96dp icons, focused 240dp with labels sliding in at `type.tv.label`).
- **States:** default · focused (TV: copper ring on item, rail expands) · pressed (tint 120ms) · hidden (mobile nav auto-hides only in fullscreen player).
- **TV delta:** rail is persistent and focusable; active pane title echoes in the rail label.

### `TopBar` (mobile detail/screens)

- **Anatomy:** 56dp transparent bar over artwork or solid obsidian when scrolled; back chevron (48dp hit), title (only when scrolled — resolves to `type.h2`), optional trailing icon button.
- **States:** transparent-at-rest / solid-on-scroll (160ms background fade, no motion of content).

## 11.2 Hero & headers

### `MarqueeHero` (S1)

- **Anatomy:** full-bleed backdrop (`layout.hero.*`) + `color.bg.scrim` dissolve; display title; `CreditsLine`; `PrimaryButton` + `IconAction`(My List); optional page dots (TV: focusable dots switch hero manually).
- **Variants:** movie / series (Play reads `Resume S2:E4` when progress exists) / no-backdrop (elevated obsidian + large serif title only — a title card).
- **States:** image loading (elevated placeholder + type visible immediately), loaded, error (no-backdrop variant).
- **Mobile vs TV:** mobile hero 56vh with swipe-free single item (no auto-rotation — P4); TV hero full-width with manual dots and caption strip.

## 11.3 Content cards

| Component | Anatomy | Variants | States | TV delta |
|---|---|---|---|---|
| `PosterCard` | 2:3 frame `radius.sm`, art fill, press → veil 120ms; below: title `type.meta` (1 line) | standard 120dp / featured 140dp / TV 260dp | image placeholder → loaded; unavailable tag (`state.info` chip) | unfocused = 60% veil; focused = 1.04 scale + elevation.2 + full art |
| `LandscapeCard` | 16:9 frame + progress hairline (copper, 3dp) + title + meta | Continue variant (progress) / Episode variant (`E{n}` micro tag) | progress 0–100%; watched (ivory check, no copper) | caption strip shows synopsis on focus |
| `ContinueCard` | `LandscapeCard` + `×` remove action (long-press/menu) | — | stale → `Unavailable` chip, still removable | `Menu` key = remove dialog |
| `EpisodeRow` (mobile) | still 128×72 + `E{n}` + title + duration + 1-line synopsis | watched / in-progress hairline / next-up (copper `Next` tag) | skeleton 3 rows; missing still → typographic tile | — (TV uses `EpisodeCard` in shelf) |
| `QueryRow` (search history) | clock icon + query text + `×` | — | press → rerun | keyboard `Clear` handles history on TV |

## 11.4 Shelves & labels

- **`Shelf`:** ReelLabel header + horizontal card row (snap scroll mobile, focus walk TV) + right-edge fade (12dp, obsidian). First card aligns to `layout.margin`; last card ends 20dp before edge (bleed scroll).
- **`ReelLabel` (S4):** `type.label` caps, letterspaced, `text.muted`, followed by a 1dp hairline rule to the edge; optional trailing `All ›` text button. Non-interactive labels render without the button.
- **`PosterGrid`:** 2-col mobile (12dp gap) / 6×2 TV; equal rows (§5.6).

## 11.5 Buttons & inputs

| Component | Anatomy | Variants | States | TV delta |
|---|---|---|---|---|
| `PrimaryButton` | `radius.sm`, `accent.copper` fill, `text.onAccent` `type.button`, 52dp height, leading glyph | Play (leading ▶) / Approve / Enter / Retry | rest · pressed (`copperDeep`, scale .98, 120ms) · disabled (`bg.elevated`, `text.faint`) · loading (glyph → copper ring) | 60dp height, `type.tv.label`; focused = `copperLight` fill + ring |
| `SecondaryButton` | transparent, 1.5dp `stroke.hairline` border, `text.primary` | Download / Cancel / Start over | same; pressed = `bg.veil` | same, larger |
| `TextButton` | no chrome, `text.muted` → `text.primary` on press | Skip, Cancel, links (`copperLight` color) | — | focusable, ring |
| `IconButton` | 24dp glyph in 48dp box | bookmark, download, flash, share→(none), close | rest/pressed/toggled (filled glyph) | 32dp glyph, ring |
| `Chip` | `radius.pill`, `bg.surface` + hairline, `type.meta` | filter (single-select: selected = `copperTint` + copper border) / suggestion / tag (non-interactive) | same | 44dp height, focus ring |
| `SearchField` | 52dp `radius.sm` `bg.surface` + hairline; lens icon; copper caret; clear `×` | idle / typing / results-count suffix | focused (border → copper 40%) / disabled | query line variant on TV (`type.tv.h2`) |
| `Toggle` | 44×26 track; on = copper; thumb ivory | — | on/off/disabled | 64×36, labels beside |
| `Stepper/MenuRow` | settings row: label + value + chevron | menu / navigation / destructive (`state.error` label) | pressed | two-column layout (§6.2.14) |

## 11.6 Overlays

- **`BottomSheet`:** `radius.lg` top, `bg.surface` with glass grabber strip (S2), 36dp grabber, drag-to-dismiss; detents: half / 85vh (episodes) / full (keyboard-safe). Backdrop `bg.veil`. States: loading content skeleton inside.
- **`Dialog`:** `radius.md`, `bg.elevated`, elevation.2, width 312dp (mobile) / 640dp (TV); title `type.h1`; body `type.body`; actions right-aligned (stacked full-width on compact): destructive uses `state.error` text, never copper fill. TV: focus trapped, default focus on the safe action.
- **`Snackbar/Toast`:** glass strip 8dp above nav, `type.meta`, optional `Undo` (copper text), 5s; error variant uses `state.error` icon. TV: bottom-center card, 6s, focus-safe (never steals focus).
- **`ContextMenu/ActionSheet`:** action list from long-press (cards) or `Menu` key (TV); destructive items separated by a hairline.

## 11.7 Player controls (summary — full spec §13)

`PlayerControlBar` (glass `glassLow`), `Seekbar` (4dp track `bg.elevated`, copper fill, 20dp thumb, scrub preview still above thumb), `TransportButton` (48dp/TV 56dp), `PlayerMenuSheet` (§6.1.11), `NextEpisodeCard` (§6.1.12), `BufferingRing` (copper arc, 1200ms/turn, the only looping animation besides skeleton shimmer).

## 11.8 Downloads & library

| Component | Anatomy | States |
|---|---|---|
| `DownloadRow` | poster 48×72 + title + meta (`S2:E4 · 1080p · 720 MB`) + progress hairline + action glyphs | queued · downloading · paused · complete (ivory check) · failed (`state.error` + reason + Retry) · interrupted |
| `StorageMeter` | used/free big numbers (`type.display.l`), 8dp bar (copper fill on `bg.elevated`), category breakdown rows | normal · warning (<10% free: `state.warning`) · critical (<2%: `state.error`) |
| `HistoryRow` | poster + title + watched date meta + rewatch play glyph | fresh / stale (Unavailable chip) |

## 11.9 Pairing components

| Component | Anatomy | States |
|---|---|---|
| `QRPanel` (S2) | glass panel `radius.md`, QR at 220dp (mobile) / 280dp (TV), quiet zone 16dp, hairline frame | pending · refreshing · zoomed (TV) |
| `ShortCode` | `type.tv.code` (TV) / `type.display.xl` (mobile entry field), grouped `XXX-XXX`, tabular | pending · entered · invalid (shake 3× only — once per attempt) |
| `CountdownRing` | 4dp copper ring + `type.micro`/`type.tv.meta` time text | >2min calm · <2min ring turns `state.warning` · expired → `state.error` |
| `DeviceCard` | TV glyph + name + model meta + `Last seen` + `Unpair` action | online-ish (recent) / dormant / revoking (card disables) |
| `ApprovalCard` | TV glyph, name, explanatory body, Approve/Reject pair, TTL line | pending · approved · rejected · expired |

## 11.10 Feedback & system components

| Component | Use | Notes |
|---|---|---|
| `SkeletonBlock` | all loading states | `bg.elevated` blocks matching final layout; shimmer **once** then hold (mobile); TV static |
| `EmptyState` | §15.1 | display-serif line + body + primary CTA; optional italic flourish |
| `ErrorState` | §15.1 | `state.error` glyph (24dp outline), serif line, body, Retry |
| `PermissionPrimer` | camera/storage asks | sheet: glyph + why + Allow/Not now (copy per Appendix A) |
| `InlineBanner` | warnings in situ | `bg.surface` + `state.warning` icon + body + action |
| `ProgressRing/Bar` | determinate when bytes known; indeterminate ring otherwise | never fake percentages (pack `05`) |

---

# 12. Motion and transition guidelines

Motion is a lighting cue, not a performance. Everything below is transform/opacity-only (compositor-safe, §4.4).

## 12.1 Principles

1. **Purpose only:** every animation answers *where did this come from / where did it go*. Ornament animation is banned.
2. **Brief:** nothing over 400ms except artwork dissolves tied to image load.
3. **Polite:** motion never blocks input; taps land during animation.
4. **Scalable:** reduced-motion (§12.6) removes movement but keeps meaning.

## 12.2 Screen transitions

| Transition | Spec | When |
|---|---|---|
| Shared-element (poster → detail) | `motion.duration.4` `ease.emphasis`; poster expands into backdrop position, title fades/rises 12dp | card tap → detail (mobile) |
| Hero dissolve (detail → player) | backdrop crossfades into video surface, `duration.5` | Play |
| Stack push | outgoing screen shifts −8dp + fade to 60%; incoming fades in 320ms | all other pushes |
| Tab/rail switch | content crossfade 160ms; **no** horizontal slide (tabs are peers, not a timeline) | nav |
| TV pane swap | crossfade 200ms + 8dp rise; focus lands on the pane's first target after fade | rail |

## 12.3 Focus & press

- **TV focus move:** scale 1.0→1.04 + ring fade-in over `duration.2`, `ease.standard`; veil on the previously focused card in the same duration. Focus movement itself is instant (the ring animates, not the focus).
- **Press (mobile):** scale 0.98 + veil, 120ms down / 180ms up (`ease.exit` down, `ease.standard` up).
- **Nav active swap:** icon crossfade + copper color 180ms.

## 12.4 Overlays

- **Bottom sheet:** slide from 100%→detent, `duration.3`, `ease.emphasis`; backdrop veil fades in parallel. Dismiss: `ease.exit`, 180ms.
- **Dialog:** scale 0.96→1 + fade, `duration.3`.
- **Player controls:** fade + 8dp rise 180ms; hide = fade only 160ms.
- **Snackbar:** rise 24dp + fade 240ms; dismiss fades 160ms.

## 12.5 Signature moments (S1/S2 choreography)

| Moment | Spec |
|---|---|
| Splash light sweep | single highlight gradient passes across the wordmark, 800ms, once |
| Hero settle | backdrop fades from 40%→100% opacity over `duration.5` as art loads; title rises after 60% of settle |
| Next-episode countdown | copper ring depletes linearly over 10s; card breathes (1.0↔1.01) only while counting |
| Pairing success | card lifts 8dp + ring completes; TV enters Home with a 400ms crossfade (no confetti — this is a premium product) |

## 12.6 Reduced motion

When the system reduced-motion setting is on (or the in-app toggle, §6.1.17):

| Normal | Reduced |
|---|---|
| shared-element expansion | crossfade 120ms |
| slides/scales | fades 120ms |
| hero settle | instant (static scrim) |
| shimmer skeletons | static skeleton blocks |
| countdown breath | static ring |
| focus scale (TV) | ring only, no scale (ring visibility is a functional requirement and stays) |

## 12.7 Performance budget (design-level)

- Max 2 concurrent property animations per screen region; max 4 per viewport.
- No animated blur, shadows, or background-size effects — ever.
- Artwork dissolves are opacity crossfades over pre-composited scrims.
- Every looping animation must be stoppable by state (loading → done) — the only exceptions are BufferingRing and (mobile) skeleton shimmer while loading.


---

# 13. Playback interface design

Playback is where the product keeps its promises. The architecture pack (`05`) mandates: stream JSON resolved on device, CDN bytes direct to device, signed URLs expire and must be re-resolved, captions must never block video, progress saved under `subjectId|se|ep`. The player UI makes all of that legible.

## 13.1 Player layout — mobile landscape (immersive)

```
┌──────────────────────────────────────────────┐
│ ⌐ back   S2:E4 · Breaking Bad   [CC] [⚙] [⤢] │  glass top strip (glassLow)
│                                              │
│                  (video)                     │
│                                              │
│         ◄◄ 10      ▶ / ❚❚      10 ►►         │  transport (controls visible)
│  ▬▬▬▬▬▬▬▬▬▬▬●━━━━━━━━━━━━━━━━ 42:10 / 47:02 │  seekbar + times
└──────────────────────────────────────────────┘
```

- **Chrome:** smoked glass (`color.bg.glassLow`, `blur.chrome`) strips top and bottom when controls are visible; the video letterboxes/pillarboxes on obsidian (never stretches).
- **Auto-hide:** controls fade after **3.5s** of uninterrupted playback; any tap re-shows; while paused, controls persist.
- **Gestures:** tap halves = double-tap ±10s (visual “ripple + time” feedback); vertical drags = brightness (left) / volume (right) with slim glass meters (validated in §20 before enabling); pinch/zoom disabled (aspect integrity).

## 13.2 Player layout — mobile portrait

Video contained in the top 42% (16:9 frame, `radius.sm` — the one time a video gets a frame); below: title, credits line, episode selector (series), Up-next shelf. `⤢` enters fullscreen/landscape. Controls behave identically inside the contained frame.

## 13.3 Player layout — TV

```
┌──────────────────────────────────────────────┐
│  Breaking Bad · S2:E4            1080p · 5.1 │  quiet top line (meta)
│                                              │
│                  (video)                     │
│  ┌────────────────────────────────────────┐  │
│  │ ▶/❚❚   42:10 ━━━━●─────────── 47:02    │  │  glass control bar (elevation.3)
│  │ ⏮  ⏯  ⏭   [CC] [Quality] [Audio] [⚙]  │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

- Controls reveal on **Up** or **Select** (during playback Select toggles play/pause when controls are hidden), auto-hide **5s**; `Back` hides controls first, second `Back` exits player (confirm only if scrubbing is active).
- Seekbar is focusable: Left/Right ±10s per press, holding ramps to ±30s after 800ms; the scrubber shows a preview still + time chip above the thumb.
- Episode context (series): `Down` reveals the episode shelf overlay; `Up` from seekbar returns to top line.

## 13.4 Quality & source behaviour (design visibility of pack rules)

| Pack rule | UI expression |
|---|---|
| Auto default (360p/480p start on mobile) | Quality sheet: `Auto (recommended)` selected; current source shown as a copper dot (`Streaming 480p`) |
| Manual lock | Selecting a resolution marks it `Locked`; Auto is always selectable again |
| Never invent qualities | The sheet lists **only** real `sources[]` resolutions; absent quality is absent — no greyed “1080p” ghosts |
| Short-preview heuristic | Invisible to users (it only removes trap sources); the sheet never shows dropped sources |
| MP4 preference | Invisible; playback reliability is the outcome |

## 13.5 Stream failure & re-resolve (the honesty path)

Mid-playback failures (expiry, recoverable media errors) trigger the **re-resolve choreography** — never a dead spinner:

1. **Detect (0s):** video freezes; a small glass chip appears top-center: `Refreshing the stream…` + copper BufferingRing. Playback controls remain available (pause, back).
2. **Re-resolve (≤12s):** the app re-fetches stream JSON (pack `05` step 9), selects the same locked quality or Auto. The chip updates to `Resuming at 42:10…` on success and playback restarts at the saved position.
3. **Bounded retry:** at most 2 automatic re-resolves; the second attempt shows `Retrying (2 of 2)…`.
4. **Failure card:** if recovery fails, a full player error state: `This stream stopped responding.` with three honest actions: **Try again** (manual re-resolve) · **Choose another quality** (opens sheet — users can escape a bad source) · **Exit** (returns to detail, progress saved).
5. **No infinite loops, no fake success** (pack `01`). The elapsed position is preserved in every path.

## 13.6 Completion & next episode

- **Series:** at 20s remaining (or on completion) the `NextEpisodeCard` overlays (§6.1.12): still + `Up next · S2:E5` + 10s countdown ring + `Play now`/`Cancel`. Auto-continue happens **only** between consecutive episodes and **only** if the user hasn't pressed Cancel. Autoplay-next is a Settings toggle (default on).
- **Movie completion:** controls return with `Watch again` (copper) + `Back to detail`; the progress entry marks `completed` (pack `05`).
- **End of catalogue/last episode:** `That's the end of the line.` + `Back to series`.

## 13.7 Mobile player edge behaviours

- **Accidental back:** first back while controls are hidden shows controls only (no exit) — prevents thumb-loss; second back exits.
- **Audio focus:** incoming call/notification ducks audio; the paused state persists after; design shows paused chrome on return, never a surprise resume.
- **Orientation lock during scrub:** entering scrub (thumb down on seekbar) locks orientation changes until release.
- **Screen brightness:** the player never overrides system brightness except via the validated brightness gesture.

## 13.8 Captions rendering

- Caption track renders bottom-center over video on a `rgba(10,11,13,0.72)` scrim pill, `type.body` white, max 2 lines; never pure `#FFF` (glare on OLED).
- `Off` is always the first row in the Subtitles sheet; the last choice is remembered per device (and per-title override allowed later).
- Missing captions: the CC button remains visible but opens the sheet showing `No subtitles for this title` (honesty) — video never blocks (pack `05`).

---

# 14. Device pairing experience (phone ↔ TV)

Design target: **pairing is a one-minute ritual, then invisible forever.** Protocol constraints from pack `07`/ADR 002 are binding: QR carries challenge/deep-link only; short codes are rate-limited; challenges expire (5–15 min); approval is explicit and single-use; revocation is mandatory; no fake pairing states.

## 14.1 The pairing story (both screens, one narrative)

```
        TV (activation)                          Phone
 ┌─────────────────────────┐            ┌─────────────────────────┐
 │ QR + K7M-2Q4 + 08:42   │            │ Pairing hub → Scan      │
 │ “Connect your phone”    │◄──scan─────│ camera w/ copper frame  │
 │ status: waiting…        │            │ Approval card           │
 │                         │◄──approve──│ “Living Room TV”        │
 │ ✓ → TV Home             │            │ ✓ → “TV connected”      │
 └─────────────────────────┘            └─────────────────────────┘
```

## 14.2 TV activation screen (6.2.2) — design notes

- Composition: brand top-left, countdown top-right, QR panel left-of-center (the largest object — it is the content), steps right in `type.tv.body`, security microcopy at the bottom.
- The short code is huge (`type.tv.code`) and grouped; it exists for camera-less phones and accessibility.
- **Countdown is the trust signal:** it visibly proves the code is short-lived. On expiry the ring completes in `state.error`, copy `Code expired — a new one is on its way`, and a fresh challenge auto-issues (with a subtle “New code” chip).
- Focus set is tiny on purpose: QR panel (zoom), `Regenerate code`, `Network help`. Nothing else competes.

## 14.3 Trust & security copy (visible design, not fine print)

| Element | Copy principle |
|---|---|
| QR panel footnote | “This code links your devices. It never contains video or account details.” (per pack `09` — QR payload = challenge only) |
| Approval card | “Approving connects this TV to your phone. You can unpair anytime in Settings.” |
| Reject path | “Connection declined” — the TV stays on Activation with its challenge consumed (single-use) |
| Revocation | “This TV will need a new code to connect again.” — consequences before the dialog action |
| About | Independence disclaimer (Appendix A) |

## 14.4 State machine → interface

```
pending ──► approved ──► revoked
pending ──► expired      (auto re-issue new challenge)
pending ──► rejected     (challenge consumed)
```

| State | TV UI | Phone UI |
|---|---|---|
| pending | QR + code + countdown ring (calm) | Scanner or “Waiting for approval…” after scan |
| approved | Ring completes copper → 400ms crossfade to Home; toast `Living Room TV connected` | Success card + `Done` → Pairing hub with new DeviceCard |
| expired | `state.error` ring + “New code issued” chip; QR refreshes | Approval card expired copy + `Scan the new code` |
| rejected | “Connection declined — request a new code.” + Regenerate | Toast + back to scanner |
| revoked (from either side) | TV returns to Activation at next app open (or live via sync) | Card removed, undo snackbar clarifies re-pair needs a new code |
| service unavailable | Honest error card (§6.2.16): “Pairing is unavailable right now.” + Retry + `Watch on this TV anyway` **only if** the device was previously paired and still has a valid session — otherwise pairing is the gate (pack `04`) | Pairing hub error banner + Retry; scanner shows `Can't reach pairing service` |

## 14.5 Micro-interactions

- Scan match: haptic + viewfinder brackets flash copper once (120ms) — then straight to Approval (no celebratory detour).
- Approve press: button shows loading ring inline ≤300ms before the success card (backend confirmation first — never optimistic).
- TV approval arrival: the ring completes with a 240ms copper bloom (opacity only) — the “house lights” moment.
- All pairing motion respects reduced-motion (§12.6).

## 14.6 Accessibility in pairing

- The code is readable at 20/20 vision from 3m (64sp) and selectable for screen readers as individual groups (“K”, “7”, “M”…).
- Every step of the activation flow is fully narrated by TalkBack in order: title → steps → code → countdown → security line.
- The scanner offers `Enter code instead` at the same visual level as the camera CTA (it is a first-class path, not a fallback afterthought).


---

# 15. Empty, loading, error and success states

**Rule zero (pack `01/11`): every state is real.** No fake success, no placeholder catalogue in release, no optimistic pairing. This catalogue maps condition → what the user sees → what they can do. Copy in Appendix A.

## 15.1 The three universal state templates

| Template | Composition | Used for |
|---|---|---|
| `EmptyState` | serif line (`type.display.l`) + body (`type.body`, muted) + primary CTA (+ optional italic flourish) | empty catalogue, watchlist, history, no results |
| `ErrorState` | `state.error` 24dp outline glyph + serif line + body + Retry primary + secondary escape | catalogue failure, stream dead, service down |
| `LoadingState` | `SkeletonBlock` layout-matching placeholders (mobile shimmer-once; TV static) + optional `type.meta` hint after 4s | all content loads |

## 15.2 Behaviour catalogue

| # | Condition | What the user sees | Action available |
|---|---|---|---|
| 1 | Empty catalogue / provider returns nothing | `EmptyState`: “The screen is quiet.” / body + `Try again` | Retry |
| 2 | Missing artwork | Typographic fallback tile (elevated bg, serif title, copper rule) — never a grey box | none needed |
| 3 | Missing metadata | “—” in credits line; synopsis block hidden if absent; year/rating never invented | open detail works regardless |
| 4 | No search results | `EmptyState`: “No matches for ‘…’” + tips line | `Clear search`, `Browse Home` |
| 5 | Slow loading | Layout-matching skeletons; after 4s quiet hint (“Still opening the catalogue…”) | Back works throughout |
| 6 | Connection failure (JSON) | `ErrorState` at the affected region (inline for shelves, full for root) | Retry; offline banner if airplane mode detected |
| 7 | Unavailable stream (`has_resource` false / empty sources) | Detail: Play disabled `Not available to play`; Download hidden | My List still works |
| 8 | Playback buffering | `BufferingRing` + controls stay; after 8s, chip “Still buffering… check your connection” | Pause, exit |
| 9 | Playback interruption (expiry/media error) | Re-resolve chip (§13.5): `Refreshing the stream…` → `Resuming at mm:ss…` | back to detail anytime |
| 10 | Re-resolve exhausted | Player `ErrorState`: “This stream stopped responding.” | `Try again` · `Choose another quality` · `Exit` |
| 11 | Missing subtitles | Subtitles sheet: “No subtitles for this title” | video unaffected; Off default |
| 12 | Failed download | Row in `Needs attention` with reason (`state.error`) | `Retry` (fresh URL re-resolve) · `Remove` |
| 13 | Interrupted download | Row shows `Paused` + bytes so far; honest, resumable-when-safe | Resume · Cancel |
| 14 | Storage full | Before start: sheet “Not enough space — this download needs 1.2 GB” | `Free up space` → Storage · cancel |
| 15 | Offline / airplane mode | Banner `You're offline`; Home shows cached shelves if present (labelled `Saved`); Library/Downloads fully usable | `Downloads` shortcut; Retry when back |
| 16 | Empty watchlist | `EmptyState` “Your list is empty…” | `Browse Home` |
| 17 | Empty viewing history | `EmptyState` “Nothing watched yet” | `Browse Home` |
| 18 | Invalid QR code | Scanner: “That doesn't look like an HALLYU-STREAM pairing code.” | Rescan · Enter code instead |
| 19 | Expired pairing session | TV: new-code chip; Phone: expired approval card | Scan/enter new code |
| 20 | Rejected device connection | TV: “Connection declined”; Phone: toast | Request new code |
| 21 | TV disconnected / revoked live | TV: Activation returns (with reason line); Player on TV exits gracefully with explanation | Re-pair |
| 22 | Pairing service unavailable | Honest error card both sides (§14.4) | Retry; phone keeps single-device value |
| 23 | Success — download complete | Row shows ivory check + `Available offline`; notification (stage 2) | Play offline |
| 24 | Success — pairing | §14.5 choreography | `Done` / TV Home |

## 15.3 Fallback artwork system (detail)

When `cover`/`backdrop` is missing or fails to load: the frame renders `color.bg.elevated`; the title in display serif (ivory), centered, clamped 3 lines; a 2dp copper rule 24dp under the title; the item's initials watermark at 8% opacity behind. The tile is identical on both platforms — a designed title card, not an apology.

## 15.4 Stale-data behaviour

Progress/watchlist entries referencing titles that no longer resolve stay visible with an `Unavailable` chip and remain removable (§6.1.14) — user data is never silently deleted.

---

# 16. Accessibility guidelines

Usability first: “Do not sacrifice usability for visual effects” is a design constraint, not an afterthought (pack `10`).

## 16.1 Contrast (normative)

| Pair | Ratio | Use |
|---|---|---|
| `text.primary` on `bg.obsidian` | ≈ 17:1 | all body/titles (AAA) |
| `text.muted` on `bg.obsidian` | ≈ 7.7:1 | metadata (AA+, AAA large) |
| `text.faint` on `bg.obsidian` | ≈ 3.6:1 | **disabled/decorative only** — never informational body |
| `text.onAccent` on `accent.copper` | ≈ 6:1 | button labels (AA) |
| `accent.copperLight` on `bg.obsidian` | ≈ 8:1 | links, focus rings (AA+) |
| `state.error` on `bg.obsidian` | ≈ 5.2:1 | error text/icons (AA) |
| Ivory caption scrim | video-dependent | captions always on a 72% ink scrim pill |

Contrast is verified against the *glass composites* too: any text over glass is placed where the scrim under it keeps effective contrast ≥ 4.5:1 (the glass budget guarantees a dark composite).

## 16.2 Touch, focus, targets

- Minimum touch target 48dp mobile; minimum focusable TV element 40dp with visible ring.
- Focus indicators (TV) are **never** removed; copper ring is the functional focus (reduced-motion keeps rings — §12.6).
- Color is never the only signal: states pair color with icon/shape (error glyph + color, watched check + color).

## 16.3 Large text & reflow

- All type in `sp`; layouts must survive 1.3× system font scale: shelf labels wrap to 2 lines; buttons grow; cards keep art ratio and reflow text under art; nothing truncates without ellipsis + full text on tap.
- The player uses fixed-size chrome text (sp-based) — time codes remain legible at 1.3× without breaking the bar (values shorten: `42m left`).

## 16.4 Screen-reader semantics (TalkBack)

| Element | Announcement pattern |
|---|---|
| PosterCard | “{Title}, {year}, {type}, {rating}. Double-tap to open.” + custom actions “Add to My List”, “Download” |
| ContinueCard | “{Title}, S{se}:E{ep}, {remaining} left. Double-tap to resume.” |
| Player controls | named buttons (“Play”, “Seek backward 10 seconds”, “Subtitles”), seekbar as adjustable |
| CountdownRing | “Pairing code expires in {n} minutes” |
| Progress bars | “Downloading, {pct} percent” (or “Downloading, {MB} of {MB}”) |

Focus order follows visual order on every screen; decorative elements are `notAccessibilityFocusable`.

## 16.5 Reduced motion & vestibular safety

Per §12.6. Additionally: no parallax, no auto-play previews (there are none by design), no zoom beyond 1.04, no flashing (pairing success bloom ≤ 1 pulse).

## 16.6 Television accessibility

- Focus visibility is contractual (§5.5): tested from 3 metres at 720p.
- All journeys remote-only (§5.4); no hidden touch-only features.
- Captions available on TV with size options (Default / Large) in Settings — distance reading applies to subtitles too.
- Colour-blind safety: copper + ivory system avoids red/green pairings in normal flows (success/error always paired with glyphs).

## 16.7 Permission clarity (pack `09`)

Every OS permission is preceded by a `PermissionPrimer` explaining the exact use (camera → scan TV codes; storage → keep downloads; notifications → download progress). Denial paths remain complete (scanner → manual code entry; downloads → Settings link).

---

# 17. Responsive design principles

## 17.1 Phone classes

| Class | Width | Margin | Poster (shelf) | Notes |
|---|---|---|---|---|
| Compact | ≤ 360dp | 16dp | 108dp | 4-item shelves peek the 5th card |
| Medium | 361–480dp | 20dp | 120dp | the baseline this document specifies |
| Large / foldable inner | ≥ 481dp | 24dp | 140dp | grid gains a 3rd column where grids exist |

- Aspect ratios 18:9 → 21:9: hero height clamps 44vh–58vh; the dissolve always occupies the last 45% of whatever the hero height is.
- Cutouts/punch-holes: `layout.margin` additionally respects `windowInsets`; the splash wordmark sits below the cutout band.

## 17.2 Tablet & large screens

Not a launch target (pack `03` says phone-first), but the design pre-commits: poster grids go 3–4 columns with the same rhythm; detail becomes a 2-pane (art left, info right) at ≥600dp. Nothing else changes — tokens scale, they don't fork.

## 17.3 Low-memory class (design contract)

- `lowTier` device flag collapses the glass budget to opaque (§9.7).
- Shelf posters capped at 2× frame size decode (§9.6).
- Skeleton shimmer disabled; static skeletons used.
- Hero art request capped at 1280px wide (upscaled by the frame, not the decoder).
- These are invisible design decisions — the product must look intentional in both tiers.

## 17.4 TV scaling

1080p is the design baseline; 720p and 4K scale proportionally in dp. Two floors never scale below: body ≥ 20sp@1080p-equivalent and focus ring ≥ 3dp-equivalent. Overscan safe area (5%) is constant across all TV sizes.

---


# 18. Design consistency rules

These rules are enforceable in design review. They convert the brief's “must avoid” list into decisions.

## 18.1 Do / Don't

| Do | Don't |
|---|---|
| Let artwork dominate; chrome recedes | Put borders, badges or gradients over posters |
| Use copper for exactly one primary action per region | Colour-code genres, sprinkle accent decorations |
| Use glass only within the glass budget (§9.7) | Blur cards, rows, posters or whole screens |
| Set titles in the display serif; UI in Inter | Mix families randomly or add weights beyond 400/500/600 |
| Keep 12dp posters, 12dp buttons; one radius per region | Oversized rounded cards, pill-buttons everywhere |
| Design every empty/error/loading state with the same care as Home | Ship generic grey “oops” dialogs or bare spinners |
| Keep motion under 400ms and purposeful | Perpetual pulsing, bouncing, rotating decoration |
| Design phone and TV separately for their input models | Stretch the phone layout onto the TV or shrink the TV onto the phone |
| Keep the player quiet: video first, chrome on demand | Permanent heavy overlays, autoplaying previews |
| State the truth in copy (expiry, failures, limits) | Fake pairing, fake progress, fake success |

## 18.2 Spacing & rhythm rules

- All vertical spacing is from `space.*` (4dp grid). No magic numbers.
- Shelf = ReelLabel + 12dp + cards + 28dp. Sections never sit closer than `layout.gap.shelfStack`.
- Every screen has exactly one dominant margin value (`layout.margin.*`).

## 18.3 Colour application rules

- Backgrounds are only `bg.obsidian` / `bg.surface` / `bg.elevated` (glass is a chrome treatment of the same family).
- Copper appears in at most one *content-region* role per screen + one *chrome-region* role (e.g. Play CTA + active nav).
- State colours never replace body text; they annotate it.

## 18.4 Copy rules

- Sentence case everywhere; all-caps only for reel labels and TV buttons.
- No exclamation marks. No “Oops”. No filler (“It looks like…”) openers.
- Times, sizes and qualities are always real values from data; unknown → “—” or hidden.

## 18.5 The anti-generic clause

Before release, every screen must pass: *“Would this screen belong in a template streaming kit?”* If yes, the screen is redesigned around at least one signature (S1–S4) from §2.4.

---

# 19. Design acceptance criteria

A design is accepted only when **all** of the following hold. This list merges the brief's requirements with the pack's UI acceptance checklist (pack `10` §5).

## 19.1 Identity

- [ ] Screens are recognisable as HALLYU-STREAM without a logo visible (S1–S4 present and consistent).
- [ ] Copper discipline verified per screen (≤1 content + ≤1 chrome role).
- [ ] Glass budget verified per screen (no blur outside §9.7; low-tier fallback designed).
- [ ] No purple gradients, no neon, no template-kit artefacts (§18.5).

## 19.2 Completeness

- [ ] All screens in §6 specified and designed, both platforms.
- [ ] Every screen has designed empty, loading, error states (§15) — none generic.
- [ ] All 14 journeys in §8 walkable step-by-step with states accounted for.
- [ ] Playback states 7–10 (§15.2) designed including the re-resolve choreography.
- [ ] Pairing states 18–22 designed on both sides, all with honest copy.

## 19.3 Platform integrity

- [ ] Mobile: every journey completable one-handed on a 360dp phone; touch targets ≥48dp.
- [ ] TV: every journey completable with D-pad only; focus always visible; focus recovery verified for dialogs and player; overscan safe area respected.
- [ ] No mobile layout stretched onto TV (independent compositions, shared tokens only).

## 19.4 Quality bars

- [ ] Contrast table (§16.1) verified including glass composites.
- [ ] 1.3× font scale reflow verified on 3 screens (Home, Detail, Settings).
- [ ] Reduced-motion variants defined for every motion in §12.
- [ ] Image render sizes (§9.6) specified for every artwork frame.
- [ ] Microcopy bank (Appendix A) covers every state in §15.2.

## 19.5 Honesty & security

- [ ] No fake success paths anywhere (pairing, playback, downloads).
- [ ] QR panels carry the security microcopy; approval is explicit.
- [ ] About screen carries the independence disclaimer (pack `09`).
- [ ] Permission primers precede every OS permission ask.

## 19.6 Delivery-phase alignment (pack `11`)

- [ ] Phase 1 gate: brand identity + tokens + motion direction (§2–3, §9–10, §12) accepted.
- [ ] Phase 2 gate: mobile + TV screen blueprints (§4–6) complete to this document's template depth.

---

# 20. Recommendations for the next design phase

Handoff notes for Phase 3+ (pack `11`). These are recommendations, not implementation.

1. **Token freeze & theming.** Convert §9–10 into the engineering token layer first (single source: this document). Any value change must come back through a revision of this file.
2. **Design-system build order.** Foundations (colour/type/space) → core components (§11.1–11.6) → player chrome (§13) → pairing kit (§14). Components ship with their states, never stateless.
3. **Artwork pipeline.** Establish the backdrop-crop rules (hero dissolve zones), the typographic fallback renderer (§15.3), and a request-size policy matching §9.6 before any screen work begins.
4. **Prototype the four signatures.** Validate S1 (Marquee Hero), S2 (glass chrome — with low-tier fallback on a real low-RAM phone), S3 (copper thread) and S4 (reel labels) as a small prototype before mass screen production.
5. **Hardware validation early.** Focus visibility (TV, 3m, 720p), player gesture reliability (brightness/volume — if unreliable, cut them per §4.3), download progress truthfulness, and pairing timing on real devices before Phase 8 polish.
6. **Brand assets.** Produce the wordmark/brand-rule/Hangul lockup vectors, the app icon, and the icon set (Appendix B) as real assets; confirm Fraunces + Inter licensing for distribution.
7. **Optional remote (§6.1.23) and Play-on-TV handoff (§8.13).** Design only after core pairing KPIs are stable; both must stay intent-only (ADR 001).
8. **Design QA checklist.** §19 becomes the standing review gate for every future screen — including the anti-generic clause (§18.5).
9. **Open items to resolve with engineering/data** (see Appendix D) — especially Explore's data availability and the movie season/episode mapping convention (pack `02` §6).

---

# Appendices

## Appendix A — Microcopy bank

Voice: assured, cinematic, understated. Sentence case. These strings are normative; deviations need a revision here.

| Context | Line 1 (serif, display) | Line 2 (body, muted) | Primary action |
|---|---|---|---|
| Catalogue empty | The screen is quiet. | We can't reach the catalogue right now. Check your connection and try again. | Try again |
| Catalogue loading (slow) | — | Still opening the catalogue… | — |
| No search results | No matches. | Try a shorter title, or check the spelling. | Clear search |
| Empty watchlist | Your list is empty. | Save anything for later — tap the bookmark on any title. | Browse Home |
| Empty history | Nothing watched yet. | Your place is kept automatically when you watch. | Browse Home |
| Empty continue | Nothing in progress. | Start something tonight — we'll remember where you stopped. | Browse Home |
| Stream refreshing | — (chip) | Refreshing the stream… | — |
| Stream retry 2 | — (chip) | Retrying (2 of 2)… | — |
| Stream failed | This stream stopped responding. | The link to this video expired and couldn't be renewed. | Try again |
| Buffering (8s+) | — (chip) | Still buffering… check your connection. | — |
| No sources | Not available to play. | This title can't be streamed right now. | — (My List still available) |
| No subtitles | — (sheet) | No subtitles for this title. | — |
| Download failed | Download paused. | We lost the connection. It will resume when you're back. | Retry |
| Storage full | Not enough space. | This download needs {size}. Free up space to continue. | Free up space |
| Offline | You're offline. | Downloads and saved lists still work. | Open Downloads |
| Pairing: invalid QR | Not one of our codes. | Point at the code shown on your TV. | Rescan |
| Pairing: expired | This code expired. | Codes are short-lived for security. A new one is waiting on the TV. | Scan the new code |
| Pairing: rejected | Connection declined. | The phone declined this session. Request a new code. | Regenerate code |
| Pairing: service down | Pairing is unavailable right now. | We can't reach the pairing service. Your films are unaffected. | Try again |
| Pairing success | Living Room TV connected. | You can unpair anytime in Settings. | Done |
| QR security note | — | This code links your devices. It never contains video or account details. | — |
| About | HALLYU-STREAM | An independent streaming experience for film and television. Not affiliated with, endorsed by, or connected to Moviebox. | — |
| Permission: camera | Camera access | Used only to scan the pairing code on your TV. | Allow / Enter code instead |
| Permission: storage | Storage access | Used only to keep downloads on this device. | Allow / Not now |
| End of series | That's the end of the line. | You've finished every episode. | Back to series |

## Appendix B — Icon inventory

Style contract: 24dp (TV 32dp) line icons, 1.75dp stroke, rounded caps. Filled only for active nav and toggles.

| Icon | Use | Screens |
|---|---|---|
| marquee-arch | Home nav | both |
| compass-frame | Explore nav | both |
| lens | Search nav / field | both |
| stacked-frames | Library nav | both |
| aperture | Settings nav | both |
| device-tv | Devices / device cards | pairing, settings |
| qr-frame | Scan CTA | pairing hub |
| bookmark (+filled) | My List | detail, cards |
| download-arrow | Downloads | detail, manager |
| play / pause / replay | transport | player |
| seek-10 / seek+10 | transport | player |
| cc-frame | Subtitles | player |
| signal-bars | Quality | player |
| waveform | Audio | player |
| expand / collapse | fullscreen | player |
| chevron / close / clear | navigation & inputs | global |
| clock | search history | search |
| check-watched | watched state | episodes |
| alert-outline | errors | global |
| trash / minus-circle | remove actions | downloads, history |
| flash | scanner torch | scanner |

## Appendix C — Data-availability & fallback matrix

The design depends only on normalised models (pack `02` §7). Where data may be absent, the fallback is designed — not improvised.

| UI element | Data field | Fallback |
|---|---|---|
| Poster card art | `cover` | Typographic tile (§15.3) |
| Hero backdrop | `backdrop` | Elevated title-card hero (S1 no-backdrop variant) |
| Credits line | `releaseYear`, `rating`, `genres`, `contentType` | “—” per gap; never invented |
| Home shelves | `/home` rows | Skeleton → error state; cached shelves labelled `Saved` when offline |
| Explore chips/groups | category/collection metadata in `/home` | Fallback ladder (§6.1.4): featured grid + quiet note |
| Episode list | `seasons[]` (`se`, `maxEp`) | Empty-season copy (§6.1.8) |
| Episode stills | provider stills | `E{n}` typographic tile |
| Quality list | `sources[]` | Show only real entries; disabled Play when none |
| Subtitles | captions endpoint | “No subtitles for this title” |
| Download size | `size` | Hide size meta; progress by bytes when known, else indeterminate ring |
| Continue progress | local `progress` key | Empty state |
| Similar titles | home/category data | Hide the shelf entirely (no empty shelf chrome) |
| Stream URL | signed `url` | Never stored; re-resolved (§13.5) |

## Appendix D — Open questions (design-relevant)

| # | Question | Owner | Design stance meanwhile |
|---|---|---|---|
| 1 | Does the provider expose category/genre browse beyond `/home`? | Data/eng (pack `02`) | Explore fallback ladder (§6.1.4) is the design of record |
| 2 | Movie season/episode convention (`0/0` vs `1/1`) — pack `02` §6 says verify live | Eng | UI reads whatever `movieSeasonEpisode()` returns; design is agnostic |
| 3 | Backdrop aspect ratios available from provider? | Data | Hero crops tolerate 16:9–2:1; dissolve zone is proportional |
| 4 | Do caption formats need conversion (SRT etc.)? | Eng (pack `05`) | UI lists languages only; format is invisible to design |
| 5 | TV hardware constraint class (RAM) for glass fallback | QA/eng | Low-tier fallback designed in (§9.7) — safe either way |
| 6 | Brightness/volume gestures reliable on target devices? | QA (§20.5) | Designed but flagged experimental (§4.3) |
| 7 | Legal review of About disclaimer wording | Legal | Appendix A line is the safe default |
| 8 | Optional accounts arrive? | Product | Settings gains `Sign in (optional)`; no IA change (§4.2) |

---

*End of HALLYU-STREAM UI/UX Master Plan v1.0 — design companion to `streaming-company-architecture/`. No application code was produced or implied.*
