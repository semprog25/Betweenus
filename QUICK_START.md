# Quick Start - Native App Setup

Your project is now ready to build native iOS and Android apps with Capacitor!

## ✅ What's Been Done

1. ✅ Added all required Capacitor dependencies to `package.json`
2. ✅ Created `capacitor.config.ts` at project root
3. ✅ Fixed Vite build output to `dist` directory
4. ✅ Initialized Capacitor in `main.tsx`
5. ✅ Updated `index.html` with mobile meta tags
6. ✅ Added npm scripts for Capacitor commands
7. ✅ Created `.gitignore` for native platform folders

## 🚀 Next Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Build Your Web App

```bash
npm run build
```

### 3. Add Native Platforms

**For iOS (macOS only):**
```bash
npm run cap:add:ios
```

**For Android:**
```bash
npm run cap:add:android
```

### 4. Sync to Native Projects

```bash
npm run cap:sync
```

### 5. Open in Native IDEs

**iOS (Xcode):**
```bash
npm run cap:open:ios
```

**Android (Android Studio):**
```bash
npm run cap:open:android
```

## 📱 Building & Running

### iOS
1. Open Xcode: `npm run cap:open:ios`
2. Select a simulator or connected device
3. Click Run (▶️) or press `Cmd + R`

### Android
1. Open Android Studio: `npm run cap:open:android`
2. Wait for Gradle sync
3. Select a device or emulator
4. Click Run (▶️) or press `Shift + F10`

## 🔄 Development Workflow

After making changes to your React code:

```bash
# 1. Build web app
npm run build

# 2. Sync to native projects
npm run cap:sync

# 3. Open in IDE and run
npm run cap:open:ios    # or cap:open:android
```

## 📚 Full Documentation

See `CAPACITOR_SETUP.md` for detailed setup instructions, troubleshooting, and advanced configuration.

## ⚠️ Important Notes

- **iOS development requires macOS** and Xcode
- **Android development** works on Windows, macOS, or Linux
- Always run `npm run build` before `npm run cap:sync`
- Native platform folders (`ios/`, `android/`) are gitignored - they'll be generated when you add platforms

## 🆘 Troubleshooting

If you encounter issues:

1. **White screen on launch:**
   - Ensure `npm run build` completed successfully
   - Check that `dist/` folder exists
   - Run `npm run cap:sync` again

2. **Build errors:**
   - Make sure all dependencies are installed: `npm install`
   - For iOS: Ensure Xcode and CocoaPods are installed
   - For Android: Ensure Android Studio and SDK are set up

3. **Plugins not working:**
   - Run `npm run cap:sync` after installing any new plugin
   - Rebuild the native project

See `CAPACITOR_SETUP.md` for more troubleshooting tips.



