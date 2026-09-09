/**
 * Shared Between Us subscription catalog.
 * Logical plans map to platform-specific product / price IDs via env.
 * Never put Stripe secret keys or store credentials here.
 */

export type SubscriptionTier = 'free' | 'premium' | 'pro'
export type BillingPeriod = 'month' | 'year'

export interface TierLimits {
  monthlyPostLimit: number
  editCreditsOnGrant: number
  unlimitedEdits: boolean
  canEditPosts: boolean
  unlimitedPosts: boolean
  prioritySupport: boolean
  pointMultiplier: number
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    monthlyPostLimit: 3,
    editCreditsOnGrant: 0,
    unlimitedEdits: false,
    canEditPosts: false,
    unlimitedPosts: false,
    prioritySupport: false,
    pointMultiplier: 1,
  },
  premium: {
    monthlyPostLimit: 10,
    editCreditsOnGrant: 10,
    unlimitedEdits: false,
    canEditPosts: true,
    unlimitedPosts: false,
    prioritySupport: true,
    pointMultiplier: 2,
  },
  pro: {
    monthlyPostLimit: 999,
    editCreditsOnGrant: 999,
    unlimitedEdits: true,
    canEditPosts: true,
    unlimitedPosts: true,
    prioritySupport: true,
    pointMultiplier: 3,
  },
}

/** RevenueCat entitlement identifiers (lookup keys). */
export const RC_ENTITLEMENT_PREMIUM = 'premium'
export const RC_ENTITLEMENT_PRO = 'pro'

/**
 * Logical plan IDs used by Stripe Checkout and native purchase mapping.
 * Stripe Price IDs come from VITE_/server env — placeholders mean checkout is not configured.
 */
export type PlanId =
  | 'premium_monthly'
  | 'premium_yearly'
  | 'pro_monthly'
  | 'pro_yearly'

export interface PlanDefinition {
  id: PlanId
  tier: 'premium' | 'pro'
  period: BillingPeriod
  /** Display-only fallback when live store prices are unavailable */
  displayPrice: string
  displayLabel: string
  /** RevenueCat package lookup preference order */
  rcPackageHints: string[]
}

export const PAID_PLANS: PlanDefinition[] = [
  {
    id: 'premium_monthly',
    tier: 'premium',
    period: 'month',
    displayPrice: '$9.99',
    displayLabel: 'Monthly',
    rcPackageHints: ['premium_monthly', '$rc_monthly', 'monthly'],
  },
  {
    id: 'premium_yearly',
    tier: 'premium',
    period: 'year',
    displayPrice: '$79.99',
    displayLabel: 'Yearly',
    rcPackageHints: ['premium_yearly', '$rc_annual', 'yearly', 'annual'],
  },
  {
    id: 'pro_monthly',
    tier: 'pro',
    period: 'month',
    displayPrice: '$19.99',
    displayLabel: 'Monthly',
    rcPackageHints: ['pro_monthly', 'pro_month'],
  },
  {
    id: 'pro_yearly',
    tier: 'pro',
    period: 'year',
    displayPrice: '$149.99',
    displayLabel: 'Yearly',
    rcPackageHints: ['pro_yearly', 'pro_annual', 'pro_year'],
  },
]

export function getPlan(planId: string): PlanDefinition | undefined {
  return PAID_PLANS.find((p) => p.id === planId)
}

/** Client-safe Stripe price ID map (public price IDs are not secrets). */
export function getStripePriceId(planId: PlanId): string | null {
  const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env || {}
  const map: Record<PlanId, string | undefined> = {
    premium_monthly: env.VITE_STRIPE_PRICE_PREMIUM_MONTHLY,
    premium_yearly: env.VITE_STRIPE_PRICE_PREMIUM_YEARLY,
    pro_monthly: env.VITE_STRIPE_PRICE_PRO_MONTHLY,
    pro_yearly: env.VITE_STRIPE_PRICE_PRO_YEARLY,
  }
  const value = (map[planId] || '').trim()
  return value || null
}

export function isStripeCheckoutConfigured(): boolean {
  return PAID_PLANS.some((plan) => Boolean(getStripePriceId(plan.id)))
}

export function tierFromRevenueCatEntitlements(
  active: Record<string, unknown> | null | undefined,
): SubscriptionTier {
  if (!active || typeof active !== 'object') return 'free'
  const keys = Object.keys(active)
  // Prefer exact keys, then fuzzy match for legacy "BetweenUS Pro"
  if (keys.includes(RC_ENTITLEMENT_PRO) || keys.some((k) => /^pro$/i.test(k))) return 'pro'
  if (keys.some((k) => /pro/i.test(k) && !/premium/i.test(k))) return 'pro'
  if (keys.includes(RC_ENTITLEMENT_PREMIUM) || keys.some((k) => /premium/i.test(k))) return 'premium'
  return 'free'
}

export function tierFromProductId(productId: string | null | undefined): SubscriptionTier {
  if (!productId) return 'free'
  const id = productId.toLowerCase()
  if (id.includes('pro') && !id.includes('premium')) return 'pro'
  if (id.includes('premium')) return 'premium'
  if (id.includes('pro')) return 'pro'
  return 'free'
}
