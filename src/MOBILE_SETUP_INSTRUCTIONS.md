# Quick Start: Converting to Mobile App 🚀

## What I've Done For You

I've created all the necessary files to convert your React web app into iOS/Android mobile apps:

✅ `/capacitor.config.json` - Capacitor configuration
✅ `/utils/platform.tsx` - Platform detection utilities  
✅ `/utils/nativeFeatures.tsx` - Native feature wrappers (camera, haptics, etc.)
✅ `/utils/revenuecat.tsx` - RevenueCat integration for mobile subscriptions
✅ `/MOBILE_APP_CONVERSION_GUIDE.md` - Complete step-by-step guide

---

## ⚠️ Important: Run These Steps Locally

**This code CANNOT run in Figma Make** - you need to move to your local development environment to build mobile apps.

Here's what to do:

---

## 📥 Step 1: Download Your Code

### Option A: Copy Files Manually
1. Open each file in Figma Make
2. Copy the contents
3. Create the same file structure locally
4. Paste the code

### Option B: Export as ZIP (if available)
1. Download entire project
2. Extract to your local machine

---

## 💻 Step 2: Set Up Local Environment

### Install Prerequisites

**For Both iOS & Android:**
```bash
# Verify Node.js is installed (16+ required)
node --version

# Verify npm is installed
npm --version
```

**For iOS (Mac only):**
```bash
# Install Xcode from Mac App Store (free)
# Then install Command Line Tools
xcode-select --install

# Install CocoaPods
sudo gem install cocoapods
```

