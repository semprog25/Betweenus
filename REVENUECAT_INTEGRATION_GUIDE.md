# RevenueCat Integration Guide - Between Us App

Complete guide for RevenueCat SDK integration in your Between Us React/Capacitor app.

## 📦 Installation

The RevenueCat packages are already installed:

```bash
npm install @revenuecat/purchases-capacitor @revenuecat/purchases-capacitor-ui
```

**Status:** ✅ Installed

---

## 🔑 Configuration

### API Key

The RevenueCat API key is configured in `/src/utils/revenuecat.tsx`:

```typescript
const REVENUECAT_API_KEY = 'test_WmecNTXNBZcHNrjcaPxMeYhXVQq';
```

**Note:** This is a test API key. For production, use your production API key from RevenueCat Dashboard.

---

## 🚀 Initialization

RevenueCat is automatically initialized in `App.tsx` when the app loads:

```typescript
// In App.tsx
useEffect(() => {
  const initRevenueCat = async () => {
    const session = getSession();
    const userId = session?.user?.id;
    
    await initializeRevenueCat(userId);
    
    if (userId) {
      await identifyRevenueCatUser(userId);
    }
  };
  
  initRevenueCat();
}, []);
```

**Status:** ✅ Initialized

---

## 🎯 Entitlements

### BetweenUS Pro Entitlement

The entitlement identifier is configured as:

```typescript
export const ENTITLEMENT_IDENTIFIER = 'BetweenUS Pro';
```

### Checking Entitlement Status

```typescript
import { hasBetweenUSPro, getSubscriptionStatus } from './utils/revenuecat';

// Simple check
const hasPro = await hasBetweenUSPro();

// Detailed status
const status = await getSubscriptionStatus();
// Returns: { hasPro, entitlement, expirationDate, willRenew, isTrial, isIntroPeriod }
```

---

## 📦 Products Configuration

### Product Identifiers

The following product identifiers are configured in the SDK:

```typescript
export const PRODUCT_IDENTIFIERS = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  LIFETIME: 'lifetime',
  CONSUMABLE: 'consumable',
};
```

### Setting Up Products in RevenueCat Dashboard

1. **Go to RevenueCat Dashboard** → Your Project → Products
2. **Add Products:**
   - `monthly` - Monthly subscription
   - `yearly` - Yearly subscription
   - `lifetime` - Lifetime purchase
   - `consumable` - Consumable in-app purchase

3. **Create Offerings:**
   - Go to Offerings section
   - Create an offering (e.g., "default")
   - Add packages with your products
   - Package types: `MONTHLY`, `ANNUAL`, `LIFETIME`

4. **Create Entitlement:**
   - Go to Entitlements section
   - Create entitlement: `BetweenUS Pro`
   - Attach products to this entitlement

### App Store Connect / Google Play Console

For each product, you need to:

1. **iOS (App Store Connect):**
   - Create subscription/product
   - Set price and duration
   - Use same product ID as in RevenueCat

2. **Android (Google Play Console):**
   - Create subscription/product
   - Set price and duration
   - Use same product ID as in RevenueCat

---

## 💳 Purchasing

### Purchase a Package

```typescript
import { getCurrentOffering, purchasePackage, getMonthlyPackage } from './utils/revenuecat';

// Get offering
const offering = await getCurrentOffering();

// Get specific package
const monthlyPackage = getMonthlyPackage(offering);

// Purchase
const result = await purchasePackage(monthlyPackage);

if (result.success) {
  // Purchase successful
  // Sync with backend
  await syncSubscriptionWithBackend(userId);
}
```

### Handle Purchase Errors

```typescript
const result = await purchasePackage(pkg);

if (!result.success) {
  if (result.errorCode === 'PURCHASE_CANCELLED') {
    // User cancelled - no error needed
  } else {
    toast.error(result.error || 'Purchase failed');
  }
}
```

---

## 🎨 RevenueCat Paywall UI

The app includes support for RevenueCat's native Paywall UI:

```typescript
import { presentPaywall } from './utils/revenuecat';

// Present paywall (shows current offering)
const result = await presentPaywall();

// Or present specific offering
const result = await presentPaywall(specificOffering);
```

**Usage in SubscriptionModal:**
- "View All Plans" button opens the RevenueCat Paywall UI
- Automatically handles purchases
- Shows all available packages

---

## 👤 Customer Center

The Customer Center allows users to manage their subscriptions:

```typescript
import { presentCustomerCenter, isCustomerCenterAvailable } from './utils/revenuecat';

// Check if available
const available = await isCustomerCenterAvailable();

// Present customer center
await presentCustomerCenter();
```

**Features:**
- View subscription details
- Manage subscriptions (cancel, change plan)
- Restore purchases
- View purchase history

**Usage in SubscriptionModal:**
- "Manage Subscription" button opens Customer Center
- Only shown if available on the platform

---

## 🔄 Restore Purchases

```typescript
import { restorePurchases, hasBetweenUSPro } from './utils/revenuecat';

const customerInfo = await restorePurchases();
const hasPro = await hasBetweenUSPro();

if (hasPro) {
  // Sync with backend
  await syncSubscriptionWithBackend(userId);
}
```

**Usage:**
- "Restore Purchases" button in SubscriptionModal
- Useful when user reinstalls app or signs in on new device

---

## 👥 User Identification

RevenueCat automatically identifies users:

1. **On App Load:** If user is logged in, they're identified
2. **On Sign In:** User is identified with their user ID
3. **On Sign Out:** User is logged out of RevenueCat

```typescript
// In App.tsx - automatically called
await identifyRevenueCatUser(userId);

// On sign out
await logoutRevenueCatUser();
```

---

## 📊 Customer Info

Get detailed customer information:

