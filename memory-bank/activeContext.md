# Active Context

## Web-only desktop responsiveness (2026-09-07)

- **Problem:** Authenticated web app felt like a phone frame — nested `max-w` (shell 48rem + tab `max-w-md`/`max-w-4xl`), Check-in locked to phone column, Community used native `pb-24` scroll nesting, EN missing `community.tabAll` (raw key in UI).
- **Fix (web-only):** `.bu-web-app` full-bleed shell; sidebar ≥900px; insights rail ≥1280px; readable `.bu-web-feed`/`.bu-web-form`/`.bu-web-profile` columns; `webShell` props on Community/Check-in/Share/Profile; EN `community.tabAll`; category chips wrap on web.
- **Native preserved:** `App.tsx` still routes Capacitor → `NativeAppContent` with `max-w-md` header/nav; tab defaults `webShell=false`.
- **Verified:** preview metrics 375–1920; iOS `xcodebuild` BUILD SUCCEEDED; Android `assembleDebug` BUILD SUCCESSFUL. No commit/push/deploy.


- Security: `npm run test:security` **37/37** (incl. cross-user ownership) using existing local anon + store-review + ephemeral B — no keys printed/committed.
- CORS: local Edge source now returns `null` for disallowed/missing Origin (no fallback to first allowlist). **Live Edge still old** until redeploy — evil Origin still reflected as `https://betweenus.fun`.
- Shared links: GH Pages `404.html` → `/?p=` now restored via `restoreGithubPagesSpaPath()` in `main.tsx` / `public-path.ts`; authenticated `/story/:id` stashes id sync + CommunityTab opens/scrolls shared story.
- Locales: es/zh/hi/de/fr nav + Spill/Stories/Check-in/hints aligned; FR “Messages” post-count → Publications.
- Do not commit/push/deploy until user authorizes. Deploy must include **Edge Function** (CORS) + **website** (shared-link restore + marketing).

## First-time UX + orientation (2026-09-06 night)

- **Problem:** Polished UI but “void” first visit — mobile `/app` interstitial was download-first with no product explanation; web skipped welcome and dumped into Home with equal Write/Check-in; Messages duplicated Stories; Activity ≠ Check-in naming.
- **Fixes (local, not deployed):** product-first mobile interstitial (Continue → Stories primary); web first-session lands on Stories; Home orientation card + Browse Stories primary CTA; Spill/Check-in labels; auth modal clarifies anonymity; Messages removed from sidebar; CORS no longer falls back to a foreign Origin; feed `Cache-Control` for anonymous reads.
- **Preserved:** all prior AdSense/marketing static pages, prerender, sitemap, robots, ads.txt.
- Do not commit/push/deploy until explicit authorization.

## AdSense + public SEO readiness (2026-09-06)

- **Root causes of “Low value content” (verified live):** homepage initial HTML was empty CSR shell; `/stories`, `/journey`, `/about` returned **HTTP 404** on GitHub Pages (SPA-only); legal pages were thin stubs; sitemap listed 404 routes; product is anonymous community — not a couples app (do not invent Love Notes / Date Planning pages).
- **Fix (local, not deployed):** static marketing HTML via `scripts/generate-public-marketing.cjs` → Features (6 real features), Guides (5 evergreen), Journey/About, Stories, enriched Privacy/Terms/Support/Download; homepage prerender in `index.html`; nav Features+Guides; robots disallow `/app` + `/story/`; sitemap expanded; AdSense ownership meta kept; ad slots still gated off.
- **Verify locally:** `npm run generate:marketing` + `npm run build` + `npm run preview` — public routes return **200** with unique titles/canonicals; `ads.txt` unchanged.
- **Deploy when authorized:** `scripts/deploy-web-to-landing.sh` then push `betweenus_landing` (not done).

## Community feed performance (2026-08-26)

- **Root cause:** `GET /posts` used `kv.getByPrefix("post:")` (full JSON for ~700 posts incl. replies) then sorted in Edge (~8–30s cold).
- **Fix:** Postgres RPCs `community_feed_ids` + `community_feed_stats` (applied on Between Us DB); Edge ranks via SQL, `mget`s page only, strips reply bodies from feed (`replyCount` only).
- **Default Stories feed:** Controversial; All/Trending/Newest/Discussed/All + Media/Text are targeted requests with per-feed cache keys + cursor pagination (`limit=15`).
- **Measured (warm, stats=0):** controversial ~0.5–2s, newest/all ~0.5–0.7s; replies preloaded = 0. Normal feed no longer uses `getByPrefix("post:")`.
- Migration file: `supabase/migrations/20260826140000_community_feed_rpc.sql` (applied via `db query` due to migration history skew).

