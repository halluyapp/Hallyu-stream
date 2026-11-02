# 03 — Client: Android Mobile

**Version:** 1.0  

## 1. Role

Touch-first Android application for discovery, title detail, playback, downloads, library, settings, QR scanning for TV pairing, and optional companion remote after pairing.

## 2. Navigation (recommended)

Bottom navigation:

- **Home**
- **Explore** (categories / collections when data allows)
- **Search**
- **My Library**
- **Settings** (or Profile + Settings — pick one IA and keep it consistent)

Stack routes:

- Title detail (`detailPath` / subjectId)
- Player (fullscreen)
- Pairing scanner / approval
- Device management
- Downloads (may live under Library)

## 3. Screens (required)

1. Splash  
2. Onboarding (short)  
3. Home — hero + shelves + continue watching  
4. Explore  
5. Search — history, results, empty  
6. Title detail — metadata, play, list, download, seasons/episodes  
7. Player — full controls, quality, subtitles, retry  
8. Library — continue, watchlist, history, downloads  
9. Downloads manager — queue, progress, failures  
10. Settings — quality default, subtitle language, storage, devices, about  
11. Device management — paired TVs, unlink  
12. QR scan + approve pairing  
13. Optional companion remote  

## 4. Visual direction

**Premium cinematic luxury (dark-first):**

- Deep black / charcoal / graphite surfaces  
- Single signature accent (chosen in design phase)  
- Poster-first editorial layout; strong type hierarchy  
- Restrained motion; no cluttered “template streaming UI”  
- Design tokens: colour, type, space, radius, elevation, motion  

Reusable components: hero, poster card, shelf/rail, chips, sheets (quality/subs), player chrome, download row, empty/error/skeleton states.

## 5. Playback UX (mobile)

- Edge-to-edge video; controls auto-hide  
- Play/pause, seek, times, buffer indicator  
- Quality sheet; subtitle sheet  
- Retry on failure (triggers stream re-resolve)  
- Resume from saved position  
- Landscape / fullscreen orientation support  
- Optional: double-tap seek, vertical volume/brightness — only if reliable  

**Open sequence:** identifiers → stream JSON → pick source → set player URL (+ headers if supported) → captions parallel → save progress.

## 6. Downloads UX

- Explicit quality choice when multiple sources exist  
- Progress (bytes / % when known), pause/cancel/resume as supported  
- Failed state + retry (fresh URL if expired)  
- Offline playback from local file  
- Storage used / insufficient space handling  

## 7. Performance (mandatory)

Owner constraint: **low-memory Android phones** must remain usable.

- Appropriately sized images; bounded cache  
- Virtualise long lists / shelves  
- Lazy-load rails  
- Tear down player on exit  
- Avoid heavy blur and perpetual decoration animations  

## 8. Related

- Shared playback rules: `05-PLAYBACK_AND_OFFLINE.md`
- Pairing UX: `07-PAIRING_SERVICE.md`
- TV is separate: `04-CLIENT_ANDROID_TV.md`
