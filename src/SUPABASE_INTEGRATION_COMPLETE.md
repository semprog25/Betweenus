# Supabase Integration - Complete Setup Guide

## ✅ What's Been Set Up

### 1. Backend Server (`/supabase/functions/server/index.tsx`)
Your Hono server is now running with full CRUD operations for:

#### **Mood Check-ins API**
- `POST /make-server-6c9b0e48/check-ins` - Save a mood check-in
- `GET /make-server-6c9b0e48/check-ins` - Get all check-ins (with optional date filtering)

#### **Journal Entries API**
- `POST /make-server-6c9b0e48/journal` - Save a journal entry
- `GET /make-server-6c9b0e48/journal` - Get all journal entries
- `DELETE /make-server-6c9b0e48/journal/:entryId` - Delete a journal entry

#### **Community Posts API (Share & Listen)**
- `POST /make-server-6c9b0e48/posts` - Create a new post
- `GET /make-server-6c9b0e48/posts` - Get all posts (with language filtering)
- `POST /make-server-6c9b0e48/posts/:postId/upvote` - Upvote a post
- `POST /make-server-6c9b0e48/posts/:postId/reply` - Reply to a post
- `DELETE /make-server-6c9b0e48/posts/:postId` - Delete a post

#### **User Statistics API**
- `GET /make-server-6c9b0e48/stats` - Get user statistics (total check-ins, posts, upvotes, etc.)

### 2. Frontend Client (`/utils/supabase/client.tsx`)
- **Supabase client singleton** for efficient connection reuse
- **`callServer()` helper** for easy API calls with automatic auth headers

### 3. Data Storage
- Using Supabase **KV Store** for all data persistence
- Keys are organized by type:
  - `check-in:*` - Individual check-ins
  - `check-in-by-date:*` - Check-ins indexed by date
  - `journal:*` - Journal entries
  - `post:*` - Community posts

---

## 🚀 Next Steps - Integration Into Components

### Step 1: Update CheckInTab to Save Check-ins

Add this to `/components/CheckInTab.tsx`:

```tsx
import { callServer } from '../utils/supabase/client';

// In your handleMoodSubmit function:
const saveCheckIn = async (moodData) => {
  try {
    const response = await callServer('/check-ins', {
      method: 'POST',
      body: JSON.stringify({
        date: new Date().toISOString(),
        mainMood: moodData.mainMood,
        subMood: moodData.subMood,
        emoji: moodData.emoji,
        color: moodData.color,
        note: moodData.note,
        activities: moodData.activities,
      }),
    });
    
    console.log('Check-in saved!', response);
    toast.success('Mood check-in saved!');
  } catch (error) {
    console.error('Error saving check-in:', error);
    toast.error('Failed to save check-in');
  }
};
```

### Step 2: Update ShareTab to Create Posts

Add this to `/components/ShareTab.tsx`:

```tsx
import { callServer } from '../utils/supabase/client';

const handleSharePost = async (content, mood, languages) => {
  try {
    const response = await callServer('/posts', {
      method: 'POST',
      body: JSON.stringify({
        content,
        mood,
        isAnonymous: true,
        languages,
      }),
    });
    
    console.log('Post created!', response);
    toast.success('Your thoughts have been shared anonymously!');
  } catch (error) {
    console.error('Error creating post:', error);
    toast.error('Failed to share post');
  }
};
```

### Step 3: Update ListenTab to Load Posts

Add this to `/components/ListenTab.tsx`:

```tsx
import { callServer } from '../utils/supabase/client';
import { useEffect, useState } from 'react';

const [posts, setPosts] = useState([]);

useEffect(() => {
  loadPosts();
}, []);

const loadPosts = async () => {
  try {
    const response = await callServer('/posts?language=all', {
      method: 'GET',
    });
    
    setPosts(response.posts);
  } catch (error) {
    console.error('Error loading posts:', error);
  }
};

const handleUpvote = async (postId) => {
  try {
    await callServer(\`/posts/\${postId}/upvote\`, {
      method: 'POST',
    });
    
    // Reload posts
    loadPosts();
  } catch (error) {
    console.error('Error upvoting:', error);
  }
};
```

### Step 4: Update ProfileTab to Show Stats

