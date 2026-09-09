/**
 * Server-side entitlement mutations for Between Us.
 * Only payment webhooks (or verified provider callbacks) should call applyEntitlement.
 */
import * as kv from "./kv_store.tsx"

export type SubscriptionTier = "free" | "premium" | "pro"
export type EntitlementSource = "stripe" | "revenuecat" | "system"

export interface SubscriptionRecord {
  tier: SubscriptionTier
  credits: number
  postsThisMonth: number
  monthlyPostLimit: number
  lastResetDate?: string
  expiresAt: string | null
  willRenew?: boolean
  status?: "active" | "canceled" | "expired" | "past_due" | "trialing" | "incomplete"
  source?: EntitlementSource
  productId?: string | null
  providerCustomerId?: string | null
  providerSubscriptionId?: string | null
  updatedAt?: string
  features: {
    canEditPosts: boolean
    unlimitedPosts: boolean
    prioritySupport: boolean
  }
}

const TIER_LIMITS: Record<SubscriptionTier, {
  monthlyPostLimit: number
  editCreditsOnGrant: number
  unlimitedEdits: boolean
  canEditPosts: boolean
  unlimitedPosts: boolean
  prioritySupport: boolean
}> = {
  free: {
    monthlyPostLimit: 3,
    editCreditsOnGrant: 0,
    unlimitedEdits: false,
    canEditPosts: false,
    unlimitedPosts: false,
    prioritySupport: false,
  },
  premium: {
    monthlyPostLimit: 10,
    editCreditsOnGrant: 10,
    unlimitedEdits: false,
    canEditPosts: true,
    unlimitedPosts: false,
    prioritySupport: true,
  },
  pro: {
    monthlyPostLimit: 999,
    editCreditsOnGrant: 999,
    unlimitedEdits: true,
    canEditPosts: true,
    unlimitedPosts: true,
    prioritySupport: true,
  },
}

export function defaultSubscription(): SubscriptionRecord {
  const limits = TIER_LIMITS.free
  return {
    tier: "free",
    credits: 0,
    postsThisMonth: 0,
    monthlyPostLimit: limits.monthlyPostLimit,
    lastResetDate: new Date().toISOString(),
    expiresAt: null,
    willRenew: false,
    status: "active",
    source: "system",
    productId: null,
    providerCustomerId: null,
    providerSubscriptionId: null,
    updatedAt: new Date().toISOString(),
    features: {
      canEditPosts: limits.canEditPosts,
      unlimitedPosts: limits.unlimitedPosts,
      prioritySupport: limits.prioritySupport,
    },
  }
}

export function normalizeSubscription(raw: Partial<SubscriptionRecord> | null | undefined): SubscriptionRecord {
  const base = defaultSubscription()
  if (!raw || typeof raw !== "object") return base

  const tier = (raw.tier === "premium" || raw.tier === "pro" || raw.tier === "free")
    ? raw.tier
    : "free"
  const limits = TIER_LIMITS[tier]
  const expiresAt = raw.expiresAt || null

  // Expire locally if past due and not renewing
  if (
    tier !== "free" &&
    expiresAt &&
    raw.willRenew === false &&
    new Date(expiresAt).getTime() < Date.now()
  ) {
    return {
      ...base,
      postsThisMonth: typeof raw.postsThisMonth === "number" ? raw.postsThisMonth : 0,
      lastResetDate: raw.lastResetDate || base.lastResetDate,
      status: "expired",
      source: raw.source || "system",
      providerCustomerId: raw.providerCustomerId || null,
      providerSubscriptionId: raw.providerSubscriptionId || null,
      updatedAt: new Date().toISOString(),
    }
  }

  return {
    ...base,
    ...raw,
    tier,
    credits: typeof raw.credits === "number" ? raw.credits : (tier === "pro" ? 999 : base.credits),
    postsThisMonth: typeof raw.postsThisMonth === "number" ? raw.postsThisMonth : 0,
    monthlyPostLimit: limits.monthlyPostLimit,
    expiresAt,
    features: {
      canEditPosts: limits.canEditPosts,
      unlimitedPosts: limits.unlimitedPosts,
      prioritySupport: limits.prioritySupport,
    },
  }
}

export async function getSubscriptionRecord(userId: string): Promise<SubscriptionRecord> {
  const raw = await kv.get(`subscription:${userId}`)
  const normalized = normalizeSubscription(raw)
  // Persist normalization when expired so clients see free consistently
  if (raw && raw.tier !== "free" && normalized.tier === "free" && normalized.status === "expired") {
    await kv.set(`subscription:${userId}`, normalized)
  }
  return normalized
}

