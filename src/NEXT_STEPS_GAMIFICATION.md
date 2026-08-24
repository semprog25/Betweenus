# Next Steps: Implementing Gamification Backend

## 🎯 What's Already Done (Frontend)

✅ **SubscriptionModal.tsx** - Completely redesigned with:
- Three tabs (Subscriptions, Credits, Points & Rewards)
- Flexible pricing (daily/weekly/monthly/yearly/lifetime)
- Points system explanation
- Rewards catalog with 6 tiers
- Beautiful animations and UI

✅ **ProfileTab.tsx** - Enhanced with:
- New subscription & points card
- Displays points balance, credits, and post usage
- Prominent "Upgrade & Earn Rewards" button
- Animated star icon

✅ **Documentation** - Complete guides:
- GAMIFICATION_SYSTEM.md (full system overview)
- GAMIFICATION_IMPLEMENTATION_SUMMARY.md (what's implemented)

## 🚀 What You Need To Do Next

### Phase 1: Backend - Points System (Priority 1)

#### 1.1 Update Database Schema
Add to the subscription data in KV store:

```typescript
// In /supabase/functions/server/index.tsx
interface UserSubscription {
  userId: string;
  tier: 'free' | 'premium' | 'pro';
  period: 'day' | 'week' | 'month' | 'year' | 'lifetime'; // NEW
  credits: number;
  points: number; // NEW
  postsThisMonth: number;
  monthlyPostLimit: number;
  lastResetDate: string;
  expiresAt: string;
  pointMultiplier: number; // NEW: 1 for free, 2 for premium, 3 for pro
  features: {
    canEditPosts: boolean;
    unlimitedPosts: boolean;
    prioritySupport: boolean;
  };
}
```

#### 1.2 Create Points Tracking Functions

Add to `/supabase/functions/server/index.tsx`:

```typescript
// Award points for user activity
app.post('/make-server-6c9b0e48/points/earn', async (c) => {
  const { userId, action, metadata } = await c.req.json();
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  
  // Verify user
  const { data: { user } } = await supabase.auth.getUser(accessToken);
  if (!user || user.id !== userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  // Get user subscription for point multiplier
  const subscription = await kv.get(`subscription:${userId}`);
  const multiplier = subscription?.pointMultiplier || 1;
  
  // Calculate points based on action
  let basePoints = 0;
  switch (action) {
    case 'post_created':
      basePoints = 10;
      break;
    case 'reply_given':
      basePoints = 5;
      break;
    case 'check_in_completed':
      basePoints = 25;
      break;
    default:
      return c.json({ error: 'Invalid action' }, 400);
  }
  
  const pointsEarned = basePoints * multiplier;
  
  // Update user's point balance
  subscription.points = (subscription.points || 0) + pointsEarned;
  await kv.set(`subscription:${userId}`, subscription);
  
  // Store transaction history
  const transaction = {
    userId,
    action,
    pointsEarned,
    pointsBalance: subscription.points,
    timestamp: new Date().toISOString(),
    metadata
  };
  
  const history = await kv.get(`points-history:${userId}`) || [];
  history.unshift(transaction);
  // Keep last 100 transactions
  if (history.length > 100) history.pop();
  await kv.set(`points-history:${userId}`, history);
  
  return c.json({ 
    success: true, 
    pointsEarned, 
    pointsBalance: subscription.points,
    multiplier 
  });
});

// Get points balance
app.get('/make-server-6c9b0e48/points/balance', async (c) => {
  const userId = c.req.query('userId');
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  
  const { data: { user } } = await supabase.auth.getUser(accessToken);
  if (!user || user.id !== userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const subscription = await kv.get(`subscription:${userId}`);
  return c.json({ 
    points: subscription?.points || 0,
    multiplier: subscription?.pointMultiplier || 1
  });
});

// Get points history
app.get('/make-server-6c9b0e48/points/history', async (c) => {
  const userId = c.req.query('userId');
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  
  const { data: { user } } = await supabase.auth.getUser(accessToken);
  if (!user || user.id !== userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const history = await kv.get(`points-history:${userId}`) || [];
  return c.json({ history });
});
```

#### 1.3 Update Frontend to Award Points

In `/components/ShareTab.tsx`, after successful post creation:

```typescript
// After successful post
if (session?.user?.id) {
  try {
    await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6c9b0e48/points/earn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`
      },
      body: JSON.stringify({
        userId: session.user.id,
        action: 'post_created',
        metadata: { postId: response.postId }
      })
    });
  } catch (error) {
    console.error('Failed to award points:', error);
  }
}
```

In `/components/ListenTab.tsx`, after successful reply:

```typescript
// After successful reply
if (session?.user?.id) {
  try {
    await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6c9b0e48/points/earn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`
      },
      body: JSON.stringify({
        userId: session.user.id,
        action: 'reply_given',
        metadata: { postId: currentPost.id }
      })
    });
  } catch (error) {
    console.error('Failed to award points:', error);
  }
}
```

In `/components/CheckInTab.tsx`, after check-in:

```typescript
// After successful check-in
if (session?.user?.id) {
  try {
    await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6c9b0e48/points/earn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`
      },
      body: JSON.stringify({
        userId: session.user.id,
        action: 'check_in_completed',
        metadata: { mood, date: selectedDate }
      })
    });
  } catch (error) {
    console.error('Failed to award points:', error);
  }
}
```

### Phase 2: Backend - Reward Redemption (Priority 2)

#### 2.1 Create Reward Redemption Endpoint

Add to `/supabase/functions/server/index.tsx`:

```typescript
// Rewards catalog
const REWARDS = [
  { id: 'credit_1', points: 100, type: 'credits', value: 1 },
  { id: 'premium_trial', points: 500, type: 'tier_upgrade', value: { tier: 'premium', days: 7 } },
  { id: 'credits_5', points: 1000, type: 'credits', value: 5 },
  { id: 'custom_theme', points: 2500, type: 'feature', value: 'custom_theme' },
  { id: 'premium_month', points: 5000, type: 'tier_upgrade', value: { tier: 'premium', days: 30 } },
  { id: 'pro_months', points: 10000, type: 'tier_upgrade', value: { tier: 'pro', days: 90 } },
];

