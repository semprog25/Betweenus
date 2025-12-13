# 🧪 Backend Testing Script

Copy and paste these commands into your **browser console** to test the backend!

---

## ✅ Health Check

```javascript
// Test 1: Is the server running?
fetch('https://qoqbdiixztolvtcjdnle.supabase.co/functions/v1/make-server-6c9b0e48/health', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcWJkaWl4enRvbHZ0Y2pkbmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NDEwNjcsImV4cCI6MjA3NzAxNzA2N30.MpuwFgrc1rhlhaCG73LQWgjahM3m0uR4cEd7xvnLO6g'
  }
})
.then(r => r.json())
.then(data => console.log('✅ Health Check:', data))
.catch(err => console.error('❌ Error:', err));
```

**Expected result:** `✅ Health Check: {status: "ok", timestamp: "..."}`

---

## 📝 Test Check-Ins

```javascript
// Test 2: Create a check-in
fetch('https://qoqbdiixztolvtcjdnle.supabase.co/functions/v1/make-server-6c9b0e48/check-ins', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcWJkaWl4enRvbHZ0Y2pkbmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NDEwNjcsImV4cCI6MjA3NzAxNzA2N30.MpuwFgrc1rhlhaCG73LQWgjahM3m0uR4cEd7xvnLO6g'
  },
  body: JSON.stringify({
    mainMood: 'Happy',
    subMood: 'Joyful',
    emoji: '😊',
    color: 'from-yellow-500 to-green-500',
    note: 'Feeling great today!',
    activities: ['exercise', 'meditation']
  })
})
.then(r => r.json())
.then(data => console.log('✅ Check-in created:', data))
.catch(err => console.error('❌ Error:', err));

// Test 3: Get all check-ins
fetch('https://qoqbdiixztolvtcjdnle.supabase.co/functions/v1/make-server-6c9b0e48/check-ins', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcWJkaWl4enRvbHZ0Y2pkbmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NDEwNjcsImV4cCI6MjA3NzAxNzA2N30.MpuwFgrc1rhlhaCG73LQWgjahM3m0uR4cEd7xvnLO6g'
  }
})
.then(r => r.json())
.then(data => console.log('✅ Check-ins:', data))
.catch(err => console.error('❌ Error:', err));
```

---

## 📖 Test Journal

```javascript
// Test 4: Create a journal entry
fetch('https://qoqbdiixztolvtcjdnle.supabase.co/functions/v1/make-server-6c9b0e48/journal', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcWJkaWl4enRvbHZ0Y2pkbmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NDEwNjcsImV4cCI6MjA3NzAxNzA2N30.MpuwFgrc1rhlhaCG73LQWgjahM3m0uR4cEd7xvnLO6g'
  },
  body: JSON.stringify({
    content: 'Today was a good day. I practiced gratitude and felt more at peace.',
    activities: ['meditation', 'journaling'],
    mood: 'peaceful'
  })
})
.then(r => r.json())
.then(data => console.log('✅ Journal entry created:', data))
.catch(err => console.error('❌ Error:', err));

// Test 5: Get all journal entries
fetch('https://qoqbdiixztolvtcjdnle.supabase.co/functions/v1/make-server-6c9b0e48/journal', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcWJkaWl4enRvbHZ0Y2pkbmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NDEwNjcsImV4cCI6MjA3NzAxNzA2N30.MpuwFgrc1rhlhaCG73LQWgjahM3m0uR4cEd7xvnLO6g'
  }
})
.then(r => r.json())
.then(data => console.log('✅ Journal entries:', data))
.catch(err => console.error('❌ Error:', err));
```

---

## 💬 Test Posts (Share & Listen)

```javascript
// Test 6: Create a post
fetch('https://qoqbdiixztolvtcjdnle.supabase.co/functions/v1/make-server-6c9b0e48/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcWJkaWl4enRvbHZ0Y2pkbmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NDEwNjcsImV4cCI6MjA3NzAxNzA2N30.MpuwFgrc1rhlhaCG73LQWgjahM3m0uR4cEd7xvnLO6g'
  },
  body: JSON.stringify({
    content: 'Feeling grateful for this supportive community. You all make a difference! 💜',
    mood: 'grateful',
    languages: ['en'],
    isAnonymous: true
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Post created:', data);
  // Save post ID for next tests
  window.testPostId = data.post.id;
})
.catch(err => console.error('❌ Error:', err));

// Test 7: Get all posts
fetch('https://qoqbdiixztolvtcjdnle.supabase.co/functions/v1/make-server-6c9b0e48/posts', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcWJkaWl4enRvbHZ0Y2pkbmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NDEwNjcsImV4cCI6MjA3NzAxNzA2N30.MpuwFgrc1rhlhaCG73LQWgjahM3m0uR4cEd7xvnLO6g'
  }
})
.then(r => r.json())
.then(data => console.log('✅ Posts:', data))
.catch(err => console.error('❌ Error:', err));

// Test 8: Upvote a post (run after Test 6)
fetch(`https://qoqbdiixztolvtcjdnle.supabase.co/functions/v1/make-server-6c9b0e48/posts/${window.testPostId}/upvote`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcWJkaWl4enRvbHZ0Y2pkbmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NDEwNjcsImV4cCI6MjA3NzAxNzA2N30.MpuwFgrc1rhlhaCG73LQWgjahM3m0uR4cEd7xvnLO6g'
  }
})
.then(r => r.json())
.then(data => console.log('✅ Post upvoted:', data))
.catch(err => console.error('❌ Error:', err));

