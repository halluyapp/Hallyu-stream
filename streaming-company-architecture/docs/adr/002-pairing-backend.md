# ADR 002 — Minimal Pairing Backend (Signalling Only)

**Status:** Accepted  
**Date:** 2026-11-02  

## Context

Android TV requires a comfortable first-run authorisation model. QR + short code from the TV, approval on the phone, is the chosen UX. Two devices cannot complete secure pairing with local-only state alone.

## Decision

- Introduce a **minimal backend** responsible for pairing sessions, approval, device registry, and revocation.  
- Optionally extend later with accounts and metadata sync (progress/watchlist).  
- **Never** extend this backend into a media proxy or CDN cache for titles.

## Consequences

- TV and mobile clients depend on HTTPS pairing APIs for activation.  
- Security controls (TTL, rate limit, single-use challenges, secure device credentials) are mandatory.  
- Infrastructure cost and ops focus on pairing availability, not video throughput.  
- Product can still browse/play on mobile without TV pairing.
