# 📱 Between Us - Mobile App Deployment Guide

## Complete Guide: Web App → iOS & Android Apps

This guide will help you convert your React web app into native iOS and Android apps using Capacitor, handle updates, and integrate payments.

---

## 🎯 Overview: What You'll Learn

1. ✅ Convert web app to iOS/Android using Capacitor
2. ✅ Download and build your app for distribution
3. ✅ Set up OTA (Over-The-Air) updates to skip app store reviews
4. ✅ Integrate native in-app purchases (Play Store & App Store)
5. ✅ Configure AdMob for native apps
6. ✅ Submit to Play Store and App Store

---

## 📋 Prerequisites

### What You Need:
- ✅ A Mac computer (required for iOS builds)
- ✅ Node.js installed (v16 or higher)
- ✅ Xcode installed (for iOS) - Free from Mac App Store
- ✅ Android Studio installed (for Android) - Free download
- ✅ Apple Developer Account ($99/year) - For App Store
- ✅ Google Play Developer Account ($25 one-time) - For Play Store
- ✅ Your Supabase project fully set up

---

## 🚀 PART 1: Install Capacitor (Convert Web → Native)

Capacitor wraps your web app into a native iOS/Android container. Think of it as a browser that only shows your app.

### Step 1: Install Capacitor

Open terminal in your project folder and run:

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor
npx cap init
```

When prompted:
- **App name**: `Between Us`
- **App ID**: `com.betweenus.app` (must be unique, can't change later)
- **Web directory**: `dist` (or `build` depending on your setup)

### Step 2: Add iOS and Android Platforms

```bash
# Add iOS (Mac only)
npm install @capacitor/ios
npx cap add ios

# Add Android
npm install @capacitor/android
npx cap add android
```

This creates:
- `ios/` folder - Your iOS app project
- `android/` folder - Your Android app project

### Step 3: Build Your Web App

```bash
# Build your React app
npm run build
```

This creates optimized files in `dist/` folder.

### Step 4: Sync Web App to Native Apps

Every time you update your web app, run:

```bash
npx cap sync
```

This copies your web files to iOS and Android projects.

---

## 📱 PART 2: Build for iOS (App Store)

### Step 1: Open iOS Project

```bash
npx cap open ios
```

This opens Xcode.

### Step 2: Configure in Xcode

1. **Select your project** (top left, blue icon "App")
2. **Signing & Capabilities** tab:
   - Team: Select your Apple Developer account
   - Bundle Identifier: `com.betweenus.app`
   - Automatically manage signing: ✓ (checked)

3. **General** tab:
   - Display Name: `Between Us`
   - Version: `1.0.0`
   - Build: `1`

4. **Info** tab:
   - Add privacy permissions your app needs (see below)

### Step 3: Test on Simulator

1. Select a simulator device (e.g., iPhone 15 Pro)
2. Click ▶️ Play button
3. Your app will launch in simulator

### Step 4: Build for App Store

1. **Product** menu → **Archive**
2. Wait for archive to complete
3. **Distribute App** → **App Store Connect**
4. Follow the wizard to upload

---

## 🤖 PART 3: Build for Android (Play Store)

### Step 1: Open Android Project

```bash
npx cap open android
```

This opens Android Studio.

### Step 2: Configure in Android Studio

1. Open `android/app/build.gradle`
2. Update:
   ```gradle
   defaultConfig {
       applicationId "com.betweenus.app"
       minSdkVersion 22
       targetSdkVersion 34
       versionCode 1
       versionName "1.0.0"
   }
   ```

### Step 3: Test on Emulator

1. Click device dropdown → **Device Manager**
2. Create a virtual device (e.g., Pixel 7)
3. Click ▶️ Run
4. Your app will launch in emulator

### Step 4: Build APK/Bundle for Play Store

1. **Build** menu → **Generate Signed Bundle / APK**
2. Choose **Android App Bundle** (AAB) - recommended by Google
3. Create a keystore (save this file and password securely!)
4. Generate the bundle
5. Upload the `.aab` file to Play Console

---

## 🔄 PART 4: OTA Updates (Skip App Store Reviews)

OTA updates let you update your app's content WITHOUT resubmitting to app stores. This works for web code changes (HTML, CSS, JS) but NOT native code changes.

### Option 1: Capgo (Recommended - Easiest)

Capgo is specifically built for Capacitor live updates.

#### Install Capgo:

```bash
npm install @capgo/capacitor-updater
npx cap sync
```

#### Sign up and configure:

1. Visit https://capgo.app
2. Create account (free tier available)
3. Get your API key
4. Configure in your app:

```bash
npx @capgo/cli init YOUR_API_KEY
```

#### Deploy updates:

```bash
# Build your web app
npm run build

