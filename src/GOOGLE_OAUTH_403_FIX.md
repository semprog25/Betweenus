# 🔴 Google OAuth 403 Error - Troubleshooting Guide

## ❌ Problem
Getting a **403 Forbidden** error when trying to sign in with Google OAuth.

---

## 🔍 Common Causes

### 1. **Google OAuth Not Configured in Supabase** (Most Common)
The Google provider is not enabled or properly configured in your Supabase project.

### 2. **Redirect URI Mismatch**
The redirect URI in Google Cloud Console doesn't match what Supabase is using.

### 3. **Google Cloud Console Not Set Up**
OAuth consent screen or credentials not properly configured in Google Cloud Console.

### 4. **Project Domain Not Authorized**
Your app's domain is not added to the authorized domains list.

---

## ✅ Solution Steps

### Step 1: Check Supabase Dashboard

1. **Go to Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/qoqbdiixztolvtcjdnle/auth/providers
   ```

2. **Find Google Provider:**
   - Scroll to find "Google" in the list of providers
   - Check if it's **enabled** (toggle should be ON)

3. **Check Configuration:**
   - Look for "Client ID" and "Client Secret" fields
   - If empty or not configured → This is the issue!

---

### Step 2: Set Up Google Cloud Console

#### A. Create OAuth 2.0 Credentials

1. **Go to Google Cloud Console:**
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **Create a New Project** (if you don't have one):
   - Click "Select a project" → "New Project"
   - Name: `Between Us` or any name you prefer
   - Click "Create"

3. **Configure OAuth Consent Screen:**
   - Click "OAuth consent screen" in the left sidebar
   - Choose **External** (for public access)
   - Click "Create"
   
   **Fill in required fields:**
   - App name: `Between Us`
   - User support email: Your email
   - Developer contact email: Your email
   - Click "Save and Continue"
   
   **Scopes:** (Click "Add or Remove Scopes")
   - Select: `email`, `profile`, `openid`
   - Click "Update" → "Save and Continue"
   
   **Test users:** (Optional for development)
   - Add your email for testing
   - Click "Save and Continue"

4. **Create OAuth Client ID:**
   - Go back to "Credentials" tab
   - Click "+ CREATE CREDENTIALS" → "OAuth client ID"
   - Application type: **Web application**
   - Name: `Between Us Web Client`
   
   **Authorized JavaScript origins:**
   ```
   http://localhost:5173
   https://your-figma-make-url.com
   ```
   
   **Authorized redirect URIs:**
   ```
   https://qoqbdiixztolvtcjdnle.supabase.co/auth/v1/callback
   ```
   
   ⚠️ **IMPORTANT:** The redirect URI format is:
   ```
   https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback
   ```
   
   - Click "Create"
   - **Copy the Client ID and Client Secret** (you'll need these!)

---

### Step 3: Configure Supabase with Google Credentials

1. **Go back to Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/qoqbdiixztolvtcjdnle/auth/providers
   ```

2. **Find Google Provider** and click to expand

3. **Paste Credentials:**
   - **Client ID:** Paste from Google Cloud Console
   - **Client Secret:** Paste from Google Cloud Console
   
4. **Configure Additional Settings:**
   - **Skip nonce check:** ❌ Leave unchecked (recommended)
   - **Redirect URL:** Should auto-populate as:
     ```
     https://qoqbdiixztolvtcjdnle.supabase.co/auth/v1/callback
     ```

5. **Click "Save"**

6. **Enable the Provider:**
   - Make sure the toggle at the top is **ON** (green)

---

### Step 4: Update Authorized Domains

1. **In Supabase Dashboard:**
   - Go to: Authentication → URL Configuration
   ```
   https://supabase.com/dashboard/project/qoqbdiixztolvtcjdnle/auth/url-configuration
   ```

2. **Add Site URLs:**
   Add all URLs where your app will run:
   ```
   http://localhost:5173
   https://your-figma-make-url.com
   ```

3. **Add Redirect URLs:**
   ```
   http://localhost:5173/**
   https://your-figma-make-url.com/**
   ```

4. **Click "Save"**

---

### Step 5: Verify Google Cloud Console Settings

1. **Go back to Google Cloud Console:**
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **Click on your OAuth 2.0 Client ID**

3. **Verify Authorized redirect URIs includes:**
   ```
   https://qoqbdiixztolvtcjdnle.supabase.co/auth/v1/callback
   ```

4. **Verify Authorized JavaScript origins includes:**
   ```
   http://localhost:5173
   https://your-actual-domain.com
   ```

5. **Save any changes**

---

### Step 6: Test Google Sign-In

