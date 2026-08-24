# Between Us — Production Readiness Report

**Date:** 2026-08-24  
**Target domain:** https://betweenus.fun  
**Supabase project:** qoqbdiixztolvtcjdnle  

---

## Executive Summary

Repository-side production hardening is **complete and verified locally**. The Supabase Edge Function was **deployed** with critical security fixes. **https://betweenus.fun is not live yet** (DNS/domain not resolving from this environment). Google/Apple OAuth and GitHub Pages deployment require **manual console steps** documented in `PRODUCTION_DEPLOYMENT.md`.

**Not production-ready until:** domain DNS + GitHub Pages deploy + OAuth consoles configured + mobile release builds verified.

---

## Infrastructure

| Item | Status | Notes |
|------|--------|-------|
| Domain `betweenus.fun` | **NOT LIVE** | HTTP requests return connection failure (no DNS/hosting yet) |
| GitHub Pages workflow | **CONFIGURED** | `.github/workflows/deploy-pages.yml` — needs repo push + `VITE_SUPABASE_ANON_KEY` secret |
| CNAME | **READY** | `public/CNAME` → `betweenus.fun` (copied to `dist/` on build) |
| HTTPS | **PENDING** | Enabled automatically by GitHub Pages after DNS |
| SPA 404 fallback | **READY** | `public/404.html` |
| SEO | **UPDATED** | canonical, OG, Twitter, robots.txt, sitemap.xml |

**DNS required (registrar):**
- Apex `A` → GitHub Pages IPs (see `PRODUCTION_DEPLOYMENT.md`)
- `www` CNAME → `<username>.github.io` with redirect to apex

---

## Authentication

| Platform | Status | Notes |
|----------|--------|-------|
| Supabase email/password | **WORKING** | Via Edge Function; verified health endpoint |
| Google OAuth (web) | **NEEDS CONFIG** | Code uses `getOAuthRedirectUrl()` → production origin; Supabase + Google Cloud must add `https://betweenus.fun` |
| Apple OAuth (iOS/web) | **NEEDS CONFIG** | AuthStep shows "coming soon" on web; Supabase Apple provider + Apple Developer setup required |
| Session handling | **IMPROVED** | API calls now send user JWT when logged in |
| OAuth redirects | **UPDATED IN CODE** | `src/config/site.ts`, `src/utils/auth.tsx` |

**Supabase Dashboard — set Site URL:** `https://betweenus.fun`  
**Redirect URLs:** `https://betweenus.fun/**`, `https://www.betweenus.fun/**`, localhost dev URLs

---

## Google Cloud

| Item | Status |
|------|--------|
| Project | **UNKNOWN** — must confirm in console (Between Us vs shared) |
| OAuth consent screen | **MANUAL** |
| Web client origins | **ADD** `https://betweenus.fun`, `https://www.betweenus.fun` |
| Redirect URI | `https://qoqbdiixztolvtcjdnle.supabase.co/auth/v1/callback` |
| Android client | **MANUAL** — package `com.betweenus.app`, Play signing SHA-1/256 |
| iOS client | **MANUAL** — bundle `com.betweenus.app` when iOS added |

See `src/GOOGLE_OAUTH_403_FIX.md` (update localhost-only refs to include betweenus.fun).

---

## Firebase

| Item | Status |
|------|--------|
| Required by app | **NO** — app uses Supabase Auth + Edge Functions + KV store |
| Integration in code | **NONE** (guide only: `src/FIREBASE_INTEGRATION_GUIDE.md`) |
| Action | **Do not create** unless adding Firebase-specific features |

---

## Supabase

| Item | Status | Notes |
|------|--------|-------|
| Project | **ACTIVE** | `qoqbdiixztolvtcjdnle`, EU Central |
| Edge Function | **DEPLOYED** | `make-server-6c9b0e48` — security hardening live |
| KV table RLS | **APPLIED** | `kv_store_6c9b0e48` — service_role only (migration applied via CLI) |
| Storage | **PUBLIC READ** | `post-images` bucket — uploads via authenticated Edge Function |
| Secrets set | **PARTIAL** | `BETWEENUS_ENV=production` set; `BETWEENUS_ADMIN_SECRET` **not set** (admin routes disabled) |

### Security fixes deployed

- CORS restricted to allowed origins (not `*`)
- **Waitlist export** blocked (was leaking emails — **CRITICAL**, fixed)
- **Admin endpoints** require `X-Admin-Secret` (disabled until secret set)
- **Subscription upgrade/credits** require auth + blocked in production (`PAYMENT_REQUIRED`)
- **Check-ins/journal** scoped to authenticated user
- **Post delete** requires auth + ownership
- **Seeding/vote manipulation** endpoints admin-only

### Remaining Supabase manual steps

1. Set `BETWEENUS_ADMIN_SECRET` in Edge Function secrets (generate strong random value)
2. Configure Auth URL settings for `betweenus.fun`
3. Enable/configure Google + Apple providers
4. Confirm Storage policies for `post-images`

---

## Android

| Item | Value |
|------|-------|
| Package ID | `com.betweenus.app` |
| Play Console | **Existing app** — ID preserved, not changed |
| Local project | Present (gitignored) |
| google-services.json | **Not present** — push notifications optional |
| Release build | **NOT VERIFIED** in this session (requires Android Studio + signing) |
| RevenueCat keys | **Placeholder** — configure via env, not source |