# Upload to Capgo
npx @capgo/cli upload
```

**How it works:**
- When users open your app, it checks for updates
- Downloads and installs new version in background
- Next app launch shows the updated version
- Takes 1-2 minutes, no app store review needed

**Pricing:**
- Free: Up to 100 users
- Starter: $15/month - Up to 1,000 users
- Pro: $49/month - Up to 10,000 users

### Option 2: Appflow (Ionic's Official Solution)

1. Sign up at https://ionic.io/appflow
2. Connect your Git repository
3. Configure live updates
4. Deploy via dashboard

**Pricing:**
- Starter: $29/month
- Growth: $99/month

### Option 3: Self-Hosted (Advanced)

Use Capacitor's built-in update APIs to build your own update system. Not recommended for beginners.

### ⚠️ Important: What You CAN'T Update via OTA

- Native plugin changes
- Capacitor version updates
- Changes to iOS/Android native code
- New permissions
- App icons or splash screens

For these, you MUST submit a new version to app stores.

---

## 💰 PART 5: In-App Purchases (Native App Store Payments)

Use native payment systems (Apple In-App Purchase & Google Play Billing) - users trust these, and they're the only way allowed by app stores.

### Install Capacitor In-App Purchase Plugin

```bash
npm install @capacitor-community/in-app-purchases
npx cap sync
```

### Configure iOS In-App Purchases

1. **App Store Connect** (https://appstoreconnect.apple.com)
2. Go to your app → **Features** → **In-App Purchases**
3. Click **+** to add products
4. Create your subscription tiers:
   - `premium_monthly` - Premium Monthly ($4.99)
   - `pro_yearly` - Pro Yearly ($49.99)
   - `lifetime_access` - Lifetime Access ($99.99)
5. Fill in details for each product
6. Set up pricing for all countries

### Configure Android In-App Purchases

1. **Google Play Console** (https://play.google.com/console)
2. Go to your app → **Monetize** → **Products** → **Subscriptions**
3. Create subscriptions matching iOS:
   - `premium_monthly`
   - `pro_yearly`
   - `lifetime_access` (use "Prepaid" for lifetime)
4. Set pricing for all countries

### Add to Your Between Us App

Create a new file for in-app purchase logic:

**See `PAYMENT-INTEGRATION-CODE.md` for complete implementation.**

### How It Works:

1. User clicks "Subscribe to Premium"
2. Native payment sheet appears (Apple Pay / Google Pay)
3. User completes purchase through app store
4. Your app receives purchase token
5. Verify purchase with app store servers
6. Update user's subscription in Supabase
7. Grant access to premium features

### Revenue Split:

- **Apple**: Takes 30% (15% after year 1)
- **Google**: Takes 30% (15% after year 1)
- You get 70% (85% for long-term subscribers)

### Benefits of Native Payments:

✅ Users trust Apple/Google payment systems  
✅ Handles payment processing, refunds, subscriptions  
✅ No additional payment gateway fees  
✅ Required by app stores (can't use Stripe, etc.)  
✅ Automatic currency conversion  
✅ Family Sharing support (iOS)  
✅ Tax handling included  

---

## 📊 PART 6: Google AdMob for Native Apps

You mentioned AdMob is set up for web. For native apps, you need the Capacitor AdMob plugin.

### Install AdMob Plugin

```bash
npm install @capacitor-community/admob
npx cap sync
```

### Configure AdMob

1. **AdMob Console** (https://admob.google.com)
2. Create an app for iOS and Android separately
3. Get your App IDs:
   - iOS: `ca-app-pub-XXXXX~YYYYY`
   - Android: `ca-app-pub-XXXXX~YYYYY`

4. Create ad units:
   - Banner ads
   - Interstitial ads
   - Rewarded ads

### Add to Your App

**See `ADMOB-INTEGRATION-CODE.md` for complete implementation.**

### Ad Strategy for Between Us:

- **Free tier**: Show banner ads, interstitial every 5 posts
- **Premium tier**: Remove ads
- **Pro tier**: Remove ads + bonus features

---

## 📦 PART 7: Download Your Built App

### For iOS (.ipa file):

1. After archiving in Xcode, go to **Window** → **Organizer**
2. Select your archive
3. Click **Distribute App**
4. Choose **Development** or **Ad Hoc** for testing
5. Choose **App Store Connect** for production
6. Export to folder - you'll get a `.ipa` file

### For Android (.apk or .aab file):

1. After building in Android Studio
2. File is saved in:
   ```
   android/app/build/outputs/bundle/release/app-release.aab
   ```
   or
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

3. Find this file and save it

### For Testing on Physical Devices:

**iOS:**
- Use TestFlight (automatic with App Store Connect upload)
- Or install .ipa via Xcode → Window → Devices and Simulators

**Android:**
- Enable Developer Options on phone
- Enable USB debugging
- Connect phone via USB
- Android Studio → Run (select your device)
- Or share .apk file and install directly

---

## 🏪 PART 8: App Store Submission Checklist

### Before Submitting:

✅ App tested on real devices  
✅ All features working  
✅ In-app purchases configured  
✅ Privacy policy URL ready  
✅ App screenshots prepared (required sizes)  
✅ App icon (1024×1024px)  
✅ App description written  
✅ Age rating determined  
✅ Support email/URL ready  

### iOS - App Store Connect:

1. Create app listing
2. Upload screenshots (required sizes):
   - 6.7" iPhone (1290×2796)
   - 6.5" iPhone (1284×2778)
   - 5.5" iPhone (1242×2208)
3. Fill in app information
4. Set pricing (Free with in-app purchases)
5. Upload build from Xcode
6. Submit for review (typically 1-2 days)

### Android - Play Console:

1. Create app listing
2. Upload screenshots (at least 2)
3. Feature graphic (1024×500px)
4. App description (short and full)
5. Upload .aab file
6. Complete content rating questionnaire
7. Set up pricing (Free with in-app purchases)
8. Submit for review (typically 1-3 days)

---

## 🔧 PART 9: Essential Capacitor Configurations

### Capacitor Config File

Create/update `capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.betweenus.app',
  appName: 'Between Us',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // For development, uncomment:
    // url: 'http://192.168.1.XXX:5173',
    // cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0f0f23",
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
```

### iOS Permissions (Info.plist)

Add required permissions in Xcode → Info tab:

```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to let you share photos</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>We need photo library access to let you share images</string>

