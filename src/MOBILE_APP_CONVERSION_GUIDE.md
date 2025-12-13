# Converting Between Us to iOS/Android Mobile Apps 📱

## Overview

This guide will walk you through converting your React web app into native iOS and Android applications using **Capacitor**. This approach allows you to:

✅ Keep 90%+ of your existing React code
✅ Build for iOS and Android from the same codebase  
✅ Access native device features (camera, notifications, etc.)
✅ Integrate RevenueCat for mobile subscriptions
✅ Publish to App Store and Google Play

---

## 🎯 Why Capacitor?

| Approach | Pros | Cons | Recommendation |
|----------|------|------|----------------|
| **Capacitor** | ✅ Use existing code<br>✅ Quick setup<br>✅ Native plugins | ⚠️ Larger app size | **BEST FOR YOU** |
| React Native | ✅ True native<br>✅ Best performance | ❌ Complete rewrite<br>❌ Months of work | Not recommended |
| Flutter | ✅ Beautiful UI | ❌ Complete rewrite<br>❌ Learn new language | Not recommended |
| PWA | ✅ Zero changes | ❌ Limited features<br>❌ No app stores | Limited |

**Verdict:** Capacitor is perfect for your situation!

---

## 📋 Prerequisites

### Development Environment

**For iOS Development:**
- Mac computer (required for iOS builds)
- Xcode 14+ (free from Mac App Store)
- CocoaPods (`sudo gem install cocoapods`)
- Apple Developer Account ($99/year)

**For Android Development:**
- Any computer (Windows, Mac, Linux)
- Android Studio (free)
- JDK 11 or higher
- Google Play Developer Account ($25 one-time)

**Both Platforms:**
- Node.js 16+ (already installed)
- npm or yarn (already installed)

---

## 🚀 Step 1: Install Capacitor

Since this is a Figma Make environment, I'll create a setup script, but you'll need to run these commands in your **local development environment**:

```bash
# Install Capacitor CLI and core
npm install @capacitor/core @capacitor/cli

# Install platform-specific packages
npm install @capacitor/ios @capacitor/android

# Install useful plugins
npm install @capacitor/status-bar @capacitor/splash-screen @capacitor/keyboard @capacitor/haptics @capacitor/network @capacitor/app @capacitor/camera @capacitor/push-notifications
```

---

## 🛠️ Step 2: Initialize Capacitor

Create a `capacitor.config.json` file at the root of your project:

```json
{
  "appId": "com.betweenusapp.mobile",
  "appName": "Between Us",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "server": {
    "url": "https://your-app-url.com",
    "cleartext": true
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#6366f1",
      "androidSplashResourceName": "splash",
      "showSpinner": false
    },
    "StatusBar": {
      "style": "dark",
      "backgroundColor": "#6366f1"
    },
    "Keyboard": {
      "resize": "body",
      "style": "dark"
    },
    "PushNotifications": {
      "presentationOptions": ["badge", "sound", "alert"]
    }
  }
}
```

---

## 📱 Step 3: Create Mobile-Specific Code

I'll create components that detect mobile vs web and adapt accordingly:

### 3.1: Mobile Detection Utility

```typescript
// utils/platform.tsx
import { Capacitor } from '@capacitor/core';

export const isNativeMobile = () => Capacitor.isNativePlatform();
export const isIOS = () => Capacitor.getPlatform() === 'ios';
export const isAndroid = () => Capacitor.getPlatform() === 'android';
export const isWeb = () => Capacitor.getPlatform() === 'web';

export const getPlatform = () => Capacitor.getPlatform();
```

### 3.2: Native Features Wrapper

```typescript
// utils/nativeFeatures.tsx
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { isNativeMobile } from './platform';

// Haptic Feedback
export const hapticLight = async () => {
  if (isNativeMobile()) {
    await Haptics.impact({ style: ImpactStyle.Light });
  }
};

export const hapticMedium = async () => {
  if (isNativeMobile()) {
    await Haptics.impact({ style: ImpactStyle.Medium });
  }
};

// Status Bar
export const setStatusBarLight = async () => {
  if (isNativeMobile()) {
    await StatusBar.setStyle({ style: Style.Light });
  }
};

export const setStatusBarDark = async () => {
  if (isNativeMobile()) {
    await StatusBar.setStyle({ style: Style.Dark });
  }
};

// Camera
export const takePicture = async () => {
  if (!isNativeMobile()) {
    throw new Error('Camera only available on mobile');
  }
  
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Prompt // Let user choose camera or gallery
  });
  
  return image.dataUrl;
};

// Keyboard
export const hideKeyboard = async () => {
  if (isNativeMobile()) {
    await Keyboard.hide();
  }
};
```