## Community MVP restore under Stories (2026-08-26)

- **Regression cause:** polish pass mapped Stories → `DiscoverTab` and only mounted full `CommunityTab` for web **Saved**
- **Fix:** Stories (`discover` tab / web `stories`) mounts full `CommunityTab` again (All Posts | Saved, filters, search, categories, stats, posts)
- **Home** stays `HomeTab` overview (Write / Check-in / What’s happening / Journey) — not the Community feed
- **Saved** remains a filter inside Community (+ desktop sidebar shortcut); **not** bottom-nav
- Bottom nav still exactly 5: Home | Stories | Write | Activity | Profile
- Perf: cold `/posts` Edge `getByPrefix("post:")` is the bottleneck (~8–30s measured); client TTL cache + `limit=25` + no staggered card motion + deferred reputation make remounts/shell fast; server feed index not changed
- DiscoverTab remains in repo but unwired from main Stories nav

## Onboarding simplification (2026-08-25)

- **Goal:** get users into the app fast; teach features contextually
- **Native setup (`Onboarding.tsx`):** Language → Name → Auth (removed 5 feature slides)
- **Native welcome (`Tutorial.tsx`):** one Welcome screen + optional ≤3-step “How it works”; primary CTA enters app
- **State:** keep `hasCompletedOnboarding` / `hasCompletedTutorial`; add `between_us_onboarding_experience_v`, `between_us_hints_seeded`, `between_us_hint_dismissed_*` via `src/utils/onboarding-state.ts`
- **Migration:** users with existing `hasCompletedTutorial=true` → `hints_seeded=legacy` (no re-welcome, no coach marks)
- **Contextual hints:** Discover / Write / Check-in / Community first visit; dismissible; web + native
- **Web:** still skips welcome carousel; keeps sidebar shell; hints only for non-legacy installs
- **i18n:** filled missing EN `tutorial.levels.*` + `tutorial.back`; added `welcome.*` / `hint.*` in all 6 locales; `t()` accepts optional fallback
- **Verify:** `node scripts/test-onboarding-state.mjs` OK; migration scenarios OK; `npm run build` OK; preview `/` = public marketing site (no mobile onboarding)
- **Release-blocker pass (2026-08-25):** iOS `GADApplicationIdentifier` added to `Info.plist` (Google sample App ID matching `capacitor.config.ts` / `ADMOB_TEST.iosAppId`); simulator launch + Welcome→tour→Discover PASS; Android Welcome Back PASS (tour steps + minimize, no completion); reduced-motion Motion transitions zeroed; web not redeployed yet — production iOS AdMob App ID still required for store release (`VITE_ADMOB_IOS_APP_ID`)

## Public design-system sanitation (2026-08-25)

- Shared tokens + static chrome: `public/bu-public.css`, `public/bu-journal.css`, `scripts/public-chrome.cjs`, `src/web/public-chrome.tsx`
- Nav: Stories · Journal · Journey · Download (Privacy/Terms/Support in footer)
- Journal generator + restyled static HTML use logo image + shared header/footer
- Download static HTML rewritten to match homepage system (Play link intact; App Store coming soon)
- `/journey` added; `/about` aliases to Journey content
- Deploy still via `deploy-web-to-landing.sh` when user asks

## Public IA correction pass 2 (2026-08-25)

- **Stories** = community only via public showcase selection (not app feed changes)
- Selection: fetch newest+trending candidates (`limit=50`), prefer popular within **30 days**, else **90 days**, else trending-ranked fallback; score = `totalVotes + replyCount*2` (same as Edge)
- Timestamp: public `createdAt` (ISO) with `timestamp` (epoch ms) fallback — `src/web/public-popular-stories.ts`
- No Journal cards; optional “Explore the Journal” CTA only
- **Journal** = static editorial under `/journal/` + `/journal/<slug>/`; SPA returns null + hard-nav; Vite plugin `betweenus-journal-static-routes` serves static HTML in dev/preview (fixes flash/loop)
- Article/nav hrefs root-relative; canonicals remain absolute `https://betweenus.fun/...`
- **Journey** = product story page only (no feed)
- Deployed to `betweenus.fun` via `deploy-web-to-landing.sh` + push `betweenus_landing` `b931667` (2026-08-25)
- Deploy script now also preserves landing `.github`, `scripts`, `package.json` (wipe was deleting CMS tooling)

## Go-live browser continuation (2026-08-25 ~00:50)

