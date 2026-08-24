# Firebase Integration Guide for Between Us

This guide will help you integrate Firebase into the Between Us app for data persistence, authentication, and real-time features.

## 🔥 Why Firebase?

Firebase provides:
- **Firestore Database**: Real-time cloud database for mood entries, thoughts, and community posts
- **Authentication**: Anonymous authentication to maintain user privacy while syncing data
- **Cloud Storage**: Store user data securely
- **Hosting**: Deploy your web app
- **Analytics**: Track app usage (privacy-friendly)

## 📋 Prerequisites

1. Create a Firebase account at [https://firebase.google.com](https://firebase.google.com)
2. Create a new Firebase project
3. Enable Firestore Database
4. Enable Anonymous Authentication

## 🛠️ Installation

### Step 1: Install Firebase SDK

```bash
npm install firebase
```

### Step 2: Create Firebase Configuration

Create a new file `/src/lib/firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// Replace with your actual Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
```

### Step 3: Get Your Firebase Config

1. Go to Firebase Console → Project Settings
2. Scroll down to "Your apps"
3. Click "Web" icon (</>) to add a web app
4. Copy the `firebaseConfig` object
5. Replace the values in `/src/lib/firebase.ts`

## 🔐 Enable Anonymous Authentication

### In Firebase Console:
1. Go to Authentication → Sign-in method
2. Enable "Anonymous" authentication
3. Save

### In Your Code:

Create `/src/hooks/useAuth.ts`:

```typescript
import { useEffect, useState } from 'react';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sign in anonymously on mount
    signInAnonymously(auth).catch(console.error);

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, loading };
}
```

## 💾 Database Structure

### Firestore Collections:

```
users/{userId}
  - languages: string[]
  - createdAt: timestamp
  - settings: object

moodEntries/{entryId}
  - userId: string
  - date: string (YYYY-MM-DD)
  - time: string (HH:MM)
  - timestamp: number
  - mainMood: string
  - subMood: string
  - note: string (optional)
  - createdAt: timestamp

thoughts/{thoughtId}
  - userId: string
  - content: string
  - anonymous: boolean
  - supportCount: number
  - languages: string[]
  - createdAt: timestamp

support/{supportId}
  - thoughtId: string
  - userId: string
  - message: string
  - createdAt: timestamp
```

## 📝 Mood Tracking Integration

Update `/components/CheckInTab.tsx` to save moods to Firebase:

```typescript
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';

// Inside your component:
const { user } = useAuth();

const handleSaveMood = async () => {
  if (!selectedMainMood || !selectedSubMood || !user) return;
  
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const time = now.toTimeString().slice(0, 5);
  
  try {
    await addDoc(collection(db, 'moodEntries'), {
      userId: user.uid,
      date: today,
      time: time,
      timestamp: now.getTime(),
      mainMood: selectedMainMood,
      subMood: selectedSubMood,
      note: moodNote.trim() || '',
      createdAt: now
    });
    
    // Show success message
    setShowMoodConfirmation(true);
  } catch (error) {
    console.error('Error saving mood:', error);
    // Show error message
  }
};

// Load moods for a month
const loadMoodEntries = async (month: Date) => {
  if (!user) return;
  
  const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
  const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  
  const q = query(
    collection(db, 'moodEntries'),
    where('userId', '==', user.uid),
    where('timestamp', '>=', startDate.getTime()),
    where('timestamp', '<=', endDate.getTime())
  );
  
  const snapshot = await getDocs(q);
  const entries = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  setMoodEntries(entries);
};
```

## 💭 Thoughts & Community Integration

Update `/components/ShareTab.tsx`:

```typescript
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';

const { user } = useAuth();

const handleSubmit = async () => {
  if (!thought.trim() || !user) return;
  
  try {
    await addDoc(collection(db, 'thoughts'), {
      userId: user.uid,
      content: thought,
      anonymous: true,
      supportCount: 0,
      languages: selectedLanguages,
      createdAt: new Date()
    });
    
    setThought('');
    // Show success message
  } catch (error) {
    console.error('Error sharing thought:', error);
  }
};
```

Update `/components/ListenTab.tsx` to load thoughts:

```typescript
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const loadThoughts = async () => {
  const q = query(
    collection(db, 'thoughts'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  
  const snapshot = await getDocs(q);
  const loadedThoughts = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  setThoughts(loadedThoughts);
};
```

## 🔒 Security Rules

Set up Firestore security rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only create/read/update their own mood entries
    match /moodEntries/{entryId} {
      allow create: if request.auth != null;
      allow read, update, delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Thoughts are public for reading, but only owner can modify
    match /thoughts/{thoughtId} {
      allow read: if true; // Anyone can read (for anonymous support)
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Support messages are public
    match /support/{supportId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

## 🚀 Deployment

### Deploy to Firebase Hosting:

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase in your project:
```bash
firebase init
```

Select:
- Hosting
- Use existing project
- Public directory: `dist` (for Vite builds)
- Configure as single-page app: Yes
- Set up automatic builds: Optional

4. Build your app:
```bash
npm run build
```

5. Deploy:
```bash
firebase deploy
```

## 📊 Analytics (Optional)

To track app usage while respecting privacy:

```typescript
import { getAnalytics, logEvent } from 'firebase/analytics';

const analytics = getAnalytics(app);

// Log events
logEvent(analytics, 'mood_logged', { mood: mainMood });
logEvent(analytics, 'thought_shared');
logEvent(analytics, 'support_given');
```

## 🎯 Next Steps

1. **Set up Firebase project** and get your configuration
2. **Enable Anonymous Auth** in Firebase Console
3. **Create Firestore database** with the structure above
4. **Install Firebase SDK** in your project
5. **Implement authentication** using the useAuth hook
6. **Update components** to save/load data from Firestore
7. **Configure security rules** to protect user data
8. **Test thoroughly** before deployment
9. **Deploy to Firebase Hosting**

## 💡 Tips

- Always use anonymous authentication to maintain user privacy
- Set up proper security rules before going live
- Use Firestore indexes for complex queries
- Implement offline persistence for better UX
- Consider using Cloud Functions for server-side logic
- Monitor usage with Firebase Analytics (anonymized)

## 🆘 Troubleshooting

**"Permission denied" errors:**
- Check your Firestore security rules
- Ensure user is authenticated
- Verify userId matches in rules

**Data not syncing:**
- Check internet connection
- Verify Firebase config is correct
- Look for console errors

**Anonymous auth issues:**
- Enable Anonymous auth in Firebase Console
- Check if signInAnonymously() is being called

## 📚 Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Guide](https://firebase.google.com/docs/firestore)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

Remember: This app handles sensitive mental health data. Always prioritize user privacy and data security!