### 3.3: Safe Area Handling

```css
/* styles/mobile.css */
/* Handle iPhone notches and Android navigation */
:root {
  --safe-area-inset-top: env(safe-area-inset-top);
  --safe-area-inset-bottom: env(safe-area-inset-bottom);
  --safe-area-inset-left: env(safe-area-inset-left);
  --safe-area-inset-right: env(safe-area-inset-right);
}

.mobile-safe-area {
  padding-top: var(--safe-area-inset-top);
  padding-bottom: var(--safe-area-inset-bottom);
  padding-left: var(--safe-area-inset-left);
  padding-right: var(--safe-area-inset-right);
}

/* Prevent overscroll bounce on iOS */
body {
  overscroll-behavior: none;
}

/* Better touch targets for mobile */
@media (hover: none) and (pointer: coarse) {
  button, a, input, textarea {
    min-height: 44px; /* iOS recommended touch target */
    min-width: 44px;
  }
}
```

---

## 💳 Step 4: Integrate RevenueCat

Now you can add RevenueCat for mobile subscription management!

```bash
# Install RevenueCat
npm install react-native-purchases

# Install Capacitor plugin for RevenueCat
npm install @revenuecat/purchases-capacitor
```

### 4.1: RevenueCat Setup

```typescript
// utils/revenuecat.tsx
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { isNativeMobile, isIOS, isAndroid } from './platform';

const REVENUECAT_API_KEY_IOS = 'your_ios_api_key';
const REVENUECAT_API_KEY_ANDROID = 'your_android_api_key';

export async function initializeRevenueCat() {
  if (!isNativeMobile()) {
    console.log('RevenueCat only available on mobile');
    return;
  }

  const apiKey = isIOS() ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
  
  await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
  await Purchases.configure({ apiKey });
  
  console.log('RevenueCat initialized');
}

export async function getOfferings() {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('Error getting offerings:', error);
    return null;
  }
}

export async function purchasePackage(packageToPurchase: any) {
  try {
    const purchaseResult = await Purchases.purchasePackage({ 
      aPackage: packageToPurchase 
    });
    
    // Check what entitlements the user has
    const customerInfo = purchaseResult.customerInfo;
    
    if (customerInfo.entitlements.active['premium']) {
      return { tier: 'premium', success: true };
    } else if (customerInfo.entitlements.active['pro']) {
      return { tier: 'pro', success: true };
    }
    
    return { tier: 'free', success: false };
  } catch (error: any) {
    if (error.code === 'PURCHASE_CANCELLED') {
      console.log('User cancelled purchase');
    } else {
      console.error('Purchase error:', error);
    }
    return { tier: 'free', success: false };
  }
}

export async function restorePurchases() {
  try {
    const customerInfo = await Purchases.restorePurchases();
    
    if (customerInfo.entitlements.active['premium']) {
      return 'premium';
    } else if (customerInfo.entitlements.active['pro']) {
      return 'pro';
    }
    
    return 'free';
  } catch (error) {
    console.error('Error restoring purchases:', error);
    return 'free';
  }
}

export async function checkSubscriptionStatus() {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    
    if (customerInfo.entitlements.active['premium']) {
      return 'premium';
    } else if (customerInfo.entitlements.active['pro']) {
      return 'pro';
    }
    
    return 'free';
  } catch (error) {
    console.error('Error checking subscription:', error);
    return 'free';
  }
}
```

### 4.2: Mobile Subscription Modal

