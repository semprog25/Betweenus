/**
 * RevenueCat — native iOS / Android in-app purchases only.
 * Entitlements are granted server-side via RevenueCat webhooks.
 * Never call /subscription/upgrade from the client.
 */

import { isNativeMobile, isIOS, isAndroid } from './platform'
import {
  getPlan,
  PAID_PLANS,
  tierFromRevenueCatEntitlements,
  type PlanId,
  type SubscriptionTier,
} from '../config/subscription-catalog'
import { getSubscription } from './api'

function readEnv(key: string): string {
  const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env || {}
  return (env[key] || '').trim()
}

function getRevenueCatApiKey(): string | null {
  if (isIOS()) {
    return readEnv('VITE_REVENUECAT_IOS_API_KEY') || readEnv('VITE_REVENUECAT_API_KEY_IOS') || null
  }
  if (isAndroid()) {
    return readEnv('VITE_REVENUECAT_ANDROID_API_KEY') || readEnv('VITE_REVENUECAT_API_KEY_ANDROID') || null
  }
  return null
}

export function isRevenueCatConfigured(): boolean {
  if (!isNativeMobile()) return false
  const key = getRevenueCatApiKey()
  return Boolean(key) && !key!.includes('your_') && key!.length > 10
}

const getPurchases = async () => {
  if (!isNativeMobile()) return null
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    return Purchases
  } catch (error) {
    console.error('Failed to load RevenueCat:', error)
    return null
  }
}

let isConfigured = false

/**
 * Initialize RevenueCat once on native. Pass Supabase user UUID when known.
 */
export async function initializeRevenueCat(userId?: string): Promise<boolean> {
  if (!isNativeMobile()) return false
  if (!isRevenueCatConfigured()) {
    console.warn('RevenueCat: API keys not configured (VITE_REVENUECAT_IOS_API_KEY / VITE_REVENUECAT_ANDROID_API_KEY)')
    return false
  }

  try {
    const Purchases = await getPurchases()
    if (!Purchases) return false

    const apiKey = getRevenueCatApiKey()!
    const isProd = readEnv('MODE') === 'production' || readEnv('PROD') === 'true'

    if (!isProd) {
      await Purchases.setLogLevel({ level: 'DEBUG' as any })
    }

    if (!isConfigured) {
      await Purchases.configure({ apiKey, appUserID: userId || undefined })
      isConfigured = true
    } else if (userId) {
      await Purchases.logIn({ appUserID: userId })
    }

    console.log('RevenueCat: Initialized')
    return true
  } catch (error) {
    console.error('RevenueCat: Initialization failed:', error)
    return false
  }
}

export async function getOfferings() {
  if (!isNativeMobile()) return null
  try {
    const Purchases = await getPurchases()
    if (!Purchases) return null
    const offerings = await Purchases.getOfferings()
    return offerings.current || null
  } catch (error) {
    console.error('RevenueCat: Error getting offerings:', error)
    return null
  }
}

/** Find a package for a logical Between Us plan ID. */
export async function findPackageForPlan(planId: PlanId): Promise<any | null> {
  const offering = await getOfferings()
  if (!offering?.availablePackages?.length) return null

  const plan = getPlan(planId)
  const hints = [
    ...(plan?.rcPackageHints || []),
    planId,
    plan?.tier,
  ].filter(Boolean).map((h) => String(h).toLowerCase())

  const packages = offering.availablePackages as any[]

  for (const hint of hints) {
    const match = packages.find((pkg) => {
      const id = String(pkg.identifier || '').toLowerCase()
      const productId = String(pkg.product?.identifier || '').toLowerCase()
      return id === hint || productId === hint || id.includes(hint) || productId.includes(hint)
    })
    if (match) return match
  }

  // Fallbacks by package type for monthly/yearly when product ids are store-generated
  if (planId.endsWith('_monthly')) {
    return packages.find((pkg) => String(pkg.packageType || '').toUpperCase() === 'MONTHLY') || null
  }
  if (planId.endsWith('_yearly')) {
    return packages.find((pkg) => {
      const type = String(pkg.packageType || '').toUpperCase()
      return type === 'ANNUAL' || type === 'YEARLY'
    }) || null
  }

  return null
}

