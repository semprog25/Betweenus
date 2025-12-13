# Google OAuth Setup Guide for Between Us

## Problem: 403 Error "You do not have access to this page"

This error occurs when the redirect URI configuration doesn't match between Google Cloud Console and your app.

## Step-by-Step Solution

### 1. Get Your Supabase Project Details

First, you need your Supabase project URL. You can find this in:
- Supabase Dashboard → Settings → API
- Look for "Project URL" (format: `https://xxxxx.supabase.co`)

### 2. Configure Google Cloud Console

Go to [Google Cloud Console](https://console.cloud.google.com/):

1. **Select or Create a Project**
   - If you don't have a project, create one

2. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

3. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" user type (unless you have a Google Workspace)
   - Fill in required fields:
     - App name: "Between Us"
     - User support email: your email
     - Developer contact: your email
   - Click "Save and Continue"
   - **Scopes**: Add the following scopes:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
   - Click "Save and Continue"
   - **Test users** (if app is in Testing mode):
     - Add your Google account email
     - Add any other emails you want to test with
   - Click "Save and Continue"

4. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "+ CREATE CREDENTIALS" → "OAuth client ID"
   - Application type: **Web application**
   - Name: "Between Us Web Client"
   - **Authorized JavaScript origins**:
     - Add: `https://xxxxx.supabase.co` (your Supabase project URL)
     - Add: Your app's production URL (if different)
   - **Authorized redirect URIs** - ADD BOTH:
     - `https://xxxxx.supabase.co/auth/v1/callback`
     - Your app's URL + `/` (e.g., `https://your-app.com/`)
   - Click "Create"
   - **Copy your Client ID and Client Secret**

### 3. Configure Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to "Authentication" → "Providers"
4. Find "Google" in the list
5. Toggle it to "Enabled"
6. Paste your Google **Client ID**
7. Paste your Google **Client Secret**
8. Click "Save"

### 4. Update Redirect URLs in Supabase (IMPORTANT)

1. Still in Supabase Dashboard → Authentication → "URL Configuration"
2. Add your app's URL to "Redirect URLs":
   - Add: `https://your-app-url.com/`
   - Make sure it ends with `/`

### 5. Publish Your OAuth Consent Screen (For Production)

If you want anyone to sign in (not just test users):

1. Go back to Google Cloud Console
2. "APIs & Services" → "OAuth consent screen"
3. Click "PUBLISH APP"
4. Confirm the publishing

**Note**: While in "Testing" mode, only test users you've added can sign in.

## Common Issues & Solutions

### Issue: "Access blocked: This app's request is invalid"
**Solution**: Make sure you've added the scopes in the OAuth consent screen:
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`

### Issue: "redirect_uri_mismatch"
**Solution**: 
- Double-check that the redirect URI in Google Console exactly matches: `https://xxxxx.supabase.co/auth/v1/callback`
- Make sure there are no trailing spaces
- The URL is case-sensitive

### Issue: "This app is blocked" for other users
**Solution**: 
- Your app is in "Testing" mode
- Either:
  1. Add their email as a test user in OAuth consent screen, OR
  2. Publish your app (see step 5 above)

### Issue: User sees "This app isn't verified"
**Solution**: This is normal for unpublished apps. Users can click "Advanced" → "Go to [App Name] (unsafe)" to proceed. To remove this:
- Go through Google's verification process (for production apps)
- Or keep it in testing mode with added test users

## Quick Checklist

- [ ] Google+ API is enabled
- [ ] OAuth consent screen is configured
- [ ] Test users are added (if in Testing mode)
- [ ] OAuth client created with type "Web application"
- [ ] Authorized JavaScript origins includes Supabase URL
- [ ] Authorized redirect URIs includes `https://xxxxx.supabase.co/auth/v1/callback`
- [ ] Client ID and Secret are in Supabase
- [ ] Google provider is enabled in Supabase
- [ ] Your app URL is in Supabase redirect URLs

## Testing

After setup:
1. Clear your browser cache
2. Try signing in with Google
3. If you see the consent screen, click "Allow"
4. You should be redirected back to your app and signed in

## Need Help?

If you're still having issues:
1. Check browser console for error messages
2. Check Supabase logs: Dashboard → Logs → Auth Logs
3. Verify all URLs match exactly (no typos, extra spaces, or wrong protocols)
