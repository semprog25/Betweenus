# Between Us — Production Deployment Guide

Production canonical domain: **https://betweenus.fun**  
Supabase project: **qoqbdiixztolvtcjdnle**

---

## 1. GitHub Pages + Custom Domain

### Repository settings

1. Push this repository to GitHub.
2. **Settings → Pages → Build and deployment**
   - Source: **GitHub Actions**
3. **Settings → Secrets and variables → Actions**
   - Add `VITE_SUPABASE_ANON_KEY` = Supabase anon/public key (Dashboard → Project Settings → API)

### DNS (registrar for `betweenus.fun`)

| Type | Name | Value |
|------|------|-------|
| A | `@` | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` |
| CNAME | `www` | `<your-github-username>.github.io` |

**Canonical:** `https://betweenus.fun`  
Configure `www.betweenus.fun` to redirect to apex in GitHub Pages custom domain settings (Enforce HTTPS ON).

The build copies `public/CNAME` → `betweenus.fun`.

---

## 2. Supabase Auth Redirect URLs

Dashboard → **Authentication → URL Configuration**

| Setting | Value |
|---------|-------|
| Site URL | `https://betweenus.fun` |
| Redirect URLs | `https://betweenus.fun/**`, `https://www.betweenus.fun/**`, `http://localhost:3000/**`, `http://localhost:5173/**`, `com.betweenus.app://**` |

---

## 3. Google Cloud OAuth

Console → **APIs & Services → Credentials → OAuth 2.0 Client (Web)**

**Authorized JavaScript origins:**
```
https://betweenus.fun
https://www.betweenus.fun
http://localhost:3000
http://localhost:5173
```

**Authorized redirect URIs:**
```
https://qoqbdiixztolvtcjdnle.supabase.co/auth/v1/callback
```

Paste Client ID + Secret into Supabase → **Auth → Providers → Google**.

### Android OAuth client

- Package: `com.betweenus.app`
- SHA-1 + SHA-256 from **Play Console → App signing** and **upload key**

### iOS OAuth client (when iOS platform is added)

- Bundle ID: `com.betweenus.app`
- iOS URL scheme from Google client config

---

## 4. Apple Sign In (iOS)

1. Apple Developer → App ID `com.betweenus.app` → enable **Sign In with Apple**
2. Create **Services ID** for web callback (if using web flow)
3. Supabase → **Auth → Providers → Apple**
   - Services ID, Team ID, Key ID
   - Private key: store in Supabase secrets only — **never commit `.p8` files**

Redirect URI in Apple:
```
https://qoqbdiixztolvtcjdnle.supabase.co/auth/v1/callback
```

---

## 5. Supabase Edge Function Secrets

Dashboard → **Edge Functions → make-server-6c9b0e48 → Secrets**

| Secret | Purpose |
|--------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side KV + admin auth (auto-injected in hosted functions) |
| `BETWEENUS_ADMIN_SECRET` | Protects admin/waitlist export/seeding endpoints |
| `BETWEENUS_ENV` | Set to `production` to block free subscription upgrades |
| `BETWEENUS_ALLOWED_ORIGINS` | Optional comma list; defaults include betweenus.fun |

Deploy updated function code from `src/supabase/functions/server/`.

---

## 6. Firebase

**Not required** for current architecture (Supabase Auth + Edge Functions).  
Do not create a Firebase project unless you add Firebase-specific services later.

---

## 7. Android (existing Play app)

- **Application ID:** `com.betweenus.app` — do not change
- Release signing: configure in Android Studio / Play App Signing
- After release keystore is known, add SHA fingerprints to Google OAuth Android client

Build:
```bash
npm run build
npm run cap:sync
npm run cap:open:android
```

---

## 8. iOS

```bash
npm run build
npm run cap:add:ios   # first time only
npm run cap:sync
npm run cap:open:ios
```

Configure in Xcode:
- Bundle ID: `com.betweenus.app`
- Sign in with Apple capability
- Associated domains (if using universal links): `applinks:betweenus.fun`

---

## 9. RevenueCat (mobile subscriptions)

Configure keys via environment — not in source:
- iOS / Android public SDK keys in native build config
- Webhook → Edge Function with `REVENUECAT_WEBHOOK_SECRET`

Direct `/subscription/upgrade` is blocked when `BETWEENUS_ENV=production`.

---

## 10. Verify Checklist

- [ ] `https://betweenus.fun` loads over HTTPS
- [ ] Google OAuth completes and session persists
- [ ] Apple Sign In works on iOS build
- [ ] `/waitlist` GET returns 401 without admin secret
- [ ] `/subscription/upgrade` returns 403 in production
- [ ] Check-ins only visible to owning user
- [ ] GitHub Actions deploy succeeds
