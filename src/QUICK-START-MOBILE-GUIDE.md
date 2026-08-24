# 🚀 Between Us - Quick Start Mobile Guide

## TL;DR - Get Your App to App Stores FAST

This is the simplest path from web app to iOS/Android apps on the App Store and Play Store.

---

## ✅ Prerequisites (What You Need First)

1. **Computer**: Mac required (for iOS builds)
2. **Accounts**:
   - Apple Developer ($99/year) - https://developer.apple.com
   - Google Play Console ($25 one-time) - https://play.google.com/console
3. **Software** (all free):
   - Xcode (Mac App Store)
   - Android Studio (https://developer.android.com/studio)
   - Node.js (https://nodejs.org)

---

## 📱 Step-by-Step: Web App → Mobile Apps

### STEP 1: Install Capacitor (5 minutes)

Open terminal in your project folder:

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli

# Initialize (answer prompts)
npx cap init
# App name: Between Us
# App ID: com.betweenus.app
# Web dir: dist

# Add platforms
npm install @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android

# Build and sync
npm run build
npx cap sync
```

✅ **Done!** You now have `ios/` and `android/` folders.

---

### STEP 2: Build iOS App (30 minutes)

```bash
# Open in Xcode
npx cap open ios
```

**In Xcode:**
1. Click project name (top left)
2. **Signing & Capabilities** tab
3. Team: Select your Apple Developer account
4. Test: Click ▶️ to run in simulator
5. Build: **Product** → **Archive**
6. Upload: **Distribute App** → **App Store Connect**

✅ **Done!** iOS app uploaded.

---

### STEP 3: Build Android App (30 minutes)

```bash
# Open in Android Studio
npx cap open android
```

**In Android Studio:**
1. Wait for Gradle sync
2. Test: Click ▶️ to run in emulator
3. Build: **Build** → **Generate Signed Bundle**
4. Create keystore (SAVE THIS FILE!)
5. Generate AAB file
6. Upload to Play Console

✅ **Done!** Android app uploaded.

---

### STEP 4: Create App Store Listings (1 hour)

**iOS - App Store Connect:**
1. Go to https://appstoreconnect.apple.com
2. **My Apps** → **+** → **New App**
3. Fill in:
   - Name: Between Us
   - Language: English
   - Category: Health & Fitness
   - Price: Free
4. Upload screenshots (use simulator)
5. Add description
6. Submit for review

**Android - Play Console:**
1. Go to https://play.google.com/console
2. **Create app**
3. Fill in details
4. Upload screenshots
5. Complete content rating
6. Submit for review

✅ **Done!** Apps submitted for review (1-3 days).

---

## 🔄 OTA Updates (Skip App Store Reviews)

### Install Capgo (10 minutes)

```bash
# Install
npm install @capgo/capacitor-updater
npx cap sync

# Sign up at https://capgo.app
# Get API key

# Initialize
npx @capgo/cli init YOUR_API_KEY
```

### Deploy Updates

```bash
# Build your changes
npm run build

# Upload (takes 1 minute)
npx @capgo/cli upload
```

✅ **Done!** Users get update within minutes, no app store review!

---

## 💰 Add In-App Purchases (2 hours)

### Install Plugin

```bash
npm install @capacitor-community/in-app-purchases
npx cap sync
```

### Create Products

**iOS - App Store Connect:**
1. Your App → **Features** → **In-App Purchases**
2. Create:
   - `premium_monthly` - $4.99/month
   - `pro_yearly` - $49.99/year
   - `lifetime_access` - $99.99 one-time

**Android - Play Console:**
1. Your App → **Monetize** → **Products** → **Subscriptions**
2. Create same products with same IDs

### Add Code

Copy code from `/PAYMENT-INTEGRATION-CODE.md` → Done!

✅ **Done!** You can now accept payments.

---

## 📊 Add Google AdMob (1 hour)

### Install Plugin

```bash
npm install @capacitor-community/admob
npx cap sync
```

### Create AdMob Account

1. Go to https://admob.google.com
2. Create apps for iOS and Android
3. Create ad units (banner, interstitial, rewarded)
4. Get App IDs

### Add Code

Copy code from `/ADMOB-INTEGRATION-CODE.md` → Done!

✅ **Done!** Ads showing for free users.

---

## 🎯 Every Time You Update

### For UI/Content Changes (No Review Needed):

```bash
# Make changes
# Build
npm run build

# Deploy via OTA
npx @capgo/cli upload
```

⏱️ **Takes 1 minute**. Users get update instantly.

### For Native Changes (Requires Review):

```bash
# Make changes
# Build
npm run build

# Sync
npx cap sync

# Rebuild in Xcode/Android Studio
npx cap open ios
npx cap open android

# Submit new version to stores
```

⏱️ **Takes 1-3 days** (app store review time).

---

## 🆘 Common Issues & Fixes

### "White screen on launch"
```bash
npm run build
npx cap sync --force
```

### "Plugins not working"
```bash
npx cap sync
# Rebuild in Xcode/Android Studio
```

### "Can't build iOS"
- Must use a Mac
- Install Xcode from Mac App Store
- Accept Xcode terms

### "Ads not showing"
- Test on real device (not simulator)
- Wait 1-2 hours after AdMob setup
- Use test ad unit IDs first

### "Payments not working"
- Test on real device
- Create sandbox test accounts
- Ensure products are approved

---

## 📋 Pre-Launch Checklist

- [ ] App tested on real iOS device
- [ ] App tested on real Android device
- [ ] In-app purchases work
- [ ] Ads show for free users
- [ ] Ads hidden for premium users
- [ ] OTA updates configured
- [ ] Privacy policy URL ready
- [ ] Screenshots prepared
- [ ] App description written
- [ ] Support email set up

---

## 💡 Pro Tips

1. **Start with OTA updates**: Fix bugs instantly
2. **Test in-app purchases first**: Use sandbox accounts
3. **Use TestFlight**: Beta test with real users before launch
4. **Monitor analytics**: Check crash rate and ratings
5. **Respond to reviews**: Engage with users

---

## 💰 Monetization Strategy

### Free Tier:
- Banner ads (bottom)
- Interstitial every 5 posts
- 3 posts/month
- Revenue: ~$0.10/user/month (ads)

### Premium ($4.99/month):
- No ads
- 10 posts/month
- 10 edit credits
- Revenue: $4.99/user/month

### Pro ($49.99/year):
- No ads
- Unlimited posts
- Unlimited edits
- Revenue: $4.17/user/month

### Lifetime ($99.99):
- All Pro features
- One-time payment
- Revenue: $99.99/user

**Target**: 80% free, 15% premium, 5% pro/lifetime

With 10,000 users:
- 8,000 free ($800/month from ads)
- 1,500 premium ($7,485/month)
- 500 pro/lifetime (~$2,085/month)
- **Total**: ~$10,370/month 💰

---

## 🎓 Learning Path

### Day 1: Setup
- Install Capacitor
- Build for iOS and Android
- Test on simulators

### Day 2: Configure
- Set up app icons
- Configure permissions
- Test on real devices

### Day 3-4: Payments
- Create in-app purchase products
- Integrate payment code
- Test purchases

### Day 5: Ads
- Set up AdMob
- Integrate ad code
- Test ad display

### Day 6-7: Polish
- Create screenshots
- Write descriptions
- Prepare app store listings

### Day 8: Submit
- Submit to App Store
- Submit to Play Store
- Wait for review

### Day 9-10: Launch
- Apps approved ✅
- Announce launch 🎉
- Monitor reviews and feedback

**Total time**: ~2 weeks part-time

---

## 📚 Full Documentation

Detailed guides:
- `/MOBILE-APP-DEPLOYMENT-GUIDE.md` - Complete 15-part guide
- `/PAYMENT-INTEGRATION-CODE.md` - In-app purchases
- `/ADMOB-INTEGRATION-CODE.md` - Ad monetization

---

## 🎯 Quick Commands Reference

```bash
# Initial setup
npx cap init
npx cap add ios android

# Build and sync
npm run build
npx cap sync

# Open native IDEs
npx cap open ios
npx cap open android

# OTA update
npx @capgo/cli upload

# Update Capacitor
npm install @capacitor/core@latest @capacitor/cli@latest
npx cap sync
```

---

## 📞 Support Resources

- **Capacitor Docs**: https://capacitorjs.com/docs
- **Capgo Docs**: https://capgo.app/docs
- **Apple Developer**: https://developer.apple.com/support
- **Google Play Help**: https://support.google.com/googleplay/android-developer
- **Stack Overflow**: Search "capacitor [your issue]"

---

## 🎉 You're Ready!

Follow this guide step-by-step and you'll have your Between Us app on the App Store and Play Store in ~2 weeks.

**Remember:**
- ✅ Take it one step at a time
- ✅ Test thoroughly before submitting
- ✅ Use OTA updates for quick fixes
- ✅ Monitor user feedback
- ✅ Keep improving

**You've got this! 💜**

---

✨ Dreamed by Darija ✨

Made with 💜 for mental wellness
