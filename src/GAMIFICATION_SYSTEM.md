# Gamification & Points System

## Overview
Between Us now includes a comprehensive gamification system with points, rewards, and flexible subscription options to increase user engagement and monetization.

## 🎮 Points System

### How Users Earn Points

#### Activity-Based Earning
- **Share Posts**: Earn points every time you share your thoughts
  - Free tier: 10 points per post (1x multiplier)
  - Premium tier: 20 points per post (2x multiplier)
  - Pro tier: 30 points per post (3x multiplier)

- **Give Support**: Earn points for helping others
  - Free tier: 5 points per reply (1x multiplier)
  - Premium tier: 10 points per reply (2x multiplier)
  - Pro tier: 15 points per reply (3x multiplier)

- **Daily Check-ins**: Consistency rewards
  - 25 points per day for completing your mental wellness check-in
  - Streak bonuses coming soon!

#### Subscription Bonuses
- **Premium**: +100 bonus points on signup
- **Pro**: +500 bonus points on signup

#### Purchase Bonuses
When purchasing edit credit packs:
- 5 credits: +25 points
- 15 credits: +75 points
- 50 credits: +250 points

### Point Multipliers by Tier

| Tier | Post Points | Reply Points | Daily Check-in |
|------|-------------|--------------|----------------|
| Free | 10 (1x) | 5 (1x) | 25 |
| Premium | 20 (2x) | 10 (2x) | 25 |
| Pro | 30 (3x) | 15 (3x) | 25 |

## 🏆 Rewards System

### Redeemable Rewards

Users can spend their earned points on exclusive rewards:

| Points Required | Reward | Description |
|----------------|--------|-------------|
| 100 | 1 Free Edit Credit | Edit one of your posts |
| 500 | Premium Badge (7 Days) | Try premium features |
| 1,000 | 5 Free Edit Credits | Edit multiple posts |
| 2,500 | Custom Profile Theme | Personalize your profile |
| 5,000 | 1 Month Premium | Full premium access |
| 10,000 | 3 Months Pro | Extended pro access |

### Coming Soon
- **Leaderboard**: Monthly rankings with exclusive badges
- **Streak Bonuses**: Extra points for consecutive check-ins
- **Achievement Badges**: Unlock special badges for milestones
- **Seasonal Events**: Limited-time point multipliers

## 💎 Subscription Tiers

### Free Tier - $0
**Features:**
- 3 posts per month
- Anonymous sharing
- Community support
- Daily check-ins
- Mood tracking
- Earn 10 points per post
- Earn 5 points per reply

**Limitations:**
- Cannot edit posts
- Limited posts
- 1x point multiplier

---

### Premium Tier
**Flexible Pricing:**
- **Daily**: $0.99/day - Try premium for a day
- **Weekly**: $4.99/week - Short-term commitment
- **Monthly**: $9.99/month - Best for regular use
- **Yearly**: $79.99/year - **Save 33%!**

**Features:**
- 10 posts per month
- 10 edit credits included monthly
- Can edit your posts
- Priority support
- Premium badge
- Earn 20 points per post (2x multiplier)
- Earn 10 points per reply (2x multiplier)
- +100 bonus points on signup
- All free features

**Perfect For:** Regular users who want more flexibility and editing capabilities

---

### Pro Tier
**Flexible Pricing:**
- **Daily**: $1.99/day - Experience pro features
- **Weekly**: $9.99/week - Try before committing
- **Monthly**: $19.99/month - Full access
- **Yearly**: $149.99/year - **Save 38%!**
- **Lifetime**: $299.99 one-time - **Save 50%! Best Value**

**Features:**
- **Unlimited posts** - Share without limits
- **Unlimited edits** - Perfect your posts anytime
- Priority support
- Pro badge
- Early access to new features
- Exclusive community access
- Earn 30 points per post (3x multiplier)
- Earn 15 points per reply (3x multiplier)
- +500 bonus points on signup
- All premium features

**Perfect For:** Power users and mental wellness advocates who want unlimited access

---

## 🎯 Credit Packs (One-Time Purchase)

For users who don't want a subscription but need edit credits:

### Small Pack - $1.99
- 5 edit credits
- +25 bonus points
- Good for occasional edits

### Value Pack - $4.99 ⭐ Most Popular
- 15 edit credits
- +3 bonus credits (18 total)
- +75 bonus points
- Best value for money

