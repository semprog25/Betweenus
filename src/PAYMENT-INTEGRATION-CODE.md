# 💰 In-App Purchase Integration Code

Complete implementation for native iOS and Android in-app purchases for Between Us.

---

## 📦 Installation

```bash
npm install @capacitor-community/in-app-purchases
npx cap sync
```

---

## 🔧 Create Payment Service

Create `/services/PaymentService.ts`:

```typescript
import { InAppPurchase2 } from '@capacitor-community/in-app-purchases';
import { supabase } from './supabase';

// Product IDs (must match App Store Connect and Play Console)
export const PRODUCTS = {
  PREMIUM_MONTHLY: 'premium_monthly',
  PRO_YEARLY: 'pro_yearly',
  LIFETIME_ACCESS: 'lifetime_access',
  // Credit packs
  CREDITS_10: 'credits_10',
  CREDITS_25: 'credits_25',
  CREDITS_50: 'credits_50',
};

export type SubscriptionTier = 'free' | 'premium' | 'pro' | 'lifetime';

export interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  priceMicros: number;
  currency: string;
}

class PaymentService {
  private initialized = false;
  private products: Product[] = [];

  /**
   * Initialize the payment service
   * Call this when app starts
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Register product IDs
      await InAppPurchase2.register([
        { id: PRODUCTS.PREMIUM_MONTHLY, type: 'paid subscription' },
        { id: PRODUCTS.PRO_YEARLY, type: 'paid subscription' },
        { id: PRODUCTS.LIFETIME_ACCESS, type: 'non renewing subscription' },
        { id: PRODUCTS.CREDITS_10, type: 'consumable' },
        { id: PRODUCTS.CREDITS_25, type: 'consumable' },
        { id: PRODUCTS.CREDITS_50, type: 'consumable' },
      ]);

      // Set up event listeners
      this.setupEventListeners();

      // Refresh product information
      await InAppPurchase2.refresh();

      this.initialized = true;
      console.log('Payment service initialized');
    } catch (error) {
      console.error('Failed to initialize payment service:', error);
      throw error;
    }
  }

  /**
   * Set up event listeners for purchase events
   */
  private setupEventListeners() {
    // When product is approved (payment successful)
    InAppPurchase2.when('product').approved((product: any) => {
      console.log('Purchase approved:', product);
      this.handlePurchaseApproved(product);
      return product.verify();
    });

    // When product is verified
    InAppPurchase2.when('product').verified((product: any) => {
      console.log('Purchase verified:', product);
      this.handlePurchaseVerified(product);
      product.finish();
    });

    // When product is finished
    InAppPurchase2.when('product').finished((product: any) => {
      console.log('Purchase finished:', product);
    });

    // When purchase is cancelled
    InAppPurchase2.when('product').cancelled((product: any) => {
      console.log('Purchase cancelled:', product);
    });

    // When error occurs
    InAppPurchase2.error((error: any) => {
      console.error('Purchase error:', error);
    });
  }

  /**
   * Get all available products with pricing
   */
  async getProducts(): Promise<Product[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    const allProducts = InAppPurchase2.products;
    
    this.products = allProducts.map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      price: p.price,
      priceMicros: p.priceMicros || 0,
      currency: p.currency || 'USD',
    }));

    return this.products;
  }

  /**
   * Get a specific product by ID
   */
  async getProduct(productId: string): Promise<Product | null> {
    const products = await this.getProducts();
    return products.find(p => p.id === productId) || null;
  }

  /**
   * Purchase a subscription
   */
  async purchaseSubscription(productId: string): Promise<boolean> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      console.log('Initiating purchase:', productId);
      const product = InAppPurchase2.get(productId);
      
      if (!product) {
        throw new Error('Product not found');
      }

      // Trigger the purchase flow
      await InAppPurchase2.order(productId);
      
      return true;
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  /**
   * Purchase credits (consumable)
   */
  async purchaseCredits(productId: string): Promise<boolean> {
    return this.purchaseSubscription(productId); // Same flow
  }

  /**
   * Restore purchases (iOS requirement)
   */
  async restorePurchases(): Promise<void> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      await InAppPurchase2.refresh();
      
      // Check for active subscriptions
      const products = InAppPurchase2.products;
      
      for (const product of products) {
        if (product.owned) {
          console.log('Restored purchase:', product.id);
          await this.handlePurchaseVerified(product);
        }
      }
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw error;
    }
  }

  /**
   * Handle purchase approval
   * Called when payment is successful but not yet verified
   */
  private async handlePurchaseApproved(product: any) {
    console.log('Processing approved purchase:', product.id);
    
    // You can show a loading state here
    // The purchase will be verified next
  }

  /**
   * Handle purchase verification
   * Called when purchase is verified by the store
   * This is where you grant access to the user
   */
  private async handlePurchaseVerified(product: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No user found');
        return;
      }

      // Determine what was purchased and update accordingly
      if (product.id === PRODUCTS.PREMIUM_MONTHLY) {
        await this.updateSubscription(user.id, 'premium', product);
      } else if (product.id === PRODUCTS.PRO_YEARLY) {
        await this.updateSubscription(user.id, 'pro', product);
      } else if (product.id === PRODUCTS.LIFETIME_ACCESS) {
        await this.updateSubscription(user.id, 'lifetime', product);
      } else if (product.id.startsWith('credits_')) {
        await this.addCredits(user.id, product.id);
      }

    } catch (error) {
      console.error('Failed to handle purchase:', error);
    }
  }

  /**
   * Update user subscription in Supabase
   */
  private async updateSubscription(
    userId: string,
    tier: SubscriptionTier,
    product: any
  ) {
    try {
      // Calculate expiry date
      let expiryDate = null;
      
      if (tier === 'premium') {
        // Monthly subscription - expires in 30 days
        expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1);
      } else if (tier === 'pro') {
        // Yearly subscription - expires in 1 year
        expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      } else if (tier === 'lifetime') {
        // Lifetime - set to 100 years in future
        expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 100);
      }

      // Update in Supabase
      const { error } = await supabase
        .from('user_profiles')
        .update({
          subscription_tier: tier,
          subscription_start: new Date().toISOString(),
          subscription_expiry: expiryDate?.toISOString(),
          purchase_token: product.transaction?.id || null,
          purchase_platform: this.getPlatform(),
        })
        .eq('user_id', userId);

      if (error) throw error;

      console.log(`Subscription updated: ${tier}`);
      
      // Award welcome points
      await this.awardWelcomePoints(userId, tier);

    } catch (error) {
      console.error('Failed to update subscription:', error);
      throw error;
    }
  }

  /**
   * Add credits to user account
   */
  private async addCredits(userId: string, productId: string) {
    try {
      // Determine credit amount from product ID
      let creditAmount = 0;
      
      if (productId === PRODUCTS.CREDITS_10) creditAmount = 10;
      else if (productId === PRODUCTS.CREDITS_25) creditAmount = 25;
      else if (productId === PRODUCTS.CREDITS_50) creditAmount = 50;

      // Get current credits
      const { data: profile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('edit_credits')
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      const currentCredits = profile?.edit_credits || 0;

      // Update credits
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          edit_credits: currentCredits + creditAmount,
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      console.log(`Added ${creditAmount} credits to user ${userId}`);

    } catch (error) {
      console.error('Failed to add credits:', error);
      throw error;
    }
  }

  /**
   * Award welcome points for subscription
   */
  private async awardWelcomePoints(userId: string, tier: SubscriptionTier) {
    let points = 0;
    
    if (tier === 'premium') points = 100;
    else if (tier === 'pro') points = 500;
    else if (tier === 'lifetime') points = 1000;

    if (points > 0) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('total_points')
        .eq('user_id', userId)
        .single();

      const currentPoints = profile?.total_points || 0;

      await supabase
        .from('user_profiles')
        .update({
          total_points: currentPoints + points,
        })
        .eq('user_id', userId);
    }
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return false;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_tier, subscription_expiry')
        .eq('user_id', user.id)
        .single();

      if (!profile) return false;

      const tier = profile.subscription_tier;
      const expiry = profile.subscription_expiry;

      // Free tier = no subscription
      if (tier === 'free') return false;

      // Lifetime = always active
      if (tier === 'lifetime') return true;

      // Check if subscription is expired
      if (expiry) {
        const expiryDate = new Date(expiry);
        const now = new Date();
        
        if (now > expiryDate) {
          // Subscription expired - downgrade to free
          await this.downgradeToFree(user.id);
          return false;
        }
      }

      return true;

    } catch (error) {
      console.error('Failed to check subscription:', error);
      return false;
    }
  }

  /**
   * Downgrade user to free tier
   */
  private async downgradeToFree(userId: string) {
    await supabase
      .from('user_profiles')
      .update({
        subscription_tier: 'free',
      })
      .eq('user_id', userId);
  }

  /**
   * Get platform (iOS or Android)
   */
  private getPlatform(): string {
    return InAppPurchase2.platform || 'unknown';
  }

  /**
   * Get current subscription status
   */
  async getSubscriptionStatus(): Promise<{
    tier: SubscriptionTier;
    active: boolean;
    expiryDate: string | null;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { tier: 'free', active: false, expiryDate: null };
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier, subscription_expiry')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return { tier: 'free', active: false, expiryDate: null };
    }

    const active = await this.hasActiveSubscription();

    return {
      tier: profile.subscription_tier as SubscriptionTier,
      active,
      expiryDate: profile.subscription_expiry,
    };
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
```

