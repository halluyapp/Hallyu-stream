# 09 — Security and Privacy

**Version:** 1.0  

## 1. Security goals

- Protect pairing from guessing, replay, and session fixation.  
- Keep device credentials out of logs and QR payloads.  
- Minimise personal data.  
- Prevent our infrastructure from becoming an open media proxy.

## 2. Client rules

- No permanent provider secrets in the app binary if avoidable.  
- Use platform **secure storage** for TV/mobile pairing credentials.  
- Do not log full signed media URLs or tokens in production.  
- Request **camera** only for QR; **storage** only for downloads — explain in UI.  
- Validate HTTPS URLs before send-to-player; reject cleartext media.

## 3. Pairing rules

See `07-PAIRING_SERVICE.md`. Summary:

- Short-lived challenges  
- Rate-limited approve/create  
- Explicit user approval on phone  
- Revocation path required  

## 4. Backend rules

- HTTPS everywhere  
- Authenticate approve/revoke  
- Authorisation: users only see their devices  
- No endpoint that fetches arbitrary URLs and streams body to caller  

## 5. Privacy

- Prefer local-first library without forced account  
- If analytics exist: minimise, no media URL exfiltration  
- About screen: truthful product description — do not claim official Moviebox ownership or partnership unless a real contract exists  

## 6. Permissions matrix (mobile)

| Permission | Why |
|------------|-----|
| Internet | Catalogue + CDN + pairing API |
| Camera | QR scan only |
| Notifications | Download progress (optional stage) |
| Storage / media | Offline files |

## 7. Related

- Backend: `06-BACKEND_OVERVIEW.md`
- Pairing: `07-PAIRING_SERVICE.md`
