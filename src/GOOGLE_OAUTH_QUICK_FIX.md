# 🔴 Google OAuth 403 Error - Quick Fix

## ❌ Problem
Getting **403 Forbidden** error when clicking "Continue with Google"

## ✅ Quick Solution

### The 403 error means Google OAuth is NOT configured in Supabase.

---

## 🚀 2-Minute Setup

### Step 1: Go to Google Cloud Console
```
https://console.cloud.google.com/apis/credentials
```

### Step 2: Create OAuth Client
1. Click "+ CREATE CREDENTIALS" → "OAuth client ID"
2. Application type: **Web application**
3. Name: `Between Us`
4. Authorized redirect URIs:
   ```
   https://qoqbdiixztolvtcjdnle.supabase.co/auth/v1/callback
   ```
5. Click "Create"
6. **Copy the Client ID and Client Secret**

### Step 3: Configure Supabase
```
https://supabase.com/dashboard/project/qoqbdiixztolvtcjdnle/auth/providers
```

1. Find **Google** provider
2. Paste **Client ID** and **Client Secret**
3. Click "Save"
4. Toggle **ON** to enable

### Step 4: Test
1. Clear browser cache
2. Try "Continue with Google" again
3. Should work now! ✅

---

## 💡 Alternative Solution

**Don't want to set up Google OAuth?**

Use **Email/Password** instead - it's already fully configured and working!

Just click "Sign Up" and enter your email. Takes 10 seconds! 💜

---

## 📋 Checklist

- [ ] Created OAuth Client in Google Cloud Console
- [ ] Added Supabase callback URL to redirect URIs
- [ ] Copied Client ID and Secret to Supabase
- [ ] Enabled Google provider in Supabase
- [ ] Cleared browser cache
- [ ] Tested sign-in

---

## 🔗 Helpful Links

- **Full Setup Guide:** See `GOOGLE_OAUTH_403_FIX.md`
- **Google Cloud Console:** https://console.cloud.google.com/apis/credentials
- **Supabase Dashboard:** https://supabase.com/dashboard/project/qoqbdiixztolvtcjdnle/auth/providers
- **Supabase OAuth Docs:** https://supabase.com/docs/guides/auth/social-login/auth-google

---

## ✨ Better Error Messages

We've updated the app to show helpful error messages:

- **403 Error** → "Google OAuth is not configured. Use Email/Password instead."
- **Redirect URI mismatch** → "Please check your Google Cloud Console settings."
- **Unauthorized client** → "Google OAuth not properly configured."

Now you'll know exactly what's wrong! 🎯

---

**Bottom line:** Google OAuth needs manual setup. Email/Password works right now! 💜
