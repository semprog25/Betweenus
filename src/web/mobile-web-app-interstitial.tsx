import { useEffect, useState } from 'react'
import { isNativeMobile } from '../utils/platform'
import {
  HAS_APP_STORE_LISTING,
  PLAY_STORE_URL,
  ANDROID_PACKAGE_ID,
  IOS_BUNDLE_ID,
} from '../config/site'

const CONTINUE_KEY = 'between_us_continue_web_app'
const PHONE_MQ = '(max-width: 767px)'

/** App Store product page once listing is live — never invent a fake ID URL. */
const APP_STORE_URL = HAS_APP_STORE_LISTING
  ? 'https://apps.apple.com/app/between-us/id6804737494'
  : '/download'

function isPhoneViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(PHONE_MQ).matches
}

function tryOpenNativeApp(): void {
  if (typeof window === 'undefined') return
  const ua = window.navigator.userAgent || ''
  const isIOS = /iPhone|iPad|iPod/i.test(ua)
  const isAndroid = /Android/i.test(ua)

  if (isAndroid) {
    const intent = `intent://app#Intent;scheme=https;package=${ANDROID_PACKAGE_ID};S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`
    window.location.href = intent
    return
  }

  if (isIOS) {
    window.location.href = `${IOS_BUNDLE_ID}://`
  }
}

interface MobileWebAppInterstitialProps {
  children: React.ReactNode
}

/**
 * Phone-sized browsers see a short product orientation before the authenticated web app.
 * Primary action: continue into the web app. App download is secondary.
 * Desktop/tablet and native shells pass through.
 */
export function MobileWebAppInterstitial({ children }: MobileWebAppInterstitialProps) {
  const [shouldGate, setShouldGate] = useState(false)
  const [ready, setReady] = useState(false)
  const [showStores, setShowStores] = useState(false)

  useEffect(() => {
    if (isNativeMobile()) {
      setShouldGate(false)
      setReady(true)
      return
    }

    let continued = false
    try {
      continued = sessionStorage.getItem(CONTINUE_KEY) === '1'
    } catch {
      continued = false
    }

    const phone = isPhoneViewport()
    setShouldGate(phone && !continued)
    setReady(true)

    const mq = window.matchMedia(PHONE_MQ)
    const onChange = () => {
      let stillContinued = false
      try {
        stillContinued = sessionStorage.getItem(CONTINUE_KEY) === '1'
      } catch {
        stillContinued = false
      }
      setShouldGate(mq.matches && !stillContinued)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const handleContinueOnWeb = () => {
    try {
      sessionStorage.setItem(CONTINUE_KEY, '1')
    } catch {
      // ignore
    }
    setShouldGate(false)
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05040a] text-zinc-400">
        <span className="text-sm">Loading Between Us…</span>
      </div>
    )
  }

  if (!shouldGate) return <>{children}</>

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#05040a] px-6 py-12 text-center text-zinc-100">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-fuchsia-300/90">
            Between Us
          </p>
          <h1 className="font-[Syne,system-ui,sans-serif] text-2xl font-semibold leading-tight text-white">
            Anonymous stories from people who get it.
          </h1>
          <p className="text-sm leading-relaxed text-zinc-400">
            Read community Stories, Spill what you can&apos;t say under your real name, and react —
            without turning your secrets into a public profile.
          </p>
          <p className="text-xs leading-relaxed text-zinc-500">
            Your account is for sign-in. What you publish can stay Anonymous to everyone else.
            Private check-ins never appear in the public feed.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleContinueOnWeb}
            className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
          >
            Continue — start with Stories
          </button>
          <button
            type="button"
            onClick={() => setShowStores((open) => !open)}
            className="min-h-[44px] text-sm text-zinc-400 underline-offset-4 hover:text-zinc-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 rounded-lg px-2"
            aria-expanded={showStores}
          >
            {showStores ? 'Hide app options' : 'Prefer the mobile app?'}
          </button>
        </div>

        {showStores && (
          <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() => tryOpenNativeApp()}
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-fuchsia-400/30 bg-fuchsia-500/10 px-4 py-3 text-sm font-semibold text-fuchsia-200 transition-colors hover:bg-fuchsia-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
            >
              Open in app
            </button>
            <a
              href={APP_STORE_URL}
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-white/15 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
            >
              Download on the App Store
            </a>
            <a
              href={PLAY_STORE_URL}
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-purple-400/40 bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
            >
              Get it on Google Play
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
