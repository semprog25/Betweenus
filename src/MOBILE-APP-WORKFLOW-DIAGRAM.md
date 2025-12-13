# 🎨 Between Us - Mobile App Workflow Diagram

Visual guide to understand how everything connects.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     BETWEEN US WEB APP                       │
│                  (React + TypeScript + Tailwind)             │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Check-in │  │  Share   │  │  Listen  │  │ Profile  │   │
│  │   Tab    │  │   Tab    │  │   Tab    │  │   Tab    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│                    Supabase Backend                          │
│             (Auth, Database, Storage, Edge Functions)        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Capacitor Wraps
                              ▼
        ┌─────────────────────────────────────────┐
        │         CAPACITOR CONTAINER             │
        │   (Native iOS/Android Wrapper)          │
        │                                         │
        │  Your web app runs inside here like a  │
        │  dedicated browser with native APIs     │
        └─────────────────────────────────────────┘
                     │                   │
        ┌────────────┴──────────┐       └────────────┬──────────┐
        │                       │                    │          │
        ▼                       ▼                    ▼          ▼
┌──────────────┐      ┌──────────────┐    ┌──────────────┐ ┌──────────────┐
│   iOS APP    │      │ ANDROID APP  │    │  WEB VERSION │ │ PWA VERSION  │
│              │      │              │    │              │ │              │
│  📱 iPhone   │      │ 🤖 Android   │    │ 🌐 Browser   │ │ 💻 Desktop   │
│  📱 iPad     │      │ 📱 Phone     │    │              │ │              │
│              │      │ 📱 Tablet    │    │              │ │              │
└──────────────┘      └──────────────┘    └──────────────┘ └──────────────┘
```

---

## 🔄 Development Workflow

```
┌─────────────────┐
│ Make Code       │
│ Changes         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Test in Browser │
│ npm run dev     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Build Web App   │
│ npm run build   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Sync to Native  │
│ npx cap sync    │
└────────┬────────┘
         │
         ├──────────────────────┐
         │                      │
         ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│ Test iOS        │    │ Test Android    │
│ npx cap open    │    │ npx cap open    │
│ ios             │    │ android         │
└────────┬────────┘    └────────┬────────┘
         │                      │
         └──────────┬───────────┘
                    ▼
         ┌─────────────────┐
         │ Choose Update   │
         │ Method          │
         └────────┬────────┘
                  │
         ┌────────┴────────┐
         │                 │
         ▼                 ▼
┌──────────────┐   ┌──────────────┐
│ OTA Update   │   │ Store Update │
│ (Instant)    │   │ (1-3 days)   │
│              │   │              │
│ Capgo Upload │   │ Xcode +      │
│              │   │ Android      │
│ Web changes  │   │ Studio       │
│ only         │   │              │
│              │   │ Native       │
│ No review    │   │ changes      │
└──────────────┘   └──────────────┘
```

---

## 💰 Monetization Flow

```
                    ┌─────────────┐
                    │   New User  │
                    └──────┬──────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │   Free Tier     │
                  │                 │
                  │ ✓ 3 posts/month │
                  │ ✓ Ads shown     │
                  │ ✓ Basic points  │
                  └────────┬────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
     ┌──────────────┐ ┌──────────┐ ┌──────────────┐
     │ Watch Ad     │ │ Buy      │ │ Upgrade to   │
     │ for Bonus    │ │ Credits  │ │ Subscription │
     │              │ │          │ │              │
     │ +10 Points   │ │ $0.99 -  │ │              │
     │              │ │ $2.99    │ │              │
     └──────────────┘ └──────────┘ └──────┬───────┘
                                           │
                    ┌──────────────────────┼──────────────────┐
                    │                      │                  │
                    ▼                      ▼                  ▼
           ┌─────────────────┐   ┌─────────────────┐  ┌─────────────────┐
           │    Premium      │   │      Pro        │  │    Lifetime     │
           │   $4.99/month   │   │  $49.99/year    │  │     $99.99      │
           │                 │   │                 │  │                 │
           │ ✓ 10 posts      │   │ ✓ Unlimited     │  │ ✓ All Pro       │
           │ ✓ No ads        │   │ ✓ No ads        │  │   features      │
           │ ✓ 10 edits      │   │ ✓ Unlimited     │  │ ✓ Forever       │
           │                 │   │   edits         │  │                 │
           └─────────────────┘   └─────────────────┘  └─────────────────┘