app.post('/make-server-6c9b0e48/rewards/claim', async (c) => {
  const { userId, rewardId } = await c.req.json();
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  
  // Verify user
  const { data: { user } } = await supabase.auth.getUser(accessToken);
  if (!user || user.id !== userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  // Get reward
  const reward = REWARDS.find(r => r.id === rewardId);
  if (!reward) {
    return c.json({ error: 'Reward not found' }, 404);
  }
  
  // Get user subscription
  const subscription = await kv.get(`subscription:${userId}`);
  
  // Check if user has enough points
  if ((subscription.points || 0) < reward.points) {
    return c.json({ error: 'Insufficient points' }, 400);
  }
  
  // Deduct points
  subscription.points -= reward.points;
  
  // Apply reward
  switch (reward.type) {
    case 'credits':
      subscription.credits = (subscription.credits || 0) + reward.value;
      break;
      
    case 'tier_upgrade':
      // If user is free tier, upgrade them temporarily
      if (subscription.tier === 'free') {
        subscription.tier = reward.value.tier;
        subscription.pointMultiplier = reward.value.tier === 'premium' ? 2 : 3;
        
        // Set expiry
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + reward.value.days);
        subscription.tempUpgradeExpiry = expiry.toISOString();
      }
      break;
      
    case 'feature':
      if (!subscription.unlockedFeatures) {
        subscription.unlockedFeatures = [];
      }
      subscription.unlockedFeatures.push(reward.value);
      break;
  }
  
  await kv.set(`subscription:${userId}`, subscription);
  
  // Log redemption
  const redemption = {
    userId,
    rewardId,
    pointsSpent: reward.points,
    timestamp: new Date().toISOString()
  };
  
  const history = await kv.get(`redemptions:${userId}`) || [];
  history.unshift(redemption);
  await kv.set(`redemptions:${userId}`, history);
  
  return c.json({ 
    success: true, 
    pointsRemaining: subscription.points,
    reward 
  });
});
```

#### 2.2 Update Frontend to Fetch Points Balance

In `/components/ProfileTab.tsx`:

```typescript
const [pointsBalance, setPointsBalance] = useState(0);

useEffect(() => {
  const loadPointsBalance = async () => {
    const session = getSession();
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6c9b0e48/points/balance?userId=${session.user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`
          }
        }
      );
      
      const data = await response.json();
      setPointsBalance(data.points || 0);
    } catch (error) {
      console.error('Failed to load points:', error);
    }
  };
  
  loadPointsBalance();
}, [userSession]);
```

Then update the card to show real points:

```typescript
<p className="text-2xl font-bold flex items-center gap-1">
  <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
  {pointsBalance}
</p>
```

### Phase 3: Frontend - Connect Reward Redemption (Priority 3)

In `/components/SubscriptionModal.tsx`:

```typescript
const [userPoints, setUserPoints] = useState(0);

// Load points when modal opens
useEffect(() => {
  if (isOpen && userId) {
    fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6c9b0e48/points/balance?userId=${userId}`, {
      headers: { 'Authorization': `Bearer ${publicAnonKey}` }
    })
    .then(res => res.json())
    .then(data => setUserPoints(data.points || 0));
  }
}, [isOpen, userId]);

