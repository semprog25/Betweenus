# Mobile Dependencies Guide 📦

## Required npm Packages for Mobile Conversion

Add these to your `package.json` when you move to local development:

---

## Core Capacitor Packages

```json
{
  "dependencies": {
    "@capacitor/core": "^5.0.0",
    "@capacitor/cli": "^5.0.0",
    "@capacitor/ios": "^5.0.0",
    "@capacitor/android": "^5.0.0"
  }
}
```

**Install:**
```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
```

---

## Capacitor Plugins

```json
{
  "dependencies": {
    "@capacitor/status-bar": "^5.0.0",
    "@capacitor/splash-screen": "^5.0.0",
    "@capacitor/keyboard": "^5.0.0",
    "@capacitor/haptics": "^5.0.0",
    "@capacitor/network": "^5.0.0",
    "@capacitor/app": "^5.0.0",
    "@capacitor/camera": "^5.0.0",
    "@capacitor/share": "^5.0.0",
    "@capacitor/push-notifications": "^5.0.0"
  }
}
```

**Install:**
```bash
npm install @capacitor/status-bar @capacitor/splash-screen @capacitor/keyboard @capacitor/haptics @capacitor/network @capacitor/app @capacitor/camera @capacitor/share @capacitor/push-notifications
```

---

## RevenueCat (Mobile Subscriptions)

```json
{
  "dependencies": {
    "@revenuecat/purchases-capacitor": "^7.0.0"
  }
}
```

**Install:**
```bash
npm install @revenuecat/purchases-capacitor
```

---

## Optional but Recommended

### Firebase (for push notifications, analytics)
```json
{
  "dependencies": {
    "@capacitor-firebase/app": "^5.0.0",
    "@capacitor-firebase/analytics": "^5.0.0",
    "@capacitor-firebase/messaging": "^5.0.0"
  }
}
```

**Install:**
```bash
npm install @capacitor-firebase/app @capacitor-firebase/analytics @capacitor-firebase/messaging
```

### Capacitor Community Plugins
```json
{
  "dependencies": {
    "@capacitor-community/http": "^1.4.1",
    "@capacitor-community/stripe": "^5.0.0"
  }
}
```

---

## Complete package.json Example

Here's what your `package.json` should look like with all mobile dependencies:

```json
{
  "name": "between-us",
  "version": "1.0.0",
  "description": "Anonymous mental wellness and support app",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "build:mobile": "vite build && npm run sync",
    "sync": "npx cap sync",
    "ios": "npx cap open ios",
    "android": "npx cap open android",
    "add:ios": "npx cap add ios",
    "add:android": "npx cap add android"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.39.0",
    "motion": "^10.16.0",
    "lucide-react": "^0.294.0",
    "sonner": "^1.2.0",
    "recharts": "^2.10.0",
    "date-fns": "^2.30.0",
    
    "@capacitor/core": "^5.0.0",
    "@capacitor/ios": "^5.0.0",
    "@capacitor/android": "^5.0.0",
    "@capacitor/status-bar": "^5.0.0",
    "@capacitor/splash-screen": "^5.0.0",
    "@capacitor/keyboard": "^5.0.0",
    "@capacitor/haptics": "^5.0.0",
    "@capacitor/network": "^5.0.0",
    "@capacitor/app": "^5.0.0",
    "@capacitor/camera": "^5.0.0",
    "@capacitor/share": "^5.0.0",
    "@capacitor/push-notifications": "^5.0.0",
    
    "@revenuecat/purchases-capacitor": "^7.0.0"
  },
  "devDependencies": {
    "@capacitor/cli": "^5.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^4.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## Installation Commands (All at Once)

Copy and paste this into your terminal in your local project directory:

```bash
# Install all Capacitor packages
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android @capacitor/status-bar @capacitor/splash-screen @capacitor/keyboard @capacitor/haptics @capacitor/network @capacitor/app @capacitor/camera @capacitor/share @capacitor/push-notifications

# Install RevenueCat
npm install @revenuecat/purchases-capacitor

