/**
 * Production site configuration for Between Us.
 * Canonical domain: https://betweenus.fun
 *
 * Platform identities (do not conflate):
 * - Android package: com.betweenus.app
 * - iOS bundle:      com.betweenus.fun
 */

import { isAndroid, isIOS, isNativeMobile } from '../utils/platform'

export const CANONICAL_SITE_URL = 'https://betweenus.fun'

export const SITE_NAME = 'Between Us'

export const SITE_DESCRIPTION =
  'Between Us — write, discover, vote on, and discuss anonymous community stories.'

/** Public contact addresses (canonical — used on website + store listings). */
export const SUPPORT_EMAIL = 'support@betweenus.semprog.de'
export const PRIVACY_EMAIL = 'privacy@betweenus.semprog.de'
export const LEGAL_EMAIL = 'legal@betweenus.semprog.de'

export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.betweenus.app'

/** Set true when App Store listing is live — do not fabricate URLs. */
export const HAS_APP_STORE_LISTING = false

export const SUPABASE_PROJECT_ID = 'qoqbdiixztolvtcjdnle'

export const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`

export const EDGE_FUNCTION_NAME = 'make-server-6c9b0e48'

export const EDGE_FUNCTION_BASE = `${SUPABASE_URL}/functions/v1/${EDGE_FUNCTION_NAME}`

/** Android applicationId / Play package — do not change for iOS migration. */
export const ANDROID_PACKAGE_ID = 'com.betweenus.app'

/** iOS Bundle Identifier (Apple App ID). */
export const IOS_BUNDLE_ID = 'com.betweenus.fun'

/** Custom URL schemes registered per platform. */
export const ANDROID_URL_SCHEME = ANDROID_PACKAGE_ID
export const IOS_URL_SCHEME = IOS_BUNDLE_ID

/**
 * Native custom-scheme for the current platform.
 * Web callers should not rely on this for OAuth redirects.
 */
export const getNativeUrlScheme = (): string => {
  if (isIOS()) return IOS_URL_SCHEME
  if (isAndroid()) return ANDROID_URL_SCHEME
  return ANDROID_URL_SCHEME
}

/** @deprecated Prefer getNativeUrlScheme() — kept for transitional imports. */
export const APP_URL_SCHEME = ANDROID_URL_SCHEME

/** Native OAuth callback for the current platform (must be allowlisted in Supabase Auth). */
export const getNativeOAuthCallbackUrl = (): string =>
  `${getNativeUrlScheme()}://auth/callback`

/** @deprecated Prefer getNativeOAuthCallbackUrl() */
export const NATIVE_OAUTH_CALLBACK_URL = `${ANDROID_URL_SCHEME}://auth/callback`

/** OAuth and Supabase auth redirects must use this origin in production. */
export const getAppOrigin = (): string => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }

  return import.meta.env.VITE_SITE_URL || CANONICAL_SITE_URL
}

export const getOAuthRedirectUrl = (): string => {
  if (isNativeMobile()) {
    return getNativeOAuthCallbackUrl()
  }

  const origin = getAppOrigin()
  return `${origin.replace(/\/$/, '')}/`
}

export const ALLOWED_ORIGINS = [
  CANONICAL_SITE_URL,
  'https://www.betweenus.fun',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
  'https://localhost',
]

export const isProductionOrigin = (origin: string): boolean =>
  origin === CANONICAL_SITE_URL || origin === 'https://www.betweenus.fun'
