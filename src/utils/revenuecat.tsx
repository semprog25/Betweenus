/**
 * RevenueCat Integration
 * 
 * Handles mobile in-app purchases and subscriptions via RevenueCat.
 * Only works on native mobile platforms (iOS and Android).
 */

import { isNativeMobile, isIOS, isAndroid } from './platform';

// RevenueCat API Keys (replace with your actual keys)
const REVENUECAT_API_KEY_IOS = 'your_ios_api_key_here';
const REVENUECAT_API_KEY_ANDROID = 'your_android_api_key_here';

// Lazy load RevenueCat
const getPurchases = async () => {
  if (!isNativeMobile()) {
    console.warn('RevenueCat only available on mobile platforms');
    return null;
  }
  
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    return Purchases;
  } catch (error) {
    console.error('Failed to load RevenueCat:', error);
    return null;
  }
};

/**
 * Initialize RevenueCat SDK
 * Call this once when the app starts
 */
export async function initializeRevenueCat(userId?: string): Promise<boolean> {
  if (!isNativeMobile()) {
    console.log('RevenueCat: Skipping initialization (not on mobile)');
    return false;
  }

  try {
    const Purchases = await getPurchases();
    if (!Purchases) return false;

    const apiKey = isIOS() ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
    
    if (apiKey === 'your_ios_api_key_here' || apiKey === 'your_android_api_key_here') {
      console.warn('RevenueCat: API keys not configured. Please add your keys to utils/revenuecat.tsx');
      return false;
    }

    // Set debug mode (disable in production)
    await Purchases.setLogLevel({ level: 'DEBUG' as any });
    
    // Configure SDK
    await Purchases.configure({ apiKey });
    
    // Identify the user (optional but recommended)
    if (userId) {
      await Purchases.logIn({ appUserID: userId });
    }
    
    console.log('RevenueCat: Initialized successfully');
    return true;
  } catch (error) {
    console.error('RevenueCat: Initialization failed:', error);
    return false;
  }
}

/**
 * Get available subscription offerings
 */
export async function getOfferings() {
  if (!isNativeMobile()) {
    return null;
  }

  try {
    const Purchases = await getPurchases();
    if (!Purchases) return null;

    const offerings = await Purchases.getOfferings();
    
    if (offerings.current) {
      console.log('RevenueCat: Current offering:', offerings.current);
      return offerings.current;
    }
    
    console.warn('RevenueCat: No current offering available');
    return null;
  } catch (error) {
    console.error('RevenueCat: Error getting offerings:', error);
    return null;
  }
}

/**
 * Purchase a package
 * @param packageToPurchase The package object from offerings
 * @returns Object with success status and subscription tier
 */
export async function purchasePackage(packageToPurchase: any): Promise<{
  success: boolean;
  tier: 'free' | 'premium' | 'pro';
  error?: string;
}> {
  if (!isNativeMobile()) {
    return { success: false, tier: 'free', error: 'Not on mobile platform' };
  }

  try {
    const Purchases = await getPurchases();
    if (!Purchases) {
      return { success: false, tier: 'free', error: 'RevenueCat not available' };
    }

    const purchaseResult = await Purchases.purchasePackage({ 
      aPackage: packageToPurchase 
    });
    
    const customerInfo = purchaseResult.customerInfo;
    
    // Check which entitlements the user now has
    const tier = getSubscriptionTierFromEntitlements(customerInfo.entitlements.active);
    
    console.log('RevenueCat: Purchase successful. Tier:', tier);
    
    return {
      success: true,
      tier,
    };
  } catch (error: any) {
    console.error('RevenueCat: Purchase error:', error);
    
    if (error.code === 'PURCHASE_CANCELLED') {
      return { success: false, tier: 'free', error: 'Purchase cancelled by user' };
    }
    
    return { 
      success: false, 
      tier: 'free', 
      error: error.message || 'Unknown error' 
    };
  }
}

/**
 * Restore previous purchases
 * Useful when user reinstalls app or signs in on new device
 */
export async function restorePurchases(): Promise<'free' | 'premium' | 'pro'> {
  if (!isNativeMobile()) {
    return 'free';
  }

  try {
    const Purchases = await getPurchases();
    if (!Purchases) return 'free';

    const customerInfo = await Purchases.restorePurchases();
    const tier = getSubscriptionTierFromEntitlements(customerInfo.entitlements.active);
    
    console.log('RevenueCat: Purchases restored. Tier:', tier);
    
    return tier;
  } catch (error) {
    console.error('RevenueCat: Error restoring purchases:', error);
    return 'free';
  }
}

/**
 * Check current subscription status
 */
