# CheckInTab Component - Translation Update Example

## Changes Needed in `/components/CheckInTab.tsx`

### 1. Add Import at Top

```tsx
import { useLanguage } from './LanguageContext';
```

### 2. Convert MAIN_MOODS and ACTIVITIES to Functions

Since these arrays contain translatable text, they need to be converted to functions that accept the `t()` function:

**Replace the MAIN_MOODS constant:**

```tsx
const getMainMoods = (t: (key: string) => string) => [
  {
    name: t('mood.happy'),
    emoji: '😊',
    color: 'from-green-500 to-green-500',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-300 dark:border-yellow-700',
    subMoods: [
      t('submood.joyful'),
      t('submood.excited'),
      t('submood.content'),
      t('submood.playful'),
      t('submood.proud'),
      t('submood.grateful'),
      t('submood.hopeful'),
      t('submood.peaceful')
    ]
  },
  {
    name: t('mood.sad'),
    emoji: '😢',
    color: 'from-yellow-500 to-yellow-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-300 dark:border-blue-700',
    subMoods: [
      t('submood.lonely'),
      t('submood.disappointed'),
      t('submood.heartbroken'),
      t('submood.grieving'),
      t('submood.regretful'),
      t('submood.melancholic'),
      t('submood.homesick'),
      t('submood.lost')
    ]
  },
  {
    name: t('mood.angry'),
    emoji: '😠',
    color: 'from-red-500 to-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-300 dark:border-red-700',
    subMoods: [
      t('submood.frustrated'),
      t('submood.annoyed'),
      t('submood.resentful'),
      t('submood.bitter'),
      t('submood.furious'),
      t('submood.irritated'),
      t('submood.jealous'),
      t('submood.vengeful')
    ]
  },
  {
    name: t('mood.anxious'),
    emoji: '😰',
    color: 'from-orange-500 to-orange-500',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-300 dark:border-purple-700',
    subMoods: [
      t('submood.worried'),
      t('submood.nervous'),
      t('submood.insecure'),
      t('submood.overwhelmed'),
      t('submood.stressed'),
      t('submood.panicked'),
      t('submood.fearful'),
      t('submood.tense')
    ]
  },
  {
    name: t('mood.peaceful'),
    emoji: '😌',
    color: 'from-green-500 to-green-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-300 dark:border-emerald-700',
    subMoods: [
      t('submood.calm'),
      t('submood.relaxed'),
      t('submood.satisfied'),
      t('submood.serene'),
      t('submood.grounded'),
      t('submood.accepting'),
      t('submood.relieved'),
      t('submood.secure')
    ]
  },
  {
    name: t('mood.excited'),
    emoji: '🤩',
    color: 'from-green-500 to-green-500',
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    border: 'border-pink-300 dark:border-pink-700',
    subMoods: [
      t('submood.enthusiastic'),
      t('submood.energetic'),
      t('submood.motivated'),
      t('submood.inspired'),
      t('submood.passionate'),
      t('submood.eager'),
      t('submood.thrilled'),
      t('submood.amazed')
    ]
  },
  {
    name: t('mood.tired'),
    emoji: '😴',
    color: 'from-yellow-500 to-yellow-500',
    bg: 'bg-slate-50 dark:bg-slate-900/20',
    border: 'border-slate-300 dark:border-slate-700',
    subMoods: [
      t('submood.exhausted'),
      t('submood.drained'),
      t('submood.sleepy'),
      t('submood.weary'),
      t('submood.fatigued'),
      t('submood.sluggish'),
      t('submood.burnout'),
      t('submood.depleted')
    ]
  },
  {
    name: t('mood.confused'),
    emoji: '😕',
    color: 'from-yellow-500 to-yellow-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-300 dark:border-amber-700',
    subMoods: [
      t('submood.uncertain'),
      t('submood.puzzled'),
      t('submood.doubtful'),
      t('submood.indecisive'),
      t('submood.bewildered'),
      t('submood.conflicted'),
      t('submood.questioning'),
      t('submood.mixed')
    ]
  },
];
```

**Replace the ACTIVITIES constant:**

```tsx
const getActivities = (t: (key: string) => string) => [
  { name: t('activity.exercise'), emoji: '🏃', icon: '💪' },
  { name: t('activity.family'), emoji: '👨‍👩‍👧‍👦', icon: '👨‍👩‍👧‍👦' },
  { name: t('activity.friends'), emoji: '👥', icon: '👥' },
  { name: t('activity.date'), emoji: '💕', icon: '💕' },
  { name: t('activity.relax'), emoji: '🧘', icon: '☂️' },
  { name: t('activity.movies'), emoji: '📺', icon: '📺' },
  { name: t('activity.gaming'), emoji: '🎮', icon: '🎮' },
  { name: t('activity.reading'), emoji: '📚', icon: '📚' },
  { name: t('activity.sleepEarly'), emoji: '🛌', icon: '🛏️' },
  { name: t('activity.eatHealthy'), emoji: '🥗', icon: '🌱' },
  { name: t('activity.cleaning'), emoji: '🧹', icon: '🧹' },
  { name: t('activity.shopping'), emoji: '🛍️', icon: '🛒' },
  { name: t('activity.work'), emoji: '💼', icon: '💼' },
  { name: t('activity.study'), emoji: '📖', icon: '📖' },
  { name: t('activity.cook'), emoji: '👨‍🍳', icon: '🍳' },
  { name: t('activity.music'), emoji: '🎵', icon: '🎵' },
];
```