```

---

## 📊 Ad Display Logic

```
                     ┌────────────────┐
                     │ User Opens App │
                     └────────┬───────┘
                              │
                              ▼
                  ┌────────────────────────┐
                  │ Check Subscription     │
                  │ paymentService.        │
                  │ hasActiveSubscription()│
                  └────────┬───────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
      ┌──────────────┐         ┌──────────────┐
      │ Free User    │         │ Paid User    │
      │              │         │              │
      │ subscription │         │ subscription │
      │ = false      │         │ = true       │
      └──────┬───────┘         └──────┬───────┘
             │                        │
             ▼                        ▼
    ┌─────────────────┐      ┌─────────────────┐
    │ Show Ads        │      │ Hide All Ads    │
    │                 │      │                 │
    │ • Banner (bottom)│     │ • No banners    │
    │ • Interstitial  │      │ • No interstitials│
    │   every 5 posts │      │ • Pure experience│
    │ • Rewarded      │      │                 │
    │   (optional)    │      │                 │
    └─────────────────┘      └─────────────────┘
```

---

## 🔐 In-App Purchase Flow

```
┌──────────────────┐
│ User Taps        │
│ "Subscribe to    │
│ Premium"         │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────┐
│ PaymentService           │
│ .purchaseSubscription()  │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Native Payment Sheet     │
│ Shows (Apple/Google Pay) │
└────────┬─────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌─────────┐
│ Cancel │ │ Approve │
└────────┘ └────┬────┘
              │
              ▼
      ┌──────────────┐
      │ User Pays    │
      │ via App Store│
      └──────┬───────┘
             │
             ▼
    ┌──────────────────┐
    │ App Store Verifies│
    │ Payment          │
    └──────┬───────────┘
           │
           ▼
  ┌─────────────────────┐
  │ PaymentService      │
  │ handlePurchase      │
  │ Verified()          │
  └──────┬──────────────┘
         │
         ▼
┌──────────────────────┐
│ Update Supabase      │
│ user_profiles table: │
│                      │
│ subscription_tier =  │
│ 'premium'            │
│                      │
│ subscription_expiry =│
│ +30 days             │
└──────┬───────────────┘
       │
       ▼
┌──────────────────┐
│ Grant Access     │
│ • Hide ads       │
│ • Unlock posts   │
│ • Award points   │
└──────────────────┘
```

---

## 🔄 OTA Update Flow (Capgo)

```
┌─────────────────┐
│ Developer       │
│ Makes Changes   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ npm run build   │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ npx @capgo/cli      │
│ upload              │
└──────��─┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Capgo CDN           │
│ Receives new bundle │
└────────┬────────────┘
         │
         │ (Within minutes)
         │
         ▼
┌─────────────────────┐
│ User Opens App      │
│                     │
│ App checks for      │
│ updates             │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Download new bundle │
│ in background       │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Next app restart    │
│ loads new version   │
│                     │
│ User sees updates!  │
└─────────────────────┘

Total time: 1-5 minutes
No app store review needed!
```

---

## 🏪 App Store Submission Flow

```
┌──────────────────────┐
│ Build in Xcode       │
│ (iOS)                │
│                      │
│ OR                   │
���                      │
│ Build in Android     │
│ Studio (Android)     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Generate Archive/    │
│ Bundle               │
│                      │
│ iOS: .ipa file       │
│ Android: .aab file   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Upload to Store      │
│                      │
│ iOS: App Store       │
│      Connect         │
│                      │
│ Android: Play        │
│          Console     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Create Listing       │
│                      │
│ • Screenshots        │
│ • Description        │
│ • Category           │
│ • Price (Free)       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Submit for Review    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Wait 1-3 Days        │
└──────────┬───────────┘
           │
      ┌────┴────┐
      │         │
      ▼         ▼
