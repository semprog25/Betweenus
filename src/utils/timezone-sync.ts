import { getSession } from './auth'
import { callServer } from './supabase/client'

/** Platform IANA timezone (Web, iOS, Android via Capacitor WebView). */
export function detectIanaTimezone(): string {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (timeZone && typeof timeZone === 'string') return timeZone
  } catch {
    // fall through
  }
  return 'UTC'
}

let syncInFlight: Promise<void> | null = null

/** Persist timezone when missing or changed; never overwrites on every request client-side. */
export async function syncUserTimezone(): Promise<void> {
  const session = getSession()
  if (!session?.accessToken) return

  const detected = detectIanaTimezone()
  const stored = session.user?.user_metadata?.iana_timezone
  if (typeof stored === 'string' && stored === detected) return

  if (syncInFlight) {
    await syncInFlight
    return
  }

  syncInFlight = (async () => {
    try {
      await callServer('/auth/timezone', {
        method: 'PUT',
        body: JSON.stringify({ iana_timezone: detected }),
      })
    } catch {
      // non-blocking; streak falls back to UTC server-side
    } finally {
      syncInFlight = null
    }
  })()

  await syncInFlight
}
