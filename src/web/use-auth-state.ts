import { useCallback, useEffect, useState } from 'react'
import { getSession, handleOAuthCallback, type User } from '../utils/auth'

export type AuthStatus = 'loading' | 'loggedOut' | 'loggedIn'

export interface AuthState {
  status: AuthStatus
  user: User | null
  accessToken: string | null
  refresh: () => void
}

/**
 * Three-state auth for web: loading → loggedOut | loggedIn.
 * Avoids rendering the public landing while the session is still resolving.
 */
export function useAuthState(): AuthState {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  const refresh = useCallback(() => {
    const session = getSession()
    if (session?.accessToken && session.user) {
      setUser(session.user)
      setAccessToken(session.accessToken)
      setStatus('loggedIn')
      return
    }
    setUser(null)
    setAccessToken(null)
    setStatus('loggedOut')
  }, [])

  useEffect(() => {
    let cancelled = false

    const resolve = async () => {
      try {
        await handleOAuthCallback()
      } catch (error) {
        console.warn('OAuth callback handling failed', error)
      }
      if (cancelled) return
      refresh()
    }

    void resolve()

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'between_us_session' || event.key === 'between_us_user') {
        refresh()
      }
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener('betweenus:auth-changed', refresh as EventListener)

    return () => {
      cancelled = true
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('betweenus:auth-changed', refresh as EventListener)
    }
  }, [refresh])

  return { status, user, accessToken, refresh }
}

export function notifyAuthChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('betweenus:auth-changed'))
  }
}
