# React to FlutterFlow Component Mapping

This document maps each React component to its FlutterFlow equivalent.

## Component Mapping Table

| React Component | FlutterFlow Widget | Notes |
|----------------|-------------------|-------|
| `<div>` | `Container` | Basic layout container |
| `<button>` | `Button` / `IconButton` | Use elevated/outlined variants |
| `<input>` | `TextField` | Single-line input |
| `<textarea>` | `TextFormField` | Set `maxLines` for multiline |
| `<p>` / `<span>` | `Text` | Text display |
| `<img>` | `Image` | Network/Asset images |
| `motion.div` | `Container` + Animation | Use "Animate on Page Load" |
| `AnimatePresence` | `PageTransition` | Built-in navigation animations |

## App.tsx → FlutterFlow Pages

### Main App Structure
```
React (App.tsx)                 FlutterFlow
├── BackgroundEffects          → Custom Widget (background_effects.dart)
├── Onboarding                 → OnboardingPage
├── Header                     → AppBar widget
├── Tab Content                → PageView / IndexedStack
│   ├── ShareTab              → ShareTabPage
│   ├── ListenTab             → ListenTabPage
│   ├── CheckInTab            → CheckInTabPage
│   ├── CommunityTab          → CommunityTabPage
│   └── ProfileTab            → ProfileTabPage
└── Bottom Navigation          → BottomNavigationBar
```

## Component-by-Component Breakdown

### 1. AnimatedLogo.tsx → Custom Widget

**FlutterFlow Implementation:**
- Create Custom Widget: "AnimatedLogo"
- Add size parameter
- Use `AnimatedBuilder` with rotation

**Widget Tree:**
```
Stack
├── Container (outer ring, rotating)
├── Container (middle ring, counter-rotating)
├── Container (inner circle, pulsing)
└── Positioned widgets (sparkles)
```

### 2. BackgroundEffects.tsx → Custom Widget

**FlutterFlow Implementation:**
- Create Custom Widget: "BackgroundEffects"
- Add to each page as background layer

**Effects to Implement:**
- Floating orbs: Use `Positioned` with `AnimatedContainer`
- Sparkles: Custom `CustomPainter` widget
- Wave: `CustomPaint` with sine wave path

### 3. Onboarding.tsx → OnboardingPage

**Widget Tree:**
```
Scaffold
└── Column (MainAxisAlignment.center)
    ├── AnimatedLogo (custom widget)
    ├── Text: "Between Us"
    ├── Text: "Safe space to share..."
    ├── Container
    │   └── GridView (2 columns)
    │       └── LanguageButton x 6
    │           └── GestureDetector
    │               └── Container (with gradient)
    └── ElevatedButton: "Continue to App"
```

**State Management:**
- Component State Variable: `selectedLanguages` (List<String>)
- Actions:
  - On language button tap: Toggle selection
  - On continue: Navigate to MainPage with parameters

### 4. ShareTab.tsx → ShareTabPage

**Widget Tree:**
```
Column
├── Text: "✏️ Share Your Thoughts"
├── Text: Description
├── Container (Examples)
│   └── ListView
│       └── GestureDetector x 4
│           └── Text (example)
├── Container
│   └── TextFormField (multiline)
└── ElevatedButton: "Share Anonymously"
```

**State:**
- `thoughtText` (String)

**Actions:**
- Example tap → Set `thoughtText`
- Share button → Show SnackBar, clear text

### 5. ListenTab.tsx → ListenTabPage

**Conditional Display:**
```
currentSecret == null ? 
  InitialView : 
  SecretView
```

**Initial View:**
```
Column (center)
├── Text: "👂" (large)
├── Text: "Listen & Support"
├── Text: Description
└── ElevatedButton: "Get a Secret to Support"
```

**Secret View:**
```
Column
├── Text: "A secret for you..."
├── Container (secret card)
│   └── Text (italic)
├── Text: "Your supportive reply:"
├── TextFormField (reply)
└── Row
    ├── ElevatedButton: "Send Support"
    └── OutlinedButton: "Pass"
```

**State:**
- `currentSecret` (String?)
- `replyText` (String)

### 6. CheckInTab.tsx → CheckInTabPage

**Conditional Display:**
```
isCompleted ? 
  CompletionView : 
  QuestionView
```

**Question View:**
```
Column
├── Text: "✓ Daily Check-in"
├── Text: "Question X of 5"
├── LinearProgressIndicator
├── Container (question card)
│   ├── Text: Question
│   └── GridView (2x2)
│       └── OptionButton x 4
│           ├── Text (emoji, large)
│           └── Text (label)
```

**Completion View:**
```
Column (center)
├── AnimatedLogo
├── Text: "Check-in Complete!"
├── Text: Description
└── ElevatedButton: "Take Another Check-in"
```

**State:**
- `currentQuestionIndex` (int)
- `answers` (List<int>)
- `isCompleted` (bool)

### 7. CommunityTab.tsx → CommunityTabPage

**Widget Tree:**
```
ListView
└── Card (for each secret) x N
    ├── Container (secret)
    │   └── Text (italic)
    ├── Divider
    ├── Text: "Community Replies:"
    └── ListView (replies)
        └── Container (reply card) x N
            ├── Badge: "⭐ Top Reply" (if first)
            ├── Text (reply text)
            └── Row
                ├── IconButton (heart)
                │   ├── Icon: favorite
                │   └── Text: vote count
                └── IconButton (flag)
```

