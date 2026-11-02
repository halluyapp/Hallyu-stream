# 08 — Data Model and API Surface

**Version:** 1.0  

## 1. Data domains

| Domain | Where it lives | Notes |
|--------|----------------|-------|
| Catalogue cache | Client (memory / disk TTL) | From zarhosting JSON |
| Playback progress | Client first; optional cloud sync | Keyed by subjectId\|se\|ep |
| Watchlist / history | Client first; optional cloud sync | Metadata only |
| Download files + registry | Client device storage | Bytes never on our server |
| Pairing sessions | Backend | Short-lived |
| Devices | Backend | Long-lived until revoked |
| Users | Backend optional | Accounts |

## 2. Core entities (backend)

**PairingSession**

- id, shortCodeHash, status, expiresAt, createdAt  
- tvDevicePublicInfo (name, model optional)  
- approvedByUserId?, approvedAt?  

**Device**

- id, userId, type (`tv` \| `mobile`), displayName  
- publicKey or refresh credential reference  
- lastSeenAt, createdAt, revokedAt?  

**User** (optional)

- id, auth identifiers, createdAt  

**WatchProgress** (optional sync)

- userId, subjectId, season, episode, positionMs, durationMs, updatedAt  

**WatchlistItem** (optional sync)

- userId, subjectId, detailPath, addedAt  

## 3. Client local schema (minimum)

- `progress(key, positionMs, durationMs, updatedAt, completed)`  
- `watchlist(subjectId, detailPath, title, cover, addedAt)`  
- `history(...)`  
- `downloads(id, subjectId, se, ep, quality, path, bytes, status, updatedAt)`  
- `settings(defaultQuality, subtitleLanguage, ...)`  

Use a real local DB (e.g. SQLite via app framework) with migrations.

## 4. Provider API (external)

Fully specified in `02-INTEGRATIONS_CATALOGUE.md` — not duplicated here. Clients call zarhosting directly for catalogue/stream/captions.

## 5. Our backend API groups

1. **Pairing** — create, status, approve, reject  
2. **Devices** — list, revoke, optional rename  
3. **Auth** — if accounts exist  
4. **Sync** — optional progress/watchlist pull/push (JSON only)

No `GET /media/proxy?url=` or equivalent.

## 6. Identifier discipline

| ID | Stable? | Store long-term? |
|----|---------|------------------|
| subjectId + detailPath | Yes | Yes |
| se / ep | Yes | Yes |
| Signed CDN URL | No | No — resolve again |
| Pairing challenge id | Until expiry | No after consume |
| Device id | Yes until revoke | Yes |

## 7. Related

- Pairing flows: `07-PAIRING_SERVICE.md`
- Playback keys: `05-PLAYBACK_AND_OFFLINE.md`
