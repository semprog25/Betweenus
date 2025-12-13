# Monetization & Premium Features Implementation

## Overview
Between Us now includes a comprehensive monetization system with tiered subscriptions, credit-based editing, and post limits for free users.

## Features Implemented

### 1. Subscription Tiers

#### Free Tier
- 3 posts per month
- Cannot edit posts
- Anonymous sharing
- Community support
- Daily check-ins
- Mood tracking

#### Premium Tier ($4.99/month)
- 10 posts per month
- 10 edit credits included
- Can edit posts using credits
- Priority support
- Premium badge
- All free features

#### Pro Tier ($9.99/month)
- Unlimited posts
- Unlimited edits
- Priority support
- Pro badge
- Early access to new features
- All premium features

### 2. Credit System
- Users can purchase edit credits separately
- Credit packs available:
  - 5 credits for $1.99
  - 15 credits + 3 bonus for $4.99 (Best Value)
  - 50 credits + 15 bonus for $12.99
- Each post edit costs 1 credit (except Pro tier which has unlimited)

### 3. Post Limits
- Free users: 3 posts/month
- Premium users: 10 posts/month  
- Pro users: Unlimited posts
- Monthly counter resets every 30 days
- Users see their remaining posts in the Share tab

### 4. Post Management

#### Delete Posts
- Users can delete their own posts
- Backend verifies ownership before deletion
- Deletes from both main storage and user-specific storage

#### Edit Posts (Premium Feature)
- Requires credits or Pro subscription
- Saves edit history
- Shows "edited" indicator on posts
- Deducts 1 credit per edit (unless Pro tier)

## Backend Endpoints Added

### Subscription Management
- `GET /subscription?userId={userId}` - Get user's subscription status
- `POST /subscription/upgrade` - Upgrade to premium/pro
- `POST /subscription/buy-credits` - Purchase edit credits

### Post Limits
- `GET /subscription/can-post?userId={userId}` - Check if user can post
- `POST /subscription/increment-post` - Increment monthly post count

### Post Operations
- `DELETE /posts/:postId?userId={userId}` - Delete post (with ownership verification)
- `POST /posts/:postId/edit` - Edit post (requires credits)

## Components Added

### SubscriptionModal.tsx
- Displays subscription tiers with pricing
- Shows credit purchase options
- Handles upgrades and credit purchases
- Responsive design with tabs
- Shows current plan and credits

## Components Updated

### ShareTab.tsx
- Shows subscription tier badge (Premium/Pro)
- Displays post limit counter
- Checks post limits before allowing posts
- Prompts upgrade when limit reached
- Opens subscription modal

### ProfileTab.tsx
- Fixed duplicate stats declaration
- Added clickable stats with detail views
- Shows user's shared secrets, replies, and upvotes
- Stats load from backend

## Integration Notes

### Payment Processing (Production)
In a production environment, you would integrate with:
- **Stripe** for credit card processing
- **PayPal** for alternative payments
- **Apple Pay / Google Pay** for mobile payments

Current implementation directly applies upgrades for demo purposes.

### Demo Mode
The subscription modal shows a notice that payments are in demo mode.
In production:
1. Replace upgrade/purchase calls with payment provider integration
2. Only apply subscription after successful payment
3. Handle payment failures and retries
4. Add webhook handlers for subscription events

## User Flow Examples

### Upgrading to Premium
1. User clicks "Upgrade" button in Share tab or Profile
2. Subscription modal opens
3. User selects Premium tier
4. (Production: Payment processed)
5. Subscription applied immediately
6. User receives 10 edit credits
7. Monthly post limit increases to 10

### Editing a Post
1. User creates a post
2. Later wants to edit it
3. Clicks edit button on their post
4. System checks if user has credits or Pro tier
5. If yes: Edit allowed, credit deducted
6. If no: Prompt to purchase credits or upgrade

### Hitting Post Limit
1. Free user creates 3 posts this month
2. Tries to create 4th post
3. Toast notification shows limit reached
4. "Upgrade" action button in toast
5. Clicking opens subscription modal
6. User can upgrade to post more

## Database Structure

Subscription data stored as:
```json
{
  "tier": "free|premium|pro",
  "credits": 0,
  "postsThisMonth": 0,
  "monthlyPostLimit": 3,
  "lastResetDate": "2025-01-01T00:00:00Z",
  "expiresAt": "2025-02-01T00:00:00Z",
  "features": {
    "canEditPosts": false,
    "unlimitedPosts": false,
    "prioritySupport": false
  }
}
```

## Future Enhancements

1. **Subscription Management**
   - Cancel subscription
   - Pause subscription
   - Billing history

2. **Additional Premium Features**
   - Custom themes
   - Advanced analytics
   - Export data
   - Ad-free experience

3. **Gifting**
   - Gift subscriptions to others
   - Gift credit packs

4. **Promotions**
   - Referral bonuses
   - Seasonal discounts
   - Trial periods

## Testing

To test the monetization features:

1. **Sign in** with a test account
2. Try posting more than 3 times (will hit limit)
3. Click "Upgrade" and select Premium
4. Verify you can now post up to 10 times
5. Try editing a post (uses 1 credit)
6. Purchase additional credits
7. Upgrade to Pro for unlimited access

## Notes

- All monetary amounts are in USD
- Subscription data persists in Supabase KV store
- Monthly counters reset automatically after 30 days
- Credits never expire
- Upgrades are immediate (no pro-rating in demo)