**For Android (Any OS):**
- Download and install [Android Studio](https://developer.android.com/studio)
- During setup, install Android SDK and emulator
- Install Java JDK 11+

---

## 🛠️ Step 3: Install Capacitor & Dependencies

In your project directory:

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android

# Install plugins
npm install @capacitor/status-bar @capacitor/splash-screen @capacitor/keyboard @capacitor/haptics @capacitor/network @capacitor/app @capacitor/camera @capacitor/share

# Install RevenueCat (for mobile subscriptions)
npm install @revenuecat/purchases-capacitor

# Install any missing React dependencies
npm install
```

---

## 📱 Step 4: Create Native Projects

```bash
# Build your web app first
npm run build

# Add iOS platform (Mac only)
npx cap add ios

# Add Android platform
npx cap add android

# Sync web code to native projects
npx cap sync
```

This creates:
- `ios/` folder with Xcode project
- `android/` folder with Android Studio project

---

## 🍎 Step 5: Build for iOS (Mac Only)

### Open in Xcode
```bash
npx cap open ios
```

### Configure in Xcode
1. **General Tab:**
   - Bundle Identifier: `com.betweenusapp.mobile`
   - Display Name: `Between Us`
   - Version: `1.0.0`
   - Build: `1`

2. **Signing & Capabilities:**
   - Select your Apple Developer account
   - Enable automatic signing

3. **Deployment Info:**
   - iOS 13.0 minimum

### Add App Icons
- Create icon at 1024x1024
- Drag to `Assets.xcassets > AppIcon`
- Or use a tool like [AppIcon.co](https://appicon.co/)

### Run on Simulator
1. Select device: iPhone 14 Pro
2. Click ▶️ Play button
3. App should launch!

### Test on Real Device
1. Connect iPhone via USB
2. Select your iPhone in device dropdown
3. Click ▶️ Play button
4. Trust developer on iPhone

---

## 🤖 Step 6: Build for Android

### Open in Android Studio
```bash
npx cap open android
```

### Configure in Android Studio
1. Wait for Gradle sync to complete
2. Check `android/app/build.gradle`:
   ```gradle
   defaultConfig {
       applicationId "com.betweenusapp.mobile"
       minSdkVersion 22
       targetSdkVersion 33
       versionCode 1
       versionName "1.0.0"
   }
   ```

### Add App Icons
1. Right-click `res` folder
2. New → Image Asset
3. Configure launcher icons
4. Or manually place icons in mipmap folders

### Run on Emulator
1. Create virtual device (Pixel 6)
2. Select device in dropdown
3. Click ▶️ Run button
4. App should launch!

### Test on Real Device
1. Enable Developer Mode on Android phone
2. Enable USB Debugging
3. Connect via USB
4. Select your device
5. Click ▶️ Run

---

## 💳 Step 7: Set Up RevenueCat (Mobile Subscriptions)

### Create RevenueCat Account
1. Go to [revenuecat.com](https://www.revenuecat.com/)
2. Sign up for free account
3. Create new project: "Between Us"

### Configure iOS Products
1. In RevenueCat dashboard → Products
2. Add products:
   - `premium_monthly` - $4.99/month
   - `pro_monthly` - $9.99/month
3. Create entitlements:
   - `premium` (linked to premium_monthly)
   - `pro` (linked to pro_monthly)

### Get API Keys
1. RevenueCat → Settings → API Keys
2. Copy iOS API Key
3. Copy Android API Key
4. Paste in `/utils/revenuecat.tsx`:
   ```typescript
   const REVENUECAT_API_KEY_IOS = 'your_actual_ios_key';
   const REVENUECAT_API_KEY_ANDROID = 'your_actual_android_key';
   ```

### Set Up App Store Connect (iOS)
1. Create app in [App Store Connect](https://appstoreconnect.apple.com)
2. Go to Features → In-App Purchases
3. Create subscriptions matching RevenueCat:
   - Premium Monthly - $4.99
   - Pro Monthly - $9.99
4. Link to RevenueCat (instructions in RevenueCat docs)

### Set Up Google Play Console (Android)
1. Create app in [Play Console](https://play.google.com/console)
2. Go to Monetize → Subscriptions
3. Create subscriptions matching RevenueCat
4. Link to RevenueCat

---

## 🔄 Step 8: Daily Development Workflow

### Make Changes to Code
```bash
# Edit your React components as usual
code components/ProfileTab.tsx
```

### Test in Browser First
```bash
npm run dev
# Visit http://localhost:5173
```

### Sync to Mobile
```bash
# Build web app
npm run build

# Copy to native projects
npx cap sync
```

### Test on iOS
```bash
npx cap open ios
# Click ▶️ in Xcode
```

### Test on Android
```bash
npx cap open android
# Click ▶️ in Android Studio
```

---

## 🚀 Step 9: Publishing to App Stores

### iOS App Store

**Prepare:**
- App Icon (1024x1024)
- Screenshots (various sizes)
- App description
- Privacy policy URL

**Submit:**
1. In Xcode: Product → Archive
2. Upload to App Store Connect
3. Complete app information
4. Submit for review
5. Wait 1-3 days for approval

**Costs:**
- Apple Developer: $99/year

### Google Play Store

**Prepare:**
- App Icon (512x512)
- Feature graphic (1024x500)
- Screenshots
- App description
- Privacy policy URL

**Submit:**
1. Build release bundle:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
2. Upload to Play Console
3. Complete store listing
4. Submit for review
5. Usually approved within hours

**Costs:**
- Google Play: $25 one-time

---

## ✅ Testing Checklist

Before publishing, test:

### Functionality
- [ ] Sign up / Login works
- [ ] Post creation works
- [ ] Check-ins work
- [ ] Journal works
- [ ] Profile updates work
- [ ] Language switching works
- [ ] Dark/light mode works

### Mobile-Specific
- [ ] Camera for profile picture works
- [ ] Haptic feedback works (if added)
- [ ] Safe areas look good (notches)
- [ ] Keyboard doesn't cover inputs
- [ ] App looks good on multiple screen sizes
- [ ] Status bar shows correctly

### Subscriptions (RevenueCat)
- [ ] Can view subscription offerings
- [ ] Can purchase premium subscription
- [ ] Can purchase pro subscription
- [ ] Features unlock after purchase
- [ ] Restore purchases works
- [ ] Backend syncs correctly

### Performance
- [ ] App loads quickly
- [ ] Scrolling is smooth
- [ ] No crashes
- [ ] Works offline (gracefully)
- [ ] Network errors handled

---

## 🐛 Common Issues & Fixes

### "Command not found: npx cap"
**Fix:** Run `npm install` to install dependencies

### Xcode signing error
**Fix:** Add Apple Developer account in Xcode → Preferences → Accounts

### Android Gradle build fails
**Fix:** Update Android Studio and Gradle to latest versions

### RevenueCat purchases fail
**Fix:** 
- Check API keys are correct
- Ensure products are created in App Store Connect / Play Console
- Test with sandbox account

### App crashes on launch
**Fix:**
- Check console logs
- Ensure all Capacitor plugins are installed
- Run `npx cap sync` again

---

## 📚 Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [RevenueCat Docs](https://docs.revenuecat.com)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android Material Design](https://material.io/design)

---

## 🎯 Summary

You now have everything you need to convert Between Us into mobile apps!

**Next Steps:**
1. ✅ Download code to local machine
2. ✅ Install prerequisites (Xcode, Android Studio)
3. ✅ Install Capacitor and dependencies
4. ✅ Create native projects (`npx cap add ios/android`)
5. ✅ Test on simulators/emulators
6. ✅ Set up RevenueCat for subscriptions
7. ✅ Test thoroughly on real devices
8. ✅ Submit to App Store and Play Store

**Timeline:**
- Basic mobile conversion: 1 week
- RevenueCat integration: 3-5 days
- Testing and polish: 1 week
- App store review: 1-7 days

**Total: 3-4 weeks to have your app in both stores!**

---

## 💡 Pro Tips

1. **Test on real devices early** - Simulators don't catch everything
2. **Use TestFlight (iOS)** - Distribute beta builds to testers
3. **Use Internal Testing (Android)** - Same for Android
4. **Monitor analytics** - Add Firebase Analytics or similar
5. **Plan for updates** - Use CodePush for instant updates without store review
6. **Handle errors gracefully** - Mobile networks are unreliable
7. **Optimize images** - Mobile data is precious
8. **Test offline** - Users lose connection frequently

Good luck with your mobile app! 🎉
