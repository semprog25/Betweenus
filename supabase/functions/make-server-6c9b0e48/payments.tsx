/**
 * Stripe + RevenueCat payment helpers for Edge Functions.
 * Secrets stay in Deno.env — never returned to clients.
 */
import {
  applyEntitlement,
  planIdFromStripePriceId,
  resolveStripePriceId,
  tierFromPlanId,
  tierFromProductId,
  tierFromRevenueCatEntitlementIds,
  type SubscriptionTier,
} from "./entitlements.tsx"

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let out = 0
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return out === 0
}

export function getStripeSecretKey(): string | null {
  return (Deno.env.get("STRIPE_SECRET_KEY") || "").trim() || null
}

export function getStripeWebhookSecret(): string | null {
  return (Deno.env.get("STRIPE_WEBHOOK_SECRET") || "").trim() || null
}

export function getRevenueCatWebhookSecret(): string | null {
  return (Deno.env.get("REVENUECAT_WEBHOOK_SECRET") || "").trim() || null
}

export function isStripeConfigured(): boolean {
  return Boolean(getStripeSecretKey()) &&
    Boolean(resolveStripePriceId("premium_monthly") || resolveStripePriceId("pro_monthly"))
}

export async function stripeRequest(
  path: string,
  init: { method?: string; form?: Record<string, string> } = {},
): Promise<{ ok: boolean; status: number; json: any; text: string }> {
  const key = getStripeSecretKey()
  if (!key) {
    return { ok: false, status: 503, json: { error: "Stripe not configured" }, text: "" }
  }

  const body = init.form
    ? new URLSearchParams(init.form).toString()
    : undefined

  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: init.method || "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  })
  const text = await res.text()
  let json: any = null
  try {
    json = JSON.parse(text)
  } catch {
    json = null
  }
  return { ok: res.ok, status: res.status, json, text }
}

/** Verify Stripe-Signature header (v1). */
export async function verifyStripeWebhookSignature(
  payload: string,
  signatureHeader: string | null,
  secret: string,
  toleranceSec = 300,
): Promise<boolean> {
  if (!signatureHeader || !secret) return false

  const parts = signatureHeader.split(",").map((p) => p.trim())
  const timestampPart = parts.find((p) => p.startsWith("t="))
  const v1Parts = parts.filter((p) => p.startsWith("v1=")).map((p) => p.slice(3))
  if (!timestampPart || v1Parts.length === 0) return false

  const timestamp = Number(timestampPart.slice(2))
  if (!Number.isFinite(timestamp)) return false
  const age = Math.abs(Math.floor(Date.now() / 1000) - timestamp)
  if (age > toleranceSec) return false

  const signedPayload = `${timestamp}.${payload}`
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload))
  const expected = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  return v1Parts.some((candidate) => timingSafeEqual(candidate, expected))
}

export function verifyRevenueCatWebhookAuth(
  authorizationHeader: string | null,
  secret: string,
): boolean {
  if (!authorizationHeader || !secret) return false
  const raw = authorizationHeader.trim()
  const bearer = raw.toLowerCase().startsWith("bearer ")
    ? raw.slice(7).trim()
    : raw
  return timingSafeEqual(bearer, secret)
}

export async function createStripeCheckoutSession(params: {
  userId: string
  email?: string | null
  planId: string
  successUrl: string
  cancelUrl: string
}): Promise<{ url?: string; error?: string; code?: string }> {
  const priceId = resolveStripePriceId(params.planId)
  if (!priceId) {
    return { error: "Stripe price is not configured for this plan", code: "STRIPE_PRICE_MISSING" }
  }
  if (!getStripeSecretKey()) {
    return { error: "Stripe is not configured", code: "STRIPE_NOT_CONFIGURED" }
  }

  const form: Record<string, string> = {
    mode: "subscription",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    client_reference_id: params.userId,
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    "metadata[betweenus_user_id]": params.userId,
    "metadata[plan_id]": params.planId,
    "subscription_data[metadata][betweenus_user_id]": params.userId,
    "subscription_data[metadata][plan_id]": params.planId,
  }
  if (params.email) {
    form.customer_email = params.email
  }

  const result = await stripeRequest("/checkout/sessions", { method: "POST", form })
  if (!result.ok || !result.json?.url) {
    return {
      error: result.json?.error?.message || "Failed to create Checkout session",
      code: "STRIPE_CHECKOUT_FAILED",
    }
  }
  return { url: result.json.url as string }
}

