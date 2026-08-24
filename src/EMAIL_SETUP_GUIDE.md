# Email Setup Guide for Between Us

## 🎉 What's New

We've implemented a beautiful welcome email system that sends to users when they:
- ✅ Sign up with email/password
- ✅ Sign up with Google OAuth
- ✅ Sign up with Apple OAuth

## 📧 Email Features

### Beautiful HTML Email Template
- **Vibrant gradient design** matching the Between Us aesthetic
- **Responsive layout** that looks great on mobile and desktop
- **Personalized greeting** with the user's name
- **Feature highlights** showcasing all app capabilities
- **Privacy assurance** emphasizing anonymous nature
- **Animated elements** with subtle pulse effects
- **Plain text fallback** for email clients that don't support HTML

### Email Content Includes:
1. ✨ Welcome message with personalized greeting
2. 💭 Feature overview (Anonymous sharing, Daily check-ins, Community support, 6 languages)
3. 🔒 Privacy assurance
4. 📝 Getting started guide
5. 💜 Warm sign-off from the Between Us team

## ⚙️ Configuration Required

### To Enable Email Sending:

**IMPORTANT:** Currently, emails are prepared and sent to Supabase, but you need to configure SMTP settings for them to actually be delivered.

### Steps to Configure:

1. **Go to Supabase Dashboard**
   - Navigate to your project at https://supabase.com/dashboard

2. **Configure SMTP Settings**
   - Go to **Project Settings** → **Auth** → **SMTP Settings**
   - Enable custom SMTP
   - Enter your SMTP provider details:
     - **Host**: e.g., `smtp.gmail.com`, `smtp.sendgrid.net`
     - **Port**: Usually `587` (TLS) or `465` (SSL)
     - **Username**: Your SMTP username
     - **Password**: Your SMTP password/API key
     - **Sender Email**: The "from" email address
     - **Sender Name**: "Between Us" or your preferred name

3. **Recommended SMTP Providers:**
   
   **SendGrid (Recommended for production)**
   - Free tier: 100 emails/day
   - Sign up: https://sendgrid.com
   - Host: `smtp.sendgrid.net`
   - Port: `587`
   - Username: `apikey`
   - Password: Your SendGrid API key
   
   **Gmail (Good for testing)**
   - Free tier: 500 emails/day
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Username: Your Gmail address
   - Password: App-specific password (not your regular password)
   - Note: Must enable "Less secure app access" or use App Passwords
   
   **Amazon SES (Best for high volume)**
   - Very affordable pricing
   - Sign up: https://aws.amazon.com/ses
   - Requires AWS account setup
   
   **Mailgun**
   - Free tier: 5,000 emails/month
   - Sign up: https://www.mailgun.com

4. **Test the Email**
   - Create a new account in your app
   - Check the spam folder if you don't see it in inbox
   - Check Supabase logs for any email sending errors

## 🔧 Technical Implementation

### Server-Side Email Function
Location: `/supabase/functions/server/email-templates.tsx`

The welcome email is automatically sent when:
- A user signs up with email/password (via `/auth/signup` endpoint)
- A user completes OAuth sign-in (via `/auth/send-welcome-email` endpoint)

### Email Sending Flow:

1. **Email/Password Signup:**
   ```
   User signs up → Server creates account → Welcome email sent → User signed in
   ```

2. **OAuth Signup (Google/Apple):**
   ```
   User signs up via OAuth → OAuth callback → Session created → Welcome email sent
   ```

### Preventing Duplicate Emails
The system tracks sent emails using key-value storage:
- Key: `welcome-email-sent:{userId}`
- This ensures each user only receives ONE welcome email

## 📝 Customizing the Email Template

### To modify the email content:

1. **Edit the template:**
   - Open `/supabase/functions/server/email-templates.tsx`
   - Modify `getWelcomeEmailHTML()` for HTML content
   - Modify `getWelcomeEmailText()` for plain text fallback

2. **Template variables:**
   - `userName`: User's display name
   - `userEmail`: User's email address
   - `confirmationLink`: Optional email confirmation link

### Design Features:
- Gradient header matching Between Us brand colors
- Animated pulse effect on header
- Feature cards with icons
- Privacy note with highlighted styling
- Responsive design for mobile
- Professional footer

## 🐛 Troubleshooting

### Emails not sending?
1. **Check Supabase Dashboard logs:**
   - Go to Logs → Edge Functions
   - Look for email sending errors

2. **Verify SMTP configuration:**
   - Ensure all SMTP settings are correct
   - Test with your SMTP provider's test tool

3. **Check spam folder:**
   - First emails may land in spam
   - Mark as "Not Spam" to improve deliverability

4. **Review server logs:**
   - The server logs will show if email sending was attempted
   - Look for messages like "Welcome email sent to: {email}"

### Common Issues:

**"Email send response: 403 Forbidden"**
- SMTP not configured in Supabase Dashboard
- Go to Auth settings and set up SMTP

**"Authentication failed"**
- Wrong SMTP username/password
- For Gmail, you need an "App Password", not your regular password

**"Connection timeout"**
- Wrong SMTP host or port
- Check your SMTP provider's documentation

**Emails go to spam**
- Add SPF/DKIM records to your domain
- Use a verified sender email address
- Ask users to whitelist your email

## 🎨 Email Preview

The email includes:
- **Vibrant purple gradient header** with "Between Us" branding
- **Personalized welcome message**
- **4 feature highlights** with emoji icons
- **Call-to-action** (if confirmation link provided)
- **Privacy assurance** in highlighted box
- **Getting started guide** with 4 simple steps
- **Professional footer** with disclaimer

## 📊 Monitoring

### Check email delivery:
1. **Supabase Dashboard:**
   - Navigate to Auth → Users
   - Check user's email confirmation status

2. **Server Logs:**
   - Look for "Welcome email sent to: {email}"
   - Check for any error messages

3. **SMTP Provider Dashboard:**
   - Most providers have delivery statistics
   - Check bounce rates and delivery status

## 🚀 Next Steps

1. ✅ Configure SMTP in Supabase Dashboard
2. ✅ Test with a new signup
3. ✅ Check email deliverability
4. ✅ Customize email template if needed
5. ✅ Set up domain authentication (SPF/DKIM) for better deliverability
6. ✅ Monitor email delivery rates

## 💡 Tips for Better Deliverability

1. **Use a custom domain:** `hello@betweenus.com` instead of `noreply@yourproject.supabase.co`
2. **Add email authentication:** Set up SPF, DKIM, and DMARC records
3. **Keep emails relevant:** Don't send too frequently
4. **Monitor bounce rates:** Remove invalid email addresses
5. **Warm up your sending domain:** Start with small volumes
6. **Include unsubscribe option:** Required by law in many countries

## 📞 Support

If you need help with email setup:
1. Check Supabase documentation: https://supabase.com/docs/guides/auth/auth-smtp
2. Contact your SMTP provider's support
3. Review server logs for detailed error messages

---

**Note:** Email functionality is fully implemented and ready to use. You just need to configure SMTP settings in Supabase Dashboard to enable actual email delivery. Until then, the system will log that emails are being prepared but won't send them.
