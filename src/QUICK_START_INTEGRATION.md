# 🚀 Quick Start - Integrate Backend in 5 Minutes

## What's Ready

✅ **Backend Server** - Running on Supabase  
✅ **API Client** - `/utils/supabase/client.tsx`  
✅ **API Functions** - `/utils/api.tsx` (super easy to use!)  
✅ **All Routes** - Check-ins, Journal, Posts, Stats  

---

## 🎯 Step-by-Step Integration

### 1️⃣ Test Backend (30 seconds)

Open browser console and paste:

```javascript
// Test if backend is working
fetch('https://qoqbdiixztolvtcjdnle.supabase.co/functions/v1/make-server-6c9b0e48/health')
  .then(r => r.json())
  .then(data => console.log('✅ Backend is live!', data));
```

You should see: `✅ Backend is live! {status: "ok", timestamp: "..."}`

---

### 2️⃣ Integrate Check-In Tab (2 minutes)

**File:** `/components/CheckInTab.tsx`

**Add import at top:**
```tsx
import { saveCheckIn } from '../utils/api';
import { toast } from 'sonner';
```

**When user completes mood selection, call:**
```tsx
const handleCheckInComplete = async (moodData) => {
  try {
    const response = await saveCheckIn({
      mainMood: moodData.mainMood,
      subMood: moodData.subMood,
      emoji: moodData.emoji,
      color: moodData.color,
      note: moodData.note,
      activities: moodData.activities,
    });
    
    console.log('✅ Check-in saved!', response);
    toast.success('Mood check-in saved!');
  } catch (error) {
    console.error('Error:', error);
    toast.error('Failed to save check-in');
  }
};
```

---

### 3️⃣ Integrate Share Tab (2 minutes)

**File:** `/components/ShareTab.tsx`

**Add import:**
```tsx
import { createPost } from '../utils/api';
import { toast } from 'sonner';
```

**When user clicks Share button:**
```tsx
const handleShare = async () => {
  if (!postContent.trim()) {
    toast.error('Please write something to share');
    return;
  }

  try {
    const response = await createPost({
      content: postContent,
      mood: selectedMood,
      languages: selectedLanguages, // from LanguageContext
    });
    
    console.log('✅ Post created!', response);
    toast.success('Your thoughts have been shared anonymously! 💜');
    
    // Clear form
    setPostContent('');
  } catch (error) {
    console.error('Error:', error);
    toast.error('Failed to share post');
  }
};
```

---

### 4️⃣ Integrate Listen Tab (3 minutes)

**File:** `/components/ListenTab.tsx`

**Add imports:**
```tsx
import { getPosts, upvotePost, replyToPost } from '../utils/api';
import { toast } from 'sonner';
import { useLanguage } from './LanguageContext';
```

**Load posts on mount:**
```tsx
const [posts, setPosts] = useState([]);
const [isLoading, setIsLoading] = useState(true);
const { language } = useLanguage();

useEffect(() => {
  loadPosts();
}, [language]);

const loadPosts = async () => {
  try {
    setIsLoading(true);
    const response = await getPosts(language);
    setPosts(response.posts);
  } catch (error) {
    console.error('Error loading posts:', error);
    toast.error('Failed to load posts');
  } finally {
    setIsLoading(false);
  }
};

const handleUpvote = async (postId) => {
  try {
    await upvotePost(postId);
    toast.success('Upvoted! 💜');
    loadPosts(); // Reload to show updated count
  } catch (error) {
    console.error('Error:', error);
    toast.error('Failed to upvote');
  }
};

const handleReply = async (postId, replyContent) => {
  try {
    await replyToPost(postId, replyContent);
    toast.success('Reply sent! 💜');
    loadPosts(); // Reload to show new reply
  } catch (error) {
    console.error('Error:', error);
    toast.error('Failed to send reply');
  }
};
```

**Show loading state:**
```tsx
if (isLoading) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-pulse text-muted-foreground">Loading posts...</div>
    </div>
  );
}
```

---

### 5️⃣ Integrate Profile Stats (1 minute)

**File:** `/components/ProfileTab.tsx`

**Add imports:**
```tsx
import { getUserStats } from '../utils/api';
```

**Load stats:**
```tsx
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
    const response = await getUserStats();
    setStats(response.stats);
  } catch (error) {
    console.error('Error loading stats:', error);
  }
};
```

**Display in UI:**
```tsx
<div className="grid grid-cols-2 gap-4">
  <StatCard 
    label="Check-ins" 
    value={stats.totalCheckIns} 
  />
  <StatCard 
    label="Posts Shared" 
    value={stats.totalPosts} 
  />
  <StatCard 
    label="Upvotes" 
    value={stats.totalUpvotesReceived} 
  />
  <StatCard 
    label="Replies" 
    value={stats.totalRepliesGiven} 
  />
</div>
```

---

## 🧪 Quick Test After Integration

### Test Check-In:
1. Go to Check-in tab
2. Select a mood
3. Check browser console for: `✅ Check-in saved!`
4. Check Network tab to see POST request

### Test Share:
1. Go to Share tab
2. Type something
3. Click Share
4. Should see success toast

### Test Listen:
1. Go to Listen tab
2. Should see the post you just created
3. Try upvoting it
4. Try replying

### Test Stats:
1. Go to Profile tab
2. Should see your stats updated!

---

## 🔍 Debugging

**If something doesn't work:**

1. **Open browser console** - Check for errors
2. **Check Network tab** - See API requests
3. **Check Supabase logs:**
   - Go to: https://supabase.com/dashboard/project/qoqbdiixztolvtcjdnle
   - Click: Functions → Logs
   - See real-time server logs

**Common issues:**

- ❌ **CORS error** → Already fixed, should work
- ❌ **404 error** → Check URL path matches route
- ❌ **500 error** → Check server logs in Supabase
- ❌ **No data showing** → Call `loadData()` in useEffect

---

## 💡 Pro Tips

1. **Always use toast for feedback:**
   ```tsx
   import { toast } from 'sonner';
   toast.success('Success!');
   toast.error('Error!');
   ```

2. **Always reload data after mutations:**
   ```tsx
   await saveCheckIn(...);
   loadCheckIns(); // Refresh the list
   ```

3. **Add loading states:**
   ```tsx
   const [isLoading, setIsLoading] = useState(false);
   setIsLoading(true);
   await saveData();
   setIsLoading(false);
   ```

4. **Use console.log for debugging:**
   ```tsx
   console.log('Saving...', data);
   const response = await saveCheckIn(data);
   console.log('Response:', response);
   ```

---

## 🎉 You're Done!

Your app now has:
- ✅ Backend storage for check-ins
- ✅ Backend storage for posts
- ✅ Backend storage for journal
- ✅ Real-time stats
- ✅ Upvotes & replies
- ✅ Multi-language support
- ✅ Complete anonymity

**Next steps:**
1. Integrate the code above
2. Test each feature
3. Add loading states
4. Add error handling
5. Ship it! 🚀
