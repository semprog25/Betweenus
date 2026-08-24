# PHASE 0 AUDIT — Between Us (2026-08-24)

## 1. CURRENT WEBSITE ARCHITECTURE
- Repo: `semprog25/betweenus_landing` → `/Users/sharanestone/Semprog/betweenus_landing`
- Stack: static `index.html` + identical `404.html` (GitHub Pages SPA fallback)
- Domain: `CNAME` = `betweenus.fun` (website owns domain; app must not reclaim)
- No build, no CI; deploy = push to `main`
- Dead weight: unused `.tsx` files (not served)

## 2. CURRENT APP ARCHITECTURE
- Repo: this workspace `Betweenus-main` (`semprog25/Betweenus`)
- Vite + React + Capacitor 8 (`com.betweenus.app`)
- Tabs (no router): Discover / Share / Community / Check-in / Profile
- Edge Function client via `src/utils/api.tsx`

## 3. CURRENT SUPABASE ARCHITECTURE
- Project: `qoqbdiixztolvtcjdnle`
- Edge Function: `make-server-6c9b0e48` (Hono)
- KV: `kv_store_6c9b0e48` (RLS service_role)
- Storage: `post-images` (public read, service_role write after hardening)

## 4–7. AUTHENTICATION
| Provider | Status |
|---|---|
| Email | Works via Edge `/auth/signup` `/auth/signin` |
| Google | Supabase OAuth; web redirect; native completion broken (no `appUrlOpen`) |
| Apple | Code present; **Apple Developer Console still external blocker**; non-iOS shows Coming Soon in app |

Session keys: `between_us_session`, `between_us_user` (localStorage).

## 8. WEB/APP ROUTING
- Website: `/`, `/privacy`, `/terms`, `/support`, `/story/:id`, **(+ Phase 1 `/journal`)**
- App: in-memory tabs only; no `/story` client route

## 9. UNIVERSAL / APP LINKS
- **Not configured** (no AASA, no assetlinks, no Associated Domains, no Android intent filters)

## 10–12. STORY / FEED / REACTIONS
- Create: ShareTab (not branded Spill yet)
- Feed: Discover + Community; sorts trending/newest/controversial/random
- Votes + replies exist; **Me Too does not exist**

## 13–14. MODERATION / NSFW
- Reports + trusted spam flags
- NSFW = category label only; **no blur / server classification**

## 15. JOURNAL
- Personal private journal in Check-in (exists)
- Editorial Between Us Journal: **Phase 1 entry page only**; full CMS = Phase 4

## 16. SEADAYS REUSE
- Engine: `seadays-landing` `scripts/generateBlogs.js`
- CMS patterns: `Seadays-main` article types + publisher gates
- Reuse architecture (slugs, JSON-LD, sitemap, static gen) — not branding

## 17–19. SEO / ADS / ANALYTICS
- Website: basic meta; GitHub Pages 404-SPA SEO limitation remains
- Ads: AdMob test IDs in app; manifests incomplete
- Analytics: **none implemented**

## 20. SECURITY BASELINE
- See `SECURITY_AUDIT_REPORT.md` — critical/high fixed; 16/16 tests
- Uncommitted hardening still in app working tree

## 21. RESIDUAL RISKS
- RevenueCat webhook missing (HIGH)
- KV full-scan feed (HIGH)
- In-memory rate limits, localStorage tokens, CSP/HSTS on Pages, anon ID guessability, email auto-confirm, shared project buckets, Apple Console

## 22–23. FILES / REPOS BY CHANGE
| Change | Repo | Files |
|---|---|---|
| Phase 1 hero/auth/journal | landing | `index.html`, `404.html`, `sitemap.xml` |
| Phase 2 native OAuth/links | app | `auth.tsx`, `App.tsx`, iOS entitlements, AndroidManifest |
| Phase 3 Me Too / Spill / NSFW | app + edge | ShareTab, CommunityTab, `security.tsx`, edge index |
| Phase 4 Journal CMS | landing + edge + app | new editorial schema, generator, app Journal screen |

## 24. IMPLEMENTATION ORDER
0 Audit ✓ → 1 Website hero/auth/journal entry → 2 Cross-platform auth → 3 Social core → 4 Journal CMS → 5 Discovery → 6 Growth → 7 Connection → 8 Monetization
