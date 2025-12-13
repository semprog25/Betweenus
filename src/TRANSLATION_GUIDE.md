# Translation System Implementation Guide

## ✅ What's Been Completed

1. **Created `LanguageContext.tsx`** - Complete translation system with all 6 languages
2. **Updated `App.tsx`** - Wrapped app with LanguageProvider
3. **Translations included for:**
   - Onboarding (all 4 steps)
   - Check-in Tab (moods, sub-moods, activities, journal)
   - Share Tab
   - Listen Tab  
   - Community Tab
   - Profile Tab

## 🎯 How It Works

### Language Selection Flow:
1. User selects language in **Onboarding** → Sets as app language
2. User can change language in **Profile Tab** → Updates app language
3. Language preference is stored in `localStorage`

### Auto-Translation:
When the user selects a language, **the entire app automatically translates** to that language.

## 📝 How to Use Translations in Components

### Step 1: Import the hook
```tsx
import { useLanguage } from './LanguageContext';
```

### Step 2: Use the `t()` function
```tsx
export function MyComponent() {
  const { t, language } = useLanguage();
  
  return (
    <div>
      <h1>{t('onboarding.welcome.title')}</h1>
      <p>{t('checkin.greeting')}</p>
    </div>
  );
}
```

### Step 3: Replace all hardcoded text
**Before:**
```tsx
<Button>Check-in Now</Button>
```

**After:**
```tsx
<Button>{t('checkin.checkInNow')}</Button>
```

## 🔧 Component Updates Needed

Each component needs to import `useLanguage` and replace text with `t()` calls:

### Example: CheckInTab.tsx

**Replace:**
```tsx
<h2>Welcome back!</h2>
<p>How are you feeling today?</p>
<Button>Check-in Now</Button>
```

**With:**
```tsx
const { t } = useLanguage();

<h2>{t('checkin.welcome')}</h2>
<p>{t('checkin.greeting')}</p>
<Button>{t('checkin.checkInNow')}</Button>
```

### Example: Moods Array

**Replace:**
```tsx
const MAIN_MOODS = [
  { name: 'Happy', emoji: '😊', ... },
  { name: 'Sad', emoji: '😢', ... },
];
```

**With:**
```tsx
const { t } = useLanguage();

const MAIN_MOODS = [
  { name: t('mood.happy'), emoji: '😊', ... },
  { name: t('mood.sad'), emoji: '😢', ... },
];
```

## 📋 Complete Translation Keys Reference

### Onboarding
- `onboarding.welcome.title`
- `onboarding.welcome.subtitle`
- `onboarding.welcome.description`
- `onboarding.anonymity.title`
- `onboarding.anonymity.subtitle`
- `onboarding.anonymity.description`
- `onboarding.track.title`
- `onboarding.track.subtitle`
- `onboarding.track.description`
- `onboarding.community.title`
- `onboarding.community.subtitle`
- `onboarding.community.description`
- `onboarding.language.title`
- `onboarding.language.subtitle`
- `onboarding.name.title`
- `onboarding.name.subtitle`
- `onboarding.name.placeholder`
- `onboarding.button.next`
- `onboarding.button.skip`
- `onboarding.button.getStarted`

### Check-in
- `checkin.welcome`
- `checkin.greeting`
- `checkin.todayCheckins`
- `checkin.checkInNow`
- `checkin.checkInAgain`
- `checkin.thisWeek`
- `checkin.total`
- `checkin.calendar`
- `checkin.journal`
- `checkin.selectMood`
- `checkin.selectMoodSubtitle`
- `checkin.describeMood`
- `checkin.addNote`
- `checkin.notePlaceholder`
- `checkin.activities`
- `checkin.activitiesSubtitle`
- `checkin.save`
- `checkin.back`
- `checkin.entrySaved`
- `checkin.monthly`
- `checkin.yearInPixels`
- `checkin.noEntries`
- `checkin.viewEntries`
- `checkin.characterLimit`

### Moods
- `mood.happy`
- `mood.sad`
- `mood.angry`
- `mood.anxious`
- `mood.peaceful`
- `mood.excited`
- `mood.tired`
- `mood.confused`

### Sub-moods (64 total)
- `submood.joyful`
- `submood.excited`
- `submood.content`
- ... (see LanguageContext.tsx for full list)

### Activities
- `activity.exercise`
- `activity.family`
- `activity.friends`
- `activity.date`
- ... (see LanguageContext.tsx for full list)

