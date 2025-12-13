# Between Us - FlutterFlow Migration Guide

## Overview
This guide helps you recreate the "Between Us" app in FlutterFlow for iOS and Android.

## Step-by-Step Migration Process

### Phase 1: Setup FlutterFlow Project

1. **Create New Project**
   - Go to flutterflow.io
   - Create new project: "Between Us"
   - Choose "Blank" template
   - Enable both iOS and Android platforms

2. **Configure Theme**
   - Go to Theme Settings
   - Set up color scheme:
     - Primary: `#9333ea` (Neon Purple)
     - Secondary: `#d946ef` (Fuchsia)
     - Background: `#000000` (Black)
     - Surface: `#1a0a2e` (Dark Purple)
   - Set default text colors: White (`#ffffff`)

### Phase 2: Create App Structure

#### Pages to Create:

1. **OnboardingPage** (First screen)
2. **MainPage** (Tab container with 5 tabs)
3. **ShareTab** (Component)
4. **ListenTab** (Component)
5. **CheckInTab** (Component)
6. **CommunityTab** (Component)
7. **ProfileTab** (Component)

### Phase 3: Build Each Screen

#### 1. Onboarding Page

**Layout:**
```
Column (Main Axis: Center)
├── AnimatedContainer (Logo placeholder)
│   └── Custom animation widget
├── Text: "Between Us"
├── Text: "Safe space to share anonymously"
├── Container (Language selection)
│   └── Wrap/GridView
│       └── 6x LanguageButton widgets
└── Button: "Continue to App"
```

**State Variables:**
- `selectedLanguages` (List<String>)

**Logic:**
- Toggle language selection on button tap
- Navigate to MainPage when "Continue" pressed
- Pass selectedLanguages to next page

#### 2. Main Page (Tab Navigation)

**Structure:**
- Use Bottom Navigation Bar widget
- 5 tabs: Share, Listen, Check-in, Community, Profile
- Floating Action Button (+) for Share tab

**Tabs:**
1. Share Tab - Index 0
2. Listen Tab - Index 1  
3. Check-in Tab - Index 2
4. Community Tab - Index 3
5. Profile Tab - Index 4

#### 3. Share Tab

**Components:**
- Container with gradient background
- Text: Examples section
  - ListView of clickable examples
- TextFormField (multiline, min 5 lines)
- Action Button: "Share Anonymously"

**State:**
- `thoughtText` (String)
- Selected example auto-fills the text field

**Actions:**
- On example tap: Set thoughtText
- On share button: Show snackbar, clear text

#### 4. Listen Tab

**Two States:**

**Initial State:**
- Column (centered)
- Emoji text widget (👂)
- Text: "Listen & Support"
- Button: "Get a Secret to Support"

**After Getting Secret:**
- Container with secret text
- TextFormField for reply
- Row with 2 buttons:
  - "Send Support" (primary)
  - "Pass" (secondary)

**State Variables:**
- `currentSecret` (String, nullable)
- `replyText` (String)

**Sample Secrets List:**
```dart
[
  "I've been having an emotional affair with my coworker...",
  "I secretly resent my parents for pressuring me...",
  "I'm drowning in debt but keep pretending...",
]
```

#### 5. Check-In Tab

**Components:**
- Progress indicator showing question number
- Question text (dynamic)
- GridView (2x2) with 4 emoji options
- Each option is a Container with:
  - Emoji
  - Label text
  - Gradient background on hover

**State Variables:**
- `currentQuestionIndex` (int, default: 0)
- `answers` (List<int>)

**Questions Array:**
```dart
const questions = [
  {
    'question': 'How are you feeling right now?',
    'options': [
      {'emoji': '😄', 'label': 'Amazing'},
      {'emoji': '😊', 'label': 'Good'},
      {'emoji': '😐', 'label': 'Okay'},
      {'emoji': '😔', 'label': 'Not great'},
    ]
  },
  // ... 4 more questions
];
```

**Logic:**
- On option tap:
  - Add answer to list
  - Increment question index
  - If last question: Show completion screen
  - Else: Show next question

**Completion Screen:**
- Show logo animation
- Text: "Check-in Complete!"
- Button: "Take Another Check-in" → Reset state

#### 6. Community Tab

**Structure:**
- ListView of secret cards
- Each card contains:
  - Secret text (italic)
  - "Community Replies:" label
  - ListView of reply cards
    - Top reply has star badge
    - Heart icon with vote count
    - Flag icon for reporting

**State Variables:**
- `votedReplies` (Set<String>)

**Sample Data Structure:**
```dart
List<Map> communityData = [
  {
    'secret': 'Secret text...',
    'replies': [
      {'text': 'Reply text...', 'upvotes': 23},
      {'text': 'Another reply...', 'upvotes': 18},
    ]
  }
];
```

**Vote Logic:**
- Toggle vote on heart tap
- Update count display

#### 7. Profile Tab

**Components:**
- Row of 3 stat cards (GridView)
  - Secrets Shared: 7
  - Replies Given: 23
  - Upvotes Received: 89
- Language preferences section
  - Show selected languages highlighted
