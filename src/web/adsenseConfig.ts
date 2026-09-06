/**
 * Website AdSense configuration.
 *
 * Publisher ID confirmed from AdSense UI (pub-3084834499411817).
 * Slot IDs remain empty until ad units can be created after site approval.
 *
 * Ads stay disabled until:
 * 1) slot IDs are filled
 * 2) advertisingConsent is granted via Google-certified CMP / Privacy & Messaging
 *
 * Generator env mirror:
 *   BETWEENUS_ADSENSE_CLIENT_ID=ca-pub-3084834499411817
 *   BETWEENUS_ADSENSE_SLOT_ARTICLE_MID1=
 *   BETWEENUS_ADSENSE_SLOT_ARTICLE_MID2=
 *   BETWEENUS_ADSENSE_SLOT_ARTICLE_AFTER=
 *   BETWEENUS_ADSENSE_CONSENT_READY=true   # only after CMP is live
 */
export const ADSENSE_CLIENT_ID = "ca-pub-3084834499411817"

/** Article template slots only — listing/index cards stay ad-free. */
export const ADSENSE_SLOTS = {
  articleMid1: "",
  articleMid2: "",
  articleAfterContent: "",
} as const

export type AdPlacement = keyof typeof ADSENSE_SLOTS

/**
 * Future CMP / Consent Mode integration point — default false.
 * Do not flip to true until Privacy & Messaging (EEA) is configured.
 */
export const advertisingConsent = false

/** Auto Ads / vignettes are intentionally OFF until explicitly reviewed. */
export const ADSENSE_AUTO_ADS_ENABLED = false

export function isAdSenseConfigured(): boolean {
  return (
    /^ca-pub-\d{10,}$/.test(ADSENSE_CLIENT_ID) &&
    Object.values(ADSENSE_SLOTS).some((slot) => /^\d{5,}$/.test(slot))
  )
}

export function canRenderAdSlot(placement: AdPlacement): boolean {
  if (!isAdSenseConfigured()) return false
  if (!advertisingConsent) return false
  const slot = ADSENSE_SLOTS[placement]
  return /^\d{5,}$/.test(slot)
}
