# Capacitor Native App Setup Guide

This guide will help you set up the Between Us app as a native iOS and Android app using Capacitor.

## Prerequisites

### For iOS Development:
- macOS (required for iOS development)
- Xcode 14+ (install from App Store)
- Xcode Command Line Tools: `xcode-select --install`
- CocoaPods: `sudo gem install cocoapods`

### For Android Development:
- Android Studio (latest version)
- Java Development Kit (JDK) 17 or higher
- Android SDK (installed via Android Studio)

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

This will install all required Capacitor packages including:
- `@capacitor/core`
- `@capacitor/ios`
- `@capacitor/android`
- `@capacitor/app`
- `@capacitor/splash-screen`
- And other Capacitor plugins

### 2. Build Your Web App

```bash
npm run build
```

This creates the `dist` folder that Capacitor will use for the native apps.

### 3. Add Native Platforms

**For iOS (macOS only):**
```bash
npm run cap:add:ios
```

**For Android:**
```bash
npm run cap:add:android
```

This creates the `ios/` and `android/` folders in your project root.

### 4. Sync Your App

After making changes to your web app, sync them to native platforms:

```bash
npm run build
npm run cap:sync
```

The `cap:sync` command:
- Copies your web app build to native projects
- Updates native dependencies
- Updates native project configuration

## Development Workflow

### Making Changes

1. **Update your React code** in `src/`
2. **Build the web app:**
   ```bash
   npm run build
   ```
3. **Sync to native platforms:**
   ```bash
   npm run cap:sync
   ```
4. **Open in native IDE:**
   - iOS: `npm run cap:open:ios` (opens Xcode)
   - Android: `npm run cap:open:android` (opens Android Studio)

### Live Reload (Development)

For faster development, you can use Capacitor's live reload:

1. Find your computer's local IP address:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet "
   
   # Windows
   ipconfig
   ```

2. Update `capacitor.config.ts`:
   ```typescript
   server: {
     url: 'http://YOUR_IP:5173',
     cleartext: true
   }
   ```

3. Start dev server:
   ```bash
   npm run dev
   ```

4. Sync with live reload:
   ```bash
   npm run cap:sync
   ```

5. Open in Xcode/Android Studio and run on device/simulator

**Note:** Remember to remove the `server.url` before production builds!

## Building for Production

### iOS

1. Open in Xcode:
   ```bash
   npm run cap:open:ios
   ```

2. In Xcode:
   - Select your development team in Signing & Capabilities
   - Choose a device or simulator
   - Click the Run button (▶️) or press `Cmd + R`

3. For App Store distribution:
   - Product → Archive
   - Distribute App → App Store Connect

### Android

1. Open in Android Studio:
   ```bash
   npm run cap:open:android
   ```

2. In Android Studio:
   - Wait for Gradle sync to complete
   - Select a device or emulator
   - Click Run (▶️) or press `Shift + F10`

3. For Play Store distribution:
   - Build → Generate Signed Bundle / APK
   - Follow the wizard to create a release build

## Available NPM Scripts

- `npm run dev` - Start Vite dev server
- `npm run build` - Build web app for production
- `npm run cap:sync` - Sync web app to native platforms
- `npm run cap:copy` - Copy web app only (faster, no dependency updates)
- `npm run cap:update` - Update native dependencies
- `npm run cap:open:ios` - Open iOS project in Xcode
- `npm run cap:open:android` - Open Android project in Android Studio
- `npm run cap:add:ios` - Add iOS platform (if not already added)
- `npm run cap:add:android` - Add Android platform (if not already added)

## Configuration

The Capacitor configuration is in `capacitor.config.ts` at the root of the project.

Key settings:
- `appId`: Your app's bundle identifier (e.g., `com.betweenus.app`)
- `appName`: Display name of your app
- `webDir`: Directory containing your built web app (`dist`)
- `plugins`: Configuration for Capacitor plugins

## Troubleshooting

### "Cannot find module '@capacitor/core'"
- Run `npm install` to ensure all dependencies are installed

### "White screen on launch"
- Ensure `npm run build` completed successfully
- Check that `dist` folder exists and contains `index.html`
- Run `npm run cap:sync` again

### "iOS build fails"
- Ensure Xcode is up to date
- Run `pod install` in the `ios/App` directory
- Check that your development team is set in Xcode

### "Android build fails"
- Ensure Android Studio is up to date
- Check that Android SDK is properly installed
- In Android Studio: File → Invalidate Caches / Restart

### "Plugins not working"
- Run `npm run cap:sync` after installing any new Capacitor plugin
- Rebuild the native project in Xcode/Android Studio

### "App crashes on launch"
- Check the console logs in Xcode (iOS) or Logcat (Android)
- Ensure all required permissions are declared in native configs
- Test the web version first to ensure there are no JavaScript errors

## Next Steps

1. **Add App Icons and Splash Screens:**
   - Use `@capacitor/assets` to generate icons and splash screens
   - Or manually add them to native projects

2. **Configure Permissions:**
   - iOS: Edit `ios/App/App/Info.plist`
   - Android: Edit `android/app/src/main/AndroidManifest.xml`

3. **Set up App Store / Play Store:**
   - Create developer accounts
   - Configure app metadata
   - Prepare screenshots and descriptions

4. **Test on Real Devices:**
   - Always test on physical devices before release
   - Test on multiple iOS and Android versions

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Setup Guide](https://capacitorjs.com/docs/ios)
- [Android Setup Guide](https://capacitorjs.com/docs/android)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)



