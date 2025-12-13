/**
 * RevenueCat Integration for Between Us
 * 
 * Complete RevenueCat SDK integration for Capacitor (React/TypeScript)
 * Supports subscriptions, consumables, entitlements, Paywall UI, and Customer Center
 * 
 * Documentation: https://www.revenuecat.com/docs
 */

import { isNativeMobile, isIOS, isAndroid, getPlatform } from './platform';

// RevenueCat API Key (Test Key)
const REVENUECAT_API_KEY = 'test_WmecNTXNBZcHNrjcaPxMeYhXVQq';

// Entitlement identifier for BetweenUS Pro
export const ENTITLEMENT_IDENTIFIER = 'BetweenUS Pro';

// Product identifiers (configure these in RevenueCat Dashboard)
export const PRODUCT_IDENTIFIERS = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  LIFETIME: 'lifetime',
  CONSUMABLE: 'consumable',
} as const;

// Types
export interface CustomerInfo {
  entitlements: {
    active: Record<string, EntitlementInfo>;
    all: Record<string, EntitlementInfo>;
  };
  activeSubscriptions: string[];
  allPurchasedProductIdentifiers: string[];
  latestExpirationDate?: string;
  firstSeen: string;
  originalAppUserId: string;
  requestDate: string;
}

export interface EntitlementInfo {
  identifier: string;
  isActive: boolean;
  willRenew: boolean;
  periodType: 'NORMAL' | 'TRIAL' | 'INTRO';
  latestPurchaseDate: string;
  originalPurchaseDate: string;
  expirationDate?: string;
  store: 'APP_STORE' | 'PLAY_STORE' | 'STRIPE' | 'PROMOTIONAL';
  productIdentifier: string;
  isSandbox: boolean;
  unsubscribeDetectedAt?: string;
  billingIssueDetectedAt?: string;
  gracePeriodExpiresDate?: string;
}

export interface Package {
  identifier: string;
  packageType: string;
  product: Product;
  offeringIdentifier: string;
}

export interface Product {
  identifier: string;
  description: string;
  title: string;
  price: number;
  priceString: string;
  currencyCode: string;
  introPrice?: any;
  discounts?: any[];
}

export interface Offerings {
  current?: Offering;
  all: Record<string, Offering>;
}

export interface Offering {
  identifier: string;
  serverDescription: string;
  metadata: Record<string, any>;
  availablePackages: Package[];
}

export interface PurchaseResult {
  customerInfo: CustomerInfo;
  productIdentifier: string;
}

// Lazy load RevenueCat
const getPurchases = async () => {
  if (!isNativeMobile()) {
    console.warn('RevenueCat: Only available on native mobile platforms');
    return null;
  }
  
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    return Purchases;
  } catch (error) {
    console.error('RevenueCat: Failed to load SDK:', error);
    return null;
  }
};

// Lazy load RevenueCat Paywall UI
const getPurchasesUI = async () => {
  if (!isNativeMobile()) {
    return null;
  }
  
  try {
    const { PurchasesPaywallsUI } = await import('@revenuecat/purchases-capacitor-ui');
    return PurchasesPaywallsUI;
  } catch (error) {
    console.error('RevenueCat: Failed to load Paywall UI:', error);
    return null;
  }
};

/**
 * Initialize RevenueCat SDK
 * Call this once when the app starts (preferably in App.tsx useEffect)
 * 
 * @param userId Optional user ID to identify the user. If not provided, uses anonymous ID
 * @returns Promise<boolean> - true if initialization successful
 */
export async function initializeRevenueCat(userId?: string): Promise<boolean> {
  if (!isNativeMobile()) {
    console.log('RevenueCat: Skipping initialization (web platform)');
    return false;
  }

  try {
    const Purchases = await getPurchases();
    if (!Purchases) {
      console.error('RevenueCat: SDK not available');
      return false;
    }

    // Configure SDK with API key
    await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
    
    console.log('RevenueCat: SDK configured successfully');

    // Set debug mode in development (remove or set to 'INFO' in production)
    if (process.env.NODE_ENV === 'development') {
      await Purchases.setLogLevel({ level: 'DEBUG' });
      console.log('RevenueCat: Debug mode enabled');
    }

    // Identify user if provided
    if (userId) {
      await Purchases.logIn({ appUserID: userId });
      console.log('RevenueCat: User identified:', userId);
    }

    // Set up listeners for customer info updates
    Purchases.addCustomerInfoUpdateListener((customerInfo: CustomerInfo) => {
      console.log('RevenueCat: Customer info updated', customerInfo);
      // You can dispatch events or update state here
    });

    return true;
  } catch (error: any) {
    console.error('RevenueCat: Initialization failed:', error);
    return false;
  }
}

/**
 * Get current customer info
 * Contains subscription status, entitlements, purchase history, etc.
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isNativeMobile()) {
    return null;
  }

  try {
    const Purchases = await getPurchases();
    if (!Purchases) return null;

    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error: any) {
    console.error('RevenueCat: Error getting customer info:', error);
    return null;
  }
}

/**
 * Check if user has BetweenUS Pro entitlement
 * This is the main function to check subscription status
 * 
 * @returns Promise<boolean> - true if user has active BetweenUS Pro entitlement
 */
