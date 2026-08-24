# Onboarding Component - Translation Update Example

## Changes Needed in `/components/Onboarding.tsx`

### 1. Add Import at the Top

```tsx
import { useLanguage, LANGUAGES } from './LanguageContext';
```

### 2. Remove the duplicate LANGUAGES constant

**Remove this (it's already in LanguageContext.tsx):**
```tsx
const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'zh', name: 'Mandarin', flag: '🇨🇳' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
];
```

### 3. Update ONBOARDING_STEPS to Use Translations

**Replace the ONBOARDING_STEPS constant with this:**

```tsx
// This function needs to be inside the component to access t()
// Or make it a function that takes t as a parameter
const getOnboardingSteps = (t: (key: string) => string) => [
  {
    title: t('onboarding.welcome.title'),
    subtitle: t('onboarding.welcome.subtitle'),
    icon: Heart,
    gradient: 'from-pink-500 via-fuchsia-500 to-purple-600',
    description: t('onboarding.welcome.description'),
    emoji: '💜'
  },
  {
    title: t('onboarding.anonymity.title'),
    subtitle: t('onboarding.anonymity.subtitle'),
    icon: Shield,
    gradient: 'from-cyan-500 via-blue-500 to-purple-600',
    description: t('onboarding.anonymity.description'),
    emoji: '🔒'
  },
  {
    title: t('onboarding.track.title'),
    subtitle: t('onboarding.track.subtitle'),
    icon: Sparkles,
    gradient: 'from-orange-500 via-pink-500 to-fuchsia-600',
    description: t('onboarding.track.description'),
    emoji: '✨'
  },
  {
    title: t('onboarding.community.title'),
    subtitle: t('onboarding.community.subtitle'),
    icon: Globe,
    gradient: 'from-green-500 via-teal-500 to-cyan-600',
    description: t('onboarding.community.description'),
    emoji: '🌍'
  },
];
```

### 4. Update Component Function

**Add useLanguage hook at the top of the component:**

```tsx
export function Onboarding({ onComplete }: { onComplete: (languages: string[], name?: string) => void }) {
  const { t } = useLanguage();  // Add this line
  
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [userName, setUserName] = useState<string>('');

  // Get onboarding steps with translations
  const ONBOARDING_STEPS = getOnboardingSteps(t);  // Add this line

  // ... rest of component
```

### 5. Update All Text in JSX

Find and replace these sections in the JSX:

**Language Selection Screen:**
```tsx
// Before:
<h1 className="text-white mb-2">Choose Your Language</h1>
<p className="text-gray-400 mb-6">Select your preferred language for the app</p>

// After:
<h1 className="text-white mb-2">{t('onboarding.language.title')}</h1>
<p className="text-gray-400 mb-6">{t('onboarding.language.subtitle')}</p>
```

**Name Input Screen:**
```tsx
// Before:
<h1 className="text-white mb-2">What should we call you?</h1>
<p className="text-gray-400 mb-6">This is just for you - it stays private</p>
<Input placeholder="Enter your name (optional)" />

// After:
<h1 className="text-white mb-2">{t('onboarding.name.title')}</h1>
<p className="text-gray-400 mb-6">{t('onboarding.name.subtitle')}</p>
<Input placeholder={t('onboarding.name.placeholder')} />
```

**Buttons:**
```tsx
// Before:
<Button>Next</Button>
<Button>Skip intro</Button>
<Button>Let's get started <ArrowRight /></Button>
<Button>Get Started</Button>

// After:
<Button>{t('onboarding.button.next')}</Button>
<Button>{t('onboarding.button.skip')}</Button>
<Button>{t('onboarding.button.getStarted')} <ArrowRight /></Button>
<Button>{t('onboarding.button.getStarted')}</Button>
```

## Complete Updated Component Skeleton

```tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedLogo } from './AnimatedLogo';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Heart, Shield, Globe, Sparkles, ArrowRight, Check } from 'lucide-react';
import { useLanguage, LANGUAGES } from './LanguageContext';
import logoImage from 'figma:asset/5a1aa58d0178d59fddfa201fc0db8049ffe9a884.png';

const getOnboardingSteps = (t: (key: string) => string) => [
  {
    title: t('onboarding.welcome.title'),
    subtitle: t('onboarding.welcome.subtitle'),
    icon: Heart,
    gradient: 'from-pink-500 via-fuchsia-500 to-purple-600',
    description: t('onboarding.welcome.description'),
    emoji: '💜'
  },
  {
    title: t('onboarding.anonymity.title'),
    subtitle: t('onboarding.anonymity.subtitle'),
    icon: Shield,
    gradient: 'from-cyan-500 via-blue-500 to-purple-600',
    description: t('onboarding.anonymity.description'),
    emoji: '🔒'
  },
  {
    title: t('onboarding.track.title'),
    subtitle: t('onboarding.track.subtitle'),
    icon: Sparkles,
    gradient: 'from-orange-500 via-pink-500 to-fuchsia-600',
    description: t('onboarding.track.description'),
    emoji: '✨'
  },
  {
    title: t('onboarding.community.title'),
    subtitle: t('onboarding.community.subtitle'),
    icon: Globe,
    gradient: 'from-green-500 via-teal-500 to-cyan-600',
    description: t('onboarding.community.description'),
    emoji: '🌍'
  },
];

export function Onboarding({ onComplete }: { onComplete: (languages: string[], name?: string) => void }) {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [userName, setUserName] = useState<string>('');

  const ONBOARDING_STEPS = getOnboardingSteps(t);

  const isLastInfoStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isLanguageStep = currentStep === ONBOARDING_STEPS.length;
  const isNameStep = currentStep === ONBOARDING_STEPS.length + 1;

  // ... rest of the component logic stays the same
  
  // Just update the JSX text sections with t() calls as shown above
}
```

## Summary of Changes

1. ✅ Import `useLanguage` and `LANGUAGES` from LanguageContext
2. ✅ Remove duplicate LANGUAGES constant  
3. ✅ Convert ONBOARDING_STEPS to a function that uses `t()`
4. ✅ Add `const { t } = useLanguage();` hook
5. ✅ Call `getOnboardingSteps(t)` to get translated steps
6. ✅ Replace all hardcoded text strings with `t('key')` calls

All translation keys are already defined in `LanguageContext.tsx` - just use them!