┌──────────┐ ┌──────────┐
│ Approved │ │ Rejected │
└────┬─────┘ └────┬─────┘
     │            │
     │            ▼
     │      ┌──────────────┐
     │      │ Fix Issues   │
     │      │ Resubmit     │
     │      └──────┬───────┘
     │             │
     └─────────────┘
           │
           ▼
┌──────────────────────┐
│ App is Live! 🎉      │
│                      │
│ Users can download   │
│ from app stores      │
└──────────────────────┘
```

---

## 🔄 Update Decision Tree

```
                ┌──────────────────┐
                │ Need to Update?  │
                └────────┬─────────┘
                         │
                         ▼
              ┌─────────────────────────┐
              │ What kind of change?    │
              └────────┬────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ UI/Content   │ │ Bug Fix      │ │ New Plugin   │
│ Changes      │ │ (Web code)   │ │ or Native    │
│              │ │              │ │ Changes      │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       │                │                │
       └────────┬───────┴────────┬───────┘
                │                │
                ▼                ▼
        ┌──────────────┐  ┌──────────────┐
        │ OTA Update   │  │ Store Update │
        │              │  │              │
        │ ✓ Instant    │  │ • 1-3 days   │
        │ ✓ No review  │  │ • Review req │
        │              │  │ • For native │
        │ Steps:       │  │              │
        │ 1. Build     │  │ Steps:       │
        │ 2. Upload    │  │ 1. Sync      │
        │ 3. Done!     │  │ 2. Build     │
        │              │  │ 3. Submit    │
        └──────────────┘  └──────────────┘
```

---

## 📱 User Journey

```
                    ┌─────────────────┐
                    │ User finds app  │
                    │ in store        │
                    └────────┬────────┘
                             │
                             ▼
                   ┌──────────────────┐
                   │ Downloads &      │
                   │ Installs         │
                   └────────┬─────────┘
                            │
                            ▼
                  ┌───────────────────┐
                  │ First Launch      │
                  │ • Splash screen   │
                  │ • Onboarding      │
                  └────────┬──────────┘
                           │
                           ▼
                 ┌────────────────────┐
                 │ Create Account     │
                 │ (Supabase Auth)    │
                 └────────┬───────────┘
                          │
                          ▼
                ┌──────────────────────┐
                │ Main App Experience  │
                │                      │
                │ • Check-in tab       │
                │ • Share thoughts     │
                │ • Support others     │
                │ • Track wellness     │
                └────────┬─────────────┘
                         │
            ┌────────────┼────────────┐
            │            │            │
            ▼            ▼            ▼
    ┌──────────────┐ ┌──────────┐ ┌──────────────┐
    │ Stay Free    │ │ Watch Ad │ │ Upgrade to   │
    │              │ │          │ │ Premium/Pro  │
    │ • See ads    │ │ +Points  │ │              │
    │ • Limited    │ │          │ │ • No ads     │
    │   posts      │ │          │ │ • More posts │
    └──────────────┘ └──────────┘ └──────┬───────┘
                                          │
                                          ▼
                                  ┌──────────────┐
                                  │ Loyal User   │
                                  │              │
                                  │ • Daily use  │
                                  │ • Community  │
                                  │   engagement │
                                  │ • Improved   │
                                  │   wellness   │
                                  └──────────────┘