// Redemption handler
const handleRedeemReward = async (rewardId: string, pointsCost: number) => {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-6c9b0e48/rewards/claim`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ userId, rewardId })
      }
    );
    
    const data = await response.json();
    
    if (data.error) {
      toast.error(data.error);
      return;
    }
    
    toast.success('Reward claimed! 🎉');
    setUserPoints(data.pointsRemaining);
    onSubscriptionUpdate?.();
  } catch (error) {
    toast.error('Failed to claim reward');
  }
};
```

Update reward display to check if redeemable:

```typescript
const canRedeem = userPoints >= reward.points;
```

### Phase 4: Update Subscription System for Periods (Priority 4)

#### 4.1 Update Upgrade Endpoint

In `/supabase/functions/server/index.tsx`:

```typescript
app.post('/make-server-6c9b0e48/subscription/upgrade', async (c) => {
  const { userId, tier, period = 'month' } = await c.req.json();
  
  // ... existing validation ...
  
  // Calculate expiry based on period
  const now = new Date();
  let expiresAt;
  
  switch (period) {
    case 'day':
      expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      break;
    case 'week':
      expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      expiresAt = new Date(now.setMonth(now.getMonth() + 1));
      break;
    case 'year':
      expiresAt = new Date(now.setFullYear(now.getFullYear() + 1));
      break;
    case 'lifetime':
      expiresAt = new Date('2099-12-31'); // Far future date
      break;
    default:
      expiresAt = new Date(now.setMonth(now.getMonth() + 1));
  }
  
  // Award bonus points
  let bonusPoints = 0;
  if (tier === 'premium') bonusPoints = 100;
  if (tier === 'pro') bonusPoints = 500;
  
  const subscription = {
    userId,
    tier,
    period,
    credits: tier === 'premium' ? 10 : 0,
    points: bonusPoints,
    postsThisMonth: 0,
    monthlyPostLimit: tier === 'premium' ? 10 : (tier === 'pro' ? 999999 : 3),
    pointMultiplier: tier === 'premium' ? 2 : (tier === 'pro' ? 3 : 1),
    lastResetDate: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    features: {
      canEditPosts: tier !== 'free',
      unlimitedPosts: tier === 'pro',
      prioritySupport: tier !== 'free',
    }
  };
  
  await kv.set(`subscription:${userId}`, subscription);
  
  return c.json({ success: true, subscription });
});
```

### Phase 5: Update API Utils (Priority 5)

Create `/utils/points.tsx`:

```typescript
import { projectId, publicAnonKey } from './supabase/info';

export async function awardPoints(
  userId: string,
  accessToken: string,
  action: 'post_created' | 'reply_given' | 'check_in_completed',
  metadata: any = {}
) {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-6c9b0e48/points/earn`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ userId, action, metadata })
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to award points');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Award points error:', error);
    throw error;
  }
}

export async function getPointsBalance(userId: string, accessToken: string) {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-6c9b0e48/points/balance?userId=${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to get points balance');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Get points balance error:', error);
    throw error;
  }
}

export async function claimReward(userId: string, accessToken: string, rewardId: string) {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-6c9b0e48/rewards/claim`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ userId, rewardId })
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to claim reward');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Claim reward error:', error);
    throw error;
  }
}
```

## 📊 Testing Checklist

After implementing the above:

### Points System
- [ ] User earns 10 points (free) / 20 (premium) / 30 (pro) for creating post
- [ ] User earns 5 points (free) / 10 (premium) / 15 (pro) for giving reply
- [ ] User earns 25 points for daily check-in
- [ ] Points balance displays correctly in profile card
- [ ] Points balance displays correctly in subscription modal

### Reward Redemption
- [ ] Rewards show "Ready!" badge when user has enough points
- [ ] Clicking "Redeem" successfully claims reward
- [ ] Points are deducted after redemption
- [ ] Credits are added after redeeming credit rewards
- [ ] Temporary upgrades work (7-day premium, etc.)

### Subscription Periods
- [ ] Can select different periods (daily/weekly/monthly/yearly/lifetime)
- [ ] Expiry dates calculated correctly
- [ ] Bonus points awarded on upgrade
- [ ] Point multipliers apply correctly

## 🎉 Expected Results

After full implementation:
- Users see points earned after every activity
- Profile card shows real-time points balance
- Subscription modal shows available rewards
- Users can redeem rewards for credits/upgrades
- Flexible subscription periods work correctly
- Gamification encourages daily engagement

## 📚 Additional Resources

- **Payment Integration**: See RevenueCat docs for mobile: https://www.revenuecat.com/docs/
- **Stripe Integration**: For web payments: https://stripe.com/docs/billing/subscriptions/overview
- **Analytics**: Track points earned, rewards claimed, subscription conversions

## ⚡ Quick Start Commands

To test the current UI (no backend changes needed):
1. Open the app
2. Go to Profile tab
3. Click "Upgrade & Earn Rewards"
4. Explore all three tabs

The UI is fully functional - it just needs backend integration!

---

**Note**: The frontend is 100% complete. The backend needs the points tracking and reward redemption logic. Start with Phase 1, then Phase 2, and you'll have a fully functional gamification system!