- About section
  - Logo
  - App description
  - "Dreamed by Darija" text

### Phase 4: Animations & Effects

#### Background Effects
Since FlutterFlow has limited animation support, use:

1. **Lottie Animations** for:
   - Logo spinning/pulsing
   - Loading states
   - Completion checkmarks

2. **Gradient Backgrounds:**
   - Use Container with BoxDecoration
   - LinearGradient from purple to fuchsia

3. **Custom Animations:**
   - Enable "Animate on Page Load"
   - Fade in effects
   - Slide transitions

#### Particle Effects (Advanced)
For floating sparkles/orbs, you'll need Custom Code:
- Create Custom Widget
- Use Flutter's `CustomPainter`
- Animate using `AnimationController`

### Phase 5: State Management

**App State Variables:**
Create in App State (global):
- `userLanguages` (List<String>) - Persisted
- `secretsShared` (int) - Persisted
- `repliesGiven` (int) - Persisted
- `upvotesReceived` (int) - Persisted

**Page State Variables:**
Managed locally in each page component

### Phase 6: Custom Code Components

You'll need custom Flutter code for:

#### 1. Animated Logo
```dart
// Custom Widget: AnimatedLogo
class AnimatedLogo extends StatefulWidget {
  final double size;
  
  @override
  _AnimatedLogoState createState() => _AnimatedLogoState();
}

class _AnimatedLogoState extends State<AnimatedLogo> 
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  
  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: Duration(seconds: 20),
      vsync: this,
    )..repeat();
  }
  
  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.rotate(
          angle: _controller.value * 2 * 3.14159,
          child: Container(
            width: widget.size,
            height: widget.size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: Color(0xFF9333ea), width: 2),
            ),
          ),
        );
      },
    );
  }
}
```

#### 2. Background Effects
Create as Custom Widget and add to each page

### Phase 7: Navigation Flow

1. **App Start** → OnboardingPage
2. **After Language Selection** → MainPage (Tab 0)
3. **Bottom Nav** → Switch between tabs
4. **FAB (+)** → Navigate to Tab 0 (Share)

### Phase 8: Data Persistence

Use FlutterFlow's built-in options:

1. **Local Storage** (for user stats):
   - Enable "Persisted" on App State variables
   - Auto-saves using shared_preferences

2. **Future: Firebase Integration**:
   - Firestore for secrets/replies
   - Cloud Functions for matching
   - Authentication (Anonymous)

### Phase 9: Styling Guide

#### Button Styles
- **Primary Button:**
  - Background: Gradient (Purple to Fuchsia)
  - Shadow: Purple glow
  - Border Radius: 12px
  - Padding: 16px vertical

- **Language Toggle:**
  - Selected: Gradient background
  - Unselected: Dark purple background
  - Border Radius: 12px

#### Text Styles
- Heading: White, 24px, Bold
- Body: Gray-400, 16px, Regular
- Caption: Gray-500, 14px

#### Containers
- Border Radius: 16-24px
- Border: 1px, Purple-500 at 20% opacity
- Background: Gradient or solid dark purple

### Phase 10: Testing Checklist

- [ ] Language selection persists
- [ ] Tab navigation works
- [ ] Share thought with validation
- [ ] Get random secret
- [ ] Complete check-in flow
- [ ] Vote on replies
- [ ] Stats display correctly
- [ ] Animations smooth on both iOS/Android

## Key Differences from Web Version

1. **No Framer Motion**: Use Flutter's built-in animations
2. **No Tailwind**: Use FlutterFlow's styling system
3. **Mobile-First**: Optimize for touch, smaller screens
4. **Navigation**: Bottom tabs instead of web routing
5. **Gestures**: Tap instead of click, swipe gestures

## Recommended FlutterFlow Packages

1. **flutter_animate** - For animations
2. **lottie** - For complex animations
3. **shimmer** - For loading states
4. **confetti** - For celebration effects

## Export & Deploy

### For Testing:
1. Use FlutterFlow's "Run" mode
2. Download APK/IPA for device testing

### For Production:
1. **Android:**
   - Generate signed APK
   - Upload to Google Play Console

2. **iOS:**
   - Generate IPA with certificates
   - Upload to App Store Connect

## Timeline Estimate

- Phase 1-2 (Setup): 1-2 hours
- Phase 3 (Pages): 4-6 hours
- Phase 4 (Animations): 2-3 hours
- Phase 5-6 (State/Custom): 2-3 hours
- Phase 7-9 (Polish): 2-3 hours
- Testing: 2-3 hours

**Total: 13-20 hours** (depending on experience level)

## Resources

- FlutterFlow Docs: https://docs.flutterflow.io
- Flutter Widgets: https://flutter.dev/docs/development/ui/widgets
- Color Picker: Use exact hex codes from this guide
- Custom Code: Use AI assistance for complex widgets

## Need Help?

For complex animations or custom widgets, you may need to:
1. Use FlutterFlow's custom code editor
2. Hire a Flutter developer for specific features
3. Join FlutterFlow community for support

---

**Good luck with your migration! The app will look even better as a native mobile experience.** 🚀
