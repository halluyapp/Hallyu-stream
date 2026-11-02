# ADR 001 — Device-Direct Playback (No Server Media Pipe)

**Status:** Accepted  
**Date:** 2026-11-02  

## Context

Experiments showed:

1. zarhosting public API returns usable stream metadata and signed MP4 URLs on Moviebox CDN hosts (e.g. `bcdnxw.hakunaymatata.com`).
2. Fetching those CDN URLs from **cloud/datacenter** environments often returned **HTTP 429** or otherwise failed.
3. Megan stream returned **502**; Megan proxy returned **service suspended**.
4. Routing video through Supabase Edge (Hallyu-style) consumed bandwidth and failed live verification when the server could not obtain CDN bytes.

## Decision

- Clients obtain **JSON only** from zarhosting (home, search, detail, stream, captions).  
- **Playback and download bytes** are requested by the **end-user device** from the media CDN URL.  
- Our backend must not proxy or download full video files.  
- Optional device media headers (`Referer` / `Origin` for `https://www.moviebox.ph/`) are configured in one client module when the player stack supports them.

## Consequences

- CI must not gate releases on “server got HTTP 206 from CDN.”  
- Playback quality depends on device network path to the CDN.  
- Signed URLs must be re-resolved via stream JSON when expired.  
- Architecture stays aligned with how consumer players typically access third-party progressive media URLs.