```

---

## 🎯 Revenue Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Between Us Revenue                    │
└─────────────────────────────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
     │   AdMob     │  │  Apple IAP  │  │ Google Play │
     │  (Ads)      │  │ (iOS subs)  │  │ (Android)   │
     │             │  │             │  │  (subs)     │
     │ Free users  │  │ Premium/Pro │  │ Premium/Pro │
     │ watch ads   │  │ lifetime    │  │ lifetime    │
     └─────┬───────┘  └─────┬───────┘  └─────┬───────┘
           │                │                │
           │ 70% to you     │ 70% to you     │ 70% to you
           │ 30% to Google  │ 30% to Apple   │ 30% to Google
           │                │                │
           └────────────────┼────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  Your Revenue   │
                  │                 │
                  │ 8k users @ $0.20│
                  │ = $1,600        │
                  │                 │
                  │ 1.5k @ $4.99    │
                  │ = $7,485        │
                  │                 │
                  │ 500 @ $4.17/mo  │
                  │ = $2,085        │
                  │                 │
                  │ Total: ~$11k/mo │
                  └─────────┬───────┘
                           │
                  ┌────────┴────────┐
                  │                 │
                  ▼                 ▼
         ┌─────────────┐    ┌─────────────┐
         │ Costs       │    │ Profit      │
         │             │    │             │
         │ Apple: $99  │    │ ~$10k/mo    │
         │ Google: $25 │    │             │
         │ Capgo: $49  │    │ Use for:    │
         │ Supabase:   │    │ • Growth    │
         │ $25         │    │ • Marketing │
         │             │    │ • Features  │
         │ Total: $200 │    │ • Team      │
         └─────────────┘    └─────────────┘
```

---

## 🔧 Tech Stack Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER                          │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  React   │  │TypeScript│  │ Tailwind │  │  Motion  │   │
│  │          │  │          │  │   CSS    │  │  React   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ shadcn/ui│  │  Recharts│  │  Sonner  │  │  Lucide  │   │
│  │Components│  │ (Charts) │  │ (Toast)  │  │  Icons   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   CAPACITOR BRIDGE LAYER                     │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Core API │  │   iOS    │  │ Android  │  │  Plugins │   │
│  │          │  │ Platform │  │ Platform │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  NATIVE PLUGINS │  │   SUPABASE      │  │   SERVICES      │
│                 │  │                 │  │                 │
│ • IAP           │  │ • Auth          │  │ • AdMob         │
│ • AdMob         │  │ • Database      │  │ • Capgo         │
│ • Push Notifs   │  │ • Storage       │  │ • Analytics     │
│ • Camera        │  │ • Edge Funcs    │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## 📚 File Structure

```
between-us/
│
├── src/                          # React source code
│   ├── components/               # React components
│   │   ├── CheckInTab.tsx
│   │   ├── ShareTab.tsx
│   │   ├── ListenTab.tsx
│   │   └── ProfileTab.tsx
│   ├── services/                 # Business logic
│   │   ├── PaymentService.ts    # In-app purchases
│   │   ├── AdMobService.ts      # Ad management
│   │   └── supabase.ts          # Supabase client
│   ├── App.tsx                   # Main app component
│   └── main.tsx                  # Entry point
│
├── ios/                          # iOS native project
│   └── App/                      # Generated by Capacitor
│       ├── App.xcodeproj         # Xcode project
│       └── App/
│           ├── Info.plist        # iOS config
│           └── Assets.xcassets/  # Icons, splash
│
├── android/                      # Android native project
│   └── app/                      # Generated by Capacitor
│       ├── build.gradle          # Build config
│       └── src/main/
│           ├── AndroidManifest.xml
│           └── res/              # Icons, splash
│
├── capacitor.config.ts           # Capacitor config
├── package.json                  # NPM dependencies
├── tsconfig.json                 # TypeScript config
└── vite.config.ts               # Build config

# Documentation (NEW - Created Today!)
├── MOBILE-APP-DEPLOYMENT-GUIDE.md       # Main guide
├── PAYMENT-INTEGRATION-CODE.md          # IAP guide
├── ADMOB-INTEGRATION-CODE.md            # AdMob guide
├── QUICK-START-MOBILE-GUIDE.md          # Quick ref
├── MOBILE-COMMANDS-CHEATSHEET.md        # Commands
├── COMPLETE-MOBILE-SETUP-SUMMARY.md     # Summary
└── MOBILE-APP-WORKFLOW-DIAGRAM.md       # This file
```

---

**Bookmark this page!** It visually explains how everything connects.

💜 Made with love for Between Us

✨ Dreamed by Darija ✨