export async function hasBetweenUSPro(): Promise<boolean> {
  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) return false;

    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_IDENTIFIER];
    return entitlement?.isActive === true;
  } catch (error) {
    console.error('RevenueCat: Error checking BetweenUS Pro:', error);
    return false;
  }
}

/**
 * Get detailed entitlement information
 * Returns full entitlement info including expiration dates, renewal status, etc.
 */
export async function getBetweenUSProEntitlement(): Promise<EntitlementInfo | null> {
  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) return null;

    return customerInfo.entitlements.active[ENTITLEMENT_IDENTIFIER] || null;
  } catch (error) {
    console.error('RevenueCat: Error getting entitlement:', error);
    return null;
  }
}

/**
 * Get available offerings and packages
 * Use this to display available subscription options
 */
export async function getOfferings(): Promise<Offerings | null> {
  if (!isNativeMobile()) {
    return null;
  }

  try {
    const Purchases = await getPurchases();
    if (!Purchases) return null;

    const offerings = await Purchases.getOfferings();
    return offerings;
  } catch (error: any) {
    console.error('RevenueCat: Error getting offerings:', error);
    return null;
  }
}

/**
 * Get current offering (recommended packages)
 * This is usually what you want to display to users
 */
export async function getCurrentOffering(): Promise<Offering | null> {
  try {
    const offerings = await getOfferings();
    return offerings?.current || null;
  } catch (error) {
    console.error('RevenueCat: Error getting current offering:', error);
    return null;
  }
}

/**
 * Purchase a package
 * 
 * @param packageToPurchase The Package object from offerings
 * @returns Promise<PurchaseResult> - Purchase result with customer info
 */
export async function purchasePackage(packageToPurchase: Package): Promise<{
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
  errorCode?: string;
}> {
  if (!isNativeMobile()) {
    return { 
      success: false, 
      error: 'Purchases only available on mobile platforms' 
    };
  }

  try {
    const Purchases = await getPurchases();
    if (!Purchases) {
      return { 
        success: false, 
        error: 'RevenueCat SDK not available' 
      };
    }

    const purchaseResult: PurchaseResult = await Purchases.purchasePackage({ 
      aPackage: packageToPurchase 
    });
    
    console.log('RevenueCat: Purchase successful', purchaseResult);
    
    return {
      success: true,
      customerInfo: purchaseResult.customerInfo,
    };
  } catch (error: any) {
    console.error('RevenueCat: Purchase error:', error);
    
    // Handle specific error codes
    const errorCode = error.code || error.userInfo?.readableErrorCode;
    let errorMessage = 'Purchase failed';
    
    if (errorCode === 'PURCHASE_CANCELLED' || errorCode === 'USER_CANCELLED') {
      errorMessage = 'Purchase was cancelled';
    } else if (errorCode === 'PAYMENT_PENDING') {
      errorMessage = 'Payment is pending';
    } else if (errorCode === 'STORE_PROBLEM') {
      errorMessage = 'There was a problem with the store';
    } else if (errorCode === 'PURCHASE_NOT_ALLOWED') {
      errorMessage = 'Purchases are not allowed on this device';
    } else if (errorCode === 'PURCHASE_INVALID') {
      errorMessage = 'Purchase is invalid';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
      errorCode: errorCode,
    };
  }
}

/**
 * Restore previous purchases
 * Call this when user taps "Restore Purchases" button
 * 
 * @returns Promise<CustomerInfo | null>
 */
export async function restorePurchases(): Promise<CustomerInfo | null> {
  if (!isNativeMobile()) {
    return null;
  }

  try {
    const Purchases = await getPurchases();
    if (!Purchases) return null;

    const customerInfo = await Purchases.restorePurchases();
    console.log('RevenueCat: Purchases restored', customerInfo);
    return customerInfo;
  } catch (error: any) {
    console.error('RevenueCat: Error restoring purchases:', error);
    return null;
  }
}

/**
 * Identify user in RevenueCat
 * Call this after user signs in to link purchases to their account
 * 
 * @param userId User ID from your backend/auth system
 * @returns Promise<CustomerInfo | null>
 */
export async function identifyUser(userId: string): Promise<CustomerInfo | null> {
  if (!isNativeMobile()) {
    return null;
  }

  try {
    const Purchases = await getPurchases();
    if (!Purchases) return null;

    const { customerInfo } = await Purchases.logIn({ appUserID: userId });
    console.log('RevenueCat: User identified:', userId);
    return customerInfo;
  } catch (error: any) {
    console.error('RevenueCat: Error identifying user:', error);
    return null;
  }
}

/**
 * Log out user from RevenueCat
 * Call this when user signs out
 * 
 * @returns Promise<CustomerInfo | null>
 */
