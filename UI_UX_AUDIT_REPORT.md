# Between Us — UI/UX Audit & iOS App Store Readiness Report

**Date:** August 24, 2026  
**Domain:** https://betweenus.fun  
**Supabase project:** `qoqbdiixztolvtcjdnle`  
**Bundle ID:** `com.betweenus.app`  
**Stack:** Vite · React · Capacitor · Supabase Edge Function (Hono) · KV store

---

## Executive Summary

A full repository audit was performed across onboarding, authentication, all main tabs, modals, native configuration, accessibility, and security regression. The application was polished toward a cohesive commercial mobile product standard: **Lucide React** is now the single icon system for UI chrome, onboarding uses structured progress and safe-area handling, mood check-ins use semantic Lucide badges (emoji retained only as backend data keys), account deletion was added for App Store compliance, and the iOS Capacitor project was generated with privacy strings and URL schemes.

**Status:** Code-side work is substantially complete. **App Store Ready** still requires manual Apple Developer / App Store Connect configuration (signing, OAuth, metadata, screenshots). Production DNS and GitHub Pages deploy remain external blockers from Phase 1.

---

## 1. Screens Audited

### Application flow (SPA — no React Router)

| Phase | Screen / State | Component |
|-------|----------------|-----------|
| First launch | Language selection (step 0) | `Onboarding.tsx` |
| Onboarding | Name input (step 1) | `Onboarding.tsx` |
| Onboarding | Welcome (step 2) | `Onboarding.tsx` |
| Onboarding | Anonymity (step 3) | `Onboarding.tsx` |
| Onboarding | Mood tracking (step 4) | `Onboarding.tsx` |
| Onboarding | Community (step 5) | `Onboarding.tsx` |
| Onboarding | Levels & badges (step 6) | `Onboarding.tsx` |
| Onboarding | Authentication (step 7) | `AuthStep.tsx` |
| Post-onboarding | Feature tutorial | `Tutorial.tsx` |
| Main app | Check-in tab (home, mood select, sub-mood, activities, journal, calendar, stats, benefits) | `CheckInTab.tsx` |
| Main app | Share tab (compose, categories, limits) | `ShareTab.tsx` |
| Main app | Listen tab (feed, filters, replies) | `ListenTab.tsx` |
| Main app | Community tab (posts, sort, vote, flag, reply threads) | `CommunityTab.tsx` |
| Main app | Profile tab (stats, mood history, levels, badges, subscription, settings entry) | `ProfileTab.tsx` |
| Global | Header + theme toggle | `App.tsx` |
| Global | Bottom navigation (5 tabs) | `BottomNavBar.tsx` |
| Modals | Settings (incl. account deletion) | `SettingsModal.tsx` |
| Modals | Subscription / credits | `SubscriptionModal.tsx` |
| Modals | Feedback (review, feature, general) | `FeedbackModal.tsx` |
| Modals | Help center FAQ | `HelpCenterModal.tsx` |
| Modals | Tutorial replay | `TutorialModal.tsx` |
| Modals | Privacy policy | `PrivacyPolicy.tsx` |
| Modals | Terms of service | `TermsOfService.tsx` |
| Modals | Profile picture upload | `ProfilePictureUpload.tsx` |
| Modals | Social share card | `SocialShareCard.tsx` |
| States | Achievement / level toast | `AchievementToast.tsx` |
| States | Loading skeletons | `CommunityTab`, various |
| States | Empty / error | Per-tab conditional UI |
| Landing (separate) | Marketing waitlist pages | `src/landing-pages/` |
| Dev-only | Reset onboarding button | `App.tsx` (dev environment only) |

**Hidden / conditional states audited:** unauthenticated gating, subscription limits, OAuth callback, account deletion confirmation, comment sort, mood calendar empty days, profile signed-out view.

---

## 2. UI Issues Found

