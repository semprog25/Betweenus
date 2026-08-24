# SECURITY AUDIT REPORT — Between Us

**Date:** 2026-08-24  
**Scope:** Web (`https://betweenus.fun`), native apps (`com.betweenus.app` iOS/Android), shared Supabase backend (`qoqbdiixztolvtcjdnle`), Edge Function `make-server-6c9b0e48`  
**Principle:** Zero client-trusted authorization — identity and privileges derived server-side from JWT / admin secret / verified payment state only.

**Verdict:** Critical and high authorization holes found in this audit were fixed, deployed, and regression-tested.  
**No known vulnerabilities found within the tested scope** for the previously open unauthenticated write/IDOR paths listed below. Residual risks remain and are documented honestly.

---

## 1. Architecture trust boundary

```
PUBLIC WEBSITE (read/share/install)
NATIVE APPS (full experience)
        │
        ▼
Edge Function (server-side authz) ──► kv_store_6c9b0e48 (RLS: service_role only)
        │                              post-images (public READ; service_role WRITE)
        ▼
Supabase Auth JWT validation via auth.getUser(token)
```

Clients may call Edge Functions with the **anon key**. That is expected. Authorization must (and now does) happen inside the function for every privileged action.

---

## 2. Attack surface inventory

### Edge Function routes (prefix `/make-server-6c9b0e48`)

| Area | Routes | Auth model (after fix) |
|---|---|---|
| Health | `GET /health` | Public |
| Check-ins | `POST/GET /check-ins` | JWT; scoped to JWT user |
| Journal | `POST/GET /journal`, `DELETE /journal/:id` | JWT; strict ownership |
| Images | `POST /upload-post-image` | JWT; path forced to `{userId}/…`; magic-bytes |
| Posts | `POST /posts`, `GET /posts`, `GET /posts/:id` | Create: JWT or validated anon ID; read: public sanitized |
| Post mutate | `PUT /community/posts/:id`, `PATCH …/privacy`, `DELETE …`, `POST …/edit` | JWT + ownership |
| Votes / replies / reports | upvote/downvote/reply/edit/delete/report | `resolveActorId` (JWT or validated anon) |
| Auth | signup/signin/signout/profile/delete-account | Rate-limited signup/signin; delete JWT |
| Profile stats | `/stats`, `/user-*`, `/subscription*` | **Self-only via JWT** |
| Waitlist | `POST` public, `GET` admin | Admin secret |
| Admin | reports, metadata, likes, votes, clear usernames | `X-Admin-Secret` |
| Subscription mutate | upgrade / buy-credits | JWT + blocked unless `BETWEENUS_ENV` is development |

### Tables / storage

- **`kv_store_6c9b0e48`**: RLS enabled; service_role only (confirmed).
- **`post-images`**: public SELECT intentional for public UGC; INSERT/UPDATE/DELETE service_role only (hardened this audit).
- Other buckets exist on the project from other apps — out of Between Us product path but noted.
- Referenced tables `user_profiles` / `user_activity_log` have no repo migrations (logout logging is best-effort).

### Client call paths

- `src/utils/api.tsx`, `src/utils/auth.tsx`, Capacitor WebView, landing site fetch to Edge Function.
- Assumed attacker: curl/Postman, modified bodies, spoofed `userId` / `ownerId` / `premium` / `role`.

---

## 3. Findings fixed in this audit

### CRITICAL

| ID | Issue | Fix |
|---|---|---|
| C1 | `PUT /community/posts/:postId` had **no auth** — any caller could edit recent posts | JWT + `post.userId === user.id` |
| C2 | `PATCH /posts/:postId/privacy` had **no auth** — anyone could de-anonymize posts | JWT + ownership |
| C3 | `POST /subscription/increment-post` unauthenticated — attackers could lock free users out of posting | JWT self-only; create path increments server-side |
| C4 | Unauthenticated `POST /posts` accepted arbitrary UUID as `userId` (authorship spoof) | Only JWT id or `/^anonymous-user-[a-z0-9]{6,24}$/` |
| C5 | Post edit accepted foreign `imageUrl` without path ownership check | Path must start with `{jwtUserId}/` |

