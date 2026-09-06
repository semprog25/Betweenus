/**
 * Complete authenticated account deletion for store / GDPR compliance.
 * Deletes user-owned KV, storage, and auth user. Does not delete other users' content
 * except scrubbing this user's votes/replies/flags from shared posts.
 */
import * as kv from "./kv_store.tsx"
import { getSupabaseAdmin } from "./security.tsx"

export interface AccountDeletionSummary {
  deletedKeys: number
  deletedStorageObjects: number
  scrubbedPosts: number
  authDeleted: boolean
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

async function deleteKeys(keys: string[]): Promise<number> {
  const unique = [...new Set(keys.filter((k) => typeof k === "string" && k.length > 0))]
  if (!unique.length) return 0
  for (const batch of chunkArray(unique, 100)) {
    await kv.mdel(batch)
  }
  return unique.length
}

async function deletePrefixKeys(prefix: string): Promise<number> {
  const entries = await kv.getEntriesByPrefix(prefix)
  return deleteKeys(entries.map((e) => e.key))
}

async function deleteUserStorageFolder(userId: string): Promise<number> {
  const supabase = getSupabaseAdmin()
  let deleted = 0
  const { data: files, error } = await supabase.storage.from("post-images").list(userId, {
    limit: 1000,
  })
  if (error) {
    console.error("Storage list error during account deletion:", error.message)
    return 0
  }
  if (!files?.length) return 0
  const paths = files.map((f) => `${userId}/${f.name}`)
  for (const batch of chunkArray(paths, 100)) {
    const { error: removeError } = await supabase.storage.from("post-images").remove(batch)
    if (removeError) {
      console.error("Storage remove error during account deletion:", removeError.message)
    } else {
      deleted += batch.length
    }
  }
  return deleted
}

function scrubActorFromPost(post: any, userId: string): { changed: boolean; post: any } {
  if (!post || typeof post !== "object") return { changed: false, post }
  let changed = false
  const next = { ...post }

  if (Array.isArray(next.upvotedBy)) {
    const filtered = next.upvotedBy.filter((id: string) => id !== userId)
    if (filtered.length !== next.upvotedBy.length) {
      next.upvotedBy = filtered
      next.upvotes = filtered.length
      changed = true
    }
  }
  if (Array.isArray(next.downvotedBy)) {
    const filtered = next.downvotedBy.filter((id: string) => id !== userId)
    if (filtered.length !== next.downvotedBy.length) {
      next.downvotedBy = filtered
      next.downvotes = filtered.length
      changed = true
    }
  }
  if (Array.isArray(next.flaggedBy)) {
    const filtered = next.flaggedBy.filter((id: string) => id !== userId)
    if (filtered.length !== next.flaggedBy.length) {
      next.flaggedBy = filtered
      next.flagCount = filtered.length
      changed = true
    }
  }
  if (Array.isArray(next.replies)) {
    const replies = next.replies
      .map((reply: any) => {
        if (!reply || typeof reply !== "object") return reply
        let replyChanged = false
        const r = { ...reply }
        if (r.userId === userId) {
          // Remove the reply entirely — it is owned by the deleting user
          return null
        }
        if (Array.isArray(r.upvotedBy)) {
          const filtered = r.upvotedBy.filter((id: string) => id !== userId)
          if (filtered.length !== r.upvotedBy.length) {
            r.upvotedBy = filtered
            r.upvotes = filtered.length
            replyChanged = true
          }
        }
        if (Array.isArray(r.downvotedBy)) {
          const filtered = r.downvotedBy.filter((id: string) => id !== userId)
          if (filtered.length !== r.downvotedBy.length) {
            r.downvotedBy = filtered
            r.downvotes = filtered.length
            replyChanged = true
          }
        }
        return replyChanged ? r : reply
      })
      .filter((r: any) => r != null)
    if (replies.length !== next.replies.length || replies.some((r: any, i: number) => r !== next.replies[i])) {
      next.replies = replies
      changed = true
    }
  }
  return { changed, post: next }
}

/**
 * Scrub the deleting user from other users' posts (votes, flags, replies).
 * Does not delete posts owned by others.
 */
async function scrubSharedPosts(userId: string): Promise<number> {
  const entries = await kv.getEntriesByPrefix("post:")
  let scrubbed = 0
  for (const entry of entries) {
    const post = entry.value
    if (!post || post.userId === userId) continue
    const { changed, post: next } = scrubActorFromPost(post, userId)
    if (!changed) continue
    await kv.set(entry.key, next)
    if (next.userId) {
      await kv.set(`user-post:${next.userId}:${next.id}`, next)
    }
    scrubbed += 1
  }
  return scrubbed
}

async function deleteOwnedPosts(userId: string): Promise<number> {
  const entries = await kv.getEntriesByPrefix(`user-post:${userId}:`)
  const keysToDelete: string[] = []
  for (const entry of entries) {
    keysToDelete.push(entry.key)
    const post = entry.value
    if (post?.id) {
      keysToDelete.push(`post:${post.id}`)
      // Reports about this post
      const reportEntries = await kv.getEntriesByPrefix(`post-report:${post.id}:`)
      for (const reportEntry of reportEntries) {
        keysToDelete.push(reportEntry.key)
        const reportId = reportEntry.value?.id || reportEntry.value?.reportId
        if (reportId) keysToDelete.push(`report:${reportId}`)
      }
      const byUser = await kv.getEntriesByPrefix(`post-report-by-user:${post.id}:`)
      keysToDelete.push(...byUser.map((e) => e.key))
    }
  }
  return deleteKeys(keysToDelete)
}

async function deleteUserReports(userId: string): Promise<number> {
  const reports = await kv.getEntriesByPrefix("report:")
  const keys: string[] = []
  for (const entry of reports) {
    if (entry.value?.reporterId !== userId) continue
    keys.push(entry.key)
    const postId = entry.value?.postId
    const reportId = entry.value?.id
    if (postId && reportId) {
      keys.push(`post-report:${postId}:${reportId}`)
      keys.push(`post-report-by-user:${postId}:${userId}`)
    }
  }
  return deleteKeys(keys)
}

async function deleteCheckIns(userId: string): Promise<number> {
  const byDate = await kv.getEntriesByPrefix(`check-in-by-user-date:${userId}:`)
  const keys = byDate.map((e) => e.key)
  for (const entry of byDate) {
    const id = entry.value?.id
    if (id) keys.push(`check-in:${id}`)
  }
  return deleteKeys(keys)
}

async function deleteJournal(userId: string): Promise<number> {
  const byUser = await kv.getEntriesByPrefix(`journal-by-user:${userId}:`)
  const keys = byUser.map((e) => e.key)
  for (const entry of byUser) {
    const id = entry.value?.id
    if (id) keys.push(`journal:${id}`)
  }
  return deleteKeys(keys)
}

/**
 * Full account deletion. Call only after requireAuth confirms JWT userId.
 */
export async function deleteUserAccountData(
  userId: string,
  username?: string | null,
): Promise<AccountDeletionSummary> {
  let deletedKeys = 0

  if (username) {
    deletedKeys += await deleteKeys([`username:${String(username).toLowerCase()}`])
  }

  deletedKeys += await deleteKeys([
    `subscription:${userId}`,
    `welcome-email-sent:${userId}`,
    `user-profile:${userId}`,
  ])

  deletedKeys += await deleteCheckIns(userId)
  deletedKeys += await deleteJournal(userId)
  deletedKeys += await deletePrefixKeys(`daily-streak-activity:${userId}:`)
  deletedKeys += await deletePrefixKeys(`user-reply:${userId}:`)
  deletedKeys += await deleteOwnedPosts(userId)
  deletedKeys += await deleteUserReports(userId)

  // Scrub votes/replies on other users' posts after owned posts are gone
  const scrubbedPosts = await scrubSharedPosts(userId)

  // Catch any remaining user-scoped prefixes
  deletedKeys += await deletePrefixKeys(`user-post:${userId}:`)
  deletedKeys += await deletePrefixKeys(`check-in-by-user-date:${userId}:`)
  deletedKeys += await deletePrefixKeys(`journal-by-user:${userId}:`)

  const deletedStorageObjects = await deleteUserStorageFolder(userId)

  // Best-effort relational tables (may not exist on this project)
  const supabase = getSupabaseAdmin()
  try {
    await supabase.from("user_profiles").delete().eq("user_id", userId)
  } catch {
    // table may not exist
  }
  try {
    await supabase.from("user_activity_log").delete().eq("user_id", userId)
  } catch {
    // table may not exist
  }

  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) {
    console.error("Auth deleteUser failed:", error)
    throw new Error("Failed to delete auth user")
  }

  return {
    deletedKeys,
    deletedStorageObjects,
    scrubbedPosts,
    authDeleted: true,
  }
}
