/**
 * API Service Layer for Between Us
 * Easy-to-use functions for all backend operations
 */

import { callServer } from './supabase/client';
import { getActorId, getActorIdForRequest } from './actor-id';

// Re-export auth functions for convenience
export * from './auth';

// ==================== CHECK-INS ====================

export async function saveCheckIn(checkInData: {
  mainMood: string;
  subMood: string;
  emoji: string;
  color: string;
  note?: string;
  activities?: string[];
}) {
  return callServer('/check-ins', {
    method: 'POST',
    body: JSON.stringify({
      date: new Date().toISOString(),
      ...checkInData,
    }),
  });
}

export async function getCheckIns(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const query = params.toString() ? `?${params.toString()}` : '';
  return callServer(`/check-ins${query}`, { method: 'GET' });
}

// ==================== JOURNAL ====================

export async function saveJournalEntry(entryData: {
  content: string;
  activities?: string[];
  mood?: string;
}) {
  return callServer('/journal', {
    method: 'POST',
    body: JSON.stringify(entryData),
  });
}

export async function getJournalEntries() {
  return callServer('/journal', { method: 'GET' });
}

export async function deleteJournalEntry(entryId: string) {
  return callServer(`/journal/${entryId}`, { method: 'DELETE' });
}

// ==================== POSTS (SHARE & LISTEN) ====================

export async function uploadPostImage(base64Image: string): Promise<{ url: string }> {
  const result = await callServer('/upload-post-image', {
    method: 'POST',
    body: JSON.stringify({ image: base64Image }),
  });
  if (!result.success || !result.url) {
    throw new Error(result.error || 'Failed to upload image');
  }
  return { url: result.url };
}

export async function createPost(postData: {
  content: string;
  mood?: string;
  languages?: string[];
  isAnonymous?: boolean;
  userId?: string;
  categories?: string[];
  imageUrl?: string;
  imageAspect?: 'square' | 'wide' | 'portrait';
}) {
  return callServer('/posts', {
    method: 'POST',
    body: JSON.stringify(postData),
  });
}

export async function getPosts(language?: string) {
  const params = new URLSearchParams();
  if (language) params.set('language', language);
  const actor = getActorId();
  if (actor) params.set('viewerId', actor);
  const query = params.toString() ? `?${params.toString()}` : '';
  return callServer(`/posts${query}`, { method: 'GET' });
}

export async function upvotePost(postId: string) {
  const actor = getActorIdForRequest()
  if ('error' in actor) throw new Error(actor.error)
  return callServer(`/posts/${postId}/upvote`, { 
    method: 'POST',
    body: JSON.stringify({ userId: actor.userId }),
  });
}

export async function downvotePost(postId: string) {
  const actor = getActorIdForRequest()
  if ('error' in actor) throw new Error(actor.error)
  return callServer(`/posts/${postId}/downvote`, { 
    method: 'POST',
    body: JSON.stringify({ userId: actor.userId }),
  });
}

export async function upvoteReply(postId: string, replyId: string) {
  const actor = getActorIdForRequest()
  if ('error' in actor) throw new Error(actor.error)
  return callServer(`/posts/${postId}/reply/${replyId}/upvote`, { 
    method: 'POST',
    body: JSON.stringify({ userId: actor.userId }),
  });
}

export async function downvoteReply(postId: string, replyId: string) {
  const actor = getActorIdForRequest()
  if ('error' in actor) throw new Error(actor.error)
  return callServer(`/posts/${postId}/reply/${replyId}/downvote`, { 
    method: 'POST',
    body: JSON.stringify({ userId: actor.userId }),
  });
}

export async function replyToPost(postId: string, content: string, userId?: string) {
  return callServer(`/posts/${postId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ content, userId }),
  });
}

export async function deletePost(postId: string, userId?: string) {
  const query = userId ? `?userId=${userId}` : '';
  return callServer(`/posts/${postId}${query}`, { method: 'DELETE' });
}

export async function editPost(
  postId: string,
  content: string,
  options?: {
    categories?: string[]
    imageUrl?: string | null
    imageAspect?: 'square' | 'wide' | 'portrait' | null
    removeImage?: boolean
  },
) {
  return callServer(`/posts/${postId}/edit`, {
    method: 'POST',
    body: JSON.stringify({ content, ...options }),
  });
}

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'hate'
  | 'sexual'
  | 'personal_info'
  | 'scam'
  | 'copyright'
  | 'other'

export async function reportPost(postId: string, reason: ReportReason, details?: string) {
  const actor = getActorIdForRequest()
  if ('error' in actor) throw new Error(actor.error)
  return callServer(`/posts/${postId}/report`, {
    method: 'POST',
    body: JSON.stringify({ reason, details, userId: actor.userId }),
  })
}

// ==================== STATISTICS ====================

export async function getUserStats(_userId?: string) {
  return callServer('/stats', { method: 'GET' });
}

export async function getUserPosts(_userId?: string) {
  return callServer('/user-posts', { method: 'GET' });
}

export async function getUserReplies(_userId?: string) {
  return callServer('/user-replies', { method: 'GET' });
}

// Get user level and achievements
export async function getUserLevel(_userId?: string) {
  return callServer('/user-level', { method: 'GET' });
}

// Get user reputation (score + isTrusted for spam-flagging)
export async function getUserReputation(_userId?: string) {
  return callServer('/user-reputation', { method: 'GET' });
}

// Flag post as spam (trusted users only)
export async function flagPostAsSpam(postId: string, userId: string) {
  return callServer(`/posts/${postId}/flag-spam`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

// Check if username is available
export async function checkUsernameAvailability(username: string) {
  return callServer(`/auth/check-username/${encodeURIComponent(username)}`, { method: 'GET' });
}

// ==================== SUBSCRIPTION & MONETIZATION ====================

export async function getSubscription(_userId?: string) {
  return callServer('/subscription', { method: 'GET' });
}

export async function upgradeSubscription(_userId: string, tier: 'premium' | 'pro') {
  return callServer('/subscription/upgrade', {
    method: 'POST',
    body: JSON.stringify({ tier }),
  });
}

export async function buyCredits(_userId: string, amount: number) {
  return callServer('/subscription/buy-credits', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
}

export async function canPost(_userId?: string) {
  return callServer('/subscription/can-post', { method: 'GET' });
}

export async function incrementPostCount(_userId?: string) {
  // Post count is incremented server-side on POST /posts; kept for compatibility.
  return { success: true, deferred: true };
}

// ==================== HEALTH CHECK ====================

export async function healthCheck() {
  return callServer('/health', { method: 'GET' });
}