---

## 🎯 Usage in Your Components

### Initialize on App Start

In your `/App.tsx` or main component:

```typescript
import { useEffect } from 'react';
import { paymentService } from './services/PaymentService';

function App() {
  useEffect(() => {
    // Initialize payment service
    paymentService.initialize().catch(console.error);
  }, []);

  return (
    // Your app content
  );
}
```

---

## 💳 Subscription Modal Component

Update your existing subscription modal to use the payment service:

```typescript
import { useState, useEffect } from 'react';
import { paymentService, PRODUCTS, type Product } from '../services/PaymentService';
import { toast } from 'sonner';

export function SubscriptionModal() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const prods = await paymentService.getProducts();
      setProducts(prods);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load subscription options');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (productId: string) => {
    try {
      setPurchasing(productId);
      await paymentService.purchaseSubscription(productId);
      toast.success('Subscription activated! 🎉');
      // Close modal, refresh UI, etc.
    } catch (error) {
      console.error('Purchase failed:', error);
      toast.error('Purchase failed. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestore = async () => {
    try {
      setLoading(true);
      await paymentService.restorePurchases();
      toast.success('Purchases restored!');
    } catch (error) {
      console.error('Restore failed:', error);
      toast.error('No purchases to restore');
    } finally {
      setLoading(false);
    }
  };

  const getProduct = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  const premiumProduct = getProduct(PRODUCTS.PREMIUM_MONTHLY);
  const proProduct = getProduct(PRODUCTS.PRO_YEARLY);
  const lifetimeProduct = getProduct(PRODUCTS.LIFETIME_ACCESS);

  return (
    <div className="subscription-modal">
      {/* Premium Monthly */}
      <div className="subscription-card">
        <h3>Premium</h3>
        <p className="price">
          {premiumProduct?.price || '$4.99'} / month
        </p>
        <ul>
          <li>10 posts per month</li>
          <li>No ads</li>
          <li>10 edit credits</li>
        </ul>
        <button
          onClick={() => handlePurchase(PRODUCTS.PREMIUM_MONTHLY)}
          disabled={purchasing !== null}
        >
          {purchasing === PRODUCTS.PREMIUM_MONTHLY ? 'Processing...' : 'Subscribe'}
        </button>
      </div>

      {/* Pro Yearly */}
      <div className="subscription-card featured">
        <div className="badge">Best Value</div>
        <h3>Pro</h3>
        <p className="price">
          {proProduct?.price || '$49.99'} / year
        </p>
        <ul>
          <li>Unlimited posts</li>
          <li>No ads</li>
          <li>Unlimited edits</li>
          <li>Priority support</li>
        </ul>
        <button
          onClick={() => handlePurchase(PRODUCTS.PRO_YEARLY)}
          disabled={purchasing !== null}
        >
          {purchasing === PRODUCTS.PRO_YEARLY ? 'Processing...' : 'Subscribe'}
        </button>
      </div>

      {/* Lifetime */}
      <div className="subscription-card">
        <h3>Lifetime</h3>
        <p className="price">
          {lifetimeProduct?.price || '$99.99'} once
        </p>
        <ul>
          <li>Unlimited forever</li>
          <li>All Pro features</li>
          <li>One-time payment</li>
          <li>Future updates included</li>
        </ul>
        <button
          onClick={() => handlePurchase(PRODUCTS.LIFETIME_ACCESS)}
          disabled={purchasing !== null}
        >
          {purchasing === PRODUCTS.LIFETIME_ACCESS ? 'Processing...' : 'Buy Lifetime'}
        </button>
      </div>

      {/* Restore Button (iOS requirement) */}
      <button
        onClick={handleRestore}
        disabled={loading}
        className="restore-button"
      >
        Restore Purchases
      </button>
    </div>
  );
}
```

