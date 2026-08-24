# Between Us — Product Implementation Report

**Date:** August 24, 2026  
**Scope:** Text-first social pivot, security fixes, production prep  
**Baseline:** Prior production hardening + UI/UX audit (unchanged security model)

---

## Executive Summary

Between Us has been refocused as a **text-first social gossip/community application** (write → publish → read → vote → comment → discover). The audio-oriented **Listen** concept was removed and replaced with **Discover**, a scrollable feed with voting and comments. **Vote userId spoofing** was fixed server-side. Code splitting reduced the main bundle. No audio dependencies or microphone permissions were found in the codebase.

---

## PRODUCT CHANGES

### Audio functionality removed
| Finding | Action |
|---------|--------|
| No `MediaRecorder`, `<audio>`, voice notes, or audio upload code | Confirmed — nothing to remove |
| No microphone permissions (Android/iOS) | Confirmed |
| No audio-specific npm packages | Confirmed |
| **Listen** tab (text support UX branded as “listening”) | **Removed** — replaced with **Discover** |
| `ListenTab.tsx` (~40KB) | **Deleted** |
| Ear icon in navigation | Replaced with **Compass** |
| Copy referencing “Listen & Support”, “stories to listen”, “feel heard” | Updated to discover/discuss language |
| Push notification `sound` in Capacitor config | Retained — standard OS notification option, not in-app audio |

### “Listen” replacement → **Discover**
- New `DiscoverTab.tsx`: scrollable feed, filters (Trending / New / Hot / Random)
- Reddit-inspired layout: vote column, post body, expandable comments
- Uses `callServer()` with JWT when signed in
- Posts endpoint supports `?limit=25` for feed pagination cap

### Navigation changes
| Before | After |
|--------|-------|
| Check-in, Share, **Listen**, Community, Profile | **Discover**, Write (Share), Community, Check-in, Profile |
| Default tab: Check-in | Default tab: **Discover** |
| `nav.share`: Share | `nav.share`: **Write** (English) |

**Check-in retained** — private mood journaling; complements community product without conflicting with gossip feed.

### Post creation (Share / Write tab)
- Existing composer already has: 1000-char limit, counter, categories, anonymous toggle, image upload, guidelines gate, loading/error states
- Copy updated: “Write Your Story”, gossip/community placeholder

### Voting improvements
- **Server:** `resolveActorId()` — authenticated users must use JWT identity; arbitrary `userId` rejected with 403
- **Server:** Anonymous votes require `anonymous-user-[a-z0-9]{6,24}` format; arbitrary strings rejected with 401
- **Client:** Centralized `getActorId()` in `src/utils/actor-id.ts`
- **CommunityTab** + **DiscoverTab** + **api.tsx** use shared actor ID helper
- Reply edit/delete now require ownership match on server

### Comments / replies
- Discover feed: inline comment threads, post comment, edit/delete own replies
- Community tab: unchanged feature set, updated actor ID handling

### Discovery
- Trending, New, Hot (controversial), Random sort via existing backend
- Refresh control on Discover header

---

## UI CHANGES

| Area | Change |
|------|--------|
| DiscoverTab | New feed UI, Lucide icons, 44px touch targets |
| Tutorial | “Discover & Discuss” step with Compass icon |
| Onboarding | Community step copy → write/discover/vote/discuss |
| Help Center | Discover tab instructions |
| Site meta | `site.ts` description → text-first product |
| Icons | Ear/headphones removed from product UI |

---

## SECURITY

### Fixed
| Issue | Fix |
|-------|-----|
| Vote `userId` spoofing | `resolveActorId()` on upvote/downvote (posts + replies) |
| Reply edit/delete without ownership | Server checks `reply.userId === actorId` |
| Invalid anonymous voter IDs | Regex validation before accepting votes |

### Verified still protected (live curl)
| Endpoint | Result |
|----------|--------|
| `GET /waitlist` | `Admin endpoint disabled` |
| `POST /subscription/upgrade` (anon) | `Authentication required` |
| `POST /posts/:id/upvote` with `userId: "spoofed-other-user-id"` | `Valid anonymous voter ID or authentication required` |
| Valid anon ID format | Reaches post lookup (auth OK) |

### Unchanged from Phase 1
- CORS allowlist, KV RLS, admin secret, production subscription blocks, user-scoped check-ins, account deletion auth

---

## SUPABASE