- **Play Advertising ID:** Yes + Advertising/marketing — saved (Need attention 5→4)
- **Play Sign-in details:** Yes + store-review account — saved
- **Play Target audience:** 18 and over — saved
- **Store review account:** `store-review@betweenus.semprog.de` (password in `~/.betweenus/secrets/store_review_account.txt`) — verified sign-in via Edge `/auth/signin`
- **Google Cloud `233093215271`:** still inaccessible to `sharanestone@gmail.com` (`resourcemanager.projects.get` Missing). User “granted access” not visible in this browser session yet.
- **Supabase MCP:** currently points at a *different* project (`soqkgrfzluewpuiguypm`) — do not use for Between Us (`qoqbdiixztolvtcjdnle`)
- Remaining Play: Content ratings, Data safety

## Go-live blocker plan progress (2026-08-25)

- **Android package locked:** `com.betweenus.app` (existing Play app + live assetlinks) — do not rename
- **iOS:** `com.betweenus.fun` — RevenueCat upgraded to `13.4.1` (Cap 8); Release archive succeeds (unsigned CI-style)
- **Android:** JDK 21 build path works; `bundleRelease` produces AAB — **unsigned until upload keystore env vars set**
- **Account deletion:** complete purge deployed to Edge Function; security tests **26/26**
- Ads: AdMob stays on test IDs in app builds unless production flags; AdSense website publisher `ca-pub-3084834499411817` connected; betweenus.fun **Getting ready** (ownership verified + review requested); ads serving still gated until approval + CMP; ads.txt live
- AdSense: placeholders in `src/web/adsenseConfig.ts` — client id set; slots empty; consent false
- Journal ads: template-level via `scripts/journal-ad-placement.cjs` + `generateJournal.js`; gated until ca-pub + slots + CMP consent; no ads in CMS/listing cards
- **Website (browser-verified live):** `/download` 200 with Play link; `/journal/` live (empty editorial); AASA + assetlinks correct; `betweenus_landing` has `download.html` + `journal/`
- **Play Console (browser):** Between Us Draft; Government/Financial/Health declarations saved; **6 of 9** content tasks remain (Ads, Sign-in, Content rating, Target audience, Data safety, Advertising ID)
- **ASC (browser):** Bundle `com.betweenus.fun`; category Social Networking; subtitle set to “Anonymous real talk”; age ratings / privacy / build still incomplete
- **SIWA key:** downloaded to `~/.betweenus/secrets/AuthKey_7J4GZ6AL46.p8` (never commit); JWT generated; **Supabase Apple provider ENABLED** (Client IDs: Services ID first + `com.betweenus.fun`)
- **iOS entitlements:** added `applesignin` + `webcredentials` for betweenus.fun
- **Play:** Ads declaration saved (Contains ads = Yes); need-attention **5** remaining
- **ASC 1.0:** description/keywords/support/marketing/copyright/review notes filled (no screenshots/build yet)
- **Google Cloud `233093215271`:** inaccessible to `sharanestone@gmail.com` — no duplicate project created
- **Android keystore:** not present; unsigned AAB only; create via `~/.betweenus/CREATE_UPLOAD_KEYSTORE.md`
- **Do not commit/push source app repo**; do not submit stores / publish production without explicit approval

## Editorial Journal CMS foundation (2026-08-24 night)

- Phase 1–3 implemented locally (not committed/pushed/deployed)
- DB: `journal_articles` + `journal-images` bucket on Between Us project `qoqbdiixztolvtcjdnle`
- Edge: `/landing-cms/*` routes in `landing-cms.tsx` (needs Edge deploy + `LANDING_CMS_BOOTSTRAP_ADMIN_IDS`)
- Admin UI: `public/journal-admin.html` → live `https://betweenus.fun/journal-admin.html`
- Editor UX (2026-08-25): full Portside-style CMS — Basic/Media/Sections/Category&Tags/SEO/Related/Publishing cards; blocks paragraph/image/quote/callout/tip/checklist/table; tag chips; related picker; SEO Google+social previews; publish checklist; live on betweenus.fun
- **Paste Article (2026-08-25):** `Paste Article` next to Create → parse ChatGPT structured text → import review (SEO/tags/category/images/related) → Apply to same editor state as DRAFT. Parser: `public/journal-article-parser.js` (also live `/journal-article-parser.js`). Magnific MCP inspected (`images_generate`, stock_*, creations_wait) but **not callable from browser**; Magnific account returns premium-required — soft-fail images with manual Replace/Regenerate UI.
- Schema: optional `thumbnail_image` on `journal_articles` (nullable fallback to featured_image)
- Sanitizer: allows h1 + table elements for new blocks; old HTML still renders
- Public Journal generator: category/tag filter chips from article metadata
- Generator: `scripts/generateJournal.js` → `public/journal/`
- Homepage Journal cards load `/journal/home-cards.json` (empty until published + generate)
- AdSense: placeholders in `src/web/adsenseConfig.ts` — all slots disabled
- Journal ads: template-level via `scripts/journal-ad-placement.cjs` + `generateJournal.js`; gated until ca-pub + slots + CMP consent; no ads in CMS/listing cards
- Do NOT confuse with private check-in `/journal` KV API

