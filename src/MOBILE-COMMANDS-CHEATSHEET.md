# 📱 Between Us - Mobile Commands Cheat Sheet

Quick reference for all the commands you'll need during mobile app development.

---

## 🚀 Initial Setup (One Time)

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor
npx cap init
# Enter: App name: Between Us
# Enter: App ID: com.betweenus.app  
# Enter: Web dir: dist

# Add iOS platform (Mac only)
npm install @capacitor/ios
npx cap add ios

# Add Android platform
npm install @capacitor/android
npx cap add android

# Install plugins
npm install @capacitor-community/in-app-purchases
npm install @capacitor-community/admob
npm install @capgo/capacitor-updater

# Build and sync
npm run build
npx cap sync
```

---

## 🔄 Daily Development Workflow

### Make Changes → Build → Sync

```bash
# 1. Make your code changes

# 2. Build your web app
npm run build

# 3. Sync to native projects
npx cap sync

# 4. Open in Xcode or Android Studio
npx cap open ios
npx cap open android
```

---

## 🍎 iOS Commands

```bash
# Open iOS project in Xcode
npx cap open ios

# Sync iOS only
npx cap sync ios

# Copy web assets to iOS
npx cap copy ios

# Update iOS dependencies
npx cap update ios

# Clean iOS build
rm -rf ios/App/App/public
npx cap sync ios
```

### In Xcode:
- **Test**: Click ▶️ (or Cmd+R)
- **Archive**: Product → Archive
- **Stop**: Click ⬛ (or Cmd+.)

---

## 🤖 Android Commands

```bash
# Open Android project in Android Studio
npx cap open android

# Sync Android only
npx cap sync android

# Copy web assets to Android
npx cap copy android

# Update Android dependencies
npx cap update android

# Clean Android build
cd android && ./gradlew clean && cd ..
npx cap sync android
```

### In Android Studio:
- **Test**: Click ▶️ (or Shift+F10)
- **Build APK**: Build → Build Bundle(s) / APK(s) → Build APK(s)
- **Build AAB**: Build → Generate Signed Bundle / APK

---

## 🔄 OTA Updates (Capgo)

```bash
# Install Capgo
npm install @capgo/capacitor-updater
npx cap sync

# Initialize (one time)
npx @capgo/cli login
npx @capgo/cli init

# Deploy update (after every change)
npm run build
npx @capgo/cli upload

# Check update status
npx @capgo/cli list

# Roll back to previous version
npx @capgo/cli rollback
```

---

## 🔧 Debugging Commands

```bash
# View iOS logs
npx cap open ios
# Then: Xcode → Window → Devices and Simulators → View Device Logs

# View Android logs
npx cap open android
# Then: Android Studio → Logcat tab

# Check Capacitor doctor
npx cap doctor

# Sync with verbose logging
npx cap sync --verbose
```

---

## 📦 Plugin Management

```bash
# List installed plugins
npx cap ls

# Update all Capacitor packages
npm install @capacitor/core@latest @capacitor/cli@latest
npx cap sync

# Add a new plugin
npm install @capacitor/[plugin-name]
npx cap sync

# Remove a plugin
npm uninstall @capacitor/[plugin-name]
npx cap sync
```

---

## 🧪 Testing Commands

```bash
# iOS Simulator
npx cap run ios

# Android Emulator
npx cap run android

# Specific iOS device
npx cap run ios --target="iPhone 14 Pro"

# Specific Android device
npx cap run android --target="Pixel_7_API_33"

# List available devices
xcrun simctl list devices  # iOS
emulator -list-avds        # Android
```

---

## 🏗️ Build Commands

### Development Build
```bash
# Build web app
npm run build

# Sync to native
npx cap sync

# Open and run
npx cap open ios      # iOS
npx cap open android  # Android
```

### Production Build (iOS)
```bash
# 1. Update version in package.json
# 2. Build web app
npm run build
npx cap sync ios

# 3. Open Xcode
npx cap open ios