| Screen | Problem | Severity | Fix |
|--------|---------|----------|-----|
| `FeedbackModal` | Broken JSX after partial icon refactor (`type.icon`, malformed map) | **Critical** | Fixed — Lucide `Icon` components, valid map callback |
| `CheckInTab` | Emoji used as decorative UI icons (💭, 🎭) | High | Replaced with `MessageCircle`, `Sparkles` |
| `CheckInTab` | Mood grid previously mixed emoji + icons | High | Standardized on `MoodIconBadge` + `ACTIVITIES` Lucide set |
| `ProfileTab` | Mood history showed raw emoji | Medium | `MoodIconBadge` via `getMoodByEmoji()` |
| `ProfileTab` | Help menu used emoji icons (📖❓💬📜) | Medium | Replaced with Lucide (`BookOpen`, `HelpCircle`, etc.) |
| `ProfileTab` | Achievement badges rendered server emoji strings | Medium | `resolveBadgeIcon()` maps to Lucide |
| `AchievementToast` | Server emoji in toast | Medium | `BadgeIcon` component |
| `FeedbackModal` | Animated 🌟 in Play Store prompt | Low | `Star` Lucide icon |
| `HelpCenterModal` | Badge FAQ used emoji list | Low | Plain-language badge names |
| `SubscriptionModal` | 💡 emoji in demo footer | Low | `Info` icon + text |
| `ProfilePictureUpload` | 📸 in success toast | Low | Plain success message |
| Onboarding | No progress indication | Medium | Added `OnboardingProgress` bar + safe-area |
| `BottomNavBar` | Home indicator overlap risk | Medium | Safe-area bottom padding, 56px min touch height |
| `AuthStep` | Missing Apple Sign In on iOS | High | Native `signInWithApple()` path added |
| Global | Achievement toast under notch | Low | Safe-area top offset |
| Bundle | Single 1.1MB JS chunk | Medium | Documented — code-splitting recommended |
| iOS | Project missing locally | High | `npx cap add ios` completed |
| iOS `Info.plist` | Missing privacy usage strings | **Critical (App Review)** | NSCamera / Photo Library descriptions added |
| App icon | iOS uses default Capacitor placeholder | High | **Manual:** replace `AppIcon.appiconset` with brand asset |
| Splash | Default Capacitor splash | Medium | **Manual:** customize `Splash.imageset` + `capacitor.config.ts` |
| `CrossPromoCarousel` | Marketing copy with emojis | Low | Acceptable promo tone; optional cleanup |
| `PrivacyPolicy` / `TermsOfService` | Closing 💜 in prose | Low | Cosmetic; not UI chrome |
| Landing pages | Waitlist copy with 🌟💜 | Low | Separate from in-app product |
| `CommunityTabNew.tsx` | Unused legacy file with emoji UI | Info | Not mounted in `App.tsx` |

---

## 3. Icon Audit

### Standardized system
**Lucide React** (`lucide-react`) — single stroke-based icon library for all interactive UI and onboarding.

### New shared modules
- `src/components/mood/mood-visuals.tsx` — mood → Lucide mapping + `MoodIconBadge`
- `src/components/mood/activity-visuals.tsx` — check-in activity icons
- `src/components/badge-icons.tsx` — achievement badge resolution (ID + server emoji fallback)
- `src/components/CategoryIcons.tsx` — community category icons (existing)

### Icons replaced (representative)
| Location | Before | After |
|----------|--------|-------|
| Check-in moods (UI) | Emoji faces | Lucide mood icons |
| Check-in activities | Emoji | Lucide activity icons |
| Onboarding steps | Already Lucide | Verified consistent |
| Profile help rows | Emoji | Lucide |
| Feedback type cards | Emoji | Lucide |
| Achievement badges | Server emoji | Lucide via mapper |
| Tutorial | Emoji in titles | Removed (prior pass) |

### Remaining intentional exceptions
| Exception | Reason |
|-----------|--------|
| `mood-visuals.tsx` `emoji` field | Stored in Supabase check-in records for backward compatibility; not shown as primary UI |
| Server `index.tsx` badge `icon` emoji | Backend payload; client maps to Lucide |
| Email templates (`email-templates.tsx`) | HTML email — separate design surface |
| Dev/seed scripts console logs | Non-user-facing |
| Cross-promo marketing copy | Promotional tone for sister apps |

---

## 4. UX Issues

| Area | Fix |
|------|-----|
| Onboarding | 8-step progress bar, safe-area padding, Lucide step icons, back navigation on auth |
| Authentication | Google + Apple buttons with 44px targets; Apple on iOS via Capacitor; dev-only setup hints |
| Account deletion | Settings → Account tab → type DELETE → `POST /auth/delete-account` (auth required) |
| Check-in flow | Consistent mood/activity visual language, calendar uses badges |
| Navigation | Bottom nav safe-area; header safe-area top |
| Feedback | Fixed broken type selection; star rating uses Lucide |
| Help | Updated badge FAQ without emoji clutter |
| Subscription | Demo disclaimer uses icon; success toast without emoji |

---

## 5. Accessibility

| Improvement | Status |
|-------------|--------|
| Safe-area CSS variables (`globals.css`) | Done |
| `prefers-reduced-motion` media query | Done |
| `.touch-target` utility (44px minimum) | Done |
| Language selector `aria-label` on onboarding | Done |
| Auth buttons minimum touch size | Done |
| Lucide icons marked `aria-hidden` where decorative | Partial — ongoing |
| Form labels on feedback/settings | Existing Radix/shadcn patterns |
| Focus states | Radix defaults |