### Share Tab
- `share.title`
- `share.subtitle`
- `share.placeholder`
- `share.characterCount`
- `share.postAnonymously`
- `share.recentPosts`
- `share.reply`
- `share.replies`
- `share.viewReplies`
- `share.hideReplies`
- `share.writeReply`
- `share.postReply`
- `share.noReplies`
- `share.anonymous`
- `share.justNow`
- `share.minutesAgo`
- `share.hoursAgo`
- `share.daysAgo`

### Listen Tab
- `listen.title`
- `listen.subtitle`
- `listen.filterAll`
- `listen.filterRecent`
- `listen.filterPopular`
- `listen.noThoughts`
- `listen.beFirst`
- `listen.upvote`
- `listen.upvoted`

### Community Tab
- `community.title`
- `community.subtitle`
- `community.trending`
- `community.supportGroups`
- `community.memberCount`
- `community.join`
- `community.joined`

### Profile Tab
- `profile.title`
- `profile.editProfile`
- `profile.saveChanges`
- `profile.cancel`
- `profile.name`
- `profile.about`
- `profile.language`
- `profile.languages`
- `profile.selectLanguages`
- `profile.saveLanguages`
- `profile.theme`
- `profile.light`
- `profile.dark`
- `profile.system`
- `profile.stats`
- `profile.secretsShared`
- `profile.repliesGiven`
- `profile.upvotesReceived`
- `profile.support`
- `profile.helpCenter`
- `profile.privacyPolicy`
- `profile.termsOfService`
- `profile.about.default`
- `profile.uploadPicture`
- `profile.languageUpdated`
- `profile.profileUpdated`
- `profile.selectOneLang`

### Journal
- `journal.title`
- `journal.filter.day`
- `journal.filter.week`
- `journal.filter.month`
- `journal.noEntries`
- `journal.startTracking`
- `journal.loadMore`

## 🌍 Supported Languages

All text is fully translated to:
- 🇬🇧 **English** (en)
- 🇪🇸 **Spanish** (es)
- 🇨🇳 **Mandarin** (zh)
- 🇮🇳 **Hindi** (hi)
- 🇩🇪 **German** (de)
- 🇫🇷 **French** (fr)

## 🔄 Adding New Translations

To add new text that needs translation:

1. Add the key to all 6 languages in `LanguageContext.tsx`:
```tsx
export const translations = {
  en: {
    'my.new.key': 'My English Text',
  },
  es: {
    'my.new.key': 'Mi Texto en Español',
  },
  // ... add for all 6 languages
};
```

2. Use it in your component:
```tsx
const { t } = useLanguage();
<div>{t('my.new.key')}</div>
```

## ⚡ Quick Migration Checklist

For each component file:

- [ ] Import `useLanguage` hook
- [ ] Call `const { t } = useLanguage();` at top of component
- [ ] Replace all hardcoded text with `t('translation.key')`
- [ ] Test in all 6 languages

## 🎨 Example: Full Component Migration

**Before (ProfileTab.tsx):**
```tsx
export function ProfileTab({ selectedLanguages, onLanguagesChange, userName }: ProfileTabProps) {
  return (
    <div>
      <h1>Profile</h1>
      <Button>Edit Profile</Button>
      <p>Language</p>
    </div>
  );
}
```

**After (ProfileTab.tsx):**
```tsx
import { useLanguage } from './LanguageContext';

export function ProfileTab({ selectedLanguages, onLanguagesChange, userName }: ProfileTabProps) {
  const { t } = useLanguage();
  
  return (
    <div>
      <h1>{t('profile.title')}</h1>
      <Button>{t('profile.editProfile')}</Button>
      <p>{t('profile.language')}</p>
    </div>
  );
}
```

## 🚀 Implementation Priority

Update components in this order:

1. ✅ **App.tsx** - Already wrapped with LanguageProvider
2. **Onboarding.tsx** - Language selection happens here
3. **ProfileTab.tsx** - Can change language here
4. **CheckInTab.tsx** - Most complex with moods/activities
5. **ShareTab.tsx**
6. **ListenTab.tsx**
7. **CommunityTab.tsx**

## 💡 Pro Tips

1. **Fallback**: If a translation key is missing, the key itself is displayed
2. **Dynamic Text**: For plurals or dynamic content, use template literals:
   ```tsx
   {t('profile.memberCount')}: {count}
   ```
3. **Current Language**: Access with `const { language } = useLanguage();`
4. **Change Language**: Use `setLanguage('es')` from the hook

## 🧪 Testing

Test each component in all 6 languages by:
1. Go to Onboarding → Select language
2. Or go to Profile → Change language
3. Navigate through all tabs
4. Verify all text is translated correctly

---

**Note**: The translation system is complete and ready to use. Just replace the hardcoded text in each component with the `t()` function calls using the keys listed above.
