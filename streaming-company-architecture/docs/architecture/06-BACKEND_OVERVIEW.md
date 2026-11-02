# 06 — Backend Overview

**Version:** 1.0  

## 1. Purpose

Our backend exists to support **product features that require a shared online service**:

| In scope | Out of scope |
|----------|----------------|
| QR / code **pairing** phone ↔ TV | Video streaming proxy |
| Device registry and revocation | CDN relay / caching of movie files |
| Optional user accounts | Transcoding |
| Optional sync of watch progress / watchlist metadata | Server-side title downloads |
| Rate limiting and abuse controls for pairing | Megan or zarhosting media passthrough |

## 2. Architecture position

```text
Mobile / TV clients
       │
       │ HTTPS (JSON)
       ▼
[ Backend API ]
       │
       ├── pairing sessions
       ├── devices
       └── optional users + metadata sync

Media path does NOT go through this box.
```

## 3. Technology choices

Choose stack after repo audit (Node, Supabase-only functions for pairing, etc.). Requirements outweigh brand:

- HTTPS only  
- Durable store for pairing challenges and devices  
- Short TTL on pairing challenges  
- Secure session/token handling for paired TVs  

If using Supabase: allowed for **auth/DB/functions for pairing**. **Forbidden** to use Edge Functions as a **video** proxy (historical failure mode).

## 4. Service modules

| Module | Responsibility |
|--------|----------------|
| Pairing | Create challenge, show status, approve, expire, reject |
| Devices | List, rename optional, revoke |
| Users (optional) | Account, link devices |
| Sync (optional) | Progress / watchlist JSON only |
| Admin/ops | Metrics on pairing success/fail — not video QoS from our CDN |

## 5. Non-negotiable rule

**No endpoint may accept a media URL and return video bytes to a client as a proxy.**

## 6. Related

- Pairing detail: `07-PAIRING_SERVICE.md`
- Data model / API surface: `08-DATA_AND_APIS.md`
- ADR: `docs/adr/002-pairing-backend.md`