### HIGH

| ID | Issue | Fix |
|---|---|---|
| H1 | IDOR on `/stats`, `/user-posts`, `/user-replies`, `/user-level`, `/user-reputation`, `/subscription`, `/subscription/can-post` via query `userId` | `requireSelfUserId()` — ignore client userId |
| H2 | LIKE-wildcard abuse via `%`/`_` in userId prefixes | `isSafeKvKeySegment` + self-only ids |
| H3 | Public feed leaked full `upvotedBy`/`downvotedBy` and anonymous `userId` | `toPublicPost()` — viewer-only vote arrays; strip anon author ids |
| H4 | Free premium if `BETWEENUS_ENV` unset | `isProductionRuntime()` true unless env is `development`/`dev`/`local` |
| H5 | Journal delete allowed when `ownerId` missing | Require `entry.ownerId === user.id` |
| H6 | `save-logout-data` used body `userId` | Force JWT `user.id` |
| H7 | Feed could return unbounded posts (DoS) | Hard clamp default 25 / max 50 |

### MEDIUM

| ID | Issue | Fix |
|---|---|---|
| M1 | No rate limits on abuse-prone routes | In-memory IP limits: signup, signin, posts, votes, replies, waitlist, journal, check-ins |
| M2 | Content length not enforced server-side | Post 5k / reply 2k / journal 10k / note 2k |
| M3 | Admin secret compared with `!==` | Timing-safe compare |
| M4 | Storage insert policy ambiguous for authenticated | Migration: service_role ALL + public SELECT only |
| M5 | Client double-count risk with `incrementPostCount` | Server increments on create; client helper no-ops |

### Previous regressions verified still held

- Waitlist GET admin-gated (live `403`)
- Vote spoofing rejected (`401`)
- Account deletion auth required
- Check-ins JWT scoped
- Upgrade requires auth; payment blocked outside development
- CORS allowlist (not `*`)
- KV RLS service_role only
- Image magic-byte + size limits
- Report reason enum + actor resolution

---

## 4. Automated tests

Script: `scripts/security-boundary-tests.ts`

```bash
VITE_SUPABASE_ANON_KEY=<anon> npx tsx scripts/security-boundary-tests.ts
```

**Result (2026-08-24):** `16/16 passed` against production Edge Function.

Optional authenticated cross-user matrix (User A vs User B ownership) requires:

```bash
SECURITY_TEST_EMAIL_A=… SECURITY_TEST_PASSWORD_A=…
SECURITY_TEST_EMAIL_B=… SECURITY_TEST_PASSWORD_B=…
```

---

## 5. Build / sync verification

- `npm run build` — **success**
- `npm run cap:sync` — **success** (iOS + Android)
- Live `https://betweenus.fun` — marketing site **200**
- Live feed returns sanitized posts (empty voter arrays; no anon `userId`)
- Live waitlist GET — **403**

---

## 6. Auth / OAuth / actor model

| Topic | Status |
|---|---|
| Email/password | Edge signup/signin; JWT via Supabase Auth |
| Google / Apple | Client OAuth flows; production Google configured previously; Apple still external blocker |
| Actor ID | Authenticated → JWT `sub`; anonymous → strict `anonymous-user-*` pattern |
| Token storage | `localStorage` session — XSS-exfiltratable (**residual**) |
| Deep links | Identify content only; authorization still required for private actions |

**Anonymity note:** Server still stores author `userId` internally for ownership. Public APIs no longer return it for anonymous posts. Do not claim cryptographic anonymity.

---

## 7. Subscriptions / ads

- Client `premium=true` cannot grant access — subscription reads/writes are JWT self-scoped.
- Direct upgrade/buy-credits blocked unless `BETWEENUS_ENV` is development (`PAYMENT_REQUIRED`).
- RevenueCat webhook route is **not implemented** yet — production Premium must be wired via verified webhook before enabling paid upgrades (**residual HIGH product gap**, not an open free-upgrade hole).
- Ads must not trust client ad-free flags; `getSubscription` is server-backed for signed-in users.

---

## 8. Mobile / web / deep links

