# Active Context

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
