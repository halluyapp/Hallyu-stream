# HALLYU-STREAM — Pairing & Device Service

Minimal, **signalling-only** backend for phone ↔ Android TV pairing. It implements
architecture pack `06-BACKEND_OVERVIEW`, `07-PAIRING_SERVICE`, `08-DATA_AND_APIS`,
`09-SECURITY_AND_PRIVACY` and ADR 002.

> **Hard rule:** this service never accepts, proxies, caches, or transcodes media.
> There is no `/media` route. Video bytes always travel from the provider CDN to the
> viewing device (ADR 001). `/health` reports `mediaProxy: false`.

## Why it exists

Two devices cannot complete secure pairing with local state alone. This service
stores short-lived pairing challenges and a durable device registry. It does **not**
store catalogue data, playback progress, or media URLs.

## Run

```bash
cd backend
cp .env.example .env
npm install
npm test
npm start
# http://localhost:8787/health
```

Requires **Node 22.5+** (uses the built-in `node:sqlite`). No native build step.

### Docker

```bash
docker build -t hallyu-pairing .
docker run -p 8787:8787 \
  -e TOKEN_PEPPER="$(openssl rand -base64 48)" \
  -v hallyu-pairing-data:/data \
  hallyu-pairing
```

## API

All bodies are JSON. Times are ISO-8601 UTC. Errors are `{ "error": code, "message": human }`.

| Method | Path | Actor | Purpose |
|---|---|---|---|
| GET | `/health` | any | Liveness + `mediaProxy:false` |
| POST | `/auth/device` | phone | Create an anonymous phone identity → bearer token (shown once) |
| POST | `/pairing/sessions` | TV | Create challenge → `challengeId`, `shortCode`, `expiresAt`, `qrPayload`, `pollToken` |
| GET | `/pairing/sessions/:id` | phone | Public session view (device name, status, expiry) — no secrets |
| GET | `/pairing/sessions/:id/status` | TV | Poll status. Requires `X-Poll-Token`. Delivers `deviceToken` once on approval |
| POST | `/pairing/lookup` | phone | Resolve a 6-character short code → public session |
| POST | `/pairing/sessions/:id/approve` | phone (Bearer) | Explicit, single-use approval; binds a device |
| POST | `/pairing/sessions/:id/reject` | phone (Bearer) | Decline; consumes the challenge |
| GET | `/devices` | phone (Bearer) | List this user's paired devices |
| DELETE | `/devices/:id` | phone (Bearer) | Revoke a device |
| POST | `/devices/heartbeat` | TV (`X-Device-Token`) | Prove a device credential is still valid |

### Example

```bash
# 1. TV creates a challenge
curl -s -X POST localhost:8787/pairing/sessions \
  -H 'content-type: application/json' \
  -d '{"deviceName":"Living Room TV","deviceModel":"Chromecast HD"}'

# 2. Phone creates an identity (store the token in secure storage)
curl -s -X POST localhost:8787/auth/device \
  -H 'content-type: application/json' -d '{"displayName":"Pixel"}'

# 3. Phone approves the challenge it scanned
curl -s -X POST localhost:8787/pairing/sessions/<challengeId>/approve \
  -H "authorization: Bearer <phoneToken>"

# 4. TV polls with its poll token and receives its device credential once
curl -s localhost:8787/pairing/sessions/<challengeId>/status \
  -H "x-poll-token: <pollToken>"
```

## Security properties

- **Challenge entropy:** 24 random bytes (base64url) for the id; 6-character short code
  from an unambiguous alphabet (no 0/O/1/I/L).
- **Hashed at rest:** short codes, poll tokens, phone tokens and device credentials are
  HMAC-SHA256 hashed with `TOKEN_PEPPER`. Plaintext is never persisted except the
  one-time device credential held only until the TV polls (then wiped).
- **TTL:** challenges expire after `PAIRING_TTL_SECONDS` (default 600s). Expiry is
  enforced lazily on read and by a cleanup interval.
- **Single use:** approval/rejection transitions `pending` exactly once; rejected and
  expired codes cannot be looked up or approved.
- **Explicit consent:** approval requires an authenticated phone token. There is no
  auto-approve and no optimistic "paired" state.
- **Binding:** approval matches the exact pending session; the device row records
  `pairing_session_id`.
- **Revocation:** `DELETE /devices/:id` is scoped to the owning user; revoked
  credentials fail heartbeat immediately.
- **Rate limits:** create (12/min/IP), lookup (20/min/IP), approve (30/min/IP),
  auth (20/min/IP), global (240/min/IP).
- **QR payload:** `hallyustream://pair?challenge=<id>` only. No tokens, no media,
  no account details.
- **Transport:** HTTPS is expected in production (terminate TLS at the proxy).
- **No media proxy:** structurally impossible — no route fetches arbitrary URLs.

## Data model

`users`, `user_tokens`, `pairing_sessions`, `devices` with versioned migrations in
`src/db.js`. SQLite runs in WAL mode with foreign keys on.

## Operational notes

- Set `TOKEN_PEPPER` in production; the process refuses to boot with the dev default
  when `NODE_ENV=production`.
- Mount `/data` on a persistent volume.
- Monitor `/health` and pairing success/failure rates. Do **not** build video QoE
  pipelines that require this service to fetch CDN bytes.
- Rotating `TOKEN_PEPPER` invalidates all tokens and device credentials (devices must
  re-pair). Plan rotations accordingly.