<key>NSUserTrackingUsageDescription</key>
<string>We use tracking to show you relevant ads</string>
```

### Android Permissions (AndroidManifest.xml)

Location: `android/app/src/main/AndroidManifest.xml`

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

---

## 🎨 PART 10: App Icons and Splash Screens

### Generate Icons and Splash Screens

Use this free tool: https://icon.kitchen

1. Upload your Between Us logo (1024×1024px)
2. Choose Capacitor/Cordova
3. Download the package
4. Extract and copy files:
   - iOS: Copy to `ios/App/App/Assets.xcassets/`
   - Android: Copy to `android/app/src/main/res/`

### Or Use Capacitor Assets Generator

```bash
npm install @capacitor/assets --save-dev
```

Place your icon at `assets/icon.png` (1024×1024)
Place your splash at `assets/splash.png` (2732×2732)

```bash
npx capacitor-assets generate
```

---

## 🔄 PART 11: Complete Workflow

### Initial Setup (One Time):

```bash
# 1. Install Capacitor
npm install @capacitor/core @capacitor/cli
npx cap init

# 2. Add platforms
npm install @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android

# 3. Install plugins
npm install @capacitor-community/in-app-purchases
npm install @capacitor-community/admob
npm install @capgo/capacitor-updater

# 4. Sync everything
npx cap sync
```

### Every Time You Update Your App:

```bash
# 1. Make changes to your React code

# 2. Build
npm run build

# 3. Sync to native apps
npx cap sync

# 4. For OTA update (no app store review):
npx @capgo/cli upload