export async function checkSubscriptionStatus(): Promise<{
  tier: 'free' | 'premium' | 'pro';
  expirationDate?: string;
  willRenew?: boolean;
}> {
  if (!isNativeMobile()) {
    return { tier: 'free' };
  }

  try {
    const Purchases = await getPurchases();
    if (!Purchases) return { tier: 'free' };

    const customerInfo = await Purchases.getCustomerInfo();
    const tier = getSubscriptionTierFromEntitlements(customerInfo.entitlements.active);
    
    // Get expiration info
    const activeEntitlements = Object.values(customerInfo.entitlements.active);
    const firstEntitlement = activeEntitlements[0] as any;
    
    return {
      tier,
      expirationDate: firstEntitlement?.expirationDate,
      willRenew: firstEntitlement?.willRenew,
    };
  } catch (error) {
    console.error('RevenueCat: Error checking subscription:', error);
    return { tier: 'free' };
  }
}

/**
 * Identify user in RevenueCat
 * Call this after user signs in
 */
export async function identifyUser(userId: string): Promise<boolean> {
  if (!isNativeMobile()) {
    return false;
  }

  try {
    const Purchases = await getPurchases();
    if (!Purchases) return false;

    await Purchases.logIn({ appUserID: userId });
    console.log('RevenueCat: User identified:', userId);
    return true;
  } catch (error) {
    console.error('RevenueCat: Error identifying user:', error);
    return false;
  }
}

/**
 * Log out user from RevenueCat
 * Call this when user signs out
 */
export async function logoutUser(): Promise<boolean> {
  if (!isNativeMobile()) {
    return false;
  }

  try {
    const Purchases = await getPurchases();
    if (!Purchases) return false;

    await Purchases.logOut();
    console.log('RevenueCat: User logged out');
    return true;
  } catch (error) {
    console.error('RevenueCat: Error logging out user:', error);
    return false;
  }
}

/**
 * Helper: Determine subscription tier from entitlements
 */
function getSubscriptionTierFromEntitlements(entitlements: any): 'free' | 'premium' | 'pro' {
  // Check in order of highest to lowest tier
  if (entitlements['pro']) {
    return 'pro';
  } else if (entitlements['premium']) {
    return 'premium';
  }
  return 'free';
}

/**
 * Helper: Create a simple offering structure for testing
 * Use this when you don't have RevenueCat configured yet
 */
export function getMockOfferings() {
  return {
    identifier: 'default',
    serverDescription: 'Default offering',
    availablePackages: [
      {
        identifier: 'premium_monthly',
        packageType: 'MONTHLY',
        product: {
          identifier: 'premium_monthly',
          description: 'Premium Subscription',
          title: 'Premium',
          price: 4.99,
          priceString: '$4.99',
          currencyCode: 'USD',
        },
      },
      {
        identifier: 'pro_monthly',
        packageType: 'MONTHLY',
        product: {
          identifier: 'pro_monthly',
          description: 'Pro Subscription',
          title: 'Pro',
          price: 9.99,
          priceString: '$9.99',
          currencyCode: 'USD',
        },
      },
    ],
  };
}

/**
 * RevenueCat Webhook Handler (Backend)
 * Add this to your Supabase edge function to handle RevenueCat events
 * 
 * Example:
 * app.post('/webhook/revenuecat', async (c) => {
 *   const event = await c.req.json();
 *   
 *   if (event.type === 'INITIAL_PURCHASE' || event.type === 'RENEWAL') {
 *     const userId = event.app_user_id;
 *     const productId = event.product_id;
 *     
 *     // Determine tier from product ID
 *     let tier: 'free' | 'premium' | 'pro' = 'free';
 *     if (productId.includes('premium')) tier = 'premium';
 *     if (productId.includes('pro')) tier = 'pro';
 *     
 *     // Update subscription in database
 *     await updateSubscription(userId, tier, 'revenuecat');
 *   }
 *   
 *   return c.json({ received: true });
 * });
 */

/**
 * Sync subscription status with backend
 * Call this after successful purchase or restore
 */
export async function syncSubscriptionWithBackend(
  tier: 'free' | 'premium' | 'pro',
  userId: string
): Promise<boolean> {
  try {
    // Import your API function
    const { upgradeSubscription } = await import('./api');
    
    // Update subscription in your Supabase backend
    const result = await upgradeSubscription(userId, tier);
    
    if (result.success) {
      console.log('RevenueCat: Subscription synced with backend');
      return true;
    }
    
    console.error('RevenueCat: Failed to sync with backend:', result);
    return false;
  } catch (error) {
    console.error('RevenueCat: Error syncing with backend:', error);
    return false;
  }
}
