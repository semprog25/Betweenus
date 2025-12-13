# Between Us - Email Templates

Beautiful, responsive HTML5 email templates for Supabase authentication flows with Between Us dark theme, neon aesthetic, and white logo.

## 📧 Available Templates

1. **confirm-signup.html** - Welcome new users and confirm email address
2. **invite-user.html** - Invite users to join Between Us
3. **magic-link.html** - Passwordless authentication link
4. **change-email.html** - Confirm email address changes
5. **reset-password.html** - Password reset requests
6. **reauthentication.html** - Verify identity for sensitive actions

## 🎨 Design Features

- **HTML5 Compliant**: Modern, semantic HTML5 structure
- **Between Us White Logo**: Professional branding with hosted logo
- **Dark Theme**: Deep purple/blue gradients (#1a1a2e, #16213e)
- **Neon Accents**: Purple-to-pink gradients (#a855f7 to #ec4899)
- **Responsive**: Mobile-friendly design that works across all email clients
- **Animated Emojis**: Visual decoration with relevant emojis
- **Security-First**: Clear security warnings and expiry notices
- **Accessibility**: High contrast, readable fonts, semantic HTML

## 🚀 Quick Setup Guide

### Step 1: Upload Logo to Supabase Storage

**See `SUPABASE-STORAGE-SETUP.md` for detailed instructions.**

Quick version:
1. Go to Supabase Dashboard → **Storage**
2. Create a new bucket named `email-assets` (make it **Public**)
3. Upload your white Between Us logo PNG as `between-us-logo-white.png`
4. Copy the public URL

### Step 2: Update Template URLs

In each HTML template, replace:
```
YOUR_SUPABASE_PROJECT_URL
```

With your actual Supabase project URL (e.g., `abcdefg123`)

Example:
```html
<!-- Before -->
https://YOUR_SUPABASE_PROJECT_URL.supabase.co/storage/v1/object/public/email-assets/between-us-logo-white.png

<!-- After -->
https://abcdefg123.supabase.co/storage/v1/object/public/email-assets/between-us-logo-white.png
```

### Step 3: Access Supabase Email Templates

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**
3. You'll see tabs for each email type

### Step 4: Copy Template HTML

For each email type:

1. Open the corresponding `.html` file from this folder
2. Copy the entire HTML content
3. Paste it into the Supabase email template editor

### Step 5: Verify Template Variables

Supabase uses these variables (already included in templates):

- `{{ .ConfirmationURL }}` - The action link/button URL
- `{{ .Token }}` - Auth token (not used in our templates, URL preferred)
- `{{ .SiteURL }}` - Your app URL (can be added if needed)

### Step 6: Test Your Emails

1. Use Supabase's "Send test email" feature
2. Check on multiple devices and email clients:
   - Gmail (web, mobile)
   - Apple Mail
   - Outlook
   - Dark mode and light mode

## 📋 Template Mapping

| Supabase Email Type | Template File | Color Theme | Primary Emoji |
|-------------------|---------------|-------------|---------------|
| Confirm signup | confirm-signup.html | Purple-Pink | 💜 ✨ 🌟 |
| Invite user | invite-user.html | Green-Blue | 💜 🎉 💌 |
| Magic Link | magic-link.html | Pink-Purple | 💜 ✨ 🔮 |
| Change Email Address | change-email.html | Blue-Purple | 💜 📧 🔄 |
| Reset Password | reset-password.html | Orange-Red | 💜 🔐 🔑 |
| Reauthentication | reauthentication.html | Violet-Indigo | 💜 🛡️ ✓ |

## 🎯 Customization Tips

### Update Play Store URL
In the templates, you'll find placeholder URLs. Replace them with your actual links:
```html
<!-- Find and replace -->
https://play.google.com/store/apps/details?id=com.betweenus.app
```

### Add Your Logo
To add a logo image, replace the emoji heading:
```html
<!-- Replace this: -->
<h1 style="...">💜 Between Us</h1>

<!-- With this: -->
<img src="YOUR_LOGO_URL" alt="Between Us" style="max-width: 200px; height: auto;">
```

### Adjust Expiry Times
Update the expiry time text to match your Supabase settings:
- Confirm signup: 24 hours (default)
- Magic link: 1 hour (default)
- Password reset: 1 hour (default)
- Email change: 24 hours (default)
- Reauthentication: 15 minutes (recommended)

## ✅ Email Client Compatibility

These templates are tested and compatible with:

- ✅ Gmail (web, iOS, Android)
- ✅ Apple Mail (macOS, iOS)
- ✅ Outlook (web, desktop, mobile)
- ✅ Yahoo Mail
- ✅ ProtonMail
- ✅ Thunderbird
- ✅ Dark mode support across all clients

## 🔒 Security Best Practices

All templates include:
- ✅ Clear call-to-action buttons
- ✅ Alternative text links for accessibility
- ✅ Security warnings for suspicious activity
- ✅ Expiry time notices
- ✅ "Didn't request this?" warnings
- ✅ Footer with brand attribution

## 💡 Pro Tips

1. **Test Thoroughly**: Always send test emails before going live
2. **Mobile First**: 60%+ of emails are opened on mobile devices
3. **Plain Text Alternative**: Consider adding plain text versions in Supabase
4. **Monitor Deliverability**: Use Supabase logs to track email delivery
5. **A/B Testing**: Test different subject lines for better open rates

## 📱 Suggested Email Subject Lines

- **Confirm signup**: "Welcome to Between Us! Please confirm your email 💜"
- **Invite user**: "You've been invited to join Between Us 🌟"
- **Magic link**: "Your secure sign-in link for Between Us 🔮"
- **Change email**: "Confirm your new email address for Between Us 📧"
- **Reset password**: "Reset your Between Us password 🔑"
- **Reauthentication**: "Verify your identity for Between Us 🛡️"

## 🆘 Troubleshooting

### Emails not sending?
- Check Supabase email settings are configured
- Verify SMTP settings if using custom domain
- Check spam folder

### Styling looks broken?
- Some email clients strip CSS styles
- Our templates use inline styles for maximum compatibility
- Test in Gmail first (most restrictive)

### Links not working?
- Ensure `{{ .ConfirmationURL }}` is not modified
- Check URL encoding in Supabase settings
- Verify redirect URLs are whitelisted

## 📞 Support

For issues or questions about these templates:
- Check Supabase documentation
- Review email template variables
- Test in different email clients

---

**Made with 💜 for mental wellness**  
✨ Dreamed by Darija ✨

© 2024 Between Us. All rights reserved.