# Between Us — Project Brief

## Product
Anonymous social/gossip/story platform. Core message: **Say what you can't say anywhere else.**

## Repositories (do not mix responsibilities)
| Repo | Owns |
|---|---|
| `semprog25/betweenus_landing` | Public website `betweenus.fun` — discovery, SEO, Journal, acquisition |
| `semprog25/Betweenus` (this repo) | Native app `com.betweenus.app` — community, Spill, reactions, activity |
| Shared Supabase `qoqbdiixztolvtcjdnle` | Auth, data, Edge Function `make-server-6c9b0e48`, authorization |

## Non-negotiables
- Do not rebuild from scratch
- Do not reclaim `betweenus.fun` for the app (no CNAME, no root→app redirect)
- One Supabase Auth identity across Web / iOS / Android
- Identity + privileges derived server-side only
- Security baseline in `SECURITY_AUDIT_REPORT.md` is protected infrastructure
- Journal = Between Us team editorial only (not personal check-in journal)