export async function createStripeBillingPortalSession(params: {
  customerId: string
  returnUrl: string
}): Promise<{ url?: string; error?: string; code?: string }> {
  if (!getStripeSecretKey()) {
    return { error: "Stripe is not configured", code: "STRIPE_NOT_CONFIGURED" }
  }
  const result = await stripeRequest("/billing_portal/sessions", {
    method: "POST",
    form: {
      customer: params.customerId,
      return_url: params.returnUrl,
    },
  })
  if (!result.ok || !result.json?.url) {
    return {
      error: result.json?.error?.message || "Failed to open billing portal",
      code: "STRIPE_PORTAL_FAILED",
    }
  }
  return { url: result.json.url as string }
}

function mapStripeSubscriptionStatus(status: string | undefined): {
  tierActive: boolean
  status: "active" | "canceled" | "expired" | "past_due" | "trialing" | "incomplete"
  willRenew: boolean
} {
  switch (status) {
    case "active":
      return { tierActive: true, status: "active", willRenew: true }
    case "trialing":
      return { tierActive: true, status: "trialing", willRenew: true }
    case "past_due":
      return { tierActive: true, status: "past_due", willRenew: true }
    case "canceled":
      return { tierActive: false, status: "canceled", willRenew: false }
    case "unpaid":
    case "incomplete_expired":
      return { tierActive: false, status: "expired", willRenew: false }
    case "incomplete":
      return { tierActive: false, status: "incomplete", willRenew: false }
    default:
      return { tierActive: false, status: "expired", willRenew: false }
  }
}

export async function handleStripeWebhookEvent(event: any): Promise<{ handled: boolean; detail?: string }> {
  const type = String(event?.type || "")
  const obj = event?.data?.object
  if (!obj) return { handled: false, detail: "missing object" }

  if (type === "checkout.session.completed") {
    const userId = obj.client_reference_id || obj.metadata?.betweenus_user_id
    const planId = obj.metadata?.plan_id || null
    if (!userId || typeof userId !== "string") {
      return { handled: false, detail: "missing betweenus user id" }
    }
    const tier = tierFromPlanId(planId)
    if (tier === "free") return { handled: false, detail: "unknown plan" }

    await applyEntitlement({
      userId,
      tier,
      source: "stripe",
      status: "active",
      willRenew: true,
      productId: planId,
      providerCustomerId: obj.customer || null,
      providerSubscriptionId: obj.subscription || null,
      eventId: event.id,
      grantCredits: true,
    })
    return { handled: true, detail: `checkout granted ${tier}` }
  }

  if (
    type === "customer.subscription.updated" ||
    type === "customer.subscription.deleted" ||
    type === "customer.subscription.created"
  ) {
    const userId = obj.metadata?.betweenus_user_id
    if (!userId || typeof userId !== "string") {
      return { handled: false, detail: "missing betweenus user id on subscription" }
    }

    const priceId = obj.items?.data?.[0]?.price?.id || null
    const planId = planIdFromStripePriceId(priceId) || obj.metadata?.plan_id || null
    const mapped = mapStripeSubscriptionStatus(obj.status)
    const cancelAtPeriodEnd = Boolean(obj.cancel_at_period_end)
    const expiresAt = obj.current_period_end
      ? new Date(Number(obj.current_period_end) * 1000).toISOString()
      : null

    let tier: SubscriptionTier = "free"
    if (mapped.tierActive) {
      tier = tierFromPlanId(planId)
      if (tier === "free") tier = tierFromProductId(priceId)
    }

    await applyEntitlement({
      userId,
      tier,
      source: "stripe",
      status: mapped.status,
      willRenew: mapped.willRenew && !cancelAtPeriodEnd && type !== "customer.subscription.deleted",
      expiresAt,
      productId: planId || priceId,
      providerCustomerId: obj.customer || null,
      providerSubscriptionId: obj.id || null,
      eventId: event.id,
      grantCredits: tier !== "free" && type !== "customer.subscription.deleted",
    })
    return { handled: true, detail: `subscription ${type} → ${tier}` }
  }

  if (type === "invoice.payment_failed") {
    const userId = obj.subscription_details?.metadata?.betweenus_user_id ||
      obj.lines?.data?.[0]?.metadata?.betweenus_user_id
    // Soft signal — keep access until Stripe cancels; mark past_due if we know the user
    if (userId && typeof userId === "string") {
      const priceId = obj.lines?.data?.[0]?.price?.id
      const planId = planIdFromStripePriceId(priceId)
      const tier = tierFromPlanId(planId)
      if (tier !== "free") {
        await applyEntitlement({
          userId,
          tier,
          source: "stripe",
          status: "past_due",
          willRenew: true,
          productId: planId || priceId,
          providerCustomerId: obj.customer || null,
          providerSubscriptionId: obj.subscription || null,
          eventId: event.id,
          grantCredits: false,
        })
        return { handled: true, detail: "marked past_due" }
      }
    }
    return { handled: false, detail: "payment_failed without user mapping" }
  }

  return { handled: false, detail: `ignored ${type}` }
}

