/**
 * Production site configuration for Between Us.
 * Canonical domain: https://betweenus.fun
 */

export const CANONICAL_SITE_URL = 'https://betweenus.fun'

export const SITE_NAME = 'Between Us'

export const SITE_DESCRIPTION =
  'Between Us — write, discover, vote on, and discuss anonymous community stories.'

export const SUPABASE_PROJECT_ID = 'qoqbdiixztolvtcjdnle'

export const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`

export const EDGE_FUNCTION_NAME = 'make-server-6c9b0e48'

export const EDGE_FUNCTION_BASE = `${SUPABASE_URL}/functions/v1/${EDGE_FUNCTION_NAME}`

/** OAuth and Supabase auth redirects must use this origin in production. */
export const getAppOrigin = (): string => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }

  return import.meta.env.VITE_SITE_URL || CANONICAL_SITE_URL
}

export const getOAuthRedirectUrl = (): string => {
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
]

export const isProductionOrigin = (origin: string): boolean =>
  origin === CANONICAL_SITE_URL || origin === 'https://www.betweenus.fun'
