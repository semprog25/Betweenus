# 📊 Google AdMob Integration for Native Apps

Complete implementation for native mobile ads in Between Us using Capacitor.

---

## 📦 Installation

```bash
npm install @capacitor-community/admob
npx cap sync
```

---

## 🔧 Configure AdMob

### Step 1: Get AdMob App IDs

1. Go to https://admob.google.com
2. Click **Apps** → **Add App**
3. Create separate apps for iOS and Android
4. Get your App IDs:
   - iOS: `ca-app-pub-XXXXX~YYYYY`
   - Android: `ca-app-pub-XXXXX~YYYYY`

### Step 2: Create Ad Units

For each app, create ad units:

1. **Banner Ad** (for bottom of screen)
   - Ad unit ID: `ca-app-pub-XXXXX/YYYYY`
   
2. **Interstitial Ad** (full screen between actions)
   - Ad unit ID: `ca-app-pub-XXXXX/YYYYY`
   
3. **Rewarded Ad** (watch ad for rewards)
   - Ad unit ID: `ca-app-pub-XXXXX/YYYYY`

Save these IDs - you'll need them!

---

## ⚙️ iOS Configuration

### 1. Update `ios/App/App/Info.plist`

Add your AdMob App ID:

```xml
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-XXXXX~YYYYY</string>

<key>SKAdNetworkItems</key>
<array>
  <dict>
    <key>SKAdNetworkIdentifier</key>
    <string>cstr6suwn9.skadnetwork</string>
  </dict>
</array>
```

### 2. Update tracking permission (iOS 14+)

Already in Info.plist (add if missing):

```xml
<key>NSUserTrackingUsageDescription</key>
<string>This identifier will be used to deliver personalized ads to you.</string>
```

---

## 🤖 Android Configuration

### 1. Update `android/app/src/main/AndroidManifest.xml`

Add inside `<application>` tag:

```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-XXXXX~YYYYY"/>
```

---

## 🎯 Create AdMob Service

Create `/services/AdMobService.ts`:

```typescript
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, AdMobError, AdmobConsentStatus, AdmobConsentDebugGeography } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

// Replace with your actual Ad Unit IDs
const AD_UNITS = {
  ios: {
    banner: 'ca-app-pub-3940256099942544/2934735716', // Test ID
    interstitial: 'ca-app-pub-3940256099942544/4411468910', // Test ID
    rewarded: 'ca-app-pub-3940256099942544/1712485313', // Test ID
  },
  android: {
    banner: 'ca-app-pub-3940256099942544/6300978111', // Test ID
    interstitial: 'ca-app-pub-3940256099942544/1033173712', // Test ID
    rewarded: 'ca-app-pub-3940256099942544/5224354917', // Test ID
  }
};

class AdMobService {
  private initialized = false;
  private bannerShowing = false;
  private interstitialLoaded = false;
  private rewardedLoaded = false;
  private platform: 'ios' | 'android' = 'ios';

  constructor() {
    this.platform = Capacitor.getPlatform() as 'ios' | 'android';
  }

  /**
   * Initialize AdMob
   * Call this once when app starts
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Check if running on mobile
      if (!Capacitor.isNativePlatform()) {
        console.log('AdMob not available on web');
        return;
      }

      // Request consent (GDPR compliance)
      await this.requestConsent();

      // Initialize AdMob
      await AdMob.initialize({
        requestTrackingAuthorization: true,
        initializeForTesting: false, // Set to true for testing
      });

      // Preload interstitial and rewarded ads
      this.preloadInterstitial();
      this.preloadRewarded();

      this.initialized = true;
      console.log('AdMob initialized');
    } catch (error) {
      console.error('Failed to initialize AdMob:', error);
    }
  }

  /**
   * Request user consent for ads (GDPR)
   */
  private async requestConsent() {
    try {
      const result = await AdMob.requestConsentInfo();
      
      if (result.status === AdmobConsentStatus.REQUIRED) {
        // Show consent form
        await AdMob.showConsentForm();
      }
    } catch (error) {
      console.error('Consent request failed:', error);
    }
  }

  /**
   * Show banner ad at bottom of screen
   */
  async showBanner() {
    if (!this.initialized || this.bannerShowing) return;

    try {
      const options: BannerAdOptions = {
        adId: this.getAdUnitId('banner'),
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
      };

      await AdMob.showBanner(options);
      this.bannerShowing = true;
      console.log('Banner ad shown');
    } catch (error) {
      console.error('Failed to show banner:', error);
    }
  }

  /**
   * Hide banner ad
   */
  async hideBanner() {
    if (!this.bannerShowing) return;

    try {
      await AdMob.hideBanner();
      this.bannerShowing = false;
      console.log('Banner ad hidden');
    } catch (error) {
      console.error('Failed to hide banner:', error);
    }
  }

  /**
   * Remove banner ad completely
   */
  async removeBanner() {
    if (!this.bannerShowing) return;

    try {
      await AdMob.removeBanner();
      this.bannerShowing = false;
      console.log('Banner ad removed');
    } catch (error) {
      console.error('Failed to remove banner:', error);
    }
  }

  /**
   * Preload interstitial ad
   */
  private async preloadInterstitial() {
    try {
      await AdMob.prepareInterstitial({
        adId: this.getAdUnitId('interstitial'),
      });
      this.interstitialLoaded = true;
      console.log('Interstitial ad loaded');
    } catch (error) {
      console.error('Failed to load interstitial:', error);
      this.interstitialLoaded = false;
    }
  }

  /**
   * Show interstitial ad (full screen)
   * Returns true if ad was shown
   */
  async showInterstitial(): Promise<boolean> {
    if (!this.initialized || !this.interstitialLoaded) {
      return false;
    }

    try {
      await AdMob.showInterstitial();
      console.log('Interstitial ad shown');
      
      // Preload next interstitial
      this.interstitialLoaded = false;
      setTimeout(() => this.preloadInterstitial(), 1000);
      
      return true;
    } catch (error) {
      console.error('Failed to show interstitial:', error);
      return false;
    }
  }

  /**
   * Preload rewarded ad
   */
  private async preloadRewarded() {
    try {
      await AdMob.prepareRewardVideoAd({
        adId: this.getAdUnitId('rewarded'),
      });
      this.rewardedLoaded = true;
      console.log('Rewarded ad loaded');
    } catch (error) {
      console.error('Failed to load rewarded ad:', error);
      this.rewardedLoaded = false;
    }
  }

  /**
   * Show rewarded ad
   * Returns reward amount if user watched the ad
   */
  async showRewarded(): Promise<number | null> {
    if (!this.initialized || !this.rewardedLoaded) {
      return null;
    }

    try {
      const result = await AdMob.showRewardVideoAd();
      console.log('Rewarded ad shown');
      
      // Preload next rewarded ad
      this.rewardedLoaded = false;
      setTimeout(() => this.preloadRewarded(), 1000);
      
      // Return reward amount (typically 1 for watched ad)
      return result.reward?.amount || 1;
    } catch (error) {
      console.error('Failed to show rewarded ad:', error);
      return null;
    }
  }

  /**
   * Check if interstitial ad is ready
   */
  isInterstitialReady(): boolean {
    return this.interstitialLoaded;
  }

  /**
   * Check if rewarded ad is ready
   */
  isRewardedReady(): boolean {
    return this.rewardedLoaded;
  }

  /**
   * Get the correct ad unit ID for current platform
   */
  private getAdUnitId(type: 'banner' | 'interstitial' | 'rewarded'): string {
    return AD_UNITS[this.platform][type];
  }

  /**
   * Resume ads (call when app comes to foreground)
   */
  async resume() {
    // Ads automatically resume
  }

  /**
   * Pause ads (call when app goes to background)
   */
  async pause() {
    // Ads automatically pause
  }
}

// Export singleton instance
export const adMobService = new AdMobService();
```

---

## 🎯 Usage in Your App

### Initialize on App Start

In `/App.tsx`:

```typescript
import { useEffect } from 'react';
import { adMobService } from './services/AdMobService';
import { paymentService } from './services/PaymentService';

function App() {
  useEffect(() => {
    // Initialize services
    initializeServices();
  }, []);

  const initializeServices = async () => {
    try {
      // Check if user has paid subscription
      const hasSubscription = await paymentService.hasActiveSubscription();
      
      // Only show ads for free users
      if (!hasSubscription) {
        await adMobService.initialize();
      }
    } catch (error) {
      console.error('Failed to initialize:', error);
    }
  };

  return (
    // Your app
  );
}
```

---

## 📱 Show Banner Ads (Bottom of Screen)

### In Your Main Tabs Component:

```typescript
import { useEffect, useState } from 'react';
import { adMobService } from '../services/AdMobService';
import { paymentService } from '../services/PaymentService';

export function MainTabs() {
  const [showAds, setShowAds] = useState(false);

  useEffect(() => {
    checkSubscriptionAndShowAds();
  }, []);

  const checkSubscriptionAndShowAds = async () => {
    const hasSubscription = await paymentService.hasActiveSubscription();
    setShowAds(!hasSubscription);

    if (!hasSubscription) {
      // Show banner ad
      await adMobService.showBanner();
    }
  };

  useEffect(() => {
    return () => {
      // Remove banner when component unmounts
      adMobService.removeBanner();
    };
  }, []);

  return (
    <div className={showAds ? 'with-bottom-ad' : ''}>
      {/* Your tab content */}
    </div>
  );
}
```

### Add CSS for Banner Ad Space:

```css
/* Add padding to avoid content being covered by banner ad */
.with-bottom-ad {
  padding-bottom: 60px; /* Height of banner ad */
}
```

---

## 🎬 Show Interstitial Ads (Full Screen)

Show after certain actions (e.g., every 5 posts for free users):

```typescript
import { adMobService } from '../services/AdMobService';
import { paymentService } from '../services/PaymentService';

export function ShareTab() {
  const [postCount, setPostCount] = useState(0);

  const handleSubmitPost = async (content: string) => {
    // Submit post logic...
    
    // Increment post count
    const newCount = postCount + 1;
    setPostCount(newCount);

    // Show interstitial ad every 5 posts for free users
    const hasSubscription = await paymentService.hasActiveSubscription();
    
    if (!hasSubscription && newCount % 5 === 0) {
      const shown = await adMobService.showInterstitial();
      if (shown) {
        console.log('Interstitial ad shown');
      }
    }

    // Continue with success message, etc.
  };

  return (
    // Your share form
  );
}
```

---

## 🎁 Rewarded Ads (Watch Ad for Bonus)

Give users bonus points or credits for watching ads:

```typescript
import { adMobService } from '../services/AdMobService';

export function RewardedAdButton() {
  const [loading, setLoading] = useState(false);
  const [canWatch, setCanWatch] = useState(false);

  useEffect(() => {
    // Check if rewarded ad is ready
    setCanWatch(adMobService.isRewardedReady());
  }, []);

  const handleWatchAd = async () => {
    try {
      setLoading(true);

      // Show rewarded ad
      const reward = await adMobService.showRewarded();

      if (reward) {
        // User watched the ad! Give reward
        await giveUserReward(reward);
        toast.success(`You earned ${reward * 10} bonus points! 🎉`);
      } else {
        toast.error('Ad not available. Try again later.');
      }
    } catch (error) {
      console.error('Rewarded ad error:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const giveUserReward = async (rewardAmount: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Give bonus points
    const points = rewardAmount * 10; // 1 ad = 10 points

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('total_points')
      .eq('user_id', user.id)
      .single();

    const currentPoints = profile?.total_points || 0;

    await supabase
      .from('user_profiles')
      .update({
        total_points: currentPoints + points,
      })
      .eq('user_id', user.id);
  };

  return (
    <button
      onClick={handleWatchAd}
      disabled={!canWatch || loading}
      className="rewarded-ad-button"
    >
      {loading ? 'Loading...' : '📺 Watch Ad for +10 Points'}
    </button>
  );
}
```

---

## 🎮 Complete Ad Strategy for Between Us

### Free Tier:
- ✅ Banner ads on all tabs (bottom)
- ✅ Interstitial ad every 5 posts
- ✅ Rewarded ad option for bonus points
- ✅ Can upgrade to remove ads

### Premium Tier:
- ❌ No banner ads
- ❌ No interstitial ads
- ✅ Can still watch rewarded ads for bonus points