# 5. For native changes (requires app store review):
npx cap open ios    # Build in Xcode
npx cap open android # Build in Android Studio
```

---

## 🆘 PART 12: Troubleshooting

### "App crashes on launch"

**Fix:**
1. Check browser console in simulator/emulator
2. Usually means JavaScript error
3. Test web app thoroughly first

### "White screen on launch"

**Fix:**
1. Ensure `webDir` in `capacitor.config.ts` matches your build folder
2. Check `dist/index.html` exists after build
3. Run `npx cap sync` again

### "Plugins not working"

**Fix:**
1. Run `npx cap sync` after installing any plugin
2. Rebuild native project
3. Check plugin documentation for iOS/Android setup

### "Can't build for iOS"

**Fix:**
1. Must use a Mac
2. Install Xcode from App Store
3. Open Xcode, agree to terms
4. Install Command Line Tools: `xcode-select --install`

### "In-app purchases not working"

**Fix:**
1. Test on real device (not simulator/emulator)
2. Use sandbox test accounts
3. Ensure products are approved in App Store Connect / Play Console
4. Check bundle ID / package name matches exactly

---

## 💡 PART 13: Best Practices

### 1. Version Management

Keep versions in sync:
- `package.json` version
- iOS: Version & Build number
- Android: versionCode & versionName

### 2. Testing Strategy

1. **Local testing**: Browser (fastest)
2. **Simulator/Emulator**: Basic functionality
3. **Real device**: Final testing before submission
4. **TestFlight/Internal Testing**: Beta testing with users

### 3. Update Strategy

**Minor UI changes**: OTA update (instant)  
**New features (web only)**: OTA update (instant)  
**New native features**: App store update (1-3 days review)  
**Bug fixes (web only)**: OTA update (instant)  

### 4. Subscription Management

- Test with sandbox accounts
- Handle subscription states: active, expired, cancelled
- Sync subscription status with Supabase
- Handle refunds gracefully
- Offer subscription management in-app

### 5. Revenue Optimization

**Free tier**: Banner ads, limited posts  
**Premium ($4.99/mo)**: No ads, more posts  
**Pro ($49/year)**: Unlimited, all features  
**Lifetime ($99)**: One-time payment  

Consider:
- Free trial (3 or 7 days)
- Discounted annual pricing (save 20%)
- Promotional offers (first month free)

---

## 📊 PART 14: Analytics and Monitoring

### Recommended Services:

1. **Firebase Analytics** (Free)
   ```bash
   npm install @capacitor-firebase/analytics
   ```

2. **Sentry** (Error tracking)
   ```bash
   npm install @sentry/capacitor
   ```

3. **App Store Connect** (iOS analytics - built-in)
4. **Google Play Console** (Android analytics - built-in)

### Track Key Metrics:

- Daily Active Users (DAU)
- Subscription conversion rate
- Churn rate
- Revenue per user
- Crash-free rate
- App store rating

---

## ✅ PART 15: Quick Reference Commands

```bash
# Initial setup
npx cap init
npx cap add ios
npx cap add android

# Development cycle
npm run build          # Build web app
npx cap sync          # Sync to native apps
npx cap open ios      # Open Xcode
npx cap open android  # Open Android Studio

# Deploy OTA update
npx @capgo/cli upload

# Update Capacitor
npm install @capacitor/core@latest @capacitor/cli@latest
npx cap sync

# Clean build (if issues)
npx cap sync --force
```

---

## 📚 Additional Resources

- **Capacitor Docs**: https://capacitorjs.com/docs
- **Capgo Docs**: https://capgo.app/docs
- **Apple Developer**: https://developer.apple.com
- **Google Play Console**: https://play.google.com/console
- **In-App Purchase Plugin**: https://github.com/capacitor-community/in-app-purchases
- **AdMob Plugin**: https://github.com/capacitor-community/admob

---

## 🎯 Summary: Your Action Plan

### Phase 1: Setup (1-2 days)
1. ✅ Install Capacitor
2. ✅ Add iOS and Android platforms
3. ✅ Test on simulators/emulators

### Phase 2: Configure (2-3 days)
1. ✅ Set up app icons and splash screens
2. ✅ Configure in-app purchases in app stores
3. ✅ Set up AdMob accounts
4. ✅ Install necessary plugins

### Phase 3: Build (1 day)
1. ✅ Build for iOS in Xcode
2. ✅ Build for Android in Android Studio
3. ✅ Test on real devices

### Phase 4: Submit (3-7 days)
1. ✅ Create app store listings
2. ✅ Upload screenshots and descriptions
3. ✅ Submit for review
4. ✅ Wait for approval

### Phase 5: Maintain (Ongoing)
1. ✅ Use OTA updates for quick fixes
2. ✅ Submit app store updates for native changes
3. ✅ Monitor analytics and revenue
4. ✅ Respond to user feedback

---

**Total Time to Launch**: ~2 weeks (if everything goes smoothly)

**Cost Estimate**:
- Apple Developer: $99/year
- Google Play: $25 one-time
- OTA Updates (Capgo): $0-49/month
- Total initial: ~$124

---

**You've got this! 💜 Feel free to ask questions as you go through each step.**

✨ Dreamed by Darija ✨
