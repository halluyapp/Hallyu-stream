# Streaming Platform — Company Architecture Pack

**Version:** 1.0  
**Status:** Active  
**Scope:** Standalone mobile + Android TV streaming product  

This pack is the **source of truth** for product architecture. Engineers and coding agents must implement against these documents. Do not treat chat history as architecture.

## Reading order

1. `docs/architecture/01-SYSTEM_ARCHITECTURE.md`
2. `docs/architecture/02-INTEGRATIONS_CATALOGUE.md`
3. `docs/architecture/05-PLAYBACK_AND_OFFLINE.md`
4. `docs/architecture/03-CLIENT_MOBILE.md` + `04-CLIENT_ANDROID_TV.md`
5. `docs/architecture/06-BACKEND_OVERVIEW.md` → `07-PAIRING_SERVICE.md` → `08-DATA_AND_APIS.md`
6. `docs/architecture/09-SECURITY_AND_PRIVACY.md`
7. `docs/architecture/10-NFR_AND_TESTING.md`
8. `docs/architecture/11-DELIVERY_AND_OPS.md`
9. `docs/adr/*` (decision records)

## Product in one line

Standalone streaming app (not a social network): catalogue and stream metadata from zarhosting; **video bytes only on the user device** from the media CDN; Android phone + Android TV; QR phone-to-TV pairing via a **signalling** backend only.

## Hard rules (summary)

| Must | Must not |
|------|----------|
| Resolve stream JSON in the app | Proxy video through our backend / Supabase / Megan |
| Play and download on device | Treat signed CDN URLs as permanent IDs |
| Send configured Referer/Origin when player supports it | Build TV as a stretched phone layout |
| Re-resolve stream on expiry/failure | Ship fake pairing or mock playback as success |
| Pairing backend for QR/devices only | Put media URLs or long-lived secrets in QR codes |

## Pack contents

- 11 architecture standards  
- 2 architecture decision records (ADRs)  
- This README  

## Out of scope for this product

- Social feeds, comments, follows, creator tools  
- Web-only product replacing native Android apps  
- Megan stream/proxy as a dependency  
