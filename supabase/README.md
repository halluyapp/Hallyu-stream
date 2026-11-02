# HALLYU-STREAM pairing backend

Signalling only. This backend authorises a phone ↔ Android TV relationship; it **never** accepts a media URL and **never** returns video bytes (ADR 001, ADR 002, `01` §5, `06` §5, `09` §4).

## Status

⚠️ **Deployment deferred (user choice, 2026-11-02):** `create_project` was refused because the `Hallyu-grok` organisation reached its free-project limit. The migration and function below are ready to apply later, but no project was created, paused, deleted, upgraded, or otherwise modified. Pairing clients therefore show honest service errors instead of fake approval until deployment happens.

## What is here

```
migrations/0001_init.sql          tables, enums, indexes, RLS, SQL functions
functions/pairing-api/index.ts    Deno Edge Function (all pairing routes)
config.toml                       verify_jwt = false (function does its own checks)
```

### Data model (`08` §2)

- `pairing_sessions` — challenge id, **hashed** short code, status, short TTL, TV public info, single-use approval, one-time token-delivery marker.
- `devices` — owner installation id, display name, **hashed** device credential, last seen, revocation.
- `pairing_rate_limits` — sliding-window counters for create / lookup / approve / reject.

RLS is enabled with **no public policies**. Only the service-role Edge Function touches the tables.

## Deploy

```bash
supabase link --project-ref <new-ref>
supabase db push

supabase secrets set --project-ref <new-ref> \
  PAIRING_CODE_SECRET=<32-byte-random> \
  PAIRING_CLIENT_KEY=<32-byte-random>

supabase functions deploy pairing-api --project-ref <new-ref> --no-verify-jwt
```

Then set the client env (`.env`, gitignored):

```
EXPO_PUBLIC_SUPABASE_URL=https://<new-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
EXPO_PUBLIC_PAIRING_CLIENT_KEY=<same-as-PAIRING_CLIENT_KEY>
```

The app calls:

```
POST   {SUPABASE_URL}/functions/v1/pairing-api/sessions
POST   {SUPABASE_URL}/functions/v1/pairing-api/sessions/lookup
GET    {SUPABASE_URL}/functions/v1/pairing-api/sessions/{challengeId}
POST   {SUPABASE_URL}/functions/v1/pairing-api/sessions/{challengeId}/approve
POST   {SUPABASE_URL}/functions/v1/pairing-api/sessions/{challengeId}/reject
GET    {SUPABASE_URL}/functions/v1/pairing-api/devices
DELETE {SUPABASE_URL}/functions/v1/pairing-api/devices/{deviceId}
POST   {SUPABASE_URL}/functions/v1/pairing-api/devices/heartbeat
GET    {SUPABASE_URL}/functions/v1/pairing-api/health
```

## Security properties

| Requirement | Implementation |
|---|---|
| Challenge entropy | UUID v4 + 6-char code from a 32-char unambiguous alphabet |
| Short code storage | HMAC-SHA256 with server-only `PAIRING_CODE_SECRET`; never plaintext |
| QR payload | `hallyu-stream://pair?c=<challengeId>` — no token, no password, no media URL |
| TTL | 10 minutes; pending rows are expired on create/status read |
| Single use | `approve_pairing_session` locks the row and only transitions `pending → approved` |
| Replay | `claim_device_token` returns the TV credential once; revoked code hashes cannot be reused |
| Rate limit | create 5/IP/10min; lookup/approve/reject 10/installation/10min |
| Explicit approval | Phone must POST `/approve` with its installation id; TV never self-approves |
| Owner scoping | devices filter by `owner_installation_id`; revoke checks the owner |
| Revocation | `revoked_at` set; TV heartbeat returns 401 `revoked`, TV returns to Activation |
| Credentials | TV device token is derived by HMAC, stored only as a hash in DB, kept in secure storage on device |
| Transport | HTTPS via Supabase; no cleartext media accepted (`09` §2) |
| No fake success | Both clients only show `approved` after this API confirms it |

## Explicitly absent

- No `/media/proxy`, no `GET ?url=`, no CDN fetch inside the function.
- No Supabase Storage bucket for titles.
- No progress/watchlist sync yet (optional future phase, metadata-only JSON).