export async function purchasePackage(packageToPurchase: any): Promise<{
  success: boolean
  tier: SubscriptionTier
  error?: string
  cancelled?: boolean
}> {
  if (!isNativeMobile()) {
    return { success: false, tier: 'free', error: 'Not on mobile platform' }
  }

  try {
    const Purchases = await getPurchases()
    if (!Purchases) {
      return { success: false, tier: 'free', error: 'RevenueCat not available' }
    }

    const purchaseResult = await Purchases.purchasePackage({
      aPackage: packageToPurchase,
    })

    const tier = tierFromRevenueCatEntitlements(purchaseResult.customerInfo?.entitlements?.active)
    // Server webhook is source of truth — refresh shortly after purchase
    return { success: true, tier }
  } catch (error: any) {
    console.error('RevenueCat: Purchase error:', error)
    const code = error?.code || error?.errorCode
    if (code === 'PURCHASE_CANCELLED' || code === 1 || /cancel/i.test(String(error?.message || ''))) {
      return { success: false, tier: 'free', error: 'Purchase cancelled', cancelled: true }
    }
    return {
      success: false,
      tier: 'free',
      error: error?.message || 'Purchase failed',
    }
  }
}

export async function purchasePlan(planId: PlanId): Promise<{
  success: boolean
  tier: SubscriptionTier
  error?: string
  cancelled?: boolean
}> {
  const pkg = await findPackageForPlan(planId)
  if (!pkg) {
    return {
      success: false,
      tier: 'free',
      error: 'This plan is not available in the store yet',
    }
  }
  return purchasePackage(pkg)
}

export async function restorePurchases(): Promise<{
  success: boolean
  tier: SubscriptionTier
  error?: string
}> {
  if (!isNativeMobile()) {
    return { success: false, tier: 'free', error: 'Not on mobile' }
  }

  try {
    const Purchases = await getPurchases()
    if (!Purchases) return { success: false, tier: 'free', error: 'RevenueCat not available' }

    const customerInfo = await Purchases.restorePurchases()
    const tier = tierFromRevenueCatEntitlements(customerInfo?.entitlements?.active)
    return { success: true, tier }
  } catch (error: any) {
    console.error('RevenueCat: Error restoring purchases:', error)
    return { success: false, tier: 'free', error: error?.message || 'Restore failed' }
  }
}

export async function checkSubscriptionStatus(): Promise<{
  tier: SubscriptionTier
  expirationDate?: string
  willRenew?: boolean
}> {
  if (!isNativeMobile()) return { tier: 'free' }

  try {
    const Purchases = await getPurchases()
    if (!Purchases) return { tier: 'free' }

    const customerInfo = await Purchases.getCustomerInfo()
    const tier = tierFromRevenueCatEntitlements(customerInfo?.entitlements?.active)
    const activeEntitlements = Object.values(customerInfo?.entitlements?.active || {}) as any[]
    const first = activeEntitlements[0]

    return {
      tier,
      expirationDate: first?.expirationDate,
      willRenew: first?.willRenew,
    }
  } catch (error) {
    console.error('RevenueCat: Error checking subscription:', error)
    return { tier: 'free' }
  }
}

export async function identifyUser(userId: string): Promise<boolean> {
  if (!isNativeMobile() || !userId) return false
  try {
    const Purchases = await getPurchases()
    if (!Purchases) return false
    if (!isConfigured) {
      return initializeRevenueCat(userId)
    }
    await Purchases.logIn({ appUserID: userId })
    return true
  } catch (error) {
    console.error('RevenueCat: Error identifying user:', error)
    return false
  }
}

export async function logoutUser(): Promise<boolean> {
  if (!isNativeMobile()) return false
  try {
    const Purchases = await getPurchases()
    if (!Purchases || !isConfigured) return false
    await Purchases.logOut()
    return true
  } catch (error) {
    console.error('RevenueCat: Error logging out user:', error)
    return false
  }
}

/** Poll backend subscription after store purchase / restore (webhook lag). */
export async function refreshBackendSubscription(maxAttempts = 5): Promise<SubscriptionTier> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await getSubscription()
      const tier = result?.subscription?.tier as SubscriptionTier | undefined
      if (tier && tier !== 'free') return tier
    } catch {
      // keep polling
    }
    await new Promise((r) => setTimeout(r, 800 + attempt * 400))
  }
  try {
    const result = await getSubscription()
    return (result?.subscription?.tier as SubscriptionTier) || 'free'
  } catch {
    return 'free'
  }
}

export function listCatalogPlans() {
  return PAID_PLANS
}