### Pro & Lifetime Tier:
- ❌ No ads at all
- ❌ No rewarded ads option (don't need it)

---

## 🔧 Implement Ad-Free Check

Create a utility hook:

```typescript
import { useState, useEffect } from 'react';
import { paymentService } from '../services/PaymentService';

export function useAdFree() {
  const [isAdFree, setIsAdFree] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdFree();
  }, []);

  const checkAdFree = async () => {
    try {
      const hasSubscription = await paymentService.hasActiveSubscription();
      setIsAdFree(hasSubscription);
    } catch (error) {
      console.error('Failed to check subscription:', error);
      setIsAdFree(false);
    } finally {
      setLoading(false);
    }
  };

  return { isAdFree, loading, refresh: checkAdFree };
}
```

Usage:

```typescript
function SomeComponent() {
  const { isAdFree, loading } = useAdFree();

  useEffect(() => {
    if (!loading && !isAdFree) {
      adMobService.showBanner();
    }
  }, [isAdFree, loading]);

  // Rest of component
}
```

---

## 🧪 Testing AdMob

### Test Ad Unit IDs:

Already included in the code above. These show test ads:

**iOS:**
- Banner: `ca-app-pub-3940256099942544/2934735716`
- Interstitial: `ca-app-pub-3940256099942544/4411468910`
- Rewarded: `ca-app-pub-3940256099942544/1712485313`

**Android:**
- Banner: `ca-app-pub-3940256099942544/6300978111`
- Interstitial: `ca-app-pub-3940256099942544/1033173712`
- Rewarded: `ca-app-pub-3940256099942544/5224354917`

### Before Production:

1. Replace test ad unit IDs with your real ones
2. Set `initializeForTesting: false`
3. Test on real devices
4. Verify ads show correctly

---

## 📊 Monitor Ad Revenue

### In AdMob Console:

1. Go to https://admob.google.com
2. Dashboard shows:
   - Daily revenue
   - eCPM (earnings per 1000 impressions)
   - Click-through rate
   - Impressions
3. Adjust ad placement for better revenue

### Expected Revenue (Estimates):

- **Banner ad**: $0.01 - $0.50 per day per user
- **Interstitial ad**: $1 - $5 per 1000 impressions
- **Rewarded ad**: $10 - $50 per 1000 impressions

With 1000 active free users:
- Estimated monthly revenue: $100 - $500

---

## ⚖️ Balance Ads and User Experience

### Best Practices:

✅ **DO:**
- Show banner ads only on free tier
- Limit interstitials (every 5 actions, not every action)
- Offer rewarded ads as optional bonus
- Remove all ads for paying users
- Give users a way to dismiss (upgrade)

❌ **DON'T:**
- Show too many interstitials (annoying)
- Block critical features behind rewarded ads
- Show ads during sensitive moments (mental health check-ins)
- Auto-play video ads with sound
- Show ads on first app open

### Recommended Frequency:

- **Banner**: Always (free tier only)
- **Interstitial**: Every 5-10 posts
- **Rewarded**: User-initiated only

---

## 🔧 Troubleshooting

### Ads not showing?

1. ✅ Check Ad Unit IDs are correct
2. ✅ Verify App IDs in Info.plist / AndroidManifest.xml
3. ✅ Test on real device (not simulator/emulator)
4. ✅ Wait 1-2 hours after AdMob setup
5. ✅ Check AdMob console for errors

### "AdMob not available on web"?

This is normal. AdMob only works on native iOS/Android apps, not in browser.

### Low ad fill rate?

- Add more ad networks in AdMob (mediation)
- Enable Google Optimized Mediation
- Wait 1-2 weeks for fill rate to improve

---

## 💡 Revenue Optimization Tips

1. **Use Adaptive Banners**: Automatically adjust to screen size
2. **Enable Mediation**: Show ads from multiple networks
3. **Optimize Placement**: Test different interstitial frequencies
4. **Target High eCPM Countries**: Focus marketing on US, UK, Canada
5. **Monitor Analytics**: Check which ad types perform best

---

## 📝 Update Privacy Policy

Add to your privacy policy:

```
Advertising:
We use Google AdMob to show ads in the free version of our app. 
AdMob may collect and use data for advertising purposes. 
You can opt-out of personalized ads in your device settings.

For more info: https://policies.google.com/privacy
```

---

## ✅ Final Checklist

Before going live:

- [ ] Replace test ad unit IDs with production IDs
- [ ] Set `initializeForTesting: false`
- [ ] Test on real iOS device
- [ ] Test on real Android device
- [ ] Verify ads show for free users
- [ ] Verify ads hide for premium users
- [ ] Add privacy policy disclosure
- [ ] Monitor AdMob console for errors

---

## 🎯 Summary

Your complete AdMob setup:
- ✅ Banner ads for free users (bottom of screen)
- ✅ Interstitial ads every 5 posts
- ✅ Rewarded ads for bonus points
- ✅ No ads for premium/pro/lifetime users
- ✅ GDPR compliant (consent)
- ✅ Revenue tracking in AdMob console

**Expected setup time**: 2-3 hours

---

💰 You're ready to monetize your app with ads!
