# Paywall Implementation Guide

Complete guide for adding payment paywalls throughout your Between Us app.

## 🎯 Overview

You have multiple options for showing paywalls:

1. **RevenueCat Native Paywall UI** - Beautiful native paywall interface
2. **Custom Paywall Modal** - Your existing SubscriptionModal
3. **PaywallGate Component** - For gating premium features
4. **usePaywall Hook** - Programmatic paywall triggering

---

## 🚀 Quick Start

### Option 1: Use RevenueCat Native Paywall (Recommended)

The easiest way - just call `presentPaywall()`:

```typescript
import { presentPaywall, getCurrentOffering, syncSubscriptionWithBackend } from '../utils/revenuecat';
import { getSession } from '../utils/auth';

// Show paywall
const showPaywall = async () => {
  const offering = await getCurrentOffering();
  const result = await presentPaywall(offering || undefined);
  
  if (!result.dismissed && result.customerInfo) {
    // Purchase successful!
    const session = getSession();
    if (session?.user?.id) {
      await syncSubscriptionWithBackend(session.user.id);
    }
    toast.success('Subscription activated! 🎉');
  }
};
```

---

## 📦 Using the usePaywall Hook

### Basic Usage

```typescript
import { usePaywall } from '../hooks/usePaywall';

function MyComponent() {
  const { showPaywall, isPresenting } = usePaywall();

  return (
    <Button onClick={() => showPaywall()} disabled={isPresenting}>
      Upgrade to Pro
    </Button>
  );
}
```

### With Callbacks

```typescript
const { showPaywall } = usePaywall();

const handleUpgrade = () => {
  showPaywall({
    onPurchaseSuccess: () => {
      // Refresh data, show success message, etc.
      loadUserData();
      toast.success('Welcome to BetweenUS Pro!');
    },
    onDismissed: () => {
      console.log('User dismissed paywall');
    },
  });
};
```

### Check Before Showing

```typescript
const { checkAndShowPaywall } = usePaywall();

const handlePremiumAction = async () => {
  const hasAccess = await checkAndShowPaywall({
    onPurchaseSuccess: () => {
      // Continue with action
      performPremiumAction();
    },
  });
  
  if (hasAccess) {
    // User already has pro, proceed
    performPremiumAction();
  }
};
```

---

## 🚪 Using PaywallGate Component

Wrap premium features with the PaywallGate component:

### Inline Paywall (Blurred Preview)

```typescript
import { PaywallGate } from '../components/PaywallGate';

function PremiumFeature() {
  return (
    <PaywallGate
      featureName="Unlimited Posts"
      description="Post as much as you want with BetweenUS Pro"
      inline={true}
    >
      {/* Your premium feature content */}
      <div>
        <h2>Unlimited Posts</h2>
        <PostForm />
      </div>
    </PaywallGate>
  );
}
```

### Button Trigger

```typescript
<PaywallGate
  featureName="Edit Post"
  trigger={
    <Button>
      <Edit className="w-4 h-4 mr-2" />
      Edit Post
    </Button>
  }
>
  <EditPostForm />
</PaywallGate>
```

---

## 📍 Where to Add Paywalls

### 1. Share Tab - Post Limit Reached

**Already implemented!** ✅

When users hit their post limit, a toast appears with an "Upgrade" button that opens the subscription modal.

**Location:** `src/components/ShareTab.tsx`

```typescript
// Already working:
if (!limitResponse.canPost) {
  toast.error(t('share.limitReached'), {
    action: {
      label: t('share.upgrade'),
      onClick: () => setIsSubscriptionModalOpen(true),
    },
  });
}
```

**Enhancement - Add Native Paywall:**

```typescript
import { usePaywall } from '../hooks/usePaywall';

// In ShareTab component
const { showPaywall } = usePaywall();

// Replace the subscription modal trigger with:
if (!limitResponse.canPost) {
  toast.error(t('share.limitReached'), {
    action: {
      label: t('share.upgrade'),
      onClick: () => showPaywall({
        onPurchaseSuccess: () => loadLimits(),
      }),
    },
  });
}
```