1. **Clear browser cache and cookies** (or use Incognito mode)

2. **Open your app:**
   ```
   http://localhost:5173
   ```

3. **Go through onboarding** until you reach the Auth step

4. **Click "Continue with Google"**

5. **Expected flow:**
   - ✅ Redirects to Google sign-in page
   - ✅ Shows consent screen
   - ✅ Redirects back to your app
   - ✅ User is signed in

---

## 🔍 Debugging Tips

### Check Browser Console

Open DevTools (F12) → Console tab:

```javascript
// Look for errors like:
❌ "403 Forbidden"
❌ "redirect_uri_mismatch"
❌ "unauthorized_client"
```

### Common Error Messages

#### 1. `redirect_uri_mismatch`
**Solution:** The redirect URI in Google Cloud Console doesn't match Supabase's callback URL.

**Fix:**
- Copy the exact redirect URI from Supabase Dashboard
- Add it to Google Cloud Console → Credentials → OAuth 2.0 Client
- Format: `https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback`

#### 2. `unauthorized_client`
**Solution:** OAuth consent screen not configured or client ID incorrect.

**Fix:**
- Complete OAuth consent screen setup in Google Cloud Console
- Verify Client ID and Secret match in Supabase

#### 3. `access_denied`
**Solution:** User denied permission or app not authorized.

**Fix:**
- Make sure OAuth consent screen is published (or in Testing mode with test users)
- Add your email to test users list

#### 4. `403 Forbidden`
**Solution:** Google OAuth not enabled in Supabase or credentials missing.

**Fix:**
- Enable Google provider in Supabase Dashboard
- Add valid Client ID and Secret
- Save and toggle provider ON

---

## 📋 Checklist

Before testing, verify all these are done:

- [ ] Google Cloud project created
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 Client ID created
- [ ] Authorized redirect URIs include Supabase callback
- [ ] Client ID and Secret copied to Supabase
- [ ] Google provider enabled in Supabase (toggle ON)
- [ ] Site URLs configured in Supabase URL Configuration
- [ ] Browser cache cleared

---

## 🎯 Quick Test

### Test in Supabase SQL Editor

Run this query to check if Google provider is enabled:

```sql
-- Check auth providers
SELECT * FROM auth.config;
```

### Test OAuth Flow Manually

1. Get your Supabase project URL:
   ```
   https://qoqbdiixztolvtcjdnle.supabase.co
   ```

2. Visit this URL in browser:
   ```
   https://qoqbdiixztolvtcjdnle.supabase.co/auth/v1/authorize?provider=google
   ```

3. If configured correctly:
   - ✅ Should redirect to Google sign-in
   - ❌ If 403, Google OAuth is not properly configured

---

## 🔧 Alternative: Use Email Auth Instead

If Google OAuth is too complex to set up right now, users can still:

1. **Sign up with Email/Password** (fully working)
2. **Skip authentication** and use the app anonymously

Google OAuth is optional! The app works great without it.

---

## 📞 Still Not Working?

### Check Supabase Logs

1. Go to: https://supabase.com/dashboard/project/qoqbdiixztolvtcjdnle/logs/auth-logs
2. Look for failed sign-in attempts
3. Check error messages

### Verify Project Settings

```bash
# Your Supabase Project ID
qoqbdiixztolvtcjdnle

# Expected callback URL
https://qoqbdiixztolvtcjdnle.supabase.co/auth/v1/callback
```

### Reset and Try Again

1. Delete OAuth Client in Google Cloud Console
2. Create a new one with correct redirect URI
3. Update Supabase with new credentials
4. Save and test

---

## 🎉 Success Indicators

When Google OAuth is working correctly:

1. ✅ Click "Continue with Google"
2. ✅ Redirects to Google sign-in page (not 403 error)
3. ✅ Shows app name "Between Us" on consent screen
4. ✅ After signing in with Google account
5. ✅ Redirects back to your app
6. ✅ User is logged in
7. ✅ Profile shows Google email and avatar

---

## 📚 Official Documentation

- [Supabase Google OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Setup Guide](https://developers.google.com/identity/protocols/oauth2)

---

## 🎯 Summary

**The 403 error means Google OAuth is not configured.**

**Quick Fix:**
1. Set up Google Cloud Console OAuth
2. Add credentials to Supabase
3. Enable Google provider
4. Test sign-in

**Time needed:** ~10-15 minutes

**Complexity:** Medium (requires Google Cloud Console access)

**Alternative:** Use email/password authentication (already working!)

---

*Need help? Check the Supabase Dashboard and Google Cloud Console for any error messages!* 💜
