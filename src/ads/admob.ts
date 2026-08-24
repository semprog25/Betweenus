import { Capacitor } from '@capacitor/core'
import { getSession } from '../utils/auth'
import { getSubscription } from '../utils/api'

/**
 * AdMob configuration — TEST IDs by default.
 * Set VITE_ADMOB_USE_PRODUCTION=true only for release builds with real unit IDs.
 */
const USE_PRODUCTION = import.meta.env.VITE_ADMOB_USE_PRODUCTION === 'true'

export const ADMOB_TEST = {
  androidAppId: 'ca-app-pub-3940256099942544~3347511713',
  iosAppId: 'ca-app-pub-3940256099942544~1458002511',
  banner: 'ca-app-pub-3940256099942544/6300978111',
  native: 'ca-app-pub-3940256099942544/2247696110',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
} as const

/** Placeholder production unit IDs — replace after AdMob console setup */
export const ADMOB_PRODUCTION = {
  androidAppId: import.meta.env.VITE_ADMOB_ANDROID_APP_ID || '',
  iosAppId: import.meta.env.VITE_ADMOB_IOS_APP_ID || '',
  banner: import.meta.env.VITE_ADMOB_BANNER_UNIT_ID || '',
  native: import.meta.env.VITE_ADMOB_NATIVE_UNIT_ID || '',
  interstitial: import.meta.env.VITE_ADMOB_INTERSTITIAL_UNIT_ID || '',
} as const

export function getAdUnits() {
  if (USE_PRODUCTION && ADMOB_PRODUCTION.banner) return ADMOB_PRODUCTION
  return ADMOB_TEST
}

export function shouldShowAds(): boolean {
  if (!Capacitor.isNativePlatform()) return false
  return true
}

export async function isAdFreeUser(): Promise<boolean> {
  try {
    const session = getSession()
    if (!session?.user?.id) return false
    const res = await getSubscription(session.user.id)
    const tier = res?.subscription?.tier
    return tier === 'premium' || tier === 'pro'
  } catch {
    return false
  }
}

/** Feed cadence: show a labeled ad slot after every N organic posts, starting after offset */
export const FEED_AD_OFFSET = 3
export const FEED_AD_EVERY = 8

export function shouldInsertFeedAd(index: number, adFree: boolean): boolean {
  if (adFree) return false
  if (index < FEED_AD_OFFSET) return false
  return (index - FEED_AD_OFFSET) % FEED_AD_EVERY === 0
}

let initialized = false

/**
 * Initialize AdMob on native platforms only.
 * Safe no-op on web. Failures never block the app.
 */
export async function initializeAdMob(): Promise<void> {
  if (initialized || !shouldShowAds()) return
  try {
    const { AdMob } = await import('@capacitor-community/admob')
    await AdMob.initialize({
      initializeForTesting: !USE_PRODUCTION,
    })
    initialized = true
  } catch (error) {
    console.warn('AdMob init skipped:', error)
  }
}

export async function showInterstitialSafely(): Promise<void> {
  if (!shouldShowAds()) return
  if (await isAdFreeUser()) return
  try {
    const { AdMob, InterstitialAdPluginEvents } = await import('@capacitor-community/admob')
    const units = getAdUnits()
    await AdMob.prepareInterstitial({ adId: units.interstitial })
    await new Promise<void>((resolve) => {
      const handle = AdMob.addListener(InterstitialAdPluginEvents.Loaded, async () => {
        await handle.remove()
        await AdMob.showInterstitial()
        resolve()
      })
      setTimeout(() => resolve(), 4000)
    })
  } catch (error) {
    console.warn('Interstitial unavailable:', error)
  }
}
