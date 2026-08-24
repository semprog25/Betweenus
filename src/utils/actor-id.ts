import { getSession } from './auth'

const ANON_ID_KEY = 'between_us_anon_id'
const ANON_ID_PATTERN = /^anonymous-user-[a-z0-9]{6,24}$/

/**
 * Returns a stable voter/actor ID for the current user session.
 * Authenticated users use Supabase user id; anonymous users use a validated local ID.
 */
export function getActorId(): string | null {
  const session = getSession()
  if (session?.user?.id) return session.user.id

  if (typeof window === 'undefined') return null

  let anonId = localStorage.getItem(ANON_ID_KEY)
  if (!anonId || !ANON_ID_PATTERN.test(anonId)) {
    anonId = `anonymous-user-${Math.random().toString(36).slice(2, 11)}`
    localStorage.setItem(ANON_ID_KEY, anonId)
  }
  return anonId
}

export function getActorIdForRequest(): { userId: string } | { error: string } {
  const actorId = getActorId()
  if (!actorId) return { error: 'Unable to resolve user identity' }
  return { userId: actorId }
}
