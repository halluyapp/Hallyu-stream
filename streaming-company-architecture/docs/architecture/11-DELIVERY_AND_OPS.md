# 11 — Delivery Standard and Operations

**Version:** 1.0  

## 1. Delivery phases

| Phase | Outcome |
|-------|---------|
| 0 | Repo audit, provider smoke, TV feasibility, risks |
| 1 | Brand/tokens/motion direction confirmed |
| 2 | Full mobile + TV screen blueprints |
| 3 | App shells, nav, design system, storage |
| 4 | zarhosting client + home/search/detail |
| 5 | Playback mobile + TV + captions + resume |
| 6 | Library + downloads + offline |
| 7 | Pairing backend + QR + revoke |
| 8 | Motion polish + performance pass |
| 9 | QA matrix + release builds |

Do not skip design foundations for a hollow demo.

## 2. Definition of done

A feature is done only when:

1. Implemented against this architecture pack  
2. Exercised on relevant **real** behaviour (live API / device)  
3. Error paths exist  
4. No fake success UI  

## 3. Environments

| Env | Use |
|-----|-----|
| Local | Client + local storage; pairing against dev backend |
| Staging | Pairing API + clients; live or sandbox provider |
| Production | Hardened pairing; production provider endpoints |

Media always from provider CDN to device — no “staging media proxy.”

## 4. Operations

- Monitor pairing success/fail rates and API errors  
- Do not build video QoE pipelines that require our servers to fetch CDN video  
- Document provider base URL and header config for on-call  

## 5. Reporting (agents and humans)

After each phase:

1. Completed work  
2. Decisions  
3. Files changed  
4. Commands/tests run  
5. Failures  
6. Blockers  
7. Next phase  

Separate **verified** from **assumed**.

## 6. Explicit non-goals in delivery

- Hallyu social integration  
- Megan dependency  
- Server video proxy “to fix CDN”  
- Fake pairing  
- Placeholder catalogue in release builds  