```typescript
// components/MobileSubscriptionModal.tsx
import { useState, useEffect } from 'react';
import { getOfferings, purchasePackage, restorePurchases } from '../utils/revenuecat';
import { isNativeMobile } from '../utils/platform';
import { SubscriptionModal } from './SubscriptionModal';

export function MobileSubscriptionModal({ isOpen, onClose, onSubscriptionUpdate }: any) {
  const [offerings, setOfferings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && isNativeMobile()) {
      loadOfferings();
    }
  }, [isOpen]);

  const loadOfferings = async () => {
    setLoading(true);
    const currentOffering = await getOfferings();
    setOfferings(currentOffering);
    setLoading(false);
  };

  const handlePurchase = async (packageId: string) => {
    const pkg = offerings?.availablePackages.find((p: any) => p.identifier === packageId);
    if (!pkg) return;

    const result = await purchasePackage(pkg);
    
    if (result.success) {
      // Sync with your Supabase backend
      await syncSubscriptionWithBackend(result.tier);
      onSubscriptionUpdate();
      onClose();
    }
  };

  const handleRestore = async () => {
    const tier = await restorePurchases();
    await syncSubscriptionWithBackend(tier);
    onSubscriptionUpdate();
    onClose();
  };

  // If on mobile, show RevenueCat modal
  // If on web, show Stripe modal
  if (!isNativeMobile()) {
    return <SubscriptionModal isOpen={isOpen} onClose={onClose} />;
  }

  // ... Mobile-specific UI with RevenueCat packages
  return (
    <div>
      {/* Show RevenueCat offerings */}
    </div>
  );
}

async function syncSubscriptionWithBackend(tier: string) {
  // Update Supabase backend with new subscription tier
  // This keeps web and mobile subscriptions in sync
  const session = getSession();
  if (session?.user?.id) {
    await upgradeSubscription(session.user.id, tier);
  }
}
```

---

## 🔄 Step 5: Update App.tsx for Mobile

Add mobile-specific initialization:

```typescript
// Add to App.tsx
import { useEffect } from 'react';
import { StatusBar } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapacitorApp } from '@capacitor/app';
import { isNativeMobile } from './utils/platform';
import { initializeRevenueCat } from './utils/revenuecat';

function App() {
  useEffect(() => {
    if (isNativeMobile()) {
      initializeMobileApp();
    }
  }, []);

  const initializeMobileApp = async () => {
    // Hide splash screen after app loads
    await SplashScreen.hide();
    
    // Initialize RevenueCat
    await initializeRevenueCat();
    
    // Set status bar style
    await StatusBar.setStyle({ style: 'dark' });
    
    // Handle app state changes
    CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Is active?', isActive);
    });
    
    // Handle back button on Android
    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        CapacitorApp.exitApp();
      } else {
        window.history.back();
      }
    });
  };

  // ... rest of your app code
}
```

---

## 🏗️ Step 6: Build Configuration

### 6.1: Update package.json

Add build scripts:

```json
{
  "scripts": {
    "build": "vite build",
    "build:mobile": "vite build && npm run sync",
    "sync": "npx cap sync",
    "ios": "npx cap open ios",
    "android": "npx cap open android",
    "add:ios": "npx cap add ios",
    "add:android": "npx cap add android"
  }
}
```

### 6.2: Create platforms

```bash
# Build your web app
npm run build

# Add iOS platform
npm run add:ios

# Add Android platform
npm run add:android

# Sync web code to native projects
npm run sync
```

---

## 📱 Step 7: iOS Setup

### 7.1: Open Xcode

```bash
npm run ios
```

This opens your app in Xcode.

### 7.2: Configure iOS Settings

In Xcode:

1. **Bundle Identifier**: `com.betweenusapp.mobile`
2. **Display Name**: `Between Us`
3. **Version**: `1.0.0`
4. **Build**: `1`
5. **Deployment Target**: iOS 13.0+
6. **Signing Team**: Select your Apple Developer account

### 7.3: App Icons

Create icons at these sizes:
- 20x20, 29x29, 40x40, 58x58, 60x60, 76x76, 80x80, 87x87, 120x120, 152x152, 167x167, 180x180, 1024x1024

Place in: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

### 7.4: Splash Screen

Create splash screen:
- Size: 2732x2732 (centered content in 1125x2436 safe area)
- Place in: `ios/App/App/Assets.xcassets/Splash.imageset/`

### 7.5: Info.plist Permissions

Add required permissions in `ios/App/App/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>To take photos for your profile</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>To choose photos from your gallery</string>

<key>NSUserNotificationsUsageDescription</key>
<string>To send you supportive notifications</string>
```

### 7.6: Build & Test

1. Select a simulator (iPhone 14 Pro)
2. Click ▶️ Play button
3. App launches in simulator!

---

## 🤖 Step 8: Android Setup

### 8.1: Open Android Studio

```bash
npm run android
```

### 8.2: Configure Android Settings

Edit `android/app/build.gradle`:

```gradle
android {
    namespace "com.betweenusapp.mobile"
    compileSdkVersion 33
    
    defaultConfig {
        applicationId "com.betweenusapp.mobile"
        minSdkVersion 22
        targetSdkVersion 33
        versionCode 1
        versionName "1.0.0"
    }
}
```

### 8.3: App Icons