### Blockers before CMS is usable in production
1. Deploy Edge Function `make-server-6c9b0e48` with landing-cms
2. Set secret `LANDING_CMS_BOOTSTRAP_ADMIN_IDS=<admin-uuid>`
3. Run `npm run generate:journal` with service role after first publish
4. Deploy website via `deploy-web-to-landing.sh` + push `betweenus_landing` (only when user asks)

## Dual public/authenticated web (2026-08-24)

- Web auth gate in `src/App.tsx`: loading → public site OR authenticated app (native unchanged)
- New `src/web/`: `PublicWebsite`, `AuthenticatedWebApp`, `WebAppShell`, `AuthModal`, `useAuthState`
- Logged out: premium landing, live stories, `/story/:id`, `/download`, Log in / Sign up — no waitlist UI
- Logged in: `/app` shell with sidebar + existing tabs; refresh keeps session; logout returns to `/`
- Deploy: `scripts/deploy-web-to-landing.sh` → local `betweenus_landing` updated; **push landing repo for betweenus.fun**

## Phase 2 release gate — iOS Bundle ID migration (2026-08-24)

### Platform identities (locked)
| Surface | ID |
|---------|-----|
| iOS Bundle ID | `com.betweenus.fun` |
| Android package | `com.betweenus.app` (unchanged) |
| Apple Team | `ZVHJ97A744` |
| Website | `https://betweenus.fun` (unchanged; root not associated) |

### Done this gate
- Xcode `PRODUCT_BUNDLE_IDENTIFIER` / Info.plist schemes → `com.betweenus.fun`; team `ZVHJ97A744`
- Capacitor `appId` remains Android `com.betweenus.app`; `scripts/ensure-ios-bundle-id.mjs` restores iOS ID after `cap:sync`
- Deep links accept both native schemes; OAuth redirects platform-aware in `src/config/site.ts`
- Apple App ID `com.betweenus.fun` registered with SIWA + Associated Domains
- Services ID `com.betweenus.fun.web` configured: domain `betweenus.fun`, return `https://qoqbdiixztolvtcjdnle.supabase.co/auth/v1/callback`, primary App ID `com.betweenus.fun`
- App Store Connect record created: display name **Between Us Spill** (exact “Between Us” / “BetweenUs” unavailable), Bundle `com.betweenus.fun`, Prepare for Submission — not submitted
- Supabase redirects: keep Android `com.betweenus.app://**` + callback; added iOS `com.betweenus.fun://auth/callback` and `com.betweenus.fun://**` (Total 13)
- Live AASA: `ZVHJ97A744.com.betweenus.fun`, paths `/story/*` only
- Live assetlinks: package `com.betweenus.app` + Play SHA-256 `5F:0A:EE:...:FD:8C` unchanged
- `npm run build`, `npm run cap:sync`, `npm run test:security` → **16/16**

### Still blocked (manual)
1. **Apple .p8 key** — create Sign in with Apple key in Developer → Keys; paste Team ID / Key ID / Services ID / secret into Supabase Apple provider only (never commit). Provider remains incomplete until this.
2. **Google Cloud iOS OAuth** — project `233093215271` inaccessible under `sharanestone@gmail.com`; do not create duplicate project. Need owning account to add iOS client for `com.betweenus.fun`.
3. **Physical device** OAuth / Universal Links / App Links / cross-platform `auth.users.id` matrix.
4. **ASC display name** — trademark claim or keep “Between Us Spill” until “Between Us” is released.

### Do not start Phase 3 until Apple provider + Google iOS client + device checks are done where possible.

## Production web deploy (2026-08-26)
- Deployed tested Community Stories client via `scripts/deploy-web-to-landing.sh` + push `betweenus_landing` `31ea876`.
- Live bundle: `assets/index-COCvQEMb.js` (includes `statsOnly`, feed/media query setters, With pictures).
- Edge feed path already live; authenticated Stories verified Controversal default + feed= params.
