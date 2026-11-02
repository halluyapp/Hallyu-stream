# 05 — Playback and Offline

**Version:** 1.0  

## 1. Mandatory delivery model

```text
App  →  zarhosting JSON (stream / captions)
App  →  Media CDN URL on the DEVICE (play + download bytes)
```

Our backend must **never** download, proxy, or cache full video files.

## 2. Stream resolution flow

1. Collect `subjectId`, `detailPath`, `se`, `ep`, optional preferred quality.  
2. `GET /stream/{subjectId}?detail_path=&se=&ep=`  
3. Normalise and validate `sources[]`.  
4. Apply source selection rules (`02-INTEGRATIONS_CATALOGUE.md`).  
5. Select quality (Auto policy vs user lock).  
6. Pass **URL** to native player on this device.  
7. Load captions in parallel (non-blocking).  
8. Persist progress under a stable content key (not the signed URL).  
9. On recoverable media failure / expiry: re-fetch stream JSON → new URL → retry (bounded).  
10. If recovery fails: clear error + alternate quality or exit actions — no infinite loops.

## 3. Progress storage key

Stable key example:

```text
{subjectId}|{season}|{episode}
```

Store: positionMs, durationMs when known, updatedAt, completed flag.

Save periodically and on pause / background / exit — not every frame.

## 4. Player requirements

- Fullscreen play/pause, seek, elapsed/remaining, buffer state  
- Quality selector (real sources only)  
- Subtitle selector + off  
- Resume  
- Series: episode context; next episode when applicable  
- Error UI with Retry  
- Controls auto-hide during play  

## 5. Captions

Primary: zarhosting captions endpoint (same ids as stream).

- List languages; remember preference  
- Support formats returned (e.g. SRT) via player or conversion only when needed  
- Missing captions must not block video  
- Optional: persist selected subtitle file with a download  

## 6. Downloads (on device)

### Stage 1

- Foreground download from media URL  
- Progress, cancel, failure, local registration  
- Offline play  
- Do not mark complete without integrity checks (size / MP4 probe as applicable)

### Stage 2

- HTTP Range resume when server supports it; validate 206 / identity before append  
- Expired URL → fresh stream resolve → resume only if safe  
- Background download via maintained native mechanism when feasible  
- Notifications for progress/complete when implemented  
- **Do not advertise** background reliability until proven on hardware  

### Forbidden

- Server-side “download for the user” of full titles  
- Completing a download on partial/corrupt data  

## 7. Headers

See media header config in `02-INTEGRATIONS_CATALOGUE.md`. Apply on play and download paths when the stack allows.

## 8. Related ADR

`docs/adr/001-device-direct-playback.md`
