/**
 * Email Templates for Between Us
 * Beautiful HTML email templates for user communications
 */

interface WelcomeEmailParams {
  userName: string;
  userEmail: string;
  confirmationLink?: string;
}

export function getWelcomeEmailHTML({ userName, userEmail, confirmationLink }: WelcomeEmailParams): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Between Us</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-font-smoothing: antialiased;
    }
    
    .email-wrapper {
      width: 100%;
      padding: 40px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
      animation: pulse 15s ease-in-out infinite;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }
    
    .logo {
      font-size: 48px;
      font-weight: 700;
      color: white;
      margin: 0;
      position: relative;
      z-index: 1;
      text-shadow: 0 2px 20px rgba(0, 0, 0, 0.2);
      letter-spacing: -1px;
    }
    
    .tagline {
      color: rgba(255, 255, 255, 0.95);
      font-size: 16px;
      margin-top: 12px;
      position: relative;
      z-index: 1;
      font-weight: 500;
    }
    
    .content {
      padding: 50px 40px;
      background: white;
    }
    
    h1 {
      font-size: 32px;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0 0 20px 0;
      line-height: 1.3;
    }
    
    .greeting {
      font-size: 18px;
      color: #4a5568;
      margin-bottom: 30px;
      line-height: 1.6;
    }
    
    .welcome-text {
      font-size: 16px;
      color: #4a5568;
      line-height: 1.8;
      margin-bottom: 30px;
    }
    
    .features-box {
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
      border-radius: 16px;
      padding: 30px;
      margin: 30px 0;
      border-left: 4px solid #667eea;
    }
    
    .feature {
      margin-bottom: 20px;
      display: flex;
      align-items: start;
    }
    
    .feature:last-child {
      margin-bottom: 0;
    }
    
    .feature-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      flex-shrink: 0;
      font-size: 20px;
    }
    
    .feature-content h3 {
      margin: 0 0 6px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
    }
    
    .feature-content p {
      margin: 0;
      font-size: 14px;
      color: #718096;
      line-height: 1.5;
    }
    
    .cta-button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      margin: 30px 0;
      transition: transform 0.2s;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
    }
    
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 30px rgba(102, 126, 234, 0.5);
    }
    
    .privacy-note {
      background: linear-gradient(135deg, #fef5e7 0%, #fef9ed 100%);
      border-radius: 12px;
      padding: 20px;
      margin: 30px 0;
      border-left: 4px solid #f59e0b;
    }
    
    .privacy-note p {
      margin: 0;
      font-size: 14px;
      color: #92400e;
      line-height: 1.6;
    }
    
    .privacy-icon {
      display: inline-block;
      margin-right: 8px;
      font-size: 18px;
    }
    
    .footer {
      padding: 30px 40px;
      background: #f7fafc;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer p {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #718096;
      line-height: 1.6;
    }
    
    .social-links {
      margin-top: 20px;
    }
    
    .social-links a {
      display: inline-block;
      margin: 0 8px;
      color: #667eea;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
    }
    
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, #e2e8f0 50%, transparent 100%);
      margin: 30px 0;
    }
    
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 20px 10px;
      }
      
      .content {
        padding: 30px 20px;
      }
      
      .footer {
        padding: 20px;
      }
      
      h1 {
        font-size: 24px;
      }
      
      .feature {
        flex-direction: column;
        align-items: start;
      }
      
      .feature-icon {
        margin-bottom: 12px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <!-- Header -->
      <div class="header">
        <h1 class="logo">Between Us</h1>
        <p class="tagline">Anonymous Mental Wellness & Support</p>
      </div>
      
      <!-- Main Content -->
      <div class="content">
        <h1>✨ Welcome to Between Us, ${userName}!</h1>
        
        <p class="greeting">
          We're so glad you're here. You've just taken an important step towards better mental wellness and meaningful connection.
        </p>
        
        <p class="welcome-text">
          Between Us is a safe, anonymous space where you can share your thoughts, connect with others who understand, and find support when you need it most. You're now part of a caring community that's here for you, always.
        </p>
        
        <!-- Features -->
        <div class="features-box">
          <div class="feature">
            <div class="feature-icon">💭</div>
            <div class="feature-content">
              <h3>Share Anonymously</h3>
              <p>Express yourself freely without judgment. Your privacy is our priority.</p>
            </div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">🌟</div>
            <div class="feature-content">
              <h3>Daily Check-Ins</h3>
              <p>Track your moods and emotions with our interactive daily check-in system.</p>
            </div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">🤝</div>
            <div class="feature-content">
              <h3>Community Support</h3>
              <p>Connect with others, offer support, and receive encouragement when you need it.</p>
            </div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">🌍</div>
            <div class="feature-content">
              <h3>6 Languages</h3>
              <p>Express yourself in your preferred language - English, Spanish, Mandarin, Hindi, German, or French.</p>
            </div>
          </div>
        </div>
        
        ${confirmationLink ? `
        <div style="text-align: center;">
          <a href="${confirmationLink}" class="cta-button">
            Confirm Your Email
          </a>
        </div>
        ` : ''}
        
        <!-- Privacy Note -->
        <div class="privacy-note">
          <p>
            <span class="privacy-icon">🔒</span>
            <strong>Your privacy matters:</strong> Between Us is completely anonymous. Your personal information is never shared publicly, and you have full control over what you share.
          </p>
        </div>
        
        <div class="divider"></div>
        
        <p class="welcome-text">
          <strong>Getting started is easy:</strong>
        </p>
        <p class="welcome-text">
          1. Complete your daily check-in to track how you're feeling<br>
          2. Explore the community and read stories from others<br>
          3. Share your thoughts when you're ready<br>
          4. Offer support and kindness to fellow community members
        </p>
        
        <p class="welcome-text">
          Remember, you're never alone. We're here to support you on your journey to better mental wellness.
        </p>
        
        <p class="welcome-text" style="margin-top: 40px;">
          With care and support,<br>
          <strong>The Between Us Team</strong> 💜
        </p>
      </div>
      
      <!-- Footer -->
      <div class="footer">
        <p>
          <strong>Between Us</strong><br>
          Your anonymous mental wellness companion
        </p>
        <p style="margin-top: 20px; font-size: 12px; color: #a0aec0;">
          You received this email because you created an account at Between Us.<br>
          If you didn't create this account, please disregard this email.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function getWelcomeEmailText({ userName, userEmail, confirmationLink }: WelcomeEmailParams): string {
  return `
Welcome to Between Us, ${userName}!

We're so glad you're here. You've just taken an important step towards better mental wellness and meaningful connection.

Between Us is a safe, anonymous space where you can share your thoughts, connect with others who understand, and find support when you need it most.

KEY FEATURES:
✨ Share Anonymously - Express yourself freely without judgment
🌟 Daily Check-Ins - Track your moods and emotions
🤝 Community Support - Connect with others who understand
🌍 6 Languages - English, Spanish, Mandarin, Hindi, German, French

${confirmationLink ? `\nCONFIRM YOUR EMAIL:\n${confirmationLink}\n` : ''}

YOUR PRIVACY MATTERS:
Between Us is completely anonymous. Your personal information is never shared publicly, and you have full control over what you share.

GETTING STARTED:
1. Complete your daily check-in to track how you're feeling
2. Explore the community and read stories from others
3. Share your thoughts when you're ready
4. Offer support and kindness to fellow community members

Remember, you're never alone. We're here to support you on your journey to better mental wellness.

With care and support,
The Between Us Team 💜

---
Between Us - Your anonymous mental wellness companion
You received this email because you created an account at Between Us.
If you didn't create this account, please disregard this email.
  `.trim();
}