# 4. In Xcode:
# - Product → Archive
# - Distribute App → App Store Connect
```

### Production Build (Android)
```bash
# 1. Update version in package.json
# 2. Build web app
npm run build
npx cap sync android

# 3. Open Android Studio
npx cap open android

# 4. In Android Studio:
# - Build → Generate Signed Bundle / APK
# - Choose Android App Bundle (AAB)
# - Sign with your keystore
```

---

## 📊 Version Management

```bash
# Update app version
# Edit package.json: "version": "1.0.1"

# Update iOS version
# Edit in Xcode: General → Version & Build

# Update Android version
# Edit android/app/build.gradle:
#   versionCode 2
#   versionName "1.0.1"
```

---

## 🧹 Clean & Reset Commands

```bash
# Clean everything and rebuild
npm run build
npx cap sync --force

# Remove and re-add platforms
npx cap remove ios
npx cap remove android
npx cap add ios
npx cap add android
npx cap sync

# Clean node modules and reinstall
rm -rf node_modules
npm install
npx cap sync

# Nuclear option (complete reset)
rm -rf node_modules ios android
npm install
npx cap add ios
npx cap add android
npm run build
npx cap sync
```

---

## 🔐 Keystore Management (Android)

### Create Keystore (First Time)
```bash
cd android/app
keytool -genkey -v -keystore between-us-release.keystore \
  -alias between-us -keyalg RSA -keysize 2048 -validity 10000

# Save this file and password somewhere safe!
```

### Sign APK/AAB Manually
```bash
cd android
./gradlew bundleRelease  # Creates AAB
./gradlew assembleRelease  # Creates APK

# Find output:
# AAB: android/app/build/outputs/bundle/release/app-release.aab
# APK: android/app/build/outputs/apk/release/app-release.apk
```

---

## 📱 Device Testing

### iOS Physical Device
```bash
# 1. Connect iPhone via USB
# 2. Open Xcode
npx cap open ios

# 3. Select your device from dropdown
# 4. Click ▶️ to run
# 5. On device: Settings → General → VPN & Device Management
#    → Trust developer certificate
```

### Android Physical Device
```bash
# 1. Enable Developer Options on phone:
#    Settings → About Phone → Tap "Build Number" 7 times

# 2. Enable USB Debugging:
#    Settings → Developer Options → USB Debugging

# 3. Connect via USB

# 4. Allow USB debugging prompt on phone

# 5. Run
npx cap run android
# OR open Android Studio and click ▶️
```

---

## 🔍 Troubleshooting Commands

### iOS Issues
```bash
# Pod install issues
cd ios/App
pod install
pod update
cd ../..
npx cap sync ios

# Reset derived data
rm -rf ~/Library/Developer/Xcode/DerivedData

# Reset simulators
xcrun simctl erase all
```

### Android Issues
```bash
# Gradle issues
cd android
./gradlew clean
./gradlew --stop
cd ..
npx cap sync android

# Reset Gradle cache
rm -rf ~/.gradle/caches

# Invalidate Android Studio caches
# File → Invalidate Caches / Restart
```

### Web Issues
```bash
# Clear build cache
rm -rf dist
npm run build
npx cap sync
```

---

## 📊 Analytics & Monitoring

```bash
# Check Capacitor status
npx cap doctor

# View installed plugins and versions
npx cap ls

# Check for updates
npm outdated

# Update specific plugin
npm update @capacitor/[plugin-name]
npx cap sync
```

---

## 🚀 Deployment Workflow

### Regular Update (OTA - No Review)
```bash
# 1. Make changes to web code
# 2. Build
npm run build

# 3. Deploy
npx @capgo/cli upload

# Done! Users get update within minutes.
```

### Native Update (Requires Review)
```bash
# 1. Make changes (including native)
# 2. Update version numbers
# 3. Build
npm run build
npx cap sync

# 4. Build for iOS
npx cap open ios
# Archive in Xcode → Upload to App Store Connect

