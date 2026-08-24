/**
 * Deep-link + OAuth callback handling for Capacitor (iOS / Android).
 * Website stays canonical for https://betweenus.fun/ — only story paths are app-eligible.
 */

import { App as CapacitorApp, type URLOpenListenerEvent } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import {
  handleOAuthCallback,
  processAuthCallbackUrl,
  consumePendingAuthAction,
  type PendingAuthAction,
} from './auth'
import { isNativeMobile } from './platform'
import {
  ANDROID_URL_SCHEME,
  CANONICAL_SITE_URL,
  IOS_URL_SCHEME,
} from '../config/site'

const NATIVE_URL_SCHEMES = [ANDROID_URL_SCHEME, IOS_URL_SCHEME] as const

const PENDING_STORY_KEY = 'between_us_open_story_id'

export type DeepLinkHandlers = {
  onAuthenticated?: (pending: PendingAuthAction | null) => void
  onStoryOpen?: (storyId: string) => void
}

function extractStoryId(url: string): string | null {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname.replace(/\/+$/, '') || '/'
    const match = path.match(/^\/story\/([^/]+)$/)
    if (match) return decodeURIComponent(match[1])

    // Custom schemes: com.betweenus.app://story/<id> (Android) | com.betweenus.fun://story/<id> (iOS)
    const scheme = parsed.protocol.replace(':', '')
    const isNativeScheme = NATIVE_URL_SCHEMES.some(
      (s) => scheme === s || url.startsWith(`${s}://`),
    )
    if (isNativeScheme) {
      const hostPath = `${parsed.hostname}${parsed.pathname}`.replace(/^\/+/, '')
      const custom = hostPath.match(/^story\/([^/]+)$/)
      if (custom) return decodeURIComponent(custom[1])
    }
  } catch {
    const fallback = url.match(/\/story\/([^/?#]+)/)
    if (fallback) return decodeURIComponent(fallback[1])
  }
  return null
}

function isAuthCallbackUrl(url: string): boolean {
  return (
    url.includes('://auth/callback') ||
    url.includes('access_token=') ||
    url.includes('code=') ||
    url.includes('error=')
  )
}

function isRootWebsiteOnly(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (!parsed.hostname.endsWith('betweenus.fun')) return false
    const path = parsed.pathname.replace(/\/+$/, '') || '/'
    return path === '/'
  } catch {
    return false
  }
}

export function stashOpenStoryId(storyId: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PENDING_STORY_KEY, storyId)
  } catch {
    // ignore quota
  }
}

export function consumeOpenStoryId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const id = localStorage.getItem(PENDING_STORY_KEY)
    if (id) localStorage.removeItem(PENDING_STORY_KEY)
    return id
  } catch {
    return null
  }
}

async function handleIncomingUrl(url: string, handlers: DeepLinkHandlers) {
  if (!url) return

  // Never hijack the marketing homepage into the app shell via deep-link logic.
  if (isRootWebsiteOnly(url)) return

  if (isAuthCallbackUrl(url)) {
    const session = await processAuthCallbackUrl(url)
    try {
      await Browser.close()
    } catch {
      // Browser may already be closed
    }
    if (session) {
      const pending = consumePendingAuthAction()
      handlers.onAuthenticated?.(pending)
    }
    return
  }

  const storyId = extractStoryId(url)
  if (storyId) {
    stashOpenStoryId(storyId)
    handlers.onStoryOpen?.(storyId)
  }
}

/**
 * Register Capacitor appUrlOpen + cold-start launch URL handling.
 * Safe no-op deep-link listener on web; still processes OAuth return.
 */
export async function registerDeepLinkHandlers(handlers: DeepLinkHandlers = {}) {
  if (!isNativeMobile()) {
    const session = await handleOAuthCallback()
    if (session) {
      const pending = consumePendingAuthAction()
      handlers.onAuthenticated?.(pending)
    }
    return () => {}
  }

  const listener = await CapacitorApp.addListener(
    'appUrlOpen',
    async (event: URLOpenListenerEvent) => {
      await handleIncomingUrl(event.url, handlers)
    },
  )

  try {
    const launchUrl = await CapacitorApp.getLaunchUrl()
    if (launchUrl?.url) {
      await handleIncomingUrl(launchUrl.url, handlers)
    }
  } catch {
    // getLaunchUrl not available on all platforms/versions
  }

  // Also process in-app OAuth hash/query if WebView lands on a callback without leaving.
  const session = await handleOAuthCallback()
  if (session) {
    const pending = consumePendingAuthAction()
    handlers.onAuthenticated?.(pending)
  }

  return () => {
    listener.remove()
  }
}

export function buildWebsiteStoryUrl(storyId: string): string {
  return `${CANONICAL_SITE_URL}/story/${encodeURIComponent(storyId)}`
}
