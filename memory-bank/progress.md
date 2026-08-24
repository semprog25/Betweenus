# Progress

## Done
- Security hardening pass (2026-08-24) — critical/high authz holes fixed; 16/16 boundary tests
- Public website LIVE feed + `/story/:id` via Edge `GET /posts` and `GET /posts/:id`
- Domain ownership fixed: landing owns `betweenus.fun`

## In progress
- Deploy Phase 1 landing changes to betweenus.fun (push `betweenus_landing`)

## Done this session
- Phase 0 full audit documented in `memory-bank/PHASE0_AUDIT.md`
- Phase 1 website: hero brand, story stack, auth panel, `/journal`, mobile nav, features copy

## Not started (by phase)
- P2 Auth cross-platform (native OAuth completion, Universal Links)
- P3 Social core (Spill rename, Me Too, NSFW blur server classification)
- P4 Editorial Journal CMS + SeaDays-style static generation
- P5 Discovery (The Tea surface, People Who Get It)
- P6 Growth SEO / sharing / notifications
- P7 Anonymous conversations (after moderation proven)
- P8 Monetization (RevenueCat webhook, Journal ads)

## Residual security risks (unchanged)
See `SECURITY_AUDIT_REPORT.md` §10 — RevenueCat webhook, KV full-scan feed, in-memory rate limits, localStorage tokens, Apple Console, etc.