### Large Pack - $12.99
- 50 edit credits
- +15 bonus credits (65 total)
- +250 bonus points
- Best for heavy editors

## 🎨 User Interface

### Profile Tab Enhancements

**New Subscription & Points Card:**
- Displays current tier with badge
- Shows points balance with animated star icon
- Shows edit credits remaining
- Shows post usage (e.g., 2/10 posts this month)
- Prominent "Upgrade & Earn Rewards" button
- Beautiful gradient background with animations

### Subscription Modal

**Three Tabs:**
1. **Subscriptions Tab**
   - All three tiers displayed side-by-side
   - Period selector buttons for flexible pricing
   - Shows savings badges (33%, 38%, 50%)
   - "Most Popular" badge on Premium
   - "Best Value" badge on Lifetime
   - Bonus points clearly displayed
   - Scrollable feature lists

2. **Buy Credits Tab**
   - Three credit pack options
   - Shows bonus credits and points
   - "Best Value" badge on middle option
   - Clear pricing and immediate purchase

3. **Points & Rewards Tab**
   - **How Points Work** section with:
     - Activity-based earning explanation
     - Point multiplier information
     - Visual cards showing earning rates
   - **Available Rewards** section with:
     - All redeemable rewards
     - Point costs clearly displayed
     - "Ready!" badge when enough points
     - Lock state for unavailable rewards
   - **Leaderboard Teaser** for future feature

## 💰 Monetization Strategy

### Conversion Funnel

1. **Free User Experience**
   - Users start with free tier
   - Hit post limit after 3 posts
   - See premium features teased
   - Earn points slowly (1x multiplier)

2. **Premium Conversion**
   - Flexible pricing options (daily/weekly/monthly/yearly)
   - Low barrier to entry with daily option
   - 2x points encourage engagement
   - Edit credits provide immediate value

3. **Pro Conversion**
   - Power users see value in unlimited access
   - Lifetime option for committed users
   - 3x points maximize engagement
   - Exclusive features justify premium price

4. **Credit Pack Sales**
   - Non-subscribers can still edit
   - Impulse purchases for quick needs
   - Bonus incentives encourage larger packs
   - Points earned add extra value

### Revenue Streams

1. **Subscription Revenue** (Primary)
   - Recurring monthly/yearly revenue
   - Daily/weekly options for testing
   - Lifetime purchases for upfront cash

2. **Credit Pack Sales** (Secondary)
   - One-time purchases
   - Supplements subscription revenue
   - Appeals to casual users

3. **Future Opportunities**
   - Premium themes
   - Custom badges
   - Gift subscriptions
   - Promotional partnerships

## 🔧 Technical Implementation

### Database Structure

**Subscription Data:**
```json
{
  "tier": "free|premium|pro",
  "period": "day|week|month|year|lifetime",
  "credits": 10,
  "points": 350,
  "postsThisMonth": 2,
  "monthlyPostLimit": 10,
  "lastResetDate": "2025-10-28T00:00:00Z",
  "expiresAt": "2025-11-28T00:00:00Z",
  "features": {
    "canEditPosts": true,
    "unlimitedPosts": false,
    "prioritySupport": true,
    "pointMultiplier": 2
  }
}
```

**Points Transactions:**
```json
{
  "userId": "user_123",
  "action": "post_created",
  "pointsEarned": 20,
  "pointsBalance": 370,
  "timestamp": "2025-10-28T10:30:00Z",
  "metadata": {
    "postId": "post_456",
    "tier": "premium",
    "multiplier": 2
  }
}
```

### API Endpoints

#### Points System
- `GET /points/balance?userId={userId}` - Get user's point balance
- `POST /points/earn` - Award points for activity
- `POST /points/redeem` - Redeem points for reward
- `GET /points/history?userId={userId}` - Get points transaction history

#### Rewards
- `GET /rewards/available?userId={userId}` - Get available rewards
- `POST /rewards/claim` - Claim a reward with points

#### Subscription (Updated)
- `POST /subscription/upgrade` - Now includes period parameter
- `GET /subscription?userId={userId}` - Includes points and period

### Frontend Components

**Updated:**
- `ProfileTab.tsx` - Added subscription/points card
- `SubscriptionModal.tsx` - Complete redesign with 3 tabs, flexible pricing, and rewards