export async function logoutUser(): Promise<CustomerInfo | null> {
  if (!isNativeMobile()) {
    return null;
  }

  try {
    const Purchases = await getPurchases();
    if (!Purchases) return null;

    const { customerInfo } = await Purchases.logOut();
    console.log('RevenueCat: User logged out');
    return customerInfo;
  } catch (error: any) {
    console.error('RevenueCat: Error logging out:', error);
    return null;
  }
}

/**
 * Present RevenueCat Paywall UI
 * This presents the native RevenueCat paywall interface
 * 
 * @param offering Optional specific offering to display. If not provided, shows current offering
 * @returns Promise<{ dismissed: boolean; customerInfo?: CustomerInfo }>
 */
export async function presentPaywall(offering?: Offering): Promise<{
  dismissed: boolean;
  customerInfo?: CustomerInfo;
}> {
  if (!isNativeMobile()) {
    return { dismissed: true };
  }

  try {
    const PurchasesUI = await getPurchasesUI();
    if (!PurchasesUI) {
      console.warn('RevenueCat: Paywall UI not available');
      return { dismissed: true };
    }

    const result = await PurchasesUI.presentPaywall({
      offering: offering || undefined, // If undefined, shows current offering
    });

    return {
      dismissed: result.dismissed || false,
      customerInfo: result.customerInfo,
    };
  } catch (error: any) {
    console.error('RevenueCat: Error presenting paywall:', error);
    return { dismissed: true };
  }
}

/**
 * Present Customer Center
 * Shows the native RevenueCat customer center where users can:
 * - View subscription details
 * - Manage subscriptions
 * - Restore purchases
 * 
 * @returns Promise<void>
 */
export async function presentCustomerCenter(): Promise<void> {
  if (!isNativeMobile()) {
    console.warn('RevenueCat: Customer Center only available on mobile');
    return;
  }

  try {
    const PurchasesUI = await getPurchasesUI();
    if (!PurchasesUI) {
      console.warn('RevenueCat: Customer Center UI not available');
      return;
    }

    await PurchasesUI.presentCustomerCenter();
    console.log('RevenueCat: Customer Center presented');
  } catch (error: any) {
    console.error('RevenueCat: Error presenting customer center:', error);
  }
}

/**
 * Check if customer center is available
 * 
 * @returns Promise<boolean>
 */
export async function isCustomerCenterAvailable(): Promise<boolean> {
  if (!isNativeMobile()) {
    return false;
  }

  try {
    const PurchasesUI = await getPurchasesUI();
    return PurchasesUI !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Get subscription status summary
 * Helper function to get a clean subscription status object
 */
export async function getSubscriptionStatus(): Promise<{
  hasPro: boolean;
  entitlement?: EntitlementInfo;
  expirationDate?: string;
  willRenew: boolean;
  isTrial: boolean;
  isIntroPeriod: boolean;
}> {
  const hasPro = await hasBetweenUSPro();
  const entitlement = await getBetweenUSProEntitlement();

  return {
    hasPro,
    entitlement: entitlement || undefined,
    expirationDate: entitlement?.expirationDate,
    willRenew: entitlement?.willRenew || false,
    isTrial: entitlement?.periodType === 'TRIAL',
    isIntroPeriod: entitlement?.periodType === 'INTRO',
  };
}

/**
 * Sync subscription with backend
 * Call this after purchase to update your backend
 */
export async function syncSubscriptionWithBackend(
  userId: string
): Promise<boolean> {
  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) return false;

    const hasPro = customerInfo.entitlements.active[ENTITLEMENT_IDENTIFIER]?.isActive || false;

    // Import your API function
    const { upgradeSubscription } = await import('./api');
    
    // Update subscription in your backend
    const tier = hasPro ? 'pro' : 'free';
    const result = await upgradeSubscription(userId, tier as 'premium' | 'pro');
    
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

/**
 * Helper: Get package by identifier from offering
 */
export function getPackageByIdentifier(
  offering: Offering,
  identifier: string
): Package | null {
  return offering.availablePackages.find(pkg => pkg.identifier === identifier) || null;
}

/**
 * Helper: Get monthly package from offering
 */
export function getMonthlyPackage(offering: Offering): Package | null {
  return getPackageByIdentifier(offering, PRODUCT_IDENTIFIERS.MONTHLY) ||
         offering.availablePackages.find(pkg => pkg.packageType === 'MONTHLY') ||
         null;
}

/**
 * Helper: Get yearly package from offering
 */
export function getYearlyPackage(offering: Offering): Package | null {
  return getPackageByIdentifier(offering, PRODUCT_IDENTIFIERS.YEARLY) ||
         offering.availablePackages.find(pkg => pkg.packageType === 'ANNUAL') ||
         null;
}

/**
 * Helper: Get lifetime package from offering
 */
export function getLifetimePackage(offering: Offering): Package | null {
  return getPackageByIdentifier(offering, PRODUCT_IDENTIFIERS.LIFETIME) ||
         offering.availablePackages.find(pkg => pkg.packageType === 'LIFETIME') ||
         null;
}

/**
 * Helper: Format price string for display
 */
export function formatPrice(product: Product): string {
  return product.priceString || `$${product.price.toFixed(2)}`;
}