---

### 2. Edit Post Feature

Add paywall when free users try to edit:

**Location:** `src/components/ProfileTab.tsx` or `src/components/ListenTab.tsx`

```typescript
import { PaywallGate } from '../components/PaywallGate';

function EditPostButton({ postId }: { postId: string }) {
  return (
    <PaywallGate
      featureName="Edit Post"
      description="Edit your posts with BetweenUS Pro"
      trigger={
        <Button variant="outline" size="sm">
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Button>
      }
    >
      <EditPostDialog postId={postId} />
    </PaywallGate>
  );
}
```

---

### 3. Advanced Features

Gate premium features like:

```typescript
import { usePaywall } from '../hooks/usePaywall';

function AdvancedAnalytics() {
  const { showPaywallForFeature } = usePaywall();
  
  const handleViewAnalytics = async () => {
    const hasAccess = await showPaywallForFeature('Advanced Analytics', {
      onPurchaseSuccess: () => {
        // Show analytics
        setShowAnalytics(true);
      },
    });
    
    if (hasAccess) {
      setShowAnalytics(true);
    }
  };
  
  return (
    <Button onClick={handleViewAnalytics}>
      View Advanced Analytics
    </Button>
  );
}
```

---

### 4. Profile Tab - Subscription Section

**Already implemented!** ✅

Users can upgrade from the Profile tab via the Subscription Modal.

**Enhancement - Add Quick Upgrade Button:**

```typescript
import { usePaywall } from '../hooks/usePaywall';

// In ProfileTab
const { showPaywall, checkAndShowPaywall } = usePaywall();

// Add a quick upgrade button
<Button onClick={() => showPaywall()}>
  <Crown className="w-4 h-4 mr-2" />
  Upgrade Now
</Button>
```

---

### 5. Listen Tab - Premium Filters

```typescript
import { PaywallGate } from '../components/PaywallGate';

function PremiumFilters() {
  return (
    <PaywallGate
      featureName="Premium Filters"
      description="Filter posts by category, mood, and more"
      inline={true}
    >
      <FilterOptions />
    </PaywallGate>
  );
}
```

---

## 🎨 Custom Paywall Trigger Examples

### Example 1: Post Limit Banner

```typescript
import { usePaywall } from '../hooks/usePaywall';

function PostLimitBanner({ postsRemaining }: { postsRemaining: number }) {
  const { showPaywall } = usePaywall();
  
  if (postsRemaining > 0) return null;
  
  return (
    <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white p-4 rounded-lg mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold">You've reached your post limit!</h3>
          <p className="text-sm">Upgrade to BetweenUS Pro for unlimited posts</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => showPaywall()}
        >
          Upgrade Now
        </Button>
      </div>
    </div>
  );
}
```

### Example 2: Feature Teaser

```typescript
import { PaywallGate } from '../components/PaywallGate';

function PremiumFeatureTeaser() {
  return (
    <div className="relative">
      <PaywallGate inline={true} featureName="Premium Dashboard">
        <Dashboard />
      </PaywallGate>
    </div>
  );
}
```

---

## 🔄 Best Practices

### 1. Always Check Before Showing

```typescript
// ✅ Good - Check first
const hasPro = await hasBetweenUSPro();
if (!hasPro) {
  await showPaywall();
}

// ❌ Bad - Show paywall without checking
await showPaywall(); // User might already have pro!
```

### 2. Sync After Purchase

```typescript
const result = await presentPaywall();
if (!result.dismissed && result.customerInfo) {
  // Always sync with backend
  await syncSubscriptionWithBackend(userId);
  // Refresh app state
  loadUserData();
}
```

### 3. Provide Context