# 5. Build for Android
npx cap open android
# Build AAB in Android Studio → Upload to Play Console

# 6. Wait for review (1-3 days)
```

---

## 🎯 Common Workflows

### Adding a New Feature (Web Only)
```bash
# 1. Code your feature
# 2. Test in browser
npm run dev

# 3. Build and test on mobile
npm run build
npx cap sync
npx cap open ios    # Test on iOS
npx cap open android # Test on Android

# 4. Deploy via OTA
npx @capgo/cli upload
```

### Adding a New Plugin
```bash
# 1. Install plugin
npm install @capacitor/[plugin-name]

# 2. Sync to native projects
npx cap sync

# 3. Configure native code if needed
npx cap open ios    # Configure iOS
npx cap open android # Configure Android

# 4. Build and test
npm run build
npx cap sync

# 5. Must submit to app stores (can't use OTA)
```

### Fixing a Critical Bug
```bash
# 1. Fix the bug in code
# 2. Test locally
npm run dev

# 3. Build
npm run build

# 4. If web-only bug:
npx @capgo/cli upload  # OTA update (instant)

# 5. If native bug:
npx cap sync
# Rebuild in Xcode/Android Studio
# Submit to app stores
```

---

## 💡 Pro Tips

```bash
# Always sync after installing plugins
npm install [plugin] && npx cap sync

# Build and sync in one line
npm run build && npx cap sync

# Open both platforms
npx cap open ios & npx cap open android

# Force sync (if having issues)
npx cap sync --force

# Check what changed
npx cap ls

# Update everything
npm update && npx cap sync
```

---

## 📝 Pre-Submission Checklist

```bash
# Run all these before submitting to stores:

# 1. Update version
# Edit package.json, Xcode (iOS), build.gradle (Android)

# 2. Clean build
npm run build
npx cap sync --force

# 3. Test on real devices
npx cap run ios --target="YOUR_DEVICE"
npx cap run android --target="YOUR_DEVICE"

# 4. Check for errors
npx cap doctor

# 5. Build for stores
# iOS: Xcode → Archive
# Android: Android Studio → Generate Signed Bundle
```

---

## 🆘 Emergency Commands

### "Everything is broken!"
```bash
# Nuclear reset
rm -rf node_modules package-lock.json ios android dist
npm install
npm run build
npx cap add ios
npx cap add android
npx cap sync
```

### "iOS won't build!"
```bash
cd ios/App
pod deintegrate
pod install
cd ../..
npx cap sync ios
```

### "Android won't build!"
```bash
cd android
./gradlew clean
./gradlew --stop
cd ..
npx cap sync android
```

### "OTA updates not working!"
```bash
# Re-initialize Capgo
npx @capgo/cli logout
npx @capgo/cli login
npx @capgo/cli init
npm run build
npx @capgo/cli upload
```

---

## 📚 Quick Reference URLs

- Capacitor Docs: https://capacitorjs.com/docs
- Capgo Docs: https://capgo.app/docs
- App Store Connect: https://appstoreconnect.apple.com
- Google Play Console: https://play.google.com/console
- AdMob: https://admob.google.com

---

## 🎓 Command Aliases (Optional)

Add these to your `package.json` scripts:

```json
{
  "scripts": {
    "cap:sync": "npm run build && npx cap sync",
    "cap:ios": "npx cap open ios",
    "cap:android": "npx cap open android",
    "cap:update": "npx @capgo/cli upload",
    "cap:doctor": "npx cap doctor",
    "mobile:dev": "npm run build && npx cap sync && npx cap open ios",
    "mobile:build": "npm run build && npx cap sync --force"
  }
}
```

Then use:
```bash
npm run cap:sync      # Build and sync
npm run cap:ios       # Open iOS
npm run cap:android   # Open Android
npm run cap:update    # OTA update
npm run mobile:dev    # Quick dev workflow
```

---

**Bookmark this file!** You'll reference it constantly during development.

💜 Made with love for Between Us

✨ Dreamed by Darija ✨
