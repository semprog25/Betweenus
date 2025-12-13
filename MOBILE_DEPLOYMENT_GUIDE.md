# Mobile App Deployment Guide - Between Us

## ✅ Build Status
- ✅ Build errors fixed (terser installed, import paths corrected)
- ✅ Production build successful
- ✅ Capacitor configured

## Prerequisites

1. **Install Capacitor CLI globally** (if not already installed):
   ```bash
   npm install -g @capacitor/cli
   ```

2. **Install platform dependencies**:
   - **Android**: Android Studio with Android SDK
   - **iOS**: Xcode (macOS only)

## Step 1: Initialize Capacitor Platforms

```bash
# Add Android platform
npx cap add android

# Add iOS platform (macOS only)
npx cap add ios
```

## Step 2: Build and Sync

After making changes to your web app:

```bash
# 1. Build the web app
npm run build

# 2. Sync web assets to native projects
npx cap sync

# This copies the dist/ folder to native projects and updates dependencies
```

## Step 3: Configure App Details

### Update App ID and Name

Edit `capacitor.config.json`:
```json
{
  "appId": "com.betweenus.app",  // Change to your unique app ID
  "appName": "Between Us",        // Your app display name
  "webDir": "dist"
}
```

### Android Configuration

1. **Update AndroidManifest.xml** (after `npx cap add android`):
   - Location: `android/app/src/main/AndroidManifest.xml`
   - Set minimum SDK version (recommended: 22+)
   - Add required permissions

2. **Update build.gradle**:
   - Location: `android/app/build.gradle`
   - Set `minSdkVersion` to 22 or higher
   - Set `targetSdkVersion` to latest (34+)
   - Configure version code and version name

3. **Create app icons**:
   - Use Android Asset Studio or provide icons in:
     - `android/app/src/main/res/mipmap-*/ic_launcher.png`
     - Various sizes: mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi

### iOS Configuration

1. **Update Info.plist** (after `npx cap add ios`):
   - Location: `ios/App/App/Info.plist`
   - Add required permissions (camera, photo library, etc.)
   - Configure URL schemes if needed

2. **Create app icons**:
   - Use Xcode Asset Catalog
   - Provide icons in various sizes (1024x1024 for App Store)

3. **Configure signing**:
   - Open `ios/App/App.xcworkspace` in Xcode
   - Select your team in Signing & Capabilities
   - Configure bundle identifier

## Step 4: Development Workflow

### Run on Android

```bash
# Build web app
npm run build

# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android

# Or run directly on connected device/emulator
npx cap run android
```

### Run on iOS (macOS only)

```bash
# Build web app
npm run build

# Sync to iOS
npx cap sync ios

# Open in Xcode
npx cap open ios

# Or run directly on connected device/simulator
npx cap run ios
```

## Step 5: Testing

### Test Checklist

- [ ] App launches without crashes
- [ ] All tabs/navigation work
- [ ] Authentication flows work
- [ ] Camera/photo upload works (if applicable)
- [ ] Push notifications work (if configured)
- [ ] Offline functionality works
- [ ] Performance is acceptable
- [ ] UI looks correct on different screen sizes

## Step 6: Production Build

### Android (APK/AAB)

1. **Open Android Studio**:
   ```bash
   npx cap open android
   ```

2. **Generate signed bundle**:
   - Build → Generate Signed Bundle / APK
   - Choose "Android App Bundle" (recommended for Play Store)
   - Use your keystore (create one if needed)
   - Build variants: release

3. **Output location**: `android/app/release/app-release.aab`

### iOS (IPA)

1. **Open Xcode**:
   ```bash
   npx cap open ios
   ```

2. **Archive**:
   - Product → Archive
   - Wait for archive to complete
   - Click "Distribute App"
   - Choose distribution method (App Store, Ad Hoc, Enterprise)

3. **Upload to App Store Connect**:
   - Use Xcode Organizer or Transporter app
   - Submit for review

## Step 7: App Store Submission

### Google Play Store

1. **Create app listing**:
   - Go to Google Play Console
   - Create new app
   - Fill in store listing details

2. **Upload AAB**:
   - Go to Production → Create new release
   - Upload `app-release.aab`
   - Fill in release notes

3. **Complete store listing**:
   - Screenshots (phone, tablet)
   - App icon (512x512)
   - Feature graphic (1024x500)
   - Privacy policy URL
   - Content rating questionnaire

### Apple App Store

1. **Create app in App Store Connect**:
   - Go to App Store Connect
   - Create new app
   - Fill in app information

2. **Upload build**:
   - Use Xcode or Transporter
   - Wait for processing (can take 30-60 minutes)

3. **Complete app information**:
   - Screenshots (various device sizes)
   - App icon (1024x1024)
   - Description, keywords
   - Privacy policy URL
   - App review information

## Step 8: Environment Variables & Secrets

### Important: Secure Your Keys

Before building for production:

1. **Supabase keys**: Ensure production keys are set
2. **API endpoints**: Use production URLs
3. **OAuth redirects**: Update redirect URLs for mobile
4. **Remove debug logs**: Already handled by build config

### Update Capacitor Config for Production

Edit `capacitor.config.json`:
```json
{
  "server": {
    "androidScheme": "https",
    "iosScheme": "https"
  }
}
```

## Common Issues & Solutions

### Issue: Build fails with "terser not found"
**Solution**: Already fixed - terser is now in devDependencies

### Issue: Import errors with version suffixes
**Solution**: Already fixed - removed `@version` suffixes from imports

### Issue: App crashes on launch
**Solution**: 
- Check browser console for errors
- Ensure all Capacitor plugins are properly installed
- Verify `npx cap sync` was run after build

### Issue: Icons not showing
**Solution**: 
- Ensure icons are in correct directories
- Run `npx cap sync` after adding icons
- Clear app data and reinstall

### Issue: Network requests failing
**Solution**: 
- Check CORS settings on backend
- Verify API endpoints are correct
- Check network permissions in AndroidManifest.xml / Info.plist

## Quick Commands Reference

```bash
# Build web app
npm run build

# Sync to all platforms
npx cap sync

# Sync to specific platform
npx cap sync android
npx cap sync ios

# Open in IDE
npx cap open android
npx cap open ios

# Run on device/emulator
npx cap run android
npx cap run ios

# Check Capacitor version
npx cap --version

# Update Capacitor
npm install @capacitor/cli@latest @capacitor/core@latest
npx cap sync
```

## Next Steps

1. ✅ Build is working
2. ⏭️ Add Android platform: `npx cap add android`
3. ⏭️ Add iOS platform: `npx cap add ios`
4. ⏭️ Test on devices
5. ⏭️ Configure app icons and splash screens
6. ⏭️ Set up signing certificates
7. ⏭️ Build production releases
8. ⏭️ Submit to app stores

## Support

For Capacitor-specific issues, check:
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor Community](https://github.com/ionic-team/capacitor/discussions)



