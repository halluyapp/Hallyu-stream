# 04 — Client: Android TV / Google TV

**Version:** 1.0  

## 1. Role

Television-first client: landscape 10-foot UI, **D-pad / remote only**, no dependence on touch. Same catalogue and playback rules as mobile; **different layout and interaction model**.

## 2. Design direction

- 16:9 composition; TV safe margins  
- Large type; focus states visible across the room  
- Cinematic heroes and wide shelves  
- No mobile bottom tabs as the primary pattern; use left nav or top rows appropriate to TV  
- Focus scale/elevation allowed if it does not jump layout or hide neighbours  

## 3. Screens (required)

1. Splash / loading  
2. Welcome + **QR pairing** (code + QR + expiry)  
3. Pairing states: pending, approved, expired, rejected, network error  
4. TV Home  
5. Browse / Explore  
6. Search + on-screen keyboard  
7. Search results  
8. Title detail  
9. Season / episode selection  
10. Fullscreen player  
11. Player overlays: quality, subtitles, settings  
12. Continue watching  
13. Watchlist / library  
14. Settings  
15. Account/device status + unlink  

## 4. Remote behaviour (required)

| Input | Behaviour |
|-------|-----------|
| D-pad | Move focus predictably |
| Select / OK | Activate focused item |
| Back | Dismiss top overlay first, then previous screen |
| Play/pause | When hardware key available |
| Seek | Player scrubbing via remote |

- Focus must never disappear when opening/closing dialogs  
- Key repeat must not multi-fire actions  
- Entire product usable **without** the phone after pairing  

## 5. Pairing entry

Unpaired TV **must** show activation (QR + short code + countdown) before the main catalogue experience. After successful pairing, do not require scan per episode.

## 6. Playback

Same resolution pipeline as mobile (`05-PLAYBACK_AND_OFFLINE.md`): stream JSON on device → CDN URL on device player. TV player tuned for remote overlays and long-distance readability.

## 7. Framework note

Evaluate Expo/RN TV support honestly. If one codebase cannot deliver reliable focus and TV playback, ship a **separate TV client** sharing types, normalisers, and design tokens — do not fake TV support.

## 8. Related

- Pairing protocol: `07-PAIRING_SERVICE.md`
- Mobile: `03-CLIENT_MOBILE.md`