Place icons in:
- `android/app/src/main/res/mipmap-mdpi/` (48x48)
- `android/app/src/main/res/mipmap-hdpi/` (72x72)
- `android/app/src/main/res/mipmap-xhdpi/` (96x96)
- `android/app/src/main/res/mipmap-xxhdpi/` (144x144)
- `android/app/src/main/res/mipmap-xxxhdpi/` (192x192)

### 8.4: Splash Screen

Create `android/app/src/main/res/drawable/splash.png` (2732x2732)

### 8.5: Permissions

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```

### 8.6: Build & Test

1. Select a device/emulator
2. Click ▶️ Run
3. App launches on Android!

---

## 🔔 Step 9: Push Notifications (Optional)

### 9.1: Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create project "Between Us"
3. Add iOS app (Bundle ID: `com.betweenusapp.mobile`)
4. Add Android app (Package name: `com.betweenusapp.mobile`)
5. Download `GoogleService-Info.plist` (iOS) and `google-services.json` (Android)

### 9.2: Configure Push Notifications

```typescript
// utils/notifications.tsx
import { PushNotifications } from '@capacitor/push-notifications';
import { isNativeMobile } from './platform';

export async function initializePushNotifications() {
  if (!isNativeMobile()) return;

  // Request permission
  const permission = await PushNotifications.requestPermissions();
  
  if (permission.receive === 'granted') {
    await PushNotifications.register();
  }

  // Listen for registration
  PushNotifications.addListener('registration', (token) => {
    console.log('Push registration token:', token.value);
    // Send token to your backend
  });

  // Listen for notifications
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push received:', notification);
  });

  // Handle notification tap
  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('Push action performed:', notification);
    // Navigate to relevant screen
  });
}
```

---

## 🚀 Step 10: Publishing

### iOS App Store

1. **Prepare Assets**
   - App Icon (1024x1024)
   - Screenshots (multiple device sizes)
   - App preview video (optional)

2. **App Store Connect**
   - Create app listing at [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - Fill in metadata (name, description, keywords, category)
   - Set pricing and availability

3. **Build & Archive**
   - In Xcode: Product → Archive
   - Upload to App Store Connect
   - Submit for review

4. **Review Process**
   - Takes 1-3 days typically
   - Address any rejections
   - Once approved, release!

### Google Play Store

1. **Prepare Assets**
   - App Icon (512x512)
   - Feature Graphic (1024x500)
   - Screenshots (multiple device sizes)
   - Promo video (optional)

2. **Play Console**
   - Create app at [play.google.com/console](https://play.google.com/console)
   - Fill in store listing
   - Set pricing and distribution

3. **Build Release APK/AAB**
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
   - Sign with keystore
   - Upload to Play Console

4. **Review Process**
   - Takes a few hours to 1 day
   - Address any issues
   - Roll out to production!

---

## 📊 Feature Compatibility

| Feature | Web | iOS | Android | Notes |
|---------|-----|-----|---------|-------|
| Anonymous Posts | ✅ | ✅ | ✅ | Works everywhere |
| Mood Check-ins | ✅ | ✅ | ✅ | Works everywhere |
| Journal | ✅ | ✅ | ✅ | Works everywhere |
| Profile Pictures | ✅ | ✅ | ✅ | Mobile uses native camera |
| Subscriptions | ✅ Stripe | ✅ RevenueCat | ✅ RevenueCat | Different systems |
| Push Notifications | ❌ | ✅ | ✅ | Mobile only |
| Haptic Feedback | ❌ | ✅ | ✅ | Mobile only |
| Dark Mode | ✅ | ✅ | ✅ | Works everywhere |
| 6 Languages | ✅ | ✅ | ✅ | Works everywhere |

---

## 💰 Unified Subscription System

### Architecture:

```
Web Users
  └── Stripe Checkout → Supabase Backend

iOS Users
  └── RevenueCat → Apple IAP → Supabase Backend

Android Users
  └── RevenueCat → Google Play → Supabase Backend
```

### Unified Backend:

```typescript
// supabase/functions/server/index.tsx

// Stripe webhook (web purchases)
app.post('/webhook/stripe', async (c) => {
  const event = await stripe.webhooks.constructEvent(...);
  
  if (event.type === 'checkout.session.completed') {
    await updateSubscription(userId, tier, 'stripe');
  }
});

// RevenueCat webhook (mobile purchases)
app.post('/webhook/revenuecat', async (c) => {
  const event = await c.req.json();
  
  if (event.type === 'INITIAL_PURCHASE' || event.type === 'RENEWAL') {
    await updateSubscription(userId, tier, 'revenuecat');
  }
});

