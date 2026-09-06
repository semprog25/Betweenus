/**
 * Unit checks for public Stories showcase selection (no network).
 */
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import assert from 'node:assert/strict'
import { transformSync } from 'esbuild'

const sourcePath = path.resolve('src/web/public-popular-stories.ts')
const source = fs.readFileSync(sourcePath, 'utf8')
const { code } = transformSync(source, { loader: 'ts', format: 'esm' })
const tmp = path.resolve('.tmp-public-popular-stories.mjs')
fs.writeFileSync(tmp, code)

const {
  selectPublicPopularStories,
  getTrendingScore,
  getPostCreatedMs,
  PUBLIC_STORIES_SHOWCASE_LIMIT,
} = await import(pathToFileURL(tmp).href + `?t=${Date.now()}`)

const now = Date.parse('2026-08-25T12:00:00.000Z')

function post(partial) {
  return {
    id: partial.id,
    content: partial.content || `story ${partial.id}`,
    upvotes: partial.upvotes ?? 0,
    downvotes: partial.downvotes ?? 0,
    replyCount: partial.replyCount ?? 0,
    createdAt: partial.createdAt,
    timestamp: partial.timestamp,
  }
}

assert.equal(getTrendingScore(post({ id: 'a', upvotes: 3, downvotes: 2, replyCount: 4 })), 13)

const recentPopular = post({
  id: 'r1',
  upvotes: 10,
  replyCount: 1,
  createdAt: '2026-08-10T00:00:00.000Z',
})
const recentQuiet = post({
  id: 'r2',
  upvotes: 1,
  replyCount: 0,
  createdAt: '2026-08-20T00:00:00.000Z',
})
const midWindow = post({
  id: 'm1',
  upvotes: 50,
  replyCount: 5,
  createdAt: '2026-07-01T00:00:00.000Z',
})
const ancientViral = post({
  id: 'old1',
  upvotes: 500,
  replyCount: 20,
  createdAt: '2025-11-22T00:00:00.000Z',
})

{
  // Fewer than 6 in 30d → expand to 90d pool (includes 30d + mid)
  const selected = selectPublicPopularStories(
    [ancientViral, recentQuiet, recentPopular, midWindow],
    { nowMs: now },
  )
  assert.equal(selected.window, 'fallback_90d')
  assert.deepEqual(selected.posts.map((p) => p.id), ['m1', 'r1', 'r2'])
  assert.equal(selected.preferredCount, 2)
}

{
  const manyRecent = Array.from({ length: 8 }, (_, i) =>
    post({
      id: `n${i}`,
      upvotes: i * 10,
      replyCount: i,
      createdAt: '2026-08-15T00:00:00.000Z',
    }),
  )
  const selected = selectPublicPopularStories([...manyRecent, ancientViral], { nowMs: now })
  assert.equal(selected.window, 'preferred_30d')
  assert.equal(selected.posts.length, PUBLIC_STORIES_SHOWCASE_LIMIT)
  assert.equal(selected.posts[0].id, 'n7')
  assert.ok(!selected.posts.some((p) => p.id === 'old1'))
}

{
  const selected = selectPublicPopularStories([ancientViral, midWindow], { nowMs: now })
  assert.equal(selected.window, 'fallback_90d')
  assert.deepEqual(selected.posts.map((p) => p.id), ['m1'])
}

{
  const selected = selectPublicPopularStories([ancientViral], { nowMs: now })
  assert.equal(selected.window, 'trending_fallback')
  assert.deepEqual(selected.posts.map((p) => p.id), ['old1'])
}

assert.equal(
  getPostCreatedMs(post({ id: 't', createdAt: '2026-01-01T00:00:00.000Z' })),
  Date.parse('2026-01-01T00:00:00.000Z'),
)
assert.equal(getPostCreatedMs(post({ id: 't2', timestamp: 1700000000000 })), 1700000000000)

fs.unlinkSync(tmp)
console.log('test-public-popular-stories: ok')
