# Android Setup Guide

Your Android project has been successfully created! Follow these steps to open and run it in Android Studio.

## ✅ What's Been Done

1. ✅ Android platform added to your project
2. ✅ Web assets copied to Android project
3. ✅ All Capacitor plugins configured
4. ✅ Gradle project structure created

## 🚀 Opening in Android Studio

### Step 1: Open Android Studio

```bash
npm run cap:open:android
```

Or manually:
1. Open Android Studio
2. File → Open
3. Navigate to your project folder
4. Select the `android` folder
5. Click OK

### Step 2: Wait for Gradle Sync

Android Studio will automatically start syncing Gradle. This may take a few minutes the first time.

**If you see a Java version error:**
- The error "Unsupported class file major version 69" means you're using Java 24, which is too new
- Android Studio will prompt you to use a compatible JDK
- **Solution:** In Android Studio, go to:
  - File → Project Structure → SDK Location
  - Set Gradle JDK to Java 17 or Java 21 (recommended: Java 17)
  - Click Apply and let Gradle sync again

### Step 3: Configure SDK

1. In Android Studio, go to **Tools → SDK Manager**
2. Ensure you have installed:
   - Android SDK Platform 34 (or latest)
   - Android SDK Build-Tools
   - Android SDK Platform-Tools
   - Android Emulator (if you want to use emulator)

### Step 4: Set Up an Emulator (Optional)

1. Go to **Tools → Device Manager**
2. Click **Create Device**
3. Select a device (e.g., Pixel 6)
4. Select a system image (e.g., Android 14 - API 34)
5. Click **Finish**

## 🏃 Running Your App

### Option 1: Run on Emulator

1. Start an emulator from Device Manager
2. Click the **Run** button (▶️) or press `Shift + F10`
3. Select your emulator from the device list
4. Wait for the app to build and launch

### Option 2: Run on Physical Device

1. **Enable Developer Options on your Android device:**
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings → Developer Options
   - Enable "USB Debugging"

2. **Connect your device:**
   - Connect via USB
   - Accept the USB debugging prompt on your device
   - Your device should appear in Android Studio's device list

3. **Run the app:**
   - Select your device from the device dropdown
   - Click **Run** (▶️) or press `Shift + F10`

## 🔧 Common Issues & Solutions

### Issue: "Gradle sync failed"

**Solution:**
1. File → Invalidate Caches / Restart
2. Select "Invalidate and Restart"
3. Wait for Android Studio to restart and sync again

### Issue: "SDK location not found"

**Solution:**
1. File → Project Structure → SDK Location
2. Set Android SDK location (usually `~/Library/Android/sdk` on macOS)
3. Click Apply

### Issue: "Build failed: Unsupported class file major version"

**Solution:**
1. File → Project Structure → SDK Location
2. Set Gradle JDK to Java 17 (or Java 21)
3. Click Apply
4. Let Gradle sync again

### Issue: "App crashes on launch"

**Solution:**
1. Check Logcat in Android Studio for error messages
2. Ensure you've run `npm run build` before `npm run cap:sync`
3. Check that `dist` folder exists and contains your built app

### Issue: "Plugin not found"

**Solution:**
1. Run `npm run cap:sync` again
2. In Android Studio: File → Sync Project with Gradle Files
3. Rebuild the project

## 📱 Development Workflow

After making changes to your React code:

```bash
# 1. Build your web app
npm run build

# 2. Sync to Android
npm run cap:sync

# 3. In Android Studio, click Run again
```

## 🔍 Testing

### Check Logs

- **Logcat:** View → Tool Windows → Logcat
- Filter by your app's package name: `com.betweenus.app`

### Debugging

1. Set breakpoints in your React code
2. Run in debug mode: Click the bug icon (🐛) or press `Shift + F9`
3. Use Chrome DevTools: The app will open in Chrome for debugging

## 📦 Building for Release

### Generate Signed APK/Bundle

1. **Build → Generate Signed Bundle / APK**
2. Choose **Android App Bundle** (recommended for Play Store) or **APK**
3. Create a new keystore or use existing:
   - Keystore path: Choose a location
   - Password: Create a strong password
   - Key alias: Create an alias
   - Key password: Create a password
   - Validity: 25 years (recommended)
4. Click **Next**
5. Select **release** build variant
6. Click **Finish**

### Configure Signing (One-time setup)

Edit `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('path/to/your/keystore.jks')
            storePassword 'your-store-password'
            keyAlias 'your-key-alias'
            keyPassword 'your-key-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            ...
        }
    }
}
```

## 🎯 Next Steps

1. **Test on a real device** - Always test on physical devices before release
2. **Configure app icon and splash screen** - Use `@capacitor/assets` or add manually
3. **Set up app signing** - Required for Play Store release
4. **Configure permissions** - Edit `AndroidManifest.xml` if needed
5. **Test all features** - Ensure all Capacitor plugins work correctly

## 📚 Resources

- [Capacitor Android Documentation](https://capacitorjs.com/docs/android)
- [Android Studio User Guide](https://developer.android.com/studio/intro)
- [Android Developer Documentation](https://developer.android.com/docs)

## ✅ Checklist

- [ ] Android Studio installed
- [ ] Android SDK configured
- [ ] Gradle sync successful
- [ ] App runs on emulator or device
- [ ] All features working
- [ ] Ready for development!

Your Android app is ready to go! 🎉



