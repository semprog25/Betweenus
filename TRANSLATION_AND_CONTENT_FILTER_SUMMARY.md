# Translation & Content Language Filter - Implementation Summary

## Overview

The app now correctly:
1. **Translates the UI** to all 6 languages (en, es, zh, hi, de, fr)
2. **Filters content** so users only see posts in their selected languages

---

## 6 Supported Languages

| Code | Language |
|------|----------|
| en   | English  |
| es   | Spanish  |
| zh   | Mandarin |
| hi   | Hindi    |
| de   | German   |
| fr   | French   |

---

## How It Works

### UI Language (App display)
- **Single language** – The language in which the app interface is shown
- Set from the **first selected language**
- Stored in `localStorage` as `app-language`
- Can be changed in **Profile → Languages** (first selected = UI language)

### Content Languages (What you see)
- **Multiple languages** – Posts shown only in selected languages
- Chosen during **Onboarding** (step 1) and in **Profile → Languages**
- Stored in `localStorage` as `between_us_selected_languages`
- Used for **Listen** and **Community** tabs

### Flow
1. **Onboarding** – User picks one or more languages → saved as `selectedLanguages`
2. **Profile → Languages** – User can add or remove languages
3. **Listen Tab** – Shows only posts in `selectedLanguages`
4. **Community Tab** – Shows only posts in `selectedLanguages`

---

## Changes Made

### 1. Persist selected languages
- **File:** `src/App.tsx`
- Loads `selectedLanguages` from `localStorage` on init
- Saves when onboarding completes or when changed in Profile
- Key: `between_us_selected_languages` (JSON array)

### 2. Server API – multiple languages
- **File:** `src/supabase/functions/server/index.tsx`
- `language` query supports multiple values: `language=en,es,zh`
- Filters posts where `post.languages` includes any selected language

### 3. ListenTab
- **File:** `src/components/ListenTab.tsx`
- New prop: `selectedLanguages: string[]`
- Uses `selectedLanguages.join(',')` when fetching posts
- Content restricted to selected languages

### 4. CommunityTab
- **File:** `src/components/CommunityTab.tsx`
- New prop: `selectedLanguages: string[]`
- Uses `selectedLanguages` for all post fetches
- Refetches when `selectedLanguages` changes

### 5. Auth & reset
- **File:** `src/utils/auth.tsx` – `between_us_selected_languages` kept on cleanup
- **File:** `src/App.tsx` – Reset button clears `between_us_selected_languages`

---

## Translation System

### Source
- **File:** `src/components/LanguageContext.tsx`
- 200+ translation keys per language
- Sections: onboarding, check-in, share, listen, community, profile, auth, tutorial, etc.

### Fallback
- If a key is missing: try current language → then English → then the key string
- Avoids broken UI if a key is missing

### Usage
```tsx
const { t, language } = useLanguage();
<h1>{t('onboarding.welcome.title')}</h1>
```

---

## Adding New Translations

1. Add the key to all 6 languages in `LanguageContext.tsx`
2. Use it: `{t('your.new.key')}`

---

## Verifying

1. **Listen Tab** – Select languages in Profile, confirm posts match those languages
2. **Community Tab** – Same as above
3. **Switching languages** – Change in Profile, content should refresh automatically
4. **Persistence** – Reload app, selected languages should remain

---

## Important Notes

- **ShareTab** posts use the current UI language (first selected)
- **Onboarding** uses single-select for the first language; more can be added in Profile
- Selected languages are validated on load; invalid values fall back to `['en']`