**State:**
- `votedReplies` (Set<String>)

**Actions:**
- Heart tap → Toggle vote, update count

### 8. ProfileTab.tsx → ProfileTabPage

**Widget Tree:**
```
Column
├── Text: "👤 Your Impact"
├── Row (stats)
│   ├── StatCard (Secrets Shared)
│   ├── StatCard (Replies Given)
│   └── StatCard (Upvotes Received)
├── Container (Languages)
│   ├── Text: "Language Preferences:"
│   └── Wrap
│       └── Chip x 6 (languages)
└── Container (About)
    ├── Text: "About"
    ├── AnimatedLogo
    ├── Text: "Between Us"
    ├── Text: Description
    └── Text: "✨ Dreamed by Darija ✨"
```

**Parameters:**
- `selectedLanguages` (passed from App State)

## UI Components Mapping

### shadcn/ui → FlutterFlow Built-in Widgets

| shadcn Component | FlutterFlow Equivalent |
|-----------------|------------------------|
| Button | ElevatedButton / OutlinedButton |
| Textarea | TextFormField (maxLines: null) |
| Progress | LinearProgressIndicator / CircularProgressIndicator |
| Card | Card widget |
| Badge | Container with decoration |
| Avatar | CircleAvatar |
| Dialog | AlertDialog / showDialog |
| Toast (Sonner) | SnackBar / showSnackBar |

## Styling Translation

### Tailwind CSS → FlutterFlow Properties

| Tailwind | FlutterFlow Property |
|----------|---------------------|
| `bg-gradient-to-r from-purple-600 to-fuchsia-600` | Container → Decoration → Gradient |
| `rounded-xl` | Border Radius: 12 |
| `rounded-2xl` | Border Radius: 16 |
| `shadow-lg shadow-purple-500/50` | Shadow with purple color |
| `backdrop-blur-xl` | BackdropFilter widget |
| `text-white` | Text Style → Color: White |
| `opacity-50` | Opacity: 0.5 |
| `p-6` | Padding: 24 (all sides) |
| `gap-3` | SizedBox(height: 12) between children |
| `grid grid-cols-2` | GridView(crossAxisCount: 2) |

## Animation Translation

### Framer Motion → Flutter Animations

| Framer Motion | Flutter Implementation |
|---------------|----------------------|
| `animate={{ opacity: 1 }}` | FadeTransition / Opacity widget |
| `animate={{ scale: 1 }}` | ScaleTransition |
| `animate={{ y: 0 }}` | SlideTransition |
| `animate={{ rotate: 360 }}` | RotationTransition |
| `whileHover={{ scale: 1.1 }}` | GestureDetector with setState |
| `whileTap={{ scale: 0.95 }}` | InkWell with highlight |
| `transition={{ duration: 0.5 }}` | AnimationController(duration: 500ms) |

## State Management

### React Hooks → FlutterFlow State

| React Hook | FlutterFlow Equivalent |
|-----------|----------------------|
| `useState` | Component State Variable |
| `useEffect` | Page Lifecycle (onPageLoad) |
| Global state | App State Variable |
| Props | Page Parameters |
| Context | App State + Provider |

## Navigation

### React Router → FlutterFlow Navigation

| React | FlutterFlow |
|-------|-------------|
| Tab switching | PageView / IndexedStack with BottomNavigationBar |
| Conditional render | Conditional Visibility widget |
| `setActiveTab('share')` | Update state variable `currentTabIndex` |

## Data Flow

```
App State (Global)
├── userLanguages: List<String>
├── secretsShared: int
├── repliesGiven: int
└── upvotesReceived: int

Page State (Local to each page)
├── ShareTab: thoughtText
├── ListenTab: currentSecret, replyText
├── CheckInTab: currentQuestionIndex, answers, isCompleted
├── CommunityTab: votedReplies
└── ProfileTab: (reads from App State)
```

## Color System Setup

In FlutterFlow Theme Settings:

```
Primary Color: #9333ea (Neon Purple)
Secondary Color: #d946ef (Fuchsia)
Tertiary Color: #a855f7 (Light Purple)

Background Color: #000000 (Black)
Surface Color: #1a0a2e (Dark Purple)

Text Colors:
- Primary Text: #ffffff (White)
- Secondary Text: #9ca3af (Gray-400)
- Tertiary Text: #6b7280 (Gray-500)

Custom Colors:
- purple500: #a855f7
- purple600: #9333ea
- purple900: #581c87
- fuchsia600: #d946ef
```

## Best Practices

1. **Reusable Components**: Create Custom Widgets for:
   - AnimatedLogo
   - BackgroundEffects
   - LanguageButton
   - SecretCard
   - ReplyCard
   - StatCard

2. **Conditional Display**: Use FlutterFlow's conditional visibility
   - Example: Show secret view only when `currentSecret != null`

3. **Performance**: 
   - Use `ListView.builder` for lists
   - Avoid unnecessary setState calls
   - Cache images

4. **Responsive Design**:
   - Use MediaQuery for screen-responsive sizing
   - Test on multiple device sizes
   - Set minimum/maximum widths

5. **Animations**:
   - Enable "Animate on Page Load" for entrance animations
   - Use implicit animations (AnimatedContainer) when possible
   - Custom animations in Custom Code for complex effects

---

This mapping guide should help you recreate each component systematically in FlutterFlow!