export function tierFromProductId(productId: string | null | undefined): SubscriptionTier {
  if (!productId) return "free"
  const id = productId.toLowerCase()
  if (id.includes("premium")) return "premium"
  if (id.includes("pro")) return "pro"
  return "free"
}

export function tierFromRevenueCatEntitlementIds(ids: string[]): SubscriptionTier {
  const lower = ids.map((id) => id.toLowerCase())
  if (lower.some((id) => id === "pro" || (id.includes("pro") && !id.includes("premium")))) {
    return "pro"
  }
  if (lower.some((id) => id.includes("premium"))) return "premium"
  return "free"
}

export interface ApplyEntitlementInput {
  userId: string
  tier: SubscriptionTier
  source: EntitlementSource
  expiresAt?: string | null
  willRenew?: boolean
  status?: SubscriptionRecord["status"]
  productId?: string | null
  providerCustomerId?: string | null
  providerSubscriptionId?: string | null
  /** Provider event id for idempotency */
  eventId?: string | null
  grantCredits?: boolean
}

export async function applyEntitlement(input: ApplyEntitlementInput): Promise<SubscriptionRecord> {
  const {
    userId,
    tier,
    source,
    expiresAt = null,
    willRenew = tier !== "free",
    status = tier === "free" ? "expired" : "active",
    productId = null,
    providerCustomerId = null,
    providerSubscriptionId = null,
    eventId = null,
    grantCredits = true,
  } = input

  if (!userId || typeof userId !== "string") {
    throw new Error("userId required")
  }

  if (eventId) {
    const seen = await kv.get(`entitlement-event:${eventId}`)
    if (seen?.userId === userId) {
      return getSubscriptionRecord(userId)
    }
  }

  const current = await getSubscriptionRecord(userId)
  const limits = TIER_LIMITS[tier]

  let credits = current.credits || 0
  if (grantCredits) {
    if (tier === "pro") {
      credits = Math.max(credits, limits.editCreditsOnGrant)
    } else if (tier === "premium") {
      // Grant edit credits on first premium grant or upgrade from free
      if (current.tier === "free" || current.tier === "pro") {
        credits = Math.max(credits, limits.editCreditsOnGrant)
      } else if (current.tier === "premium" && credits < 1) {
        credits = limits.editCreditsOnGrant
      }
    } else {
      // Downgrade to free — keep unused credits but do not grant more
      credits = Math.min(credits, 50)
    }
  }

  const next: SubscriptionRecord = {
    ...current,
    tier,
    credits,
    monthlyPostLimit: limits.monthlyPostLimit,
    expiresAt,
    willRenew,
    status,
    source,
    productId,
    providerCustomerId: providerCustomerId ?? current.providerCustomerId ?? null,
    providerSubscriptionId: providerSubscriptionId ?? current.providerSubscriptionId ?? null,
    updatedAt: new Date().toISOString(),
    features: {
      canEditPosts: limits.canEditPosts,
      unlimitedPosts: limits.unlimitedPosts,
      prioritySupport: limits.prioritySupport,
    },
  }

  await kv.set(`subscription:${userId}`, next)

  if (eventId) {
    await kv.set(`entitlement-event:${eventId}`, {
      userId,
      tier,
      source,
      at: new Date().toISOString(),
    })
  }

  return next
}

/** Server-side Stripe price id resolution (Edge secrets). */
export function resolveStripePriceId(planId: string): string | null {
  const map: Record<string, string | undefined> = {
    premium_monthly: Deno.env.get("STRIPE_PRICE_PREMIUM_MONTHLY") || undefined,
    premium_yearly: Deno.env.get("STRIPE_PRICE_PREMIUM_YEARLY") || undefined,
    pro_monthly: Deno.env.get("STRIPE_PRICE_PRO_MONTHLY") || undefined,
    pro_yearly: Deno.env.get("STRIPE_PRICE_PRO_YEARLY") || undefined,
  }
  const value = (map[planId] || "").trim()
  return value || null
}

export function planIdFromStripePriceId(priceId: string | null | undefined): string | null {
  if (!priceId) return null
  const entries: Array<[string, string | null]> = [
    ["premium_monthly", resolveStripePriceId("premium_monthly")],
    ["premium_yearly", resolveStripePriceId("premium_yearly")],
    ["pro_monthly", resolveStripePriceId("pro_monthly")],
    ["pro_yearly", resolveStripePriceId("pro_yearly")],
  ]
  for (const [planId, configured] of entries) {
    if (configured && configured === priceId) return planId
  }
  return null
}

export function tierFromPlanId(planId: string | null | undefined): SubscriptionTier {
  if (!planId) return "free"
  if (planId.startsWith("pro_")) return "pro"
  if (planId.startsWith("premium_")) return "premium"
  return "free"
}