### Remaining
- Full keyboard walkthrough of all modals not automated
- Some community action buttons could use clearer `aria-label`s
- Color contrast on gradient buttons should be spot-checked in dark mode on device

---

## 6. Performance

| Item | Result |
|------|--------|
| Production build | **Pass** (~1.12 MB JS, 166 KB CSS gzip ~313 KB JS) |
| Code splitting | Not implemented — largest opportunity |
| Image assets | Logo PNG ~117 KB — acceptable |
| Duplicate Supabase calls | Not profiled in depth |
| Lazy loading modals | Not implemented — future improvement |

**Recommendation:** Route-level or tab-level `React.lazy()` for `ShareTab`, `CommunityTab`, `ProfileTab`, and heavy modals.

---

## 7. iOS

| Item | Value / Status |
|------|----------------|
| Bundle ID | `com.betweenus.app` |
| Display name | Between Us |
| Marketing version | 1.0 (Xcode project) |
| Capacitor iOS | **Added** — `ios/` directory generated |
| Capacitor sync | **Pass** after build |
| Plugins | app, camera, haptics, keyboard, network, share, splash-screen, status-bar, RevenueCat |
| Info.plist privacy strings | NSCamera, NSPhotoLibrary, NSPhotoLibraryAdd |
| URL scheme | `com.betweenus.app` (OAuth deep link scaffold) |
| Export compliance | `ITSAppUsesNonExemptEncryption = false` |
| Sign in with Apple | Client code in `AuthStep.tsx` — **MANUAL:** enable capability in Xcode + Apple Developer + Supabase Auth |
| Google Sign In | Web OAuth redirect — **MANUAL:** iOS URL scheme + Google Cloud iOS client |
| App icon | Default Capacitor — **MANUAL:** replace all `AppIcon.appiconset` sizes from `betweenus-logo.png` |
| Splash | Default — **MANUAL:** brand splash in `Splash.imageset` |
| Status bar | Configured in `capacitor.config.ts` (#6366f1) |
| Safe areas | CSS env + component padding |
| Keyboard | Capacitor Keyboard plugin `resize: body` |

---

## 8. App Store Connect

### Completed in repository
- Account deletion UI + authenticated API endpoint
- Privacy policy & terms accessible in-app
- Bundle identifier aligned (`com.betweenus.app`)
- iOS project scaffold with privacy usage descriptions
- Export compliance plist key
- OAuth redirect URL config in `src/config/site.ts`
- Production security on backend (unchanged)

### Still requiring manual Apple Developer / App Store Connect configuration

| Task | Notes |
|------|-------|
| Apple Developer Program enrollment | Required for submission |
| App ID with Sign in with Apple capability | Match `com.betweenus.app` |
| Provisioning profiles & signing | Xcode automatic signing or manual |
| App Store Connect app record | Name, subtitle, category (Health & Fitness or Lifestyle) |
| Privacy Nutrition Labels | Map data types below (Section 18) |
| App Privacy Policy URL | Host at `https://betweenus.fun/privacy` or in-app URL |
| Support URL | Required — e.g. `https://betweenus.fun/support` |
| Screenshots | 6.7", 6.5", 5.5" iPhone + iPad if supporting tablet |
| Age rating questionnaire | Mental health / user-generated content declarations |
| Review notes | Test account if login required |
| RevenueCat / IAP | If subscriptions go live — App Store product IDs + review |
| Google OAuth iOS client | Google Cloud Console |
| Supabase Auth redirect URLs | Add `com.betweenus.app://` and production web URL |
| DNS + GitHub Pages | `betweenus.fun` must resolve for production OAuth |
| Replace placeholder iOS icons & splash | Before screenshot capture |

---

## 9. Security Regression

Verified against deployed edge function `make-server-6c9b0e48`:

| Check | Result |
|-------|--------|
| Waitlist GET (unauthenticated) | `{"error":"Admin endpoint disabled"}` — **Protected** |
| Check-ins GET (anon JWT) | `{"error":"Authentication required"}` — **Protected** |
| Subscription upgrade POST (anon) | `{"error":"Authentication required"}` — **Protected** |
| Delete account POST (anon) | `{"error":"Authentication required"}` — **Protected** |
| RLS on KV store | Applied (Phase 1) — not weakened |
| CORS allowlist | Unchanged |
| Production env restrictions | `BETWEENUS_ENV=production` — unchanged |

**UI changes did not modify RLS policies, JWT validation, admin secret checks, or CORS configuration.**

---

## 10. Testing

| Test | Result |
|------|--------|
| `npm run build` | **Pass** |
| TypeScript (`tsc --noEmit`) | No project `tsconfig` — build validates TS via Vite |
| Lint | No ESLint config in repo — not run |
| Unit / E2E tests | None configured — not run |
| `npm run cap:sync` | **Pass** (Android + iOS) |
| Android release build | Not run — **MANUAL VERIFICATION REQUIRED** |
| iOS Xcode build | Not run — **MANUAL VERIFICATION REQUIRED** (requires macOS + signing) |
| Live OAuth (Google/Apple) | **MANUAL VERIFICATION REQUIRED** |
| Account deletion E2E | **MANUAL VERIFICATION REQUIRED** with signed-in user |
| Production domain | DNS not verified live during audit |

---

## 11. Remaining Blockers

### Genuine blockers before App Store submission

1. **Apple Developer + signing + Xcode archive** — cannot be completed in repo alone  
2. **Brand iOS app icon & splash** — placeholder assets remain  
3. **Sign in with Apple** — Apple Developer capability + Supabase provider + Xcode entitlement  
4. **Google Sign In on iOS** — iOS OAuth client + URL scheme verification  
5. **Production hosting** — `betweenus.fun` DNS + GitHub Pages + Supabase auth redirect URLs  
6. **App Store Connect metadata** — screenshots, privacy labels, support URL  
7. **RevenueCat / subscriptions** — if charging users, full IAP review path required  

### Non-blockers (recommended follow-ups)

- JS bundle code-splitting  
- Remove or align unused `CommunityTabNew.tsx`  
- Email template emoji → HTML icons (optional)  
- Automated Playwright smoke tests for onboarding + auth  

---

## Appendix A — Privacy / Data Disclosure Mapping

Based on code inspection (not guessed):

| Data type | Purpose | Linked to user | Tracking | Third party |
|-----------|---------|----------------|----------|-------------|
| Email | Authentication | Yes | No | Supabase Auth |
| Name (display) | Personalization | Yes | No | Supabase / KV profile |
| Username | Community anonymity layer | Yes | No | KV store |
| Profile picture | Avatar | Yes | No | Supabase Storage (camera/library) |
| Mood check-ins | Wellness journaling | Yes | No | KV store (user-scoped) |
| Anonymous posts & replies | Community feature | Pseudonymous | No | KV store |
| Auth identifiers (OAuth) | Login | Yes | No | Google / Apple via Supabase |
| Subscription tier / credits | Feature gating | Yes | No | KV + RevenueCat (when enabled) |
| Feedback submissions | Product improvement | Optional | No | Edge function / KV |
| Device/network | None explicitly collected | — | — | — |
| Analytics / crash SDKs | Not integrated in client | No | No | — |
| Location / contacts | Not collected | No | No | — |

**App Store Connect:** Declare contact info, user content, identifiers, and purchases (if IAP live). No ATT tracking framework detected.

---

## Appendix B — App Review Risk Notes

| Risk | Mitigation |
|------|------------|
| Account deletion missing | **Fixed** — in Settings |
| Privacy policy missing | In-app modal; needs public URL for Connect |
| Sign in with Apple required (if Google offered) | Apple button on iOS — finish native config |
| Web wrapper without native value | Capacitor + camera + haptics + native auth justifies hybrid |
| User-generated content | Community moderation / flag flow exists |
| Incomplete subscription IAP | Demo mode labeled; production upgrades blocked server-side |
| Broken links to production | DNS must be live before review |

---

## Appendix C — Screenshot-Ready Screens

Best candidates once icons/splash finalized:

1. Onboarding welcome (step 2) — first impression  
2. Check-in mood selection — core value  
3. Listen feed — community support  
4. Share compose — anonymous expression  
5. Profile levels & badges — gamification  
6. Auth / subscription CTA — conversion  

---

## Appendix D — Files Changed (UI/UX Phase)

- `src/components/mood/mood-visuals.tsx` (new/updated)
- `src/components/mood/activity-visuals.tsx` (new)
- `src/components/badge-icons.tsx` (new)
- `src/components/OnboardingProgress.tsx` (new)
- `src/components/Onboarding.tsx`, `AuthStep.tsx`, `Tutorial.tsx`
- `src/components/CheckInTab.tsx`, `ProfileTab.tsx`, `FeedbackModal.tsx`
- `src/components/AchievementToast.tsx`, `HelpCenterModal.tsx`
- `src/components/SettingsModal.tsx`, `BottomNavBar.tsx`
- `src/components/SubscriptionModal.tsx`, `ProfilePictureUpload.tsx`
- `src/utils/auth.tsx` (deleteAccount)
- `src/supabase/functions/server/index.tsx` (delete-account endpoint)
- `src/styles/globals.css`
- `ios/App/App/Info.plist`

---

*Report generated after code inspection, production build, Capacitor sync, edge function deploy, and live security regression checks.*
