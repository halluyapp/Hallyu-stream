# 10 — Non-Functional Requirements and Testing

**Version:** 1.0  

## 1. Performance

- Usable on **low-memory** Android phones  
- Bounded image memory; appropriate poster sizes  
- Virtualised lists; lazy shelves  
- Fast player startup after stream JSON returns  
- No animation may block input  

## 2. Reliability

- Bounded retries on JSON and stream re-resolve  
- Clear offline mode behaviour  
- Downloads: no false “complete”  
- Pairing: safe failure states  

## 3. Accessibility

- Readable contrast on dark UI  
- TV focus always visible  
- Touch targets comfortable on mobile  
- Respect reduced motion where OS exposes it  

## 4. Device matrix (minimum)

| Target | Must verify |
|--------|-------------|
| Low-memory phone | Home, search, play, download foreground |
| Modern phone | Full mobile flows |
| Android TV / Google TV hardware or serious emulator | Focus, pairing UI, play |
| Slow network | Loading and recovery copy |
| Airplane mode | Offline file playback |

Do not claim hardware success from emulator-only runs when physical device is required (especially TV + downloads).

## 5. Acceptance checklist (excerpt)

### Catalogue

- [ ] Home from live `/home`  
- [ ] Search returns real hits with detailPath  
- [ ] Detail seasons map correctly  

### Playback

- [ ] Stream resolve returns sources for a test title  
- [ ] Play on physical phone  
- [ ] Play on TV client  
- [ ] Quality list matches API  
- [ ] Re-resolve after forced failure works  
- [ ] Progress survives restart  
- [ ] **No video bytes via our backend**  

### Captions

- [ ] Languages listed from provider  
- [ ] Toggle off works  
- [ ] Failure does not kill video  

### Downloads

- [ ] Progress reflects real bytes  
- [ ] Offline play in airplane mode  
- [ ] Resume only when Range verified  

### Pairing

- [ ] TV shows expiring QR/code  
- [ ] Phone approves explicit session  
- [ ] Revoke removes access  
- [ ] QR has no long-lived secret  

### UI

- [ ] Every control has a real action  
- [ ] TV remote completes core journeys  
- [ ] Empty/error/loading states exist  

## 6. Related

- Delivery phases: `11-DELIVERY_AND_OPS.md`