**Backend:**
- Points tracking system (needs implementation)
- Reward redemption logic (needs implementation)
- Period-based subscription handling (needs implementation)

## 📱 Mobile Considerations

### Revenue Cat Integration
For mobile (iOS/Android), integrate with RevenueCat:
- Handles App Store/Play Store subscriptions
- Manages subscription states
- Provides webhook notifications
- Handles refunds and cancellations

### Platform-Specific Features
- **iOS**: In-App Purchase (IAP)
- **Android**: Google Play Billing
- **Web**: Stripe/PayPal

## 🎯 Success Metrics

### Engagement Metrics
- Daily Active Users (DAU)
- Average points earned per user
- Post creation rate
- Reply rate
- Check-in completion rate

### Monetization Metrics
- Free to Premium conversion rate
- Premium to Pro conversion rate
- Average Revenue Per User (ARPU)
- Lifetime Value (LTV)
- Churn rate by tier

### Gamification Metrics
- Points earned per user per day
- Rewards redeemed
- Point multiplier impact on engagement
- Subscription period preference (daily vs weekly vs monthly)

## 🚀 Launch Strategy

### Phase 1: Soft Launch
1. Enable points system for existing users
2. Award retroactive points for past activity
3. Show rewards but mark as "beta"
4. Gather feedback

### Phase 2: Full Launch
1. Official announcement
2. Promotional bonus points for early adopters
3. Launch leaderboard
4. Social sharing of achievements

### Phase 3: Optimization
1. A/B test pricing
2. Analyze conversion funnels
3. Optimize reward costs
4. Add seasonal events

## 🎁 Promotional Ideas

### Launch Promotions
- **Double Points Week**: 2x points for all activities
- **First Purchase Bonus**: Extra credits on first purchase
- **Referral Program**: Earn points for inviting friends

### Seasonal Events
- **Mental Health Awareness Month**: Special badges and 3x points
- **Holiday Season**: Limited edition themes
- **New Year**: Free premium trial for 7 days

### Retention Strategies
- **Win-back Offers**: Special prices for churned users
- **Loyalty Rewards**: Extra points for long-term subscribers
- **Milestone Bonuses**: Points for account anniversaries

## 📊 Analytics & Tracking

### Key Events to Track
- `subscription_started` (tier, period, price)
- `subscription_cancelled` (tier, reason)
- `credits_purchased` (pack_size, price)
- `points_earned` (activity_type, amount)
- `reward_claimed` (reward_type, points_spent)
- `post_created` (tier, points_earned)
- `reply_given` (tier, points_earned)
- `check_in_completed` (streak_days, points_earned)

### Dashboards to Build
- Revenue dashboard (MRR, ARR, growth)
- Engagement dashboard (DAU, posts, replies)
- Gamification dashboard (points, rewards, leaderboard)
- Conversion funnel (free → premium → pro)

## 🔒 Security Considerations

### Points Fraud Prevention
- Server-side validation of all point awards
- Rate limiting on point-earning actions
- Audit log of all point transactions
- Ban system for abuse

### Payment Security
- Use established payment processors (Stripe, PayPal, RevenueCat)
- PCI compliance for card handling
- Webhook signature verification
- Retry logic for failed payments

## 📝 User Communication

### In-App Messaging
- **Welcome Message**: Explain points system to new users
- **First Point Earned**: Celebrate and explain rewards
- **Reward Available**: Notify when enough points for reward
- **Upgrade Prompts**: Strategic prompts when hitting limits

### Email Campaigns
- Welcome series explaining features
- Upgrade reminders for free users
- Re-engagement for inactive users
- Reward milestones notifications

## 🎉 Conclusion

The gamification system transforms Between Us from a simple mental wellness app into an engaging, rewarding experience that encourages consistent use while providing multiple monetization opportunities. The flexible subscription periods cater to different user preferences, while the points system keeps users engaged long-term.

**Key Benefits:**
✅ Increased user engagement through points and rewards
✅ Multiple monetization tiers with flexible pricing
✅ Low-barrier entry with daily/weekly options
✅ High-value lifetime option for committed users
✅ Credit packs for non-subscribers
✅ Clear upgrade path from free to pro
✅ Gamification elements that enhance the core wellness experience

**Next Steps:**
1. Implement backend points tracking system
2. Add reward redemption functionality
3. Create leaderboard feature
4. Integrate payment processors
5. Set up analytics tracking
6. Launch beta testing program
