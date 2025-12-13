# 🧪 Test Authentication System

Run these tests to verify your auth system is working!

---

## ✅ Test 1: Backend Health Check

Open browser console and paste:

```javascript
fetch('https://qoqbdiixztolvtcjdnle.supabase.co/functions/v1/make-server-6c9b0e48/health')
  .then(r => r.json())
  .then(data => console.log('✅ Server is running:', data));
```

**Expected:** `✅ Server is running: {status: "ok", timestamp: "..."}`

---

## ✅ Test 2: Email Sign-Up

```javascript
fetch('https://qoqbdiixztolvtcjdnle.supabase.co/functions/v1/make-server-6c9b0e48/auth/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcWJkaWl4enRvbHZ0Y2pkbmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NDEwNjcsImV4cCI6MjA3NzAxNzA2N30.MpuwFgrc1rhlhaCG73LQWgjahM3m0uR4cEd7xvnLO6g'
  },
  body: JSON.stringify({
    email: 'test@betweenusapp.com',
    password: 'testpass123',
    name: 'Test User',
    languages: ['en']
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Sign-up result:', data);
  if (data.access_token) {
    window.testAccessToken = data.access_token;
    console.log('✅ Access token saved for next tests');
  }
});
```

**Expected:** 
```javascript
{
  success: true,
  user: { id: "...", email: "test@betweenusapp.com" },
  access_token: "eyJ..."
}
```

---

## ✅ Test 3: Email Sign-In

```javascript
fetch('https://qoqbdiixztolvtcjdnle.supabase.co/functions/v1/make-server-6c9b0e48/auth/signin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcWJkaWl4enRvbHZ0Y2pkbmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NDEwNjcsImV4cCI6MjA3NzAxNzA2N30.MpuwFgrc1rhlhaCG73LQWgjahM3m0uR4cEd7xvnLO6g'
  },
  body: JSON.stringify({
    email: 'test@betweenusapp.com',
    password: 'testpass123'
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Sign-in result:', data);
  if (data.access_token) {
    window.testAccessToken = data.access_token;
  }
});
```

**Expected:** Same as Test 2 - successful sign-in with access token

---

## ✅ Test 4: Get Current User

```javascript
// Use token from previous test
fetch('https://qoqbdiixztolvtcjdnle.supabase.co/functions/v1/make-server-6c9b0e48/auth/user', {
  headers: {
    'Authorization': `Bearer ${window.testAccessToken}`
  }
})
.then(r => r.json())
.then(data => console.log('✅ Current user:', data));
```

**Expected:**
```javascript
{
  success: true,
  user: {
    id: "...",
    email: "test@betweenusapp.com",
    user_metadata: {
      name: "Test User",
      languages: ["en"]
    }
  }
}
```

---

## ✅ Test 5: Check Session

```javascript
fetch('https://qoqbdiixztolvtcjdnle.supabase.co/functions/v1/make-server-6c9b0e48/auth/session', {
  headers: {
    'Authorization': `Bearer ${window.testAccessToken}`
  }
})
.then(r => r.json())
.then(data => console.log('✅ Session valid:', data));
```

**Expected:** `{valid: true, user: {...}}`

---

## ✅ Test 6: Sign Out

