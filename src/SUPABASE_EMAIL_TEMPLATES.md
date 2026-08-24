# Supabase Email Templates

Here are the "edge-to-edge", spam-friendly, and "wow" designed email templates for your Supabase project. They use the **Between Us** branding (Purple/Fuchsia gradients) and the official logo.

## 1. Confirm Your Signup
**Subject:** Welcome to Between Us! Confirm your email

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Signup</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f3f0ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e1e2e; -webkit-font-smoothing: antialiased; }
    table { border-spacing: 0; width: 100%; }
    td { padding: 0; }
    img { border: 0; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f3f0ff; padding-bottom: 40px; }
    .webkit { max-width: 600px; background-color: #ffffff; margin: 0 auto; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #7c3aed 0%, #c026d3 100%); padding: 48px 20px; text-align: center; }
    .content { padding: 40px 40px 20px 40px; text-align: center; }
    .title { font-size: 28px; font-weight: 800; color: #1e1e2e; margin: 0 0 16px 0; letter-spacing: -0.5px; }
    .text { font-size: 16px; line-height: 1.6; color: #52525b; margin: 0 0 24px 0; }
    .button-container { margin: 32px 0; }
    .button { background-color: #7c3aed; color: #ffffff !important; text-decoration: none; padding: 16px 40px; border-radius: 9999px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3); transition: all 0.2s; }
    .footer { background-color: #f9fafb; padding: 32px 20px; text-align: center; border-top: 1px solid #e4e4e7; }
    .footer-text { font-size: 12px; line-height: 1.5; color: #a1a1aa; margin: 0 0 8px 0; }
    .footer-link { color: #7c3aed; text-decoration: none; font-weight: 600; }
    
    @media screen and (max-width: 600px) {
      .content { padding: 30px 20px; }
      .title { font-size: 24px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table role="presentation">
      <tr>
        <td align="center" style="padding-top: 40px; padding-bottom: 40px;">
          <div class="webkit">
            <!-- Header -->
            <div class="header">
              <img src="https://qoqbdiixztolvtcjdnle.supabase.co/storage/v1/object/sign/betweenus3/betweenus.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lMTYxZDg1My1iMGRlLTRkNjQtYTQxYS0xNTY5MmFmMGJhNWEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJiZXR3ZWVudXMzL2JldHdlZW51cy5wbmciLCJpYXQiOjE3NjQ1MzE5NjMsImV4cCI6MzM0MTMzMTk2M30.Y2YtSYTaspr-sUaFpli7ghszWt8nZjictCRJX2wkbGw" alt="Between Us Logo" width="140" style="display: block; margin: 0 auto; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
            </div>
            
            <!-- Content -->
            <div class="content">
              <h1 class="title">Welcome to Between Us! 👋</h1>
              <p class="text">
                We're so excited to have you join our safe space for mental wellness. Before you can start sharing and connecting, we just need to verify your email address.
              </p>
              
              <div class="button-container">
                <a href="{{ .ConfirmationURL }}" class="button">Confirm Email</a>
              </div>
              
              <p class="text" style="font-size: 14px; color: #71717a;">
                If you didn't create an account, you can safely ignore this email.
              </p>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <p class="footer-text">
                &copy; 2025 Between Us. Your safe space for mental wellness.
              </p>
              <p class="footer-text">
                <a href="{{ .SiteURL }}" class="footer-link">Visit Website</a> • <a href="#" class="footer-link">Privacy Policy</a>
              </p>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
```

## 2. Reset Password
**Subject:** Reset your Between Us password

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f3f0ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e1e2e; -webkit-font-smoothing: antialiased; }
    table { border-spacing: 0; width: 100%; }
    td { padding: 0; }
    img { border: 0; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f3f0ff; padding-bottom: 40px; }
    .webkit { max-width: 600px; background-color: #ffffff; margin: 0 auto; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #7c3aed 0%, #c026d3 100%); padding: 48px 20px; text-align: center; }
    .content { padding: 40px 40px 20px 40px; text-align: center; }
    .title { font-size: 28px; font-weight: 800; color: #1e1e2e; margin: 0 0 16px 0; letter-spacing: -0.5px; }
    .text { font-size: 16px; line-height: 1.6; color: #52525b; margin: 0 0 24px 0; }
    .button-container { margin: 32px 0; }
    .button { background-color: #7c3aed; color: #ffffff !important; text-decoration: none; padding: 16px 40px; border-radius: 9999px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3); transition: all 0.2s; }
    .footer { background-color: #f9fafb; padding: 32px 20px; text-align: center; border-top: 1px solid #e4e4e7; }
    .footer-text { font-size: 12px; line-height: 1.5; color: #a1a1aa; margin: 0 0 8px 0; }
    .footer-link { color: #7c3aed; text-decoration: none; font-weight: 600; }
    
    @media screen and (max-width: 600px) {
      .content { padding: 30px 20px; }
      .title { font-size: 24px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table role="presentation">
      <tr>
        <td align="center" style="padding-top: 40px; padding-bottom: 40px;">
          <div class="webkit">
            <!-- Header -->
            <div class="header">
              <img src="https://qoqbdiixztolvtcjdnle.supabase.co/storage/v1/object/sign/betweenus3/betweenus.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lMTYxZDg1My1iMGRlLTRkNjQtYTQxYS0xNTY5MmFmMGJhNWEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJiZXR3ZWVudXMzL2JldHdlZW51cy5wbmciLCJpYXQiOjE3NjQ1MzE5NjMsImV4cCI6MzM0MTMzMTk2M30.Y2YtSYTaspr-sUaFpli7ghszWt8nZjictCRJX2wkbGw" alt="Between Us Logo" width="140" style="display: block; margin: 0 auto; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
            </div>
            
            <!-- Content -->
            <div class="content">
              <h1 class="title">Reset Password 🔐</h1>
              <p class="text">
                Having trouble getting in? No worries! Click the button below to reset your password and get back to your safe space.
              </p>
              
              <div class="button-container">
                <a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>
              </div>
              
              <p class="text" style="font-size: 14px; color: #71717a;">
                If you didn't request a password reset, you can safely ignore this email.
              </p>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <p class="footer-text">
                &copy; 2025 Between Us. Your safe space for mental wellness.
              </p>
              <p class="footer-text">
                <a href="{{ .SiteURL }}" class="footer-link">Visit Website</a>
              </p>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
```

## 3. Magic Link
**Subject:** Sign in to Between Us

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign In</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f3f0ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e1e2e; -webkit-font-smoothing: antialiased; }
    table { border-spacing: 0; width: 100%; }
    td { padding: 0; }
    img { border: 0; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f3f0ff; padding-bottom: 40px; }
    .webkit { max-width: 600px; background-color: #ffffff; margin: 0 auto; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #7c3aed 0%, #c026d3 100%); padding: 48px 20px; text-align: center; }
    .content { padding: 40px 40px 20px 40px; text-align: center; }
    .title { font-size: 28px; font-weight: 800; color: #1e1e2e; margin: 0 0 16px 0; letter-spacing: -0.5px; }
    .text { font-size: 16px; line-height: 1.6; color: #52525b; margin: 0 0 24px 0; }
    .button-container { margin: 32px 0; }
    .button { background-color: #7c3aed; color: #ffffff !important; text-decoration: none; padding: 16px 40px; border-radius: 9999px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3); transition: all 0.2s; }
    .footer { background-color: #f9fafb; padding: 32px 20px; text-align: center; border-top: 1px solid #e4e4e7; }
    .footer-text { font-size: 12px; line-height: 1.5; color: #a1a1aa; margin: 0 0 8px 0; }
    .footer-link { color: #7c3aed; text-decoration: none; font-weight: 600; }
    
    @media screen and (max-width: 600px) {
      .content { padding: 30px 20px; }
      .title { font-size: 24px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table role="presentation">
      <tr>
        <td align="center" style="padding-top: 40px; padding-bottom: 40px;">
          <div class="webkit">
            <!-- Header -->
            <div class="header">
              <img src="https://qoqbdiixztolvtcjdnle.supabase.co/storage/v1/object/sign/betweenus3/betweenus.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lMTYxZDg1My1iMGRlLTRkNjQtYTQxYS0xNTY5MmFmMGJhNWEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJiZXR3ZWVudXMzL2JldHdlZW51cy5wbmciLCJpYXQiOjE3NjQ1MzE5NjMsImV4cCI6MzM0MTMzMTk2M30.Y2YtSYTaspr-sUaFpli7ghszWt8nZjictCRJX2wkbGw" alt="Between Us Logo" width="140" style="display: block; margin: 0 auto; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
            </div>
            
            <!-- Content -->
            <div class="content">
              <h1 class="title">Sign In with Magic Link ✨</h1>
              <p class="text">
                Click the button below to sign in to your Between Us account. This link will expire in 24 hours.
              </p>
              
              <div class="button-container">
                <a href="{{ .ConfirmationURL }}" class="button">Sign In Now</a>
              </div>
              
              <p class="text" style="font-size: 14px; color: #71717a;">
                If you didn't request this login link, you can safely ignore this email.
              </p>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <p class="footer-text">
                &copy; 2025 Between Us. Your safe space for mental wellness.
              </p>
              <p class="footer-text">
                <a href="{{ .SiteURL }}" class="footer-link">Visit Website</a>
              </p>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
```

## 4. Invite User
**Subject:** You've been invited to Between Us

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've Been Invited</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f3f0ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e1e2e; -webkit-font-smoothing: antialiased; }
    table { border-spacing: 0; width: 100%; }
    td { padding: 0; }
    img { border: 0; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f3f0ff; padding-bottom: 40px; }
    .webkit { max-width: 600px; background-color: #ffffff; margin: 0 auto; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #7c3aed 0%, #c026d3 100%); padding: 48px 20px; text-align: center; }
    .content { padding: 40px 40px 20px 40px; text-align: center; }
    .title { font-size: 28px; font-weight: 800; color: #1e1e2e; margin: 0 0 16px 0; letter-spacing: -0.5px; }
    .text { font-size: 16px; line-height: 1.6; color: #52525b; margin: 0 0 24px 0; }
    .button-container { margin: 32px 0; }
    .button { background-color: #7c3aed; color: #ffffff !important; text-decoration: none; padding: 16px 40px; border-radius: 9999px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3); transition: all 0.2s; }
    .footer { background-color: #f9fafb; padding: 32px 20px; text-align: center; border-top: 1px solid #e4e4e7; }
    .footer-text { font-size: 12px; line-height: 1.5; color: #a1a1aa; margin: 0 0 8px 0; }
    .footer-link { color: #7c3aed; text-decoration: none; font-weight: 600; }
    
    @media screen and (max-width: 600px) {
      .content { padding: 30px 20px; }
      .title { font-size: 24px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table role="presentation">
      <tr>
        <td align="center" style="padding-top: 40px; padding-bottom: 40px;">
          <div class="webkit">
            <!-- Header -->
            <div class="header">
              <img src="https://qoqbdiixztolvtcjdnle.supabase.co/storage/v1/object/sign/betweenus3/betweenus.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lMTYxZDg1My1iMGRlLTRkNjQtYTQxYS0xNTY5MmFmMGJhNWEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJiZXR3ZWVudXMzL2JldHdlZW51cy5wbmciLCJpYXQiOjE3NjQ1MzE5NjMsImV4cCI6MzM0MTMzMTk2M30.Y2YtSYTaspr-sUaFpli7ghszWt8nZjictCRJX2wkbGw" alt="Between Us Logo" width="140" style="display: block; margin: 0 auto; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
            </div>
            
            <!-- Content -->
            <div class="content">
              <h1 class="title">You've Been Invited! 💌</h1>
              <p class="text">
                Someone has invited you to join <strong>Between Us</strong>. Come join our community and find your safe space for mental wellness.
              </p>
              
              <div class="button-container">
                <a href="{{ .ConfirmationURL }}" class="button">Accept Invitation</a>
              </div>
              
              <p class="text" style="font-size: 14px; color: #71717a;">
                If you don't want to join, you can safely ignore this email.
              </p>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <p class="footer-text">
                &copy; 2025 Between Us. Your safe space for mental wellness.
              </p>
              <p class="footer-text">
                <a href="{{ .SiteURL }}" class="footer-link">Visit Website</a>
              </p>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
```

## 5. Change Email Address
**Subject:** Confirm Email Change

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Email Change</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f3f0ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e1e2e; -webkit-font-smoothing: antialiased; }
    table { border-spacing: 0; width: 100%; }
    td { padding: 0; }
    img { border: 0; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f3f0ff; padding-bottom: 40px; }
    .webkit { max-width: 600px; background-color: #ffffff; margin: 0 auto; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #7c3aed 0%, #c026d3 100%); padding: 48px 20px; text-align: center; }
    .content { padding: 40px 40px 20px 40px; text-align: center; }
    .title { font-size: 28px; font-weight: 800; color: #1e1e2e; margin: 0 0 16px 0; letter-spacing: -0.5px; }
    .text { font-size: 16px; line-height: 1.6; color: #52525b; margin: 0 0 24px 0; }
    .button-container { margin: 32px 0; }
    .button { background-color: #7c3aed; color: #ffffff !important; text-decoration: none; padding: 16px 40px; border-radius: 9999px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3); transition: all 0.2s; }
    .footer { background-color: #f9fafb; padding: 32px 20px; text-align: center; border-top: 1px solid #e4e4e7; }
    .footer-text { font-size: 12px; line-height: 1.5; color: #a1a1aa; margin: 0 0 8px 0; }
    .footer-link { color: #7c3aed; text-decoration: none; font-weight: 600; }
    
    @media screen and (max-width: 600px) {
      .content { padding: 30px 20px; }
      .title { font-size: 24px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table role="presentation">
      <tr>
        <td align="center" style="padding-top: 40px; padding-bottom: 40px;">
          <div class="webkit">
            <!-- Header -->
            <div class="header">
              <img src="https://qoqbdiixztolvtcjdnle.supabase.co/storage/v1/object/sign/betweenus3/betweenus.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lMTYxZDg1My1iMGRlLTRkNjQtYTQxYS0xNTY5MmFmMGJhNWEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJiZXR3ZWVudXMzL2JldHdlZW51cy5wbmciLCJpYXQiOjE3NjQ1MzE5NjMsImV4cCI6MzM0MTMzMTk2M30.Y2YtSYTaspr-sUaFpli7ghszWt8nZjictCRJX2wkbGw" alt="Between Us Logo" width="140" style="display: block; margin: 0 auto; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
            </div>
            
            <!-- Content -->
            <div class="content">
              <h1 class="title">Confirm Email Change 📧</h1>
              <p class="text">
                We received a request to change the email address for your Between Us account. Click the button below to confirm this change.
              </p>
              
              <div class="button-container">
                <a href="{{ .ConfirmationURL }}" class="button">Confirm Change</a>
              </div>
              
              <p class="text" style="font-size: 14px; color: #71717a;">
                If you didn't request this change, please contact support immediately.
              </p>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <p class="footer-text">
                &copy; 2025 Between Us. Your safe space for mental wellness.
              </p>
              <p class="footer-text">
                <a href="{{ .SiteURL }}" class="footer-link">Visit Website</a>
              </p>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
```
