# 🚀 Authentication Quick Start

## What You Just Got

Your **Between Us** app now has a complete authentication system at the end of onboarding!

### ✅ Ready to Use RIGHT NOW:
- **Email/Password** sign-up and sign-in
- Session management
- Sign-out functionality
- User data storage (name, languages)

### ⚠️ Needs Setup (Optional):
- **Google OAuth** - Requires Supabase Dashboard configuration
- **Apple OAuth** - Requires Supabase Dashboard configuration

---

## 🎯 Test It Now (3 Steps)

### Step 1: Reset Onboarding
Click the **"Reset"** button in the top-left corner

### Step 2: Complete Onboarding
1. Select a language
2. Enter your name (optional)
3. Go through info screens
4. **NEW!** Auth screen appears

### Step 3: Create Account
**Option A: Email/Password**
- Enter: `test@example.com`
- Password: `password123`
- Click "Create Account"
- ✅ Done! You're signed in!

**Option B: Skip**
- Click "Skip for now"
- Use app anonymously
- Can create account later from Profile

---

## 📱 What Users See

### Auth Screen Features:
- 🔵 **Google** sign-in button (needs setup)
- 🍎 **Apple** sign-in button (needs setup)
- 📧 **Email/Password** form
- 👁️ Show/hide password toggle
- 🔄 Switch between Sign Up/Sign In
- ⏭️ "Skip for now" option
- ↩️ Back button

### Beautiful UI:
- Gradient background with floating orbs
- Smooth animations
- Loading states
- Error messages with toast notifications
- Responsive design

---

## 🔐 How Sessions Work

### When User Signs Up/In:
1. Server creates account
2. Returns access token
3. Token stored in localStorage
4. User data stored in localStorage
5. Session persists across reloads

### Session Keys:
- `between_us_session` - Access token
- `between_us_user` - User data (email, name, languages)

### Check if Signed In:
```tsx
import { getSession } from './utils/auth';

const session = getSession();
if (session) {
  console.log('User email:', session.user.email);
  console.log('User name:', session.user.user_metadata?.name);
}
```

---

## 🎨 Customization

### Change Button Text:
Edit `/components/AuthStep.tsx`:
```tsx
<Button>Continue with Google</Button>
// Change to:
<Button>Sign in with Google</Button>
```

### Remove Skip Option:
Comment out the "Skip for now" button in `AuthStep.tsx`

### Make Auth Required:
Remove the `onComplete(true)` call when skip is clicked

### Add More OAuth Providers:
Supabase supports: Facebook, GitHub, Twitter, Discord, etc.
Add similar buttons with `signInWithOAuth({ provider: 'github' })`

---

## 📊 User Data Structure

```typescript
{
  id: "uuid-here",
  email: "user@example.com",
  user_metadata: {
    name: "John Doe",
    languages: ["en", "es"]
  }
}
```

---

## 🔧 Next Steps

### 1. ✅ Test Email Auth (Now!)
- Reset onboarding
- Create an account
- Verify it works

### 2. 📱 Add to Profile Tab
- Show user email
- Add sign-out button
- See `PROFILE_AUTH_INTEGRATION.md`

### 3. 🔐 Setup OAuth (Optional)
- Configure Google in Supabase Dashboard
- Configure Apple in Supabase Dashboard
- See `AUTH_SETUP_COMPLETE.md`

### 4. 🔒 Protect Features (Optional)
- Require auth for certain actions
- Check session before API calls
- Redirect to login if needed

---

## 🐛 Troubleshooting

### Can't See Auth Screen?
- Did you reset onboarding?
- Are you on step 7 (last step)?
- Check console for errors

### Email Sign-Up Not Working?
- Check browser console
- Password must be 6+ characters
- Email must be valid format
- Check Supabase logs

### Google/Apple Not Working?
- These need setup in Supabase Dashboard first!
- A warning toast will appear explaining this
- See `AUTH_SETUP_COMPLETE.md` for setup guide

---

## 📚 Documentation Files

1. **AUTH_QUICK_START.md** (this file) - Quick overview
2. **AUTH_SETUP_COMPLETE.md** - Full technical guide
3. **PROFILE_AUTH_INTEGRATION.md** - Add auth to profile tab

---

## 💡 Pro Tips

1. **Start with Email** - Works immediately, no setup needed
2. **Skip is OK** - Users can create accounts later
3. **Session Persists** - Users stay logged in
4. **OAuth is Optional** - Only set up if needed
5. **Test in Incognito** - Fresh state for testing

---

## 🎉 Summary

✅ **Authentication is LIVE!**
- Email/password works right now
- OAuth ready when you configure it
- Beautiful UI included
- Session management built-in
- Users can skip and use anonymously

**Just click "Reset" and try it!** 🚀

---

## 🔗 Quick Links

- Supabase Dashboard: https://supabase.com/dashboard/project/qoqbdiixztolvtcjdnle
- Google OAuth Setup: https://supabase.com/docs/guides/auth/social-login/auth-google
- Apple OAuth Setup: https://supabase.com/docs/guides/auth/social-login/auth-apple

---

*Built with 💜 for Between Us - Your anonymous mental wellness companion*