Add this to `/components/ProfileTab.tsx`:

```tsx
import { callServer } from '../utils/supabase/client';
import { useEffect, useState } from 'react';

const [stats, setStats] = useState({
  totalCheckIns: 0,
  totalPosts: 0,
  totalUpvotesReceived: 0,
  totalRepliesGiven: 0,
});

useEffect(() => {
  loadStats();
}, []);

const loadStats = async () => {
  try {
    const response = await callServer('/stats', {
      method: 'GET',
    });
    
    setStats(response.stats);
  } catch (error) {
    console.error('Error loading stats:', error);
  }
};
```

---

## 🧪 Testing Your Backend

### Test in Browser Console:

```javascript
// Test health check
fetch('https://qoqbdiixztolvtcjdnle.supabase.co/functions/v1/make-server-6c9b0e48/health', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcWJkaWl4enRvbHZ0Y2pkbmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NDEwNjcsImV4cCI6MjA3NzAxNzA2N30.MpuwFgrc1rhlhaCG73LQWgjahM3m0uR4cEd7xvnLO6g'
  }
}).then(r => r.json()).then(console.log);

// Test creating a post
fetch('https://qoqbdiixztolvtcjdnle.supabase.co/functions/v1/make-server-6c9b0e48/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcWJkaWl4enRvbHZ0Y2pkbmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NDEwNjcsImV4cCI6MjA3NzAxNzA2N30.MpuwFgrc1rhlhaCG73LQWgjahM3m0uR4cEd7xvnLO6g'
  },
  body: JSON.stringify({
    content: 'Test post from Between Us!',
    mood: 'happy',
    languages: ['en']
  })
}).then(r => r.json()).then(console.log);

// Test getting posts
fetch('https://qoqbdiixztolvtcjdnle.supabase.co/functions/v1/make-server-6c9b0e48/posts', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcWJkaWl4enRvbHZ0Y2pkbmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NDEwNjcsImV4cCI6MjA3NzAxNzA2N30.MpuwFgrc1rhlhaCG73LQWgjahM3m0uR4cEd7xvnLO6g'
  }
}).then(r => r.json()).then(console.log);
```

---

## 📊 Data Structure Examples

### Check-in Object:
```typescript
{
  id: "1234567890-abc123",
  date: "2025-10-26T12:00:00.000Z",
  mainMood: "Happy",
  subMood: "Joyful",
  emoji: "😊",
  color: "from-green-500 to-green-500",
  note: "Had a great day!",
  activities: ["exercise", "meditation"],
  createdAt: "2025-10-26T12:00:00.000Z"
}
```

### Post Object:
```typescript
{
  id: "1234567890-xyz789",
  content: "Feeling grateful today...",
  mood: "peaceful",
  isAnonymous: true,
  languages: ["en", "es"],
  upvotes: 5,
  replies: [
    {
      id: "reply-123",
      content: "You're not alone 💜",
      createdAt: "2025-10-26T12:30:00.000Z",
      isAnonymous: true
    }
  ],
  createdAt: "2025-10-26T12:00:00.000Z",
  timestamp: 1729944000000
}
```

---

## 🔐 Security Notes

- ✅ All posts are **anonymous by default**
- ✅ No user authentication required (completely anonymous)
- ✅ CORS is enabled for all origins
- ✅ Using Supabase anon key (safe for frontend)
- ⚠️ Currently no rate limiting - add if needed later

---

## 🎯 What You Can Do Now

1. **Test the backend** using browser console commands above
2. **Integrate into components** using the code examples
3. **Deploy and use** - your Supabase backend is live!
4. **Monitor logs** in Supabase Dashboard → Functions → Logs

---

## 🚨 Important Notes

- The backend is **already deployed** to Supabase
- All data is stored in the **KV Store** (key-value database)
- No migrations needed - KV store is schema-less
- Perfect for anonymous app - no user authentication required!

---

## 📝 Optional: Add Authentication Later

If you want to add user accounts later (optional):

1. Enable Supabase Auth in dashboard
2. Add sign-up/login routes to server
3. Protect certain routes with auth
4. See instructions in original guidelines

For now, the app works **completely anonymously** as designed! 🎉