### 3. Update Component Function

```tsx
export function CheckInTab({ userName = 'Friend' }: CheckInTabProps) {
  const { t } = useLanguage();  // Add this line
  
  // Get translated arrays
  const MAIN_MOODS = getMainMoods(t);  // Add this line
  const ACTIVITIES = getActivities(t);  // Add this line

  const [view, setView] = useState<'home' | 'mood-select' | 'submood-select' | 'journal' | 'calendar' | 'journal-list'>('home');
  // ... rest of state
```

### 4. Update All UI Text

**Home View:**
```tsx
// Before:
<p className="text-sm text-muted-foreground">Welcome back!</p>
<h3>How are you feeling today?</h3>
<p className="text-sm text-muted-foreground mb-3">Today's check-ins:</p>
<Button>Check-in Now</Button>
<span className="text-xs text-muted-foreground">This Week</span>
<span className="text-xs text-muted-foreground">Total</span>

// After:
<p className="text-sm text-muted-foreground">{t('checkin.welcome')}</p>
<h3>{t('checkin.greeting')}</h3>
<p className="text-sm text-muted-foreground mb-3">{t('checkin.todayCheckins')}</p>
<Button>{t('checkin.checkInNow')}</Button>
<span className="text-xs text-muted-foreground">{t('checkin.thisWeek')}</span>
<span className="text-xs text-muted-foreground">{t('checkin.total')}</span>
```

**Mood Selection View:**
```tsx
// Before:
<span>Back</span>
<h2>How are you feeling?</h2>
<p className="text-sm text-muted-foreground mt-1 text-center">Choose your main mood</p>

// After:
<span>{t('checkin.back')}</span>
<h2>{t('checkin.selectMood')}</h2>
<p className="text-sm text-muted-foreground mt-1 text-center">{t('checkin.selectMoodSubtitle')}</p>
```

**Sub-Mood Selection View:**
```tsx
// Before:
<span>Back</span>
<p className="text-sm text-muted-foreground">How would you describe it?</p>

// After:
<span>{t('checkin.back')}</span>
<p className="text-sm text-muted-foreground">{t('checkin.describeMood')}</p>
```

**Journal View:**
```tsx
// Before:
<span>Back</span>
<p className="text-sm text-muted-foreground">Add a note (optional)</p>
<Textarea placeholder="How are you feeling? What happened today?" />
<p className="text-sm text-muted-foreground mb-3">What did you do?</p>
<p className="text-xs text-muted-foreground mt-2">Select activities (optional)</p>
<Button>Save Entry</Button>

// After:
<span>{t('checkin.back')}</span>
<p className="text-sm text-muted-foreground">{t('checkin.addNote')}</p>
<Textarea placeholder={t('checkin.notePlaceholder')} />
<p className="text-sm text-muted-foreground mb-3">{t('checkin.activities')}</p>
<p className="text-xs text-muted-foreground mt-2">{t('checkin.activitiesSubtitle')}</p>
<Button>{t('checkin.save')}</Button>
```

**Calendar View:**
```tsx
// Before:
<span>Monthly</span>
<span>Year in Pixels</span>
<p>No entries for this date</p>

// After:
<span>{t('checkin.monthly')}</span>
<span>{t('checkin.yearInPixels')}</span>
<p>{t('checkin.noEntries')}</p>
```

**Journal List View:**
```tsx
// Before:
<h2>My Journal</h2>
<button>Day</button>
<button>Week</button>
<button>Month</button>
<p>No journal entries yet</p>
<p>Start tracking your moods to see them here</p>

// After:
<h2>{t('journal.title')}</h2>
<button>{t('journal.filter.day')}</button>
<button>{t('journal.filter.week')}</button>
<button>{t('journal.filter.month')}</button>
<p>{t('journal.noEntries')}</p>
<p>{t('journal.startTracking')}</p>
```

## Complete Component Structure

```tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from './LanguageContext';
// ... other imports

const getMainMoods = (t: (key: string) => string) => [
  // ... mood definitions with t() calls
];

const getActivities = (t: (key: string) => string) => [
  // ... activity definitions with t() calls
];

type CheckInTabProps = {
  userName?: string;
};

export function CheckInTab({ userName = 'Friend' }: CheckInTabProps) {
  const { t } = useLanguage();
  
  const MAIN_MOODS = getMainMoods(t);
  const ACTIVITIES = getActivities(t);
  
  // All state declarations
  const [view, setView] = useState<'home' | 'mood-select' | 'submood-select' | 'journal' | 'calendar' | 'journal-list'>('home');
  // ... rest of state

  // ... all functions stay the same
  
  // Just update JSX text with t() calls
  
  return (
    // ... component JSX with translated text
  );
}
```

## Quick Find & Replace Tips

Use your editor's find & replace to speed this up:

1. Find: `'Welcome back!'` → Replace: `{t('checkin.welcome')}`
2. Find: `'How are you feeling today?'` → Replace: `{t('checkin.greeting')}`
3. Find: `'Back'` → Replace: `{t('checkin.back')}`
4. Find: `'Check-in Now'` → Replace: `{t('checkin.checkInNow')}`

And so on for all the text strings!

## Testing

After making changes:
1. Test in Onboarding by selecting each of the 6 languages
2. Navigate to Check-in tab
3. Go through the full check-in flow
4. Verify all text displays in the selected language

The moods, sub-moods, and activities should all display in the correct language!