---

## 🛒 Credit Purchase Component

```typescript
import { paymentService, PRODUCTS } from '../services/PaymentService';

export function CreditPurchaseModal() {
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchaseCredits = async (productId: string) => {
    try {
      setPurchasing(productId);
      await paymentService.purchaseCredits(productId);
      toast.success('Credits added! 🎉');
    } catch (error) {
      console.error('Purchase failed:', error);
      toast.error('Purchase failed. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="credit-purchase-modal">
      <h2>Buy Edit Credits</h2>
      
      <div className="credit-options">
        <div className="credit-card">
          <h3>10 Credits</h3>
          <p className="price">$0.99</p>
          <button onClick={() => handlePurchaseCredits(PRODUCTS.CREDITS_10)}>
            {purchasing === PRODUCTS.CREDITS_10 ? 'Processing...' : 'Buy'}
          </button>
        </div>

        <div className="credit-card">
          <div className="badge">Best Value</div>
          <h3>25 Credits</h3>
          <p className="price">$1.99</p>
          <button onClick={() => handlePurchaseCredits(PRODUCTS.CREDITS_25)}>
            {purchasing === PRODUCTS.CREDITS_25 ? 'Processing...' : 'Buy'}
          </button>
        </div>

        <div className="credit-card">
          <h3>50 Credits</h3>
          <p className="price">$2.99</p>
          <button onClick={() => handlePurchaseCredits(PRODUCTS.CREDITS_50)}>
            {purchasing === PRODUCTS.CREDITS_50 ? 'Processing...' : 'Buy'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔐 Add to Supabase Database

Update your `user_profiles` table to include payment fields:

```sql
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS purchase_token TEXT,
ADD COLUMN IF NOT EXISTS purchase_platform TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_subscription_tier ON user_profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_subscription_expiry ON user_profiles(subscription_expiry);
```

---

## ✅ Testing Checklist

### iOS Testing (Sandbox):

1. Create sandbox test account in App Store Connect
2. Sign out of real Apple ID on test device
3. Sign in with sandbox account when prompted during purchase
4. Test all subscription tiers
5. Test restore purchases

### Android Testing:

1. Add test accounts in Play Console
2. Upload app to Internal Testing track
3. Install from Play Store (internal test)
4. Test all subscription tiers
5. Test credit purchases

---

## 🎯 Summary

This payment system:
- ✅ Uses native iOS and Android payment systems
- ✅ Handles subscriptions automatically
- ✅ Supports consumable purchases (credits)
- ✅ Syncs with Supabase database
- ✅ Handles restore purchases (iOS requirement)
- ✅ Awards welcome points
- ✅ Checks subscription expiry
- ✅ No external payment gateway needed
- ✅ Complies with app store requirements

**Total implementation time**: 2-3 hours

---

💜 You're ready to start accepting payments through your native app!