# Optional: Install Firebase packages
npm install @capacitor-firebase/app @capacitor-firebase/analytics @capacitor-firebase/messaging
```

---

## Verify Installation

After installing, verify everything is ready:

```bash
# Check Capacitor version
npx cap --version

# Should show: @capacitor/cli 5.x.x

# Check if all plugins are recognized
npx cap ls

# Should list all installed plugins
```

---

## Platform-Specific Dependencies

### iOS (Mac only)

**System Requirements:**
- macOS 11.0 or higher
- Xcode 14.0 or higher
- CocoaPods 1.12 or higher

**Install CocoaPods:**
```bash
sudo gem install cocoapods
```

**After adding iOS platform:**
```bash
cd ios/App
pod install
```

### Android

**System Requirements:**
- Java JDK 11 or higher
- Android Studio Arctic Fox or higher
- Android SDK 33
- Gradle 8.0 or higher

**Verify Java:**
```bash
java -version
# Should show: java version "11.0.x" or higher
```

---

## Optional Performance Plugins

### App Performance Monitoring
```bash
npm install @capacitor/performance
```

### Offline Storage
```bash
npm install @capacitor/storage
# OR
npm install @capacitor-community/sqlite
```

### Biometric Authentication
```bash
npm install @capacitor-community/biometric-auth
```

### In-App Browser
```bash
npm install @capacitor/browser
```

---

## Build Tools Configuration

### vite.config.ts

Update your Vite config for mobile builds:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    target: 'es2015', // Compatibility for older mobile browsers
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
```

### tsconfig.json

Ensure TypeScript is configured for Capacitor:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "types": ["vite/client"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## Environment Variables for Mobile

Create `.env.production` for production builds:

```env
# Supabase
VITE_SUPABASE_URL=https://qoqbdiixztolvtcjdnle.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# RevenueCat (optional - can hardcode in utils/revenuecat.tsx)
VITE_REVENUECAT_IOS_KEY=your_ios_key
VITE_REVENUECAT_ANDROID_KEY=your_android_key

# API Endpoints
VITE_API_URL=https://qoqbdiixztolvtcjdnle.supabase.co/functions/v1/make-server-6c9b0e48
```

---

## Testing Dependencies (Optional)

For automated testing:

```bash
# Unit testing
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest

# E2E testing
npm install --save-dev @capacitor/detox detox
```

---

## Size Optimization

To keep mobile app size small:

```bash
# Image optimization
npm install --save-dev vite-plugin-imagemin

# Bundle analysis
npm install --save-dev rollup-plugin-visualizer

# Tree-shaking unused code
npm install --save-dev @rollup/plugin-terser
```

---

## Troubleshooting

### Error: "Cannot find module '@capacitor/core'"
**Fix:** Run `npm install @capacitor/core`

### Error: "Capacitor sync failed"
**Fix:** Delete `node_modules`, run `npm install`, then `npx cap sync`

### Error: "Pod install failed" (iOS)
**Fix:** 
```bash
cd ios/App
pod repo update
pod install
```

### Error: "Gradle build failed" (Android)
**Fix:** Update Android Studio and Gradle to latest versions

---

## Post-Installation Checklist

After installing all dependencies:

- [ ] Run `npm install` successfully
- [ ] Run `npm run build` successfully  
- [ ] Run `npx cap add ios` (Mac only)
- [ ] Run `npx cap add android`
- [ ] Run `npx cap sync` without errors
- [ ] Open iOS in Xcode: `npx cap open ios`
- [ ] Open Android in Android Studio: `npx cap open android`
- [ ] Build and run on simulator/emulator
- [ ] Test on real device

---

## Keep Dependencies Updated

Regularly update for bug fixes and new features:

```bash
# Check for outdated packages
npm outdated

# Update Capacitor
npm update @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android

# Update all plugins
npm update @capacitor/status-bar @capacitor/splash-screen @capacitor/keyboard

# After updates, sync again
npx cap sync
```

---

## Summary

**Total Additional Packages: ~15-20**
**Estimated Download Size: ~100-150 MB**
**Installation Time: 5-10 minutes**

All packages are free and open source except RevenueCat (which has a free tier for up to $10k MRR).

You're now ready to build mobile apps! 🚀