---

## iOS

| Item | Status |
|------|--------|
| Platform folder | **NOT GENERATED** — run `npm run cap:add:ios` |
| Bundle ID (planned) | `com.betweenus.app` |
| Sign in with Apple | **MANUAL** Apple Developer + Supabase |
| Release build | **NOT VERIFIED** |

---

## Security Issues

### CRITICAL (found → fixed in deployed Edge Function)

| Issue | Resolution |
|-------|------------|
| `/waitlist` GET exposed all subscriber emails publicly | Admin gate added; verified returns `{"error":"Admin endpoint disabled"}` |
| `/subscription/upgrade` allowed free premium/pro without payment | Auth required + `BETWEENUS_ENV=production` blocks direct upgrades |
| `/admin/clear-all-usernames` unauthenticated | Admin secret required |
| Global check-in/journal read exposed all users' private data | Scoped to authenticated `ownerId` |
| CORS `origin: *` | Restricted to allowlist |

### HIGH (partially addressed / manual)

| Issue | Status |
|-------|--------|
| `userId` spoofing on votes/replies (anonymous) | **MEDIUM risk** — votes still accept client `userId` without auth; mitigated for flag-spam/delete/subscription |
| `BETWEENUS_ADMIN_SECRET` not configured | Admin tools disabled (safe default) — **set before using admin tools** |
| Anon key in `info.tsx` fallback | **CLIENT-SAFE** — prefer `VITE_SUPABASE_ANON_KEY` in CI |
| npm high CVEs (hono, xmldom, etc.) | **OPEN** — run `npm audit fix`; hono is Edge runtime dep |

### MEDIUM / LOW

| Issue | Notes |
|-------|-------|
| Main JS bundle ~1.1MB | Code-splitting recommended |
| No automated tests | No test files in repo |
| Apple sign-in web button | Shows coming-soon dialog |
| RevenueCat | Placeholder keys |

---

## Testing

| Check | Result |
|-------|--------|
| `npm run build` | **PASS** |
| TypeScript (via Vite build) | **PASS** |
| Lint | **NOT CONFIGURED** |
| Unit / E2E tests | **NONE** |
| Edge Function health | **PASS** — `{"status":"ok"}` |
| Waitlist protection | **PASS** — no longer leaks emails |
| KV store anon write | **BLOCKED** — RLS policy |
| Domain live | **FAIL** — DNS not configured |

---

## UI/UX

- Single-page tab app (Share, Listen, Check-in, Community, Profile)
- Responsive layout with safe-area insets for mobile
- Dev-only Reset button now gated by `import.meta.env.DEV`
- No full visual regression run in this session

---

## Performance

| Metric | Value |
|--------|-------|
| JS bundle | ~1,107 KB (gzip ~310 KB) |
| CSS | ~166 KB (gzip ~20 KB) |
| Recommendation | Lazy-load tabs, split vendor chunks |

---

## Files Changed (summary)

- Production config: `src/config/site.ts`, `src/vite-env.d.ts`, `.env.example`
- GitHub Pages: `.github/workflows/deploy-pages.yml`, `public/CNAME`, `404.html`, SEO files
- Security: `src/supabase/functions/server/security.tsx`, hardened `index.tsx`
- Deploy: `supabase/functions/make-server-6c9b0e48/`, `supabase/config.toml`, migration SQL
- Docs: `PRODUCTION_DEPLOYMENT.md`, this report

---

## Final Success Criteria Checklist

| # | Criterion | Met? |
|---|-----------|------|
| 1 | betweenus.fun live | ❌ DNS/hosting pending |
| 2 | GitHub Pages deploys | ⚠️ Workflow ready, not pushed |
| 3 | HTTPS | ⚠️ After DNS + Pages |
| 4–7 | Auth / Google / Apple / Supabase redirects | ⚠️ Code ready, consoles pending |
| 8–10 | RLS / storage / RPC security | ✅ KV RLS + Edge Function deployed |
| 11 | No secrets in repo | ✅ (anon key is public by design; use env in CI) |
| 12–13 | Google Cloud / Firebase | ⚠️ Manual / N/A |
| 14–16 | Android/iOS config | ⚠️ Package ID preserved; builds not verified |
| 17 | Production builds | ✅ Web build |
| 18–19 | Features / UI | ⚠️ Not fully QA'd |
| 20–21 | No critical security bugs | ✅ Critical Edge issues fixed |
| 22 | Old domain refs removed | ✅ No github.io refs in app code |
| 23 | Dev/prod separation | ✅ `BETWEENUS_ENV=production`, dev reset hidden |
| 24 | Accurate report | ✅ |

---

## Immediate Next Steps (manual)

1. **Configure DNS** for `betweenus.fun` → GitHub Pages  
2. **Push to GitHub** and run Pages workflow; add `VITE_SUPABASE_ANON_KEY` secret  
3. **Supabase Auth URLs** + Google/Apple providers  
4. **Google Cloud OAuth** origins for betweenus.fun + Android SHA fingerprints  
5. **Set `BETWEENUS_ADMIN_SECRET`** if admin tools needed  
6. **Configure RevenueCat** for mobile payments  
7. **Run Android/iOS release builds** on devices and verify OAuth  

Detailed steps: **`PRODUCTION_DEPLOYMENT.md`**