// Test 9: Reply to a post (run after Test 6)
fetch(`https://qoqbdiixztolvtcjdnle.supabase.co/functions/v1/make-server-6c9b0e48/posts/${window.testPostId}/reply`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcWJkaWl4enRvbHZ0Y2pkbmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NDEwNjcsImV4cCI6MjA3NzAxNzA2N30.MpuwFgrc1rhlhaCG73LQWgjahM3m0uR4cEd7xvnLO6g'
  },
  body: JSON.stringify({
    content: 'You are not alone! We are here for you 💜'
  })
})
.then(r => r.json())
.then(data => console.log('✅ Reply added:', data))
.catch(err => console.error('❌ Error:', err));
```

---

## 📊 Test Statistics

```javascript
// Test 10: Get user stats
fetch('https://qoqbdiixztolvtcjdnle.supabase.co/functions/v1/make-server-6c9b0e48/stats', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcWJkaWl4enRvbHZ0Y2pkbmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NDEwNjcsImV4cCI6MjA3NzAxNzA2N30.MpuwFgrc1rhlhaCG73LQWgjahM3m0uR4cEd7xvnLO6g'
  }
})
.then(r => r.json())
.then(data => console.log('✅ User stats:', data))
.catch(err => console.error('❌ Error:', err));
```

---

## 🚀 Run All Tests at Once

```javascript
// Run all tests in sequence
async function testAllEndpoints() {
  const baseUrl = 'https://qoqbdiixztolvtcjdnle.supabase.co/functions/v1/make-server-6c9b0e48';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcWJkaWl4enRvbHZ0Y2pkbmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NDEwNjcsImV4cCI6MjA3NzAxNzA2N30.MpuwFgrc1rhlhaCG73LQWgjahM3m0uR4cEd7xvnLO6g'
  };

  console.log('🧪 Starting backend tests...\n');

  // Test 1: Health
  const health = await fetch(`${baseUrl}/health`, { headers }).then(r => r.json());
  console.log('✅ Health:', health);

  // Test 2: Create check-in
  const checkIn = await fetch(`${baseUrl}/check-ins`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      mainMood: 'Happy',
      subMood: 'Joyful',
      emoji: '😊',
      color: 'from-yellow-500 to-green-500',
      note: 'Test check-in',
      activities: ['exercise']
    })
  }).then(r => r.json());
  console.log('✅ Check-in created:', checkIn);

  // Test 3: Create post
  const post = await fetch(`${baseUrl}/posts`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      content: 'Test post from automated test!',
      mood: 'happy',
      languages: ['en']
    })
  }).then(r => r.json());
  console.log('✅ Post created:', post);

  // Test 4: Upvote post
  const upvote = await fetch(`${baseUrl}/posts/${post.post.id}/upvote`, {
    method: 'POST',
    headers
  }).then(r => r.json());
  console.log('✅ Post upvoted:', upvote);

  // Test 5: Get stats
  const stats = await fetch(`${baseUrl}/stats`, { headers }).then(r => r.json());
  console.log('✅ Stats:', stats);

  console.log('\n🎉 All tests completed!');
}

// Run it!
testAllEndpoints();
```

---

## 📋 Expected Results

After running all tests, you should see:

```
✅ Health: {status: "ok", timestamp: "..."}
✅ Check-in created: {success: true, checkIn: {...}}
✅ Post created: {success: true, post: {...}}
✅ Post upvoted: {success: true, upvotes: 1}
✅ Stats: {stats: {totalCheckIns: 1, totalPosts: 1, ...}}
🎉 All tests completed!
```

---

## 🔍 Troubleshooting

**If you see errors:**

1. **Check Supabase Logs:**
   - Go to: https://supabase.com/dashboard/project/qoqbdiixztolvtcjdnle
   - Click: Functions → Logs
   - See what the server is logging

2. **Check Network Tab:**
   - Open DevTools → Network
   - Run test again
   - Click on the failed request
   - Check Response tab for error details

3. **Common Issues:**
   - `404` → Wrong URL or route not defined
   - `500` → Server error (check logs)
   - `CORS` → Should be fixed already
   - `401` → Wrong auth token

---

## ✅ Next Steps

Once all tests pass:
1. ✅ Backend is working perfectly!
2. ✅ Ready to integrate into your React components
3. ✅ Follow `QUICK_START_INTEGRATION.md` to add to your app
4. ✅ Ship it! 🚀
