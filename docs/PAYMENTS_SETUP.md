# Between Us — Payments setup (Stripe + RevenueCat)

Entitlements live in Edge KV `subscription:{supabaseUserId}`. Clients never grant Premium/Pro.

| Surface | Purchase path | Entitlement source of truth |
|---------|---------------|----------------------------|
| Web | Stripe Checkout → `/subscription/checkout` | `POST /webhooks/stripe` |
| iOS | StoreKit via RevenueCat | `POST /webhooks/revenuecat` |
| Android | Play Billing via RevenueCat | `POST /webhooks/revenuecat` |

Direct `POST /subscription/upgrade` and `/buy-credits` always return `403 PAYMENT_REQUIRED`.

## 1. Stripe (web)

1. Create Products: **Premium** and **Pro**, each with monthly + yearly Prices.
2. Copy Price IDs into Supabase Edge secrets:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRICE_PREMIUM_MONTHLY` / `_YEARLY`
   - `STRIPE_PRICE_PRO_MONTHLY` / `_YEARLY`
3. Mirror the same Price IDs in client `.env` as `VITE_STRIPE_PRICE_*` (optional UI gate).
4. Webhook endpoint (deployed Edge function):

```
https://<project>.supabase.co/functions/v1/make-server-6c9b0e48/webhooks/stripe
```

Events: `checkout.session.completed`, `customer.subscription.created|updated|deleted`, `invoice.payment_failed`.

5. Customer Portal: enable in Stripe Dashboard (Manage billing in the app).

Checkout metadata always includes `betweenus_user_id` = Supabase auth UUID.

## 2. RevenueCat (iOS + Android)

1. Add **Apple App Store** app (`com.betweenus.fun`) and **Google Play** app (`com.betweenus.app`).
2. Create entitlements with lookup keys: `premium` and `pro` (attach store products).
3. Default offering packages should map to catalog plan IDs / hints in `src/config/subscription-catalog.ts`.
4. Webhook URL:

```
https://<project>.supabase.co/functions/v1/make-server-6c9b0e48/webhooks/revenuecat
```

Authorization header = shared secret → Edge secret `REVENUECAT_WEBHOOK_SECRET`.

5. Client SDK keys (public):
   - `VITE_REVENUECAT_IOS_API_KEY`
   - `VITE_REVENUECAT_ANDROID_API_KEY`

6. App User ID = Supabase user UUID (`Purchases.logIn` after auth).

## 3. Deploy Edge secrets + function

```bash
# Example — use your real values; do not commit them
supabase secrets set STRIPE_SECRET_KEY=... STRIPE_WEBHOOK_SECRET=... \
  STRIPE_PRICE_PREMIUM_MONTHLY=... STRIPE_PRICE_PREMIUM_YEARLY=... \
  STRIPE_PRICE_PRO_MONTHLY=... STRIPE_PRICE_PRO_YEARLY=... \
  REVENUECAT_WEBHOOK_SECRET=...

npm run deploy:function
```

## 4. Verify

- Unsigned Stripe / RC webhooks → `401` (or `503` if secret unset)
- Authenticated `/subscription/upgrade` → `403 PAYMENT_REQUIRED`
- Web: Subscribe → Stripe Checkout → return `?checkout=success` → tier updates after webhook
- Native: purchase / restore → RC webhook → same KV entitlement

Until secrets and store products exist, the UI shows **Checkout not configured** / **Store billing not configured** and does not fake-grant tiers.