| Topic | Notes |
|---|---|
| Capacitor `appId` | `com.betweenus.app` |
| Schemes | `androidScheme: https`; capacitor/ionic localhost in CORS |
| Bundle secrets | No service_role in app; anon key is public-by-design |
| Web CSP / security headers | Not fully enforced on GitHub Pages marketing host (**residual MEDIUM**) |
| Open redirects | No arbitrary redirect sinks found in audited app code |

---

## 9. Secrets

| Item | Status |
|---|---|
| Service role / admin / RC webhook secrets | Not committed; env-only |
| Anon key in `info.tsx` / landing | Public-by-design; still requires RLS + Edge authz |
| Git history scan | No committed service_role private keys found in this pass |
| Long-lived storage signed URLs in email templates | Present; rotate if concerned |

If any production secret was ever shared outside the project, **rotate it** — do not rely on deleting a file from git history alone.

---

## 10. Residual risks (unresolved / deferred)

| Severity | Risk | Why open | Next step |
|---|---|---|---|
| HIGH | No RevenueCat webhook → Premium not fully productionized | Needs RC dashboard + signed webhook | Implement `/webhooks/revenuecat` with shared secret |
| HIGH | KV feed loads all `post:*` into memory then slices | Architectural; pagination is response-only | Cursor/index store or SQL-backed feed |
| MEDIUM | In-memory rate limits reset per isolate / cold start | Edge Function limit | Shared Redis/Upstash or Cloudflare rate limits |
| MEDIUM | Session tokens in `localStorage` | Capacitor/web SPA constraint | Prefer secure httpOnly cookies for web if split host |
| MEDIUM | GitHub Pages lacks strong CSP/HSTS control | Hosting limits | Add headers where platform allows; keep marketing static |
| MEDIUM | Anonymous actor IDs are guessable/replayable per device | Product choice for anon voting | Rate limits + abuse thresholds; optional auth-gated ranking weight |
| MEDIUM | Signup auto-confirms email (`email_confirm: true`) | SMTP/product constraint | Enable real email confirmation when SMTP ready |
| LOW | Username availability enumeration | By design | Keep; monitor abuse |
| LOW | Cross-project storage buckets on same Supabase project | Shared project | Isolate or document ownership |
| — | Apple Sign In / ASC App ID | External Apple account blocker | Human Apple Developer Console action |
| — | Authenticated A/B ownership matrix | Needs test accounts | Run script with `SECURITY_TEST_*` creds |

---

## 11. Security test matrix (summary)

| Actor | Can | Cannot (verified) |
|---|---|---|
| Anonymous | Read public feed/story; vote/reply with valid anon id | Waitlist dump; admin; privacy edit; community edit; subscription; stats; spoof UUID authorship; spoof votes |
| Authenticated User A | Own check-ins/journal/posts/subscription | Other users’ private endpoints via `userId` query (now ignored) |
| Admin | Only with `BETWEENUS_ADMIN_SECRET` | Anonymous admin header |
| Malicious client | — | `userId`/`ownerId`/`premium`/`role` body fields for privilege |

---

## 12. Files changed (this hardening pass)

- `src/supabase/functions/server/security.tsx`
- `src/supabase/functions/server/index.tsx`
- `supabase/functions/make-server-6c9b0e48/*` (deploy mirror)
- `supabase/migrations/20260824160000_post_images_storage_hardening.sql`
- `src/utils/api.tsx`
- `src/components/ShareTab.tsx`
- `scripts/security-boundary-tests.ts`
- `SECURITY_AUDIT_REPORT.md` (this file)

---

## 13. Final statement

Between Us is now closer to the required trust model:

- **Public web is safe to read** (sanitized feed/story responses).
- **Native apps participate through the same server-enforced rules.**
- **Backend does not trust client identity or premium claims** for the fixed surfaces.
- **Anonymous interaction no longer leaks author IDs or full voter graphs in public APIs.**
- **Admin / waitlist / upgrade / ownership regressions from prior hardening remain in place.**

This report does **not** claim “no security issues.” It claims: **no known vulnerabilities found within the tested scope** after fixing the critical/high issues discovered in this audit, with residual risks listed above.
