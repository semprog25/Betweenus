/**
 * Production site configuration for Between Us.
 * Canonical domain: https://betweenus.fun
 */

import { isNativeMobile } from '../utils/platform'

export const CANONICAL_SITE_URL = 'https://betweenus.fun'

export const SITE_NAME = 'Between Us'

export const SITE_DESCRIPTION =
  'Between Us — write, discover, vote on, and discuss anonymous community stories.'

export const SUPABASE_PROJECT_ID = 'qoqbdiixztolvtcjdnle'

export const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`

export const EDGE_FUNCTION_NAME = 'make-server-6c9b0e48'

export const EDGE_FUNCTION_BASE = `${SUPABASE_URL}/functions/v1/${EDGE_FUNCTION_NAME}`

/** Custom URL scheme registered in iOS Info.plist / Android intent-filters. */
export const APP_URL_SCHEME = 'com.betweenus.app'

/** Native OAuth callback deep link (must also be allowlisted in Supabase Auth). */
export const NATIVE_OAUTH_CALLBACK_URL = `${APP_URL_SCHEME}://auth/callback`

/** OAuth and Supabase auth redirects must use this origin in production. */
export const getAppOrigin = (): string => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }

  return import.meta.env.VITE_SITE_URL || CANONICAL_SITE_URL
}

export const getOAuthRedirectUrl = (): string => {
  if (isNativeMobile()) {
    return NATIVE_OAUTH_CALLBACK_URL
  }

  const origin = getAppOrigin()
  return `${origin.replace(/\/$/, '')}/`
}

export const ALLOWED_ORIGINS = [
  CANONICAL_SITE_URL,
  'https://www.betweenus.fun',
  'http://localhost:3000',
  'http://localhost:5173',
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
  'https://localhost',
]

export const isProductionOrigin = (origin: string): boolean =>
  origin === CANONICAL_SITE_URL || origin === 'https://www.betweenus.fun'
