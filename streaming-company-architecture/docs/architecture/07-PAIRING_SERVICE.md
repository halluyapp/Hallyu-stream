# 07 — Pairing Service (Phone ↔ Android TV)

**Version:** 1.0  

## 1. Goal

Authorise an Android TV as a trusted playback device using the user’s phone, without typing long secrets on the TV and **without** putting media through the backend.

## 2. User journey

1. User opens TV app (unpaired).  
2. TV shows **QR code**, **short code**, **expiry countdown**.  
3. User opens mobile app → Scan / Enter code.  
4. Phone shows TV identity and asks to **Approve**.  
5. On approve, backend binds phone session/user to TV device.  
6. TV receives approved state → enters Home.  
7. Pairing persists until unlink, revoke, or policy reauth.  
8. **Not** required per episode.

Optional later: phone companion remote (play/pause, d-pad, keyboard for search). Must not be required for core TV use.

## 3. Security requirements

| Rule | Detail |
|------|--------|
| Challenge entropy | High-entropy session id; short code is human convenience with rate limits |
| QR payload | Only challenge id / deep link — **no** permanent tokens, passwords, or media URLs |
| TTL | Challenges expire (e.g. 5–15 minutes); show countdown |
| Single use | Approval consumes challenge |
| Bind | Approval must match the exact pending TV session |
| Replay | Reject reused challenges |
| Rate limit | Guard short-code guessing and create/approve endpoints |
| Transport | HTTPS only |
| Storage on TV | Device credential in platform secure storage |
| Revocation | User can list and unlink devices from phone |
| UX honesty | No fake “paired” UI without backend confirmation |

## 4. Logical API surface (illustrative)

Exact paths may vary; behaviour must match.

| Action | Actor | Behaviour |
|--------|-------|-----------|
| `POST /pairing/sessions` | TV | Create session → returns challengeId, shortCode, expiresAt, qrPayload |
| `GET /pairing/sessions/{id}` | TV | Poll status: pending \| approved \| expired \| rejected |
| `POST /pairing/sessions/{id}/approve` | Phone (auth) | Approve bind to this user/device |
| `POST /pairing/sessions/{id}/reject` | Phone | Reject |
| `GET /devices` | Phone | List paired TVs |
| `DELETE /devices/{id}` | Phone | Revoke |

WebSocket or short polling is acceptable for TV status; document choice.

## 5. States

```text
pending → approved
pending → expired
pending → rejected
approved → revoked
```

TV UI must cover all states with plain-language copy.

## 6. What pairing is not

- Not a media CDN  
- Not a DRM substitute  
- Not “scan every time you press play” unless user enables a strict policy later  

## 7. Implementation note

Pairing **requires** a real backend. Local-only mock across two devices is not production pairing. If backend credentials are missing, implement UI + client contracts and report the infrastructure blocker — do not ship fake success.

## 8. Related

- Backend overview: `06-BACKEND_OVERVIEW.md`
- ADR: `docs/adr/002-pairing-backend.md`