```javascript
fetch('https://qoqbdiixztolvtcjdnle.supabase.co/functions/v1/make-server-6c9b0e48/auth/signout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${window.testAccessToken}`
  }
})
.then(r => r.json())
.then(data => console.log('✅ Sign-out result:', data));
```

**Expected:** `{success: true}`

---

## 🎯 Test All at Once

Run this complete test suite:

```javascript
async function testAuthSystem() {
  const baseUrl = 'https://qoqbdiixztolvtcjdnle.supabase.co/functions/v1/make-server-6c9b0e48';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcWJkaWl4enRvbHZ0Y2pkbmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NDEwNjcsImV4cCI6MjA3NzAxNzA2N30.MpuwFgrc1rhlhaCG73LQWgjahM3m0uR4cEd7xvnLO6g';
  
  console.log('🧪 Starting auth tests...\n');

  // Test 1: Health check
  console.log('1️⃣ Testing health check...');
  const health = await fetch(`${baseUrl}/health`).then(r => r.json());
  console.log('✅ Health:', health);

  // Test 2: Sign up
  console.log('\n2️⃣ Testing sign-up...');
  const signupResult = await fetch(`${baseUrl}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`
    },
    body: JSON.stringify({
      email: `test${Date.now()}@betweenusapp.com`, // Unique email
      password: 'testpass123',
      name: 'Test User',
      languages: ['en', 'es']
    })
  }).then(r => r.json());
  
  if (signupResult.access_token) {
    console.log('✅ Sign-up successful!');
    console.log('   User:', signupResult.user.email);
    console.log('   Name:', signupResult.user.user_metadata?.name);
  } else {
    console.error('❌ Sign-up failed:', signupResult);
    return;
  }

  const accessToken = signupResult.access_token;

  // Test 3: Get user
  console.log('\n3️⃣ Testing get user...');
  const userResult = await fetch(`${baseUrl}/auth/user`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }).then(r => r.json());
  console.log('✅ User data:', userResult.user);

  // Test 4: Check session
  console.log('\n4️⃣ Testing session check...');
  const sessionResult = await fetch(`${baseUrl}/auth/session`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }).then(r => r.json());
  console.log('✅ Session valid:', sessionResult.valid);

  // Test 5: Sign out
  console.log('\n5️⃣ Testing sign-out...');
  const signoutResult = await fetch(`${baseUrl}/auth/signout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }).then(r => r.json());
  console.log('✅ Sign-out:', signoutResult);

  console.log('\n🎉 All auth tests passed!');
}

// Run the tests
testAuthSystem();
```

---

## 📱 Test in UI (Manual Testing)

### Test Email Sign-Up Flow:

1. **Reset Onboarding**
   - Click "Reset" button in header
   - Page reloads

2. **Go Through Onboarding**
   - Select language (e.g., English)
   - Enter name (e.g., "Test User")
   - Click through info screens

3. **Auth Screen Appears**
   - Should see beautiful auth screen
   - Email input, password input
   - Google and Apple buttons
   - "Skip for now" link

4. **Create Account**
   - Enter email: `test@example.com`
   - Enter password: `password123`
   - Click "Create Account"
   - Should see: ✅ "Account created successfully! 🎉"

5. **Verify**
   - Check localStorage:
     - `between_us_session` should have token
     - `between_us_user` should have user data
   - Should be in main app now

### Test Skip Flow:

1. Reset onboarding
2. Go through onboarding
3. On auth screen, click "Skip for now"
4. Should enter main app
5. localStorage should NOT have session/user

### Test Sign In Flow:

1. If you have an account, click "Reset"
2. Go through onboarding
3. On auth screen, click "Already have an account? Sign In"
4. Enter existing email and password
5. Click "Sign In"
6. Should see: ✅ "Welcome back! 💜"

---

## 🎨 Visual Checks

### Auth Screen Should Have:

- ✅ Dark purple background with floating orbs
- ✅ Gradient border on form
- ✅ Emoji (🎉 for sign up, 👋 for sign in)
- ✅ Title: "Create Your Account" or "Welcome Back"
- ✅ Google button with colorful logo
- ✅ Apple button with white Apple logo on black
- ✅ "or" divider line
- ✅ Email field with mail icon
- ✅ Password field with lock icon
- ✅ Eye icon to show/hide password
- ✅ Purple gradient submit button
- ✅ Toggle text: "Already have an account? Sign In"
- ✅ "Skip for now →" in gray text
- ✅ Back button at bottom

### Animations Should Work:

- ✅ Screen fades in/out
- ✅ Emoji animates with rotation
- ✅ Orbs float in background
- ✅ Button hover effects
- ✅ Loading spinner when submitting

---

## 🐛 Common Issues & Fixes

### ❌ "Failed to create account"
**Possible causes:**
- Email already exists (try different email)
- Password too short (min 6 characters)
- Server not running (check health endpoint)

**Fix:** Check browser console for detailed error

### ❌ OAuth buttons show error
**Expected behavior!**
- Google/Apple need Supabase Dashboard setup
- Error toast will explain this
- Email auth will still work

### ❌ Auth screen doesn't appear
**Possible causes:**
- Not on step 7 of onboarding
- Already completed onboarding

**Fix:** Click "Reset" button

### ❌ Session not persisting
**Possible causes:**
- Cookies disabled
- Private/incognito mode
- localStorage blocked

**Fix:** Check browser settings

---

## ✅ Success Criteria

Your auth system is working if:

- ✅ Backend health check returns OK
- ✅ Can create account with email/password
- ✅ Can sign in with email/password
- ✅ Session persists in localStorage
- ✅ Can get current user with token
- ✅ Can sign out
- ✅ Auth screen appears in onboarding
- ✅ Can skip auth and use anonymously
- ✅ Toast notifications show
- ✅ Loading states work
- ✅ Error messages display

---

## 🎯 Next: Configure OAuth (Optional)

If all tests pass, you can optionally set up:
- Google OAuth (see AUTH_SETUP_COMPLETE.md)
- Apple OAuth (see AUTH_SETUP_COMPLETE.md)

But **email auth is fully working now!** 🎉

---

## 📊 Verify in Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/qoqbdiixztolvtcjdnle
2. Click: **Authentication** → **Users**
3. You should see your test users listed!
4. Click on a user to see:
   - Email
   - User metadata (name, languages)
   - Created date
   - Last sign-in

---

**All tests passing? You're ready to ship! 🚀💜**
