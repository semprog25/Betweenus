/**
 * Public Stories showcase selection — prefers popular + recent posts.
 * Does not change the app feed or Edge `/posts?sort=trending` algorithm.
 */

export interface PublicStoryCandidate {
  id: string
  content: string
  isAnonymous?: boolean
  upvotes?: number
  downvotes?: number
  replies?: unknown[]
  replyCount?: number
  createdAt?: string
  /** Epoch ms when present (same field the Edge feed sorts on). */
  timestamp?: number
  categories?: string[]
  imageUrl?: string
}

export const PUBLIC_STORIES_SHOWCASE_LIMIT = 6
export const PUBLIC_STORIES_PREFERRED_DAYS = 30
export const PUBLIC_STORIES_FALLBACK_DAYS = 90
/** Max candidates from each public feed query (matches Edge MAX_FEED_LIMIT). */
export const PUBLIC_STORIES_CANDIDATE_LIMIT = 50

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Prefer ISO `createdAt`; fall back to numeric `timestamp`. */
export function getPostCreatedMs(post: PublicStoryCandidate): number | null {
  if (post.createdAt) {
    const fromIso = new Date(post.createdAt).getTime()
    if (!Number.isNaN(fromIso)) return fromIso
  }
  if (typeof post.timestamp === 'number' && Number.isFinite(post.timestamp) && post.timestamp > 0) {
    return post.timestamp
  }
  return null
}

/** Same score the Edge Function uses for `sort=trending`. */
export function getTrendingScore(post: PublicStoryCandidate): number {
  const totalVotes = (post.upvotes || 0) + (post.downvotes || 0)
  const replyCount =
    typeof post.replyCount === 'number'
      ? post.replyCount
      : Array.isArray(post.replies)
        ? post.replies.length
        : 0
  return totalVotes + replyCount * 2
}

function rankByTrendingThenRecency(posts: PublicStoryCandidate[]): PublicStoryCandidate[] {
  return [...posts].sort((a, b) => {
    const scoreDiff = getTrendingScore(b) - getTrendingScore(a)
    if (scoreDiff !== 0) return scoreDiff
    return (getPostCreatedMs(b) || 0) - (getPostCreatedMs(a) || 0)
  })
}

function postsWithinDays(
  posts: PublicStoryCandidate[],
  days: number,
  nowMs: number,
): PublicStoryCandidate[] {
  const maxAgeMs = days * MS_PER_DAY
  return posts.filter((post) => {
    const createdMs = getPostCreatedMs(post)
    if (createdMs == null) return false
    const ageMs = nowMs - createdMs
    return ageMs >= 0 && ageMs <= maxAgeMs
  })
}

export type PublicPopularStoriesWindow = 'preferred_30d' | 'fallback_90d' | 'trending_fallback'

export interface PublicPopularStoriesSelection {
  posts: PublicStoryCandidate[]
  window: PublicPopularStoriesWindow
  preferredCount: number
  fallbackCount: number
}

/**
 * Select up to 6 public showcase stories:
 * 1) popular within last 30 days
 * 2) else popular within last 90 days (show whatever exists, even if < 6)
 * 3) else existing trending-ordered candidates (final fallback)
 */
export function selectPublicPopularStories(
  candidates: PublicStoryCandidate[],
  options: { nowMs?: number; limit?: number } = {},
): PublicPopularStoriesSelection {
  const nowMs = options.nowMs ?? Date.now()
  const limit = options.limit ?? PUBLIC_STORIES_SHOWCASE_LIMIT
  const unique = new Map<string, PublicStoryCandidate>()
  for (const post of candidates) {
    if (!post?.id || !post.content) continue
    if (!unique.has(post.id)) unique.set(post.id, post)
  }
  const pool = [...unique.values()]

  const preferred = rankByTrendingThenRecency(
    postsWithinDays(pool, PUBLIC_STORIES_PREFERRED_DAYS, nowMs),
  )
  const fallback = rankByTrendingThenRecency(
    postsWithinDays(pool, PUBLIC_STORIES_FALLBACK_DAYS, nowMs),
  )

  if (preferred.length >= limit) {
    return {
      posts: preferred.slice(0, limit),
      window: 'preferred_30d',
      preferredCount: preferred.length,
      fallbackCount: fallback.length,
    }
  }

  if (fallback.length > 0) {
    return {
      posts: fallback.slice(0, limit),
      window: 'fallback_90d',
      preferredCount: preferred.length,
      fallbackCount: fallback.length,
    }
  }

  const trendingFallback = rankByTrendingThenRecency(pool).slice(0, limit)
  return {
    posts: trendingFallback,
    window: 'trending_fallback',
    preferredCount: preferred.length,
    fallbackCount: fallback.length,
  }
}