export async function handleRevenueCatWebhookEvent(event: any): Promise<{ handled: boolean; detail?: string }> {
  const payload = event?.event || event
  const type = String(payload?.type || "")
  const appUserId = payload?.app_user_id || payload?.original_app_user_id
  if (!appUserId || typeof appUserId !== "string") {
    return { handled: false, detail: "missing app_user_id" }
  }

  // Ignore anonymous / RC-generated ids that are not our UUID auth users
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidPattern.test(appUserId)) {
    return { handled: false, detail: "app_user_id is not a Between Us auth UUID" }
  }

  const productId = payload?.product_id || payload?.new_product_id || null
  const entitlementIds: string[] = Array.isArray(payload?.entitlement_ids)
    ? payload.entitlement_ids
    : (payload?.entitlement_id ? [payload.entitlement_id] : [])

  let tier: SubscriptionTier = entitlementIds.length
    ? tierFromRevenueCatEntitlementIds(entitlementIds)
    : tierFromProductId(productId)

  const expirationAt = payload?.expiration_at_ms
    ? new Date(Number(payload.expiration_at_ms)).toISOString()
    : (payload?.expiration_at ? new Date(payload.expiration_at).toISOString() : null)

  const revokeTypes = new Set([
    "EXPIRATION",
    "CANCELLATION",
    "SUBSCRIPTION_PAUSED",
  ])
  const grantTypes = new Set([
    "INITIAL_PURCHASE",
    "RENEWAL",
    "PRODUCT_CHANGE",
    "UNCANCELLATION",
    "NON_RENEWING_PURCHASE",
  ])

  if (revokeTypes.has(type) && type === "EXPIRATION") {
    tier = "free"
  }
  if (type === "CANCELLATION") {
    // Access continues until expiration — keep tier, mark willRenew false
  }
  if (!grantTypes.has(type) && !revokeTypes.has(type) && type !== "BILLING_ISSUE") {
    return { handled: false, detail: `ignored ${type}` }
  }

  if (type === "BILLING_ISSUE" && tier !== "free") {
    await applyEntitlement({
      userId: appUserId,
      tier,
      source: "revenuecat",
      status: "past_due",
      willRenew: true,
      expiresAt: expirationAt,
      productId,
      eventId: payload?.id || `${type}:${appUserId}:${productId}:${payload?.event_timestamp_ms || ""}`,
      grantCredits: false,
    })
    return { handled: true, detail: "billing issue → past_due" }
  }

  const isExpired = type === "EXPIRATION"
  await applyEntitlement({
    userId: appUserId,
    tier: isExpired ? "free" : tier,
    source: "revenuecat",
    status: isExpired ? "expired" : (type === "CANCELLATION" ? "canceled" : "active"),
    willRenew: type === "CANCELLATION" ? false : !isExpired,
    expiresAt: expirationAt,
    productId,
    eventId: payload?.id || `${type}:${appUserId}:${productId}:${payload?.event_timestamp_ms || ""}`,
    grantCredits: !isExpired && tier !== "free",
  })

  return { handled: true, detail: `${type} → ${isExpired ? "free" : tier}` }
}