```typescript
// ✅ Good - Explain why
showPaywallForFeature('Edit Post', {
  onPurchaseSuccess: () => {
    openEditDialog();
  },
});

// ❌ Bad - No context
showPaywall(); // User doesn't know why they're seeing this
```

### 4. Handle Errors Gracefully

```typescript
try {
  await showPaywall();
} catch (error) {
  // Fallback to subscription modal
  setIsSubscriptionModalOpen(true);
}
```

### 5. Don't Spam Users

```typescript
// ✅ Good - Check if recently shown
const lastShown = localStorage.getItem('paywall_last_shown');
const daysSince = (Date.now() - parseInt(lastShown || '0')) / (1000 * 60 * 60 * 24);

if (daysSince > 1) {
  await showPaywall();
  localStorage.setItem('paywall_last_shown', Date.now().toString());
}
```

---

## 📱 Platform Handling

The paywall utilities automatically handle platform differences:

```typescript
// On web - shows message
// On mobile - shows native paywall
const { showPaywall } = usePaywall();

// Works on both platforms
await showPaywall({
  webMessage: 'Please use the mobile app to subscribe',
});
```

---

## 🧪 Testing

### Test Paywall Flow

1. **Test on Device:**
   ```bash
   npm run build
   npx cap sync
   npx cap open ios  # or android
   ```

2. **Test Purchase:**
   - Use sandbox test account
   - Complete purchase
   - Verify entitlement is active
   - Verify backend sync works

3. **Test Dismissal:**
   - Open paywall
   - Dismiss without purchasing
   - Verify no errors

---

## 🎯 Recommended Implementation Strategy

### Phase 1: Key Entry Points ✅

- [x] Share Tab - Post limit reached
- [x] Profile Tab - Subscription section
- [x] Subscription Modal - View All Plans button

### Phase 2: Premium Features

- [ ] Edit Post - Add PaywallGate
- [ ] Advanced Filters - Add PaywallGate
- [ ] Premium Analytics - Add PaywallGate
- [ ] Export Data - Add PaywallGate

### Phase 3: Growth Hooks

- [ ] Post limit banner (when 1 post remaining)
- [ ] Feature teasers (blurred previews)
- [ ] Contextual upgrade prompts

---

## 📊 Analytics Integration

Track paywall events:

```typescript
const { showPaywall } = usePaywall();

const handleUpgrade = async () => {
  // Track paywall shown
  analytics.track('paywall_shown', {
    source: 'share_tab',
    feature: 'unlimited_posts',
  });
  
  await showPaywall({
    onPurchaseSuccess: () => {
      analytics.track('subscription_purchased', {
        source: 'share_tab',
      });
    },
    onDismissed: () => {
      analytics.track('paywall_dismissed', {
        source: 'share_tab',
      });
    },
  });
};
```

---

## ✅ Quick Implementation Checklist

- [x] RevenueCat SDK integrated
- [x] usePaywall hook created
- [x] PaywallGate component created
- [x] SubscriptionModal with RevenueCat
- [ ] Add paywall to post limit reached (enhance existing)
- [ ] Add PaywallGate to edit feature
- [ ] Add paywall to premium features
- [ ] Test on iOS device
- [ ] Test on Android device
- [ ] Configure products in RevenueCat Dashboard
- [ ] Configure products in App Stores

---

## 🎉 Next Steps

1. **Add PaywallGate to Edit Feature:**
   - Find edit post button/link
   - Wrap with PaywallGate
   - Test with free user

2. **Enhance Post Limit Flow:**
   - Update ShareTab to use native paywall
   - Add banner when limit approaching

3. **Configure Products:**
   - Set up in RevenueCat Dashboard
   - Configure in App Store Connect
   - Configure in Google Play Console

4. **Test & Launch:**
   - Test all paywall flows
   - Verify purchases work
   - Launch to production

---

**Ready to implement!** Start with the usePaywall hook for the easiest integration. 🚀
