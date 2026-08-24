# Active Context

## Current phase
**Phase 1 live on betweenus.fun. Phase 2 auth/deep-link code implemented locally.**

### Phase 2 change locations
- Website: association files + `.nojekyll` (pushed)
- App: OAuth Browser+PKCE, appUrlOpen, pending auth actions
- Supabase: CORS allowlist `https://localhost` only
- iOS: entitlements Associated Domains; scheme already present
- Android: custom scheme + `/story` App Links intent filters

### Manual remaining
- Supabase Auth redirect URLs for `com.betweenus.app://auth/callback`
- Apple Team ID in AASA; Play SHA256 in assetlinks
- Apple Developer Console Sign in with Apple
- Device matrix tests (Web/Android/iOS same user id)

## Uncommitted app work (do not discard)
Security hardening already in working tree:
- Edge security + `toPublicPost` / ownership
- `scripts/security-boundary-tests.ts`
- `SECURITY_AUDIT_REPORT.md`
- Storage migration for post-images

## Design dials (Phase 1 website)
- DESIGN_VARIANCE = 4
- MOTION_INTENSITY = 3
- VISUAL_DENSITY = 3
- Preserve existing dark fuchsia/orange Between Us palette

## Change location — Phase 1
- **Website:** `betweenus_landing/index.html` (+ sync `404.html`, `sitemap.xml`)
- **App:** no Phase 1 UI rewrite required
- **Supabase:** no schema changes for Phase 1 (auth already shared)
- **iOS/Android:** Phase 2 for native OAuth / Universal Links

## Next after Phase 1
Phase 2 — cross-platform auth verification (callbacks, Apple Console blocker, native deep-link listener)