```typescript
import { getCustomerInfo } from './utils/revenuecat';

const customerInfo = await getCustomerInfo();

// Access entitlements
const hasPro = customerInfo.entitlements.active['BetweenUS Pro']?.isActive;

// Access all purchases
const allPurchases = customerInfo.allPurchasedProductIdentifiers;

// Access active subscriptions
const activeSubs = customerInfo.activeSubscriptions;
```

---

## 🔄 Sync with Backend

After successful purchase or restore, sync with your Supabase backend:

```typescript
import { syncSubscriptionWithBackend } from './utils/revenuecat';

await syncSubscriptionWithBackend(userId);
```

This updates the subscription tier in your backend database.

---

## 🛠️ Helper Functions

### Get Packages from Offering

```typescript
import { 
  getMonthlyPackage, 
  getYearlyPackage, 
  getLifetimePackage,
  getPackageByIdentifier 
} from './utils/revenuecat';

const offering = await getCurrentOffering();

// Get specific package types
const monthly = getMonthlyPackage(offering);
const yearly = getYearlyPackage(offering);
const lifetime = getLifetimePackage(offering);

// Get by identifier
const custom = getPackageByIdentifier(offering, 'custom_package_id');
```

### Format Price

```typescript
import { formatPrice } from './utils/revenuecat';

const priceString = formatPrice(package.product);
// Returns: "$9.99" or localized price string
```

---

## 📱 Platform-Specific Notes

### iOS

- Requires App Store Connect setup
- Products must be configured in App Store Connect
- Test with sandbox accounts
- RevenueCat handles receipt validation

### Android

- Requires Google Play Console setup
- Products must be configured in Google Play Console
- Test with license testers
- RevenueCat handles purchase verification

### Web

- RevenueCat only works on native mobile platforms
- All functions gracefully return null/false on web
- SubscriptionModal shows appropriate message on web

---

## 🧪 Testing

### Test Environment

1. **Use Test API Key:** Already configured (`test_WmecNTXNBZcHNrjcaPxMeYhXVQq`)
2. **Sandbox Testing:**
   - iOS: Use sandbox test accounts
   - Android: Use license testers

### Test Purchase Flow

1. Build app: `npm run build`
2. Sync Capacitor: `npx cap sync`
3. Run on device: `npx cap open ios` or `npx cap open android`
4. Test purchase flow in SubscriptionModal

### Verify Entitlements

```typescript
// Check entitlement status
const status = await getSubscriptionStatus();
console.log('Subscription Status:', status);
```

---

## 🐛 Error Handling

All RevenueCat functions include comprehensive error handling:

```typescript
try {
  const result = await purchasePackage(pkg);
  // Handle success
} catch (error) {
  // Error is already logged and handled
  // Result object contains error details
}
```

### Common Error Codes

- `PURCHASE_CANCELLED` - User cancelled purchase
- `PAYMENT_PENDING` - Payment is pending
- `STORE_PROBLEM` - Store error
- `PURCHASE_NOT_ALLOWED` - Purchases not allowed
- `PURCHASE_INVALID` - Invalid purchase

---

## 📝 Best Practices

1. **Always Check Entitlements:** Use `hasBetweenUSPro()` before granting access
2. **Sync with Backend:** Always sync after purchase/restore
3. **Handle Errors Gracefully:** Don't show errors for user cancellations
4. **Provide Restore Option:** Always include "Restore Purchases" button
5. **Show Customer Center:** Let users manage subscriptions easily
6. **Use Paywall UI:** RevenueCat Paywall UI provides best UX
7. **Test Thoroughly:** Test all purchase flows before production

---

## 🔐 Security

- **Never expose Service Role Key:** Only use public API key in app
- **Validate Server-Side:** Use RevenueCat webhooks to validate purchases
- **Use Entitlements:** Check entitlements, not product IDs
- **Test in Sandbox:** Always test purchases in sandbox environment

---

## 📚 Resources

- [RevenueCat Documentation](https://www.revenuecat.com/docs)
- [Capacitor Installation Guide](https://www.revenuecat.com/docs/getting-started/installation/capacitor)
- [Paywalls Documentation](https://www.revenuecat.com/docs/tools/paywalls)
- [Customer Center Documentation](https://www.revenuecat.com/docs/tools/customer-center)
- [Testing Guide](https://www.revenuecat.com/docs/test-and-troubleshoot)

---

## ✅ Integration Checklist

- [x] RevenueCat packages installed
- [x] API key configured
- [x] SDK initialized in App.tsx
- [x] Entitlement checking implemented
- [x] Purchase functionality implemented
- [x] Restore purchases implemented
- [x] Paywall UI integrated
- [x] Customer Center integrated
- [x] Error handling implemented
- [x] SubscriptionModal updated
- [ ] Products configured in RevenueCat Dashboard
- [ ] Products configured in App Store Connect
- [ ] Products configured in Google Play Console
- [ ] Offerings created in RevenueCat
- [ ] Entitlements configured in RevenueCat
- [ ] Tested on iOS device
- [ ] Tested on Android device

---

## 🎉 Next Steps

1. **Configure Products in RevenueCat Dashboard:**
   - Add products (monthly, yearly, lifetime, consumable)
   - Create offerings
   - Create "BetweenUS Pro" entitlement
   - Attach products to entitlement

2. **Configure in App Stores:**
   - Set up products in App Store Connect (iOS)
   - Set up products in Google Play Console (Android)

3. **Test:**
   - Test purchases with sandbox accounts
   - Verify entitlements work correctly
   - Test restore purchases
   - Test Customer Center

4. **Production:**
   - Replace test API key with production key
   - Enable production mode
   - Deploy to App Store and Google Play

---

**Integration Status:** ✅ Complete  
**Last Updated:** December 13, 2024