// Unified subscription check
app.get('/subscription', async (c) => {
  const userId = c.req.query('userId');
  const subscription = await kv.get(`subscription:${userId}`);
  
  // Returns same format regardless of platform
  return c.json({ subscription });
});
```

---

## 🔧 Development Workflow

### Daily Development:

```bash
# 1. Make changes to React components
code components/ProfileTab.tsx

# 2. Test in browser first
npm run dev

# 3. Build and sync to mobile
npm run build:mobile

# 4. Test on iOS
npm run ios

# 5. Test on Android
npm run android
```

### Before Release:

```bash
# Update version
# In package.json, ios/App/App.xcodeproj, android/app/build.gradle

# Build production
npm run build:mobile

# Test thoroughly
# - All features work
# - Subscriptions process correctly
# - Push notifications work
# - App looks good on all screen sizes

# Submit to stores
# iOS: Archive in Xcode → Upload
# Android: gradlew bundleRelease → Upload
```

---

## 🎯 Next Steps Checklist

### Phase 1: Setup (1-2 days)
- [ ] Install Capacitor and dependencies
- [ ] Configure capacitor.config.json
- [ ] Add iOS and Android platforms
- [ ] Test app builds on both platforms

### Phase 2: Mobile Features (3-5 days)
- [ ] Add mobile detection utility
- [ ] Implement native camera for profile pictures
- [ ] Add haptic feedback to buttons
- [ ] Handle safe areas (notches, home indicator)
- [ ] Test on real devices

### Phase 3: RevenueCat (2-3 days)
- [ ] Sign up for RevenueCat account
- [ ] Configure products in RevenueCat dashboard
- [ ] Implement mobile subscription flow
- [ ] Test purchases with sandbox accounts
- [ ] Sync with Supabase backend

### Phase 4: Push Notifications (2-3 days)
- [ ] Set up Firebase project
- [ ] Configure iOS APNs certificates
- [ ] Configure Android FCM
- [ ] Implement notification handling
- [ ] Test push notifications

### Phase 5: Polish (3-5 days)
- [ ] Design app icons
- [ ] Create splash screens
- [ ] Test on multiple devices
- [ ] Fix platform-specific bugs
- [ ] Optimize performance

### Phase 6: Publishing (5-7 days)
- [ ] Create app store listings
- [ ] Take screenshots
- [ ] Write descriptions
- [ ] Submit to Apple App Store
- [ ] Submit to Google Play
- [ ] Address review feedback

**Total Estimated Time: 3-4 weeks**

---

## 📱 App Size Estimates

- **Web App**: ~2-3 MB (current)
- **iOS App**: ~50-80 MB (includes framework)
- **Android App**: ~30-50 MB (includes framework)

---

## 💡 Pro Tips

1. **Test Early**: Build mobile versions ASAP to catch issues
2. **Real Devices**: Test on actual phones, not just simulators
3. **Performance**: Mobile is slower than desktop - optimize!
4. **Touch Targets**: Make buttons bigger (44x44px minimum)
5. **Keyboard**: Handle keyboard showing/hiding gracefully
6. **Offline**: Consider offline mode for poor connections
7. **Battery**: Minimize background tasks
8. **Network**: Handle slow/no internet gracefully

---

## 🆘 Common Issues & Solutions

### Issue: App crashes on launch
**Solution**: Check Capacitor version compatibility, rebuild native projects

### Issue: Keyboard covers input fields
**Solution**: Use Capacitor Keyboard plugin with `resize: 'body'`

### Issue: Images don't load
**Solution**: Check CORS headers, use relative paths not absolute

### Issue: OAuth doesn't work
**Solution**: Configure deep links in capacitor.config.json

### Issue: Subscriptions not syncing
**Solution**: Ensure webhook endpoints are reachable, check logs

---

## 📚 Useful Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [RevenueCat Docs](https://docs.revenuecat.com)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android Material Design](https://material.io/design)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy](https://play.google.com/about/developer-content-policy/)

---

## ✅ Summary

**Converting to mobile apps is totally feasible!**

1. **Use Capacitor** to wrap your React app
2. **Keep existing code** - 90% works as-is
3. **Add RevenueCat** for mobile subscriptions
4. **Sync everything** through your Supabase backend
5. **Publish to stores** and you're done!

**Time Investment:** 3-4 weeks for a solid v1.0
**Cost:** $99/year (Apple) + $25 one-time (Google) + RevenueCat (free tier available)

Ready to get started? Let me know and I can help set this up! 🚀