| Area | Status |
|------|--------|
| Edge function `make-server-6c9b0e48` | **Redeployed** with vote security + post `limit` param |
| KV store | Posts, replies, votes (unchanged schema) |
| Auth | JWT via `callServer()` / `getAuthUser()` |
| Storage | Post images only (no audio buckets) |
| RLS | KV table service_role only (unchanged) |

---

## GOOGLE CLOUD

| Item | Status |
|------|--------|
| OAuth consent screen | **MANUAL VERIFICATION REQUIRED** |
| Authorized JS origin `https://betweenus.fun` | **MANUAL** — add in Google Cloud Console |
| Redirect URI `https://qoqbdiixztolvtcjdnle.supabase.co/auth/v1/callback` | **MANUAL** — add to Web client |
| Android OAuth client `com.betweenus.app` | **MANUAL** — SHA-1/SHA-256 from Play App Signing |
| iOS OAuth client | **MANUAL** — when iOS client created |
| Code-side redirect URLs | Configured in `src/config/site.ts` |

---

## GOOGLE PLAY

| Item | Status |
|------|--------|
| Package ID `com.betweenus.app` | Unchanged |
| Capacitor sync | **Pass** |
| Release build | Not run — **MANUAL VERIFICATION REQUIRED** |
| Store listing copy | **MANUAL** — update to remove any “listen/audio” language |
| Data safety form | **MANUAL** — reflect text UGC, auth, optional camera (profile photos) |
| Privacy policy URL | **MANUAL** — must be live at production domain |

---

## APP STORE CONNECT

| Item | Status |
|------|--------|
| Bundle ID `com.betweenus.app` | Configured in Xcode project |
| Account deletion | In-app + API (prior work) |
| Sign in with Apple | Client code present — **MANUAL** capability + Supabase |
| Metadata | **MANUAL** — describe text/community product, not audio |
| Screenshots | **MANUAL** — capture Discover + Write + Community flows |

---

## iOS

| Item | Status |
|------|--------|
| Project generated | Yes (`ios/`) |
| Info.plist privacy strings | Camera + photo library |
| Cap sync | **Pass** |
| Xcode archive / signing | **MANUAL VERIFICATION REQUIRED** |
| App icon / splash | Placeholder — **MANUAL** brand assets |

---

## ANDROID

| Item | Status |
|------|--------|
| Cap sync | **Pass** |
| Package | `com.betweenus.app` |
| Microphone permission | Not present |
| Gradle release build | Not run — **MANUAL** |

---

## TESTING

| Test | Result |
|------|--------|
| `npm run build` | **Pass** |
| Main bundle | ~1,079 KB (was ~1,120 KB) |
| Code-split chunks | `DiscoverTab` 10.8 KB, `ShareTab` 21.8 KB |
| `npm run cap:sync` | **Pass** (Android + iOS) |
| Edge function deploy | **Pass** |
| Vote spoofing regression | **Pass** (invalid ID rejected) |
| TypeScript project config | No root `tsconfig` — Vite build validates |
| Lint / E2E | Not configured |
| Live OAuth flows | **MANUAL** |

---

## REMAINING BLOCKERS

1. **Production domain** — `betweenus.fun` DNS + GitHub Pages deploy  
2. **Google Cloud OAuth** — origins, redirect URIs, Android/iOS clients  
3. **Apple Developer** — signing, Sign in with Apple, App Store Connect metadata  
4. **Google Play Console** — listing update, data safety, release build  
5. **Brand iOS/Android icons & splash** — replace Capacitor placeholders  
6. **Full i18n** — Discover/Write nav strings in ES/ZH/HI/DE/FR (English complete; legacy `nav.listen` aliased to Discover in EN)

---

## Files Changed (summary)

**Added:** `src/components/DiscoverTab.tsx`, `src/utils/actor-id.ts`  
**Removed:** `src/components/ListenTab.tsx`  
**Updated:** `App.tsx`, `BottomNavBar.tsx`, `Tutorial.tsx`, `CommunityTab.tsx`, `LanguageContext.tsx`, `HelpCenterModal.tsx`, `config/site.ts`, `utils/api.tsx`, `security.tsx`, `server/index.tsx`

---

## Product Definition of Done (current)

| Criterion | Status |
|-----------|--------|
| Text-first write/read/vote/comment/discover loop | **Done in code** |
| No audio UI or permissions | **Done** |
| Listen concept removed | **Done** |
| Vote spoofing fixed | **Done + deployed** |
| Security regression | **Pass** |
| Production store submission | **Blocked on manual console work** |

---

*Implementation completed in repository; manual ecosystem configuration still required for public launch.*
