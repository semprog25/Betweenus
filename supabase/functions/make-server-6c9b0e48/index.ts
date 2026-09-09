import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { getWelcomeEmailHTML, getWelcomeEmailText } from "./email-templates.tsx";
import {
  getAllowedOrigins,
  getSupabaseAdmin,
  getSupabaseClient,
  requireAuth,
  requireAdmin,
  assertMatchingUserId,
  resolveActorId,
  resolveAuthenticatedActorId,
  requireSelfUserId,
  isValidAnonymousActorId,
  isSafeKvKeySegment,
  clampLimit,
  validateContentLength,
  rateLimitOrReject,
  toPublicPost,
  toPublicAuthUser,
  resolveOptionalViewerId,
  getAuthUser,
  MAX_POST_CONTENT_LENGTH,
  MAX_REPLY_CONTENT_LENGTH,
  MAX_JOURNAL_CONTENT_LENGTH,
  MAX_CHECKIN_NOTE_LENGTH,
  DEFAULT_FEED_LIMIT,
  MAX_FEED_LIMIT,
} from "./security.tsx";
import {
  buildDailyStreakState,
  isValidIanaTimezone,
  registerDailyStreakActivity,
} from "./daily-streak.tsx";
import { deleteUserAccountData } from "./account-deletion.tsx";
import { registerLandingCmsRoutes } from "./landing-cms.tsx";
import { getSubscriptionRecord } from "./entitlements.tsx";
import {
  createStripeBillingPortalSession,
  createStripeCheckoutSession,
  getRevenueCatWebhookSecret,
  getStripeWebhookSecret,
  handleRevenueCatWebhookEvent,
  handleStripeWebhookEvent,
  isStripeConfigured,
  verifyRevenueCatWebhookAuth,
  verifyStripeWebhookSignature,
} from "./payments.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for approved origins only (never invent/fallback a foreign Origin).
// Disallowed or missing Origin must not receive Access-Control-Allow-Origin.
app.use(
  "/*",
  cors({
    origin: (origin) => {
      if (!origin) return null;
      return getAllowedOrigins().includes(origin) ? origin : null;
    },
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "apikey",
      "X-Client-Info",
      "X-Admin-Secret",
    ],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper to generate unique IDs
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to send welcome email
async function sendWelcomeEmail(
  email: string, 
  userName: string,
  confirmationLink?: string
) {
  try {
    const supabase = getSupabaseAdmin();
    
    // Send email using Supabase's built-in email service
    // Note: This requires SMTP to be configured in Supabase Dashboard
    // Go to Authentication > Email Templates to customize
    
    const htmlContent = getWelcomeEmailHTML({
      userName,
      userEmail: email,
      confirmationLink,
    });
    
    const textContent = getWelcomeEmailText({
      userName,
      userEmail: email,
      confirmationLink,
    });
    
    // Use Supabase's internal email function
    // This is a wrapper that will use configured SMTP settings
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/mail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        to: email,
        subject: '✨ Welcome to Between Us - Your Mental Wellness Journey Begins!',
        html: htmlContent,
        text: textContent,
      }),
    });
    
    if (!response.ok) {
      console.log('Email send response:', await response.text());
      console.log('Note: Email sending requires SMTP configuration in Supabase Dashboard');
    } else {
      console.log(`Welcome email sent to: ${email}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    console.log('Note: To enable email sending, configure SMTP in Supabase Dashboard > Project Settings > Auth');
    return false;
  }
}

// Create Supabase admin client for auth operations — see security.tsx

// Create Supabase client with user token — see security.tsx


// ==================== HEALTH CHECK ====================
app.get("/make-server-6c9b0e48/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Editorial Journal CMS (separate from private check-in /journal KV API)
registerLandingCmsRoutes(app);

// ==================== MOOD CHECK-INS ====================

// Save a mood check-in
app.post("/make-server-6c9b0e48/check-ins", async (c) => {
  try {
    const authResult = await requireAuth(c);
    if (authResult.error) return authResult.error;
    const user = authResult.user!;

    const rateLimited = rateLimitOrReject(c, "check-ins", 60, 60_000);
    if (rateLimited) return rateLimited;

    const body = await c.req.json();
    const { date, mainMood, subMood, emoji, color, note, activities } = body;

    if (!mainMood || !subMood) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    if (typeof note === "string" && note.length > MAX_CHECKIN_NOTE_LENGTH) {
      return c.json({ error: `Note exceeds maximum length of ${MAX_CHECKIN_NOTE_LENGTH}` }, 400);
    }

    const checkInId = generateId();
    const checkIn = {
      id: checkInId,
      ownerId: user.id,
      date: date || new Date().toISOString(),
      mainMood,
      subMood,
      emoji,
      color,
      note,
      activities: activities || [],
      createdAt: new Date().toISOString(),
    };

    await kv.set(`check-in:${checkInId}`, checkIn);
    
    // Also save by user and date for scoped lookup
    const dateKey = new Date(checkIn.date).toISOString().split('T')[0];
    await kv.set(`check-in-by-user-date:${user.id}:${dateKey}`, checkIn);

    console.log(`Check-in saved: ${checkInId} for user ${user.id}`);
    return c.json({ success: true, checkIn });
  } catch (error) {
    console.error("Error saving check-in:", error);
    return c.json({ error: "Failed to save check-in" }, 500);
  }
});

// Get check-ins for authenticated user
app.get("/make-server-6c9b0e48/check-ins", async (c) => {
  try {
    const authResult = await requireAuth(c);
    if (authResult.error) return authResult.error;
    const user = authResult.user!;

    const checkIns = await kv.getByPrefix(`check-in-by-user-date:${user.id}:`);
    return c.json({ checkIns: checkIns || [] });
  } catch (error) {
    console.error("Error fetching check-ins:", error);
    return c.json({ error: "Failed to fetch check-ins" }, 500);
  }
});

// ==================== JOURNAL ENTRIES ====================

// Save a journal entry
app.post("/make-server-6c9b0e48/journal", async (c) => {
  try {
    const authResult = await requireAuth(c);
    if (authResult.error) return authResult.error;
    const user = authResult.user!;

    const rateLimited = rateLimitOrReject(c, "journal", 40, 60_000);
    if (rateLimited) return rateLimited;

    const body = await c.req.json();
    const { content, activities, mood } = body;

    const contentCheck = validateContentLength(content, MAX_JOURNAL_CONTENT_LENGTH);
    if (!contentCheck.ok) {
      return c.json({ error: contentCheck.error }, 400);
    }

    const entryId = generateId();
    const entry = {
      id: entryId,
      ownerId: user.id,
      content: contentCheck.value,
      activities: activities || [],
      mood,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await kv.set(`journal:${entryId}`, entry);
    await kv.set(`journal-by-user:${user.id}:${entryId}`, entry);
    console.log(`Journal entry saved: ${entryId} for user ${user.id}`);
    return c.json({ success: true, entry });
  } catch (error) {
    console.error("Error saving journal entry:", error);
    return c.json({ error: "Failed to save journal entry" }, 500);
  }
});

// Get journal entries for authenticated user
app.get("/make-server-6c9b0e48/journal", async (c) => {
  try {
    const authResult = await requireAuth(c);
    if (authResult.error) return authResult.error;
    const user = authResult.user!;

    const entries = await kv.getByPrefix(`journal-by-user:${user.id}:`);
    return c.json({ entries: entries || [] });
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    return c.json({ error: "Failed to fetch journal entries" }, 500);
  }
});

// ==================== POST IMAGE UPLOAD ====================

const MAX_POST_IMAGE_BYTES = 5 * 1024 * 1024;

function detectImageMime(buffer: Uint8Array): { mime: string; ext: string } | null {
  if (buffer.length < 12) return null;
  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  // PNG
  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47
  ) {
    return { mime: "image/png", ext: "png" };
  }
  // GIF
  if (
    buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38
  ) {
    return { mime: "image/gif", ext: "gif" };
  }
  // WEBP (RIFF....WEBP)
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { mime: "image/webp", ext: "webp" };
  }
  return null;
}

function extractPostImagePath(imageUrl: string | null | undefined): string | null {
  if (!imageUrl || typeof imageUrl !== "string") return null;
  const marker = "/storage/v1/object/public/post-images/";
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(imageUrl.slice(idx + marker.length).split("?")[0]);
}

async function deletePostImageIfOwned(imageUrl: string | null | undefined, ownerId: string) {
  const path = extractPostImagePath(imageUrl);
  if (!path) return;
  if (!path.startsWith(`${ownerId}/`)) {
    console.warn("Skipping image delete — path does not match owner", path, ownerId);
    return;
  }
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from("post-images").remove([path]);
  if (error) console.error("Failed to delete post image:", error.message);
}

// Upload post image to Supabase Storage (auth required, magic-byte validated)
app.post("/make-server-6c9b0e48/upload-post-image", async (c) => {
  try {
    const authResult = await requireAuth(c);
    if (authResult.error) return authResult.error;
    const user = authResult.user!;

    const body = await c.req.json();
    const { image: base64Data } = body;

    if (!base64Data || typeof base64Data !== "string") {
      return c.json({ error: "Image data is required" }, 400);
    }

    const matches = base64Data.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    const base64Content = matches ? matches[2] : base64Data.replace(/^data:[^;]+;base64,/, "");

    let buffer: Uint8Array;
    try {
      buffer = Uint8Array.from(atob(base64Content), (ch) => ch.charCodeAt(0));
    } catch {
      return c.json({ error: "Invalid image encoding" }, 400);
    }

    if (buffer.byteLength === 0 || buffer.byteLength > MAX_POST_IMAGE_BYTES) {
      return c.json({ error: "Image must be between 1 byte and 5MB" }, 400);
    }

    const detected = detectImageMime(buffer);
    if (!detected) {
      return c.json({ error: "Unsupported image type. Use JPEG, PNG, WEBP, or GIF." }, 400);
    }

    const fileName = `post-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${detected.ext}`;
    const filePath = `${user.id}/${fileName}`;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.storage
      .from("post-images")
      .upload(filePath, buffer, {
        contentType: detected.mime,
        upsert: false,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return c.json({ error: "Failed to upload image: " + error.message }, 500);
    }

    const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(data.path);
    return c.json({ success: true, url: urlData.publicUrl, path: data.path });
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "Failed to upload image" }, 500);
  }
});

// ==================== COMMUNITY POSTS (SHARE) ====================

// Create a new post
app.post("/make-server-6c9b0e48/posts", async (c) => {
  try {
    const rateLimited = rateLimitOrReject(c, "posts-create", 20, 60_000);
    if (rateLimited) return rateLimited;

    const authenticatedUser = await getAuthUser(c);
    const body = await c.req.json();
    const { content, mood, isAnonymous, languages, userId, categories, imageUrl, imageAspect } = body;

    const contentCheck = validateContentLength(content, MAX_POST_CONTENT_LENGTH);
    if (!contentCheck.ok) {
      return c.json({ error: contentCheck.error }, 400);
    }

    let resolvedUserId: string | null = null;
    if (authenticatedUser) {
      if (userId && !assertMatchingUserId(authenticatedUser.id, userId)) {
        return c.json({ error: "Unauthorized userId" }, 403);
      }
      resolvedUserId = authenticatedUser.id;
    } else if (userId) {
      if (!isValidAnonymousActorId(userId)) {
        return c.json({ error: "Invalid anonymous actor ID" }, 401);
      }
      resolvedUserId = userId;
    }

    let safeImageUrl: string | null = null;
    if (imageUrl) {
      if (!authenticatedUser) {
        return c.json({ error: "Authentication required to attach images" }, 401);
      }
      if (typeof imageUrl !== "string") {
        return c.json({ error: "Invalid imageUrl" }, 400);
      }
      const path = extractPostImagePath(imageUrl);
      if (!path) {
        return c.json({ error: "imageUrl must be a Between Us post-images URL" }, 400);
      }
      if (!path.startsWith(`${authenticatedUser.id}/`)) {
        return c.json({ error: "Unauthorized image ownership" }, 403);
      }
      safeImageUrl = imageUrl;
    }

    // Enforce monthly limits before writing (never trust client increment)
    let subscriptionForAuthUser: any = null;
    if (authenticatedUser) {
      subscriptionForAuthUser = await kv.get(`subscription:${authenticatedUser.id}`) || {
        tier: 'free',
        credits: 0,
        postsThisMonth: 0,
        monthlyPostLimit: 3,
        lastResetDate: new Date().toISOString(),
      };
      const lastReset = new Date(subscriptionForAuthUser.lastResetDate || 0);
      const daysSinceReset = (Date.now() - lastReset.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceReset >= 30) {
        subscriptionForAuthUser.postsThisMonth = 0;
        subscriptionForAuthUser.lastResetDate = new Date().toISOString();
      }
      if ((subscriptionForAuthUser.postsThisMonth || 0) >= (subscriptionForAuthUser.monthlyPostLimit || 3)) {
        return c.json({
          error: "Monthly post limit reached. Upgrade to continue sharing.",
          code: "POST_LIMIT_REACHED",
          postsThisMonth: subscriptionForAuthUser.postsThisMonth,
          monthlyPostLimit: subscriptionForAuthUser.monthlyPostLimit,
        }, 403);
      }
    }

    const postId = generateId();
    const post = {
      id: postId,
      content: contentCheck.value,
      mood,
      isAnonymous: isAnonymous !== false, // Default to anonymous
      languages: languages || ['en'],
      categories: categories || ['General'], // Save categories
      userId: resolvedUserId, // Track which user created it (server-derived)
      imageUrl: safeImageUrl,
      imageAspect: safeImageUrl ? (imageAspect || null) : null,
      upvotes: 0,
      downvotes: 0,
      upvotedBy: [], // Track who upvoted
      downvotedBy: [], // Track who downvoted
      replies: [],
      createdAt: new Date().toISOString(),
      timestamp: Date.now(),
    };

    await kv.set(`post:${postId}`, post);
    
    // Also save by userId for easy lookup
    if (resolvedUserId) {
      await kv.set(`user-post:${resolvedUserId}:${postId}`, post);
    }

    if (authenticatedUser && subscriptionForAuthUser) {
      subscriptionForAuthUser.postsThisMonth = (subscriptionForAuthUser.postsThisMonth || 0) + 1;
      subscriptionForAuthUser.updatedAt = new Date().toISOString();
      await kv.set(`subscription:${authenticatedUser.id}`, subscriptionForAuthUser);
    }

    let streak = null;
    if (authenticatedUser) {
      streak = await registerDailyStreakActivity(authenticatedUser.id, "post");
    }

    console.log(`Post created: ${postId}${resolvedUserId ? ` by user: ${resolvedUserId}` : ''} with categories: ${categories?.join(', ')}`);
    return c.json({ success: true, post: toPublicPost(post, resolvedUserId), streak });
  } catch (error) {
    console.error("Error creating post:", error);
    return c.json({ error: "Failed to create post" }, 500);
  }
});

// Trusted user threshold: activity points (posts + replies + upvotes received) >= this = can flag spam
const TRUSTED_USER_THRESHOLD = 50;
// Number of trusted-user flags before a post is auto-hidden
const SPAM_FLAG_THRESHOLD = 3;

// Compute user reputation and trusted status (Reddit-style)
async function getUserReputation(userId: string): Promise<{ score: number; isTrusted: boolean }> {
  const userPosts = await kv.getByPrefix(`user-post:${userId}:`);
  const userReplies = await kv.getByPrefix(`user-reply:${userId}:`);
  const secretsShared = userPosts?.length || 0;
  const repliesGiven = userReplies?.length || 0;
  const upvotesReceived = userPosts?.reduce((sum: number, post: any) => sum + (post.upvotes || 0), 0) || 0;
  const score = secretsShared + repliesGiven + upvotesReceived;
  const isTrusted = score >= TRUSTED_USER_THRESHOLD;
  return { score, isTrusted };
}

function parseFeedKind(raw: string | undefined): kv.CommunityFeedKind {
  const value = String(raw || "").toLowerCase();
  if (value === "trending") return "trending";
  if (value === "newest" || value === "new") return "newest";
  if (value === "discussed" || value === "discuss" || value === "most_discussed") return "discussed";
  if (value === "all") return "all";
  if (value === "controversial" || value === "hot") return "controversial";
  return "controversial";
}

function parseMediaFilter(raw: string | undefined): kv.CommunityMediaFilter {
  const value = String(raw || "all").toLowerCase();
  if (value === "media" || value === "pictures" || value === "with_pictures" || value === "images") {
    return "media";
  }
  if (value === "text" || value === "text_only" || value === "text-only") return "text";
  return "all";
}

function encodeFeedCursor(row: kv.CommunityFeedIdRow): string {
  return btoa(JSON.stringify([row.score, row.ts, row.post_id]));
}

function decodeFeedCursor(raw: string | undefined): kv.CommunityFeedCursor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(atob(String(raw)));
    if (!Array.isArray(parsed) || parsed.length < 3) return null;
    return {
      score: Number(parsed[0]) || 0,
      ts: Number(parsed[1]) || 0,
      id: String(parsed[2] || ""),
    };
  } catch {
    return null;
  }
}

// Community / Discover feed — ranked SQL IDs + mget page (no getByPrefix scan)
app.get("/make-server-6c9b0e48/posts", async (c) => {
  try {
    const language = c.req.query("language");
    const feedParam = c.req.query("feed") || c.req.query("sort") || "controversial";
    const media = parseMediaFilter(c.req.query("media") || undefined);
    const categoryRaw = c.req.query("category");
    const q = c.req.query("q") || c.req.query("search") || null;
    const idsParam = c.req.query("ids");
    const includeReplies = c.req.query("includeReplies") === "1" || c.req.query("includeReplies") === "true";
    const includeStats = c.req.query("stats") === "1" || c.req.query("stats") === "true";
    const statsOnly = c.req.query("statsOnly") === "1" || c.req.query("statsOnly") === "true";
    const viewerId = await resolveOptionalViewerId(c);
    const limit = clampLimit(c.req.query("limit"), DEFAULT_FEED_LIMIT, MAX_FEED_LIMIT);

    const languages =
      language && language !== "all"
        ? String(language)
            .split(",")
            .map((l) => l.trim().toLowerCase())
            .filter(Boolean)
            .slice(0, 20)
        : [];

    // Saved / explicit ID fetch — mget only, never scan all posts
    if (idsParam) {
      const ids = String(idsParam)
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .slice(0, MAX_FEED_LIMIT);
      if (ids.length === 0) return c.json({ posts: [], nextCursor: null, stats: null });
      const keys = ids.map((id) => `post:${id}`);
      const values = await kv.mget(keys);
      const posts = values
        .filter((post: any) => post && !post.hiddenAt && !post.deletedAt)
        .map((post: any) => toPublicPost(post, viewerId, { includeReplies: false }));
      return c.json({ posts, nextCursor: null, stats: null });
    }

    const feed =
      String(feedParam).toLowerCase() === "random"
        ? "newest"
        : parseFeedKind(String(feedParam));
    const cursor = decodeFeedCursor(c.req.query("cursor") || undefined);
    const category =
      categoryRaw && String(categoryRaw).toLowerCase() !== "all"
        ? String(categoryRaw)
        : null;

    if (statsOnly || (includeStats && c.req.query("limit") === "0")) {
      const stats = await kv.getCommunityFeedStats({
        media,
        languages,
        category,
        q: q ? String(q).slice(0, 120) : null,
      });
      return c.json({ posts: [], nextCursor: null, stats, feed, media });
    }

    const ranked = await kv.getCommunityFeedIds({
      feed,
      limit: limit + 1,
      media,
      languages,
      category,
      q: q ? String(q).slice(0, 120) : null,
      cursor,
    });

    const pageRows = ranked.slice(0, limit);
    const hasMore = ranked.length > limit;
    const keys = pageRows.map((row) => `post:${row.post_id}`);
    const values = keys.length > 0 ? await kv.mget(keys) : [];
    const byId = new Map<string, any>();
    for (const post of values) {
      if (post?.id) byId.set(String(post.id), post);
    }

    let posts = pageRows
      .map((row) => byId.get(row.post_id))
      .filter((post: any) => post && !post.hiddenAt && !post.deletedAt)
      .map((post: any) => toPublicPost(post, viewerId, { includeReplies }));

    if (String(feedParam).toLowerCase() === "random") {
      posts = posts.sort(() => Math.random() - 0.5);
    }

    const nextCursor =
      hasMore && pageRows.length > 0
        ? encodeFeedCursor(pageRows[pageRows.length - 1])
        : null;

    let stats = null;
    if (includeStats && !cursor) {
      stats = await kv.getCommunityFeedStats({
        media,
        languages,
        category,
        q: q ? String(q).slice(0, 120) : null,
      });
    }

    c.header(
      "Cache-Control",
      viewerId
        ? "private, max-age=10"
        : "public, max-age=20, stale-while-revalidate=40",
    );

    return c.json({ posts, nextCursor, stats, feed, media });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return c.json({ error: "Failed to fetch posts" }, 500);
  }
});

// Public single-post fetch for website story pages / deep links
app.get("/make-server-6c9b0e48/posts/:postId", async (c) => {
  try {
    const postId = c.req.param("postId")
    if (!postId || postId.includes("..") || postId.length > 200) {
      return c.json({ error: "Invalid post id" }, 400)
    }

    const post = await kv.get(`post:${postId}`)
    if (!post || (post as any).hiddenAt || (post as any).deletedAt) {
      return c.json({ error: "Story not found" }, 404)
    }

    const viewerId = await resolveOptionalViewerId(c);
    return c.json({
      post: toPublicPost(post, viewerId, { includeReplies: true }),
    })
  } catch (error) {
    console.error("Error fetching post:", error)
    return c.json({ error: "Failed to fetch story" }, 500)
  }
})

// Edit a post (owner-only; prefer JWT edit endpoint for production edits)
app.put("/make-server-6c9b0e48/community/posts/:postId", async (c) => {
  try {
    const authResult = await requireAuth(c);
    if (authResult.error) return authResult.error;
    const user = authResult.user!;

    const postId = c.req.param("postId");
    const body = await c.req.json();
    const contentCheck = validateContentLength(body?.content, MAX_POST_CONTENT_LENGTH);
    if (!contentCheck.ok) {
      return c.json({ error: contentCheck.error }, 400);
    }

    const post = await kv.get(`post:${postId}`);
    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }

    if (post.userId !== user.id) {
      return c.json({ error: "Unauthorized - you can only edit your own posts" }, 403);
    }

    const postDate = new Date(post.createdAt);
    const minutesSincePost = (Date.now() - postDate.getTime()) / (1000 * 60);
    if (minutesSincePost > 5) {
      return c.json({ error: "Post can only be edited within 5 minutes of creation" }, 403);
    }

    const updatedPost = {
      ...post,
      content: contentCheck.value,
      isEdited: true,
      editedAt: new Date().toISOString(),
    };

    await kv.set(`post:${postId}`, updatedPost);
    if (post.userId) {
      await kv.set(`user-post:${post.userId}:${postId}`, updatedPost);
    }

    console.log(`Post edited: ${postId} by ${user.id}`);
    return c.json({ success: true, post: toPublicPost(updatedPost, user.id) });
  } catch (error) {
    console.error("Error editing post:", error);
    return c.json({ error: "Failed to edit post" }, 500);
  }
});

// Update post metadata (admin only in production)
app.put("/make-server-6c9b0e48/posts/:postId/metadata", async (c) => {
  try {
    const adminError = requireAdmin(c);
    if (adminError) return adminError;

    const postId = c.req.param("postId");
    const body = await c.req.json();
    const { languages, categories } = body;

    // Get existing post
    const post = await kv.get(`post:${postId}`);
    
    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }

    // Update the post metadata
    const updatedPost = {
      ...post,
      languages: languages || post.languages || ['en'],
      categories: categories || post.categories || [],
    };

    await kv.set(`post:${postId}`, updatedPost);
    
    // Also update user-post if it exists
    if (post.userId) {
      await kv.set(`user-post:${post.userId}:${postId}`, updatedPost);
    }

    console.log(`Post metadata updated: ${postId} - languages: ${updatedPost.languages}, categories: ${updatedPost.categories}`);
    return c.json({ success: true, post: updatedPost });
  } catch (error) {
    console.error("Error updating post metadata:", error);
    return c.json({ error: "Failed to update post metadata" }, 500);
  }
});

// Update post likes (admin only)
app.put("/make-server-6c9b0e48/posts/:postId/likes", async (c) => {
  try {
    const adminError = requireAdmin(c);
    if (adminError) return adminError;

    const postId = c.req.param("postId");
    const body = await c.req.json();
    const { upvotes } = body;

    // Get existing post
    const post = await kv.get(`post:${postId}`);
    
    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }

    // Update the post likes
    const updatedPost = {
      ...post,
      upvotes: upvotes || 0,
    };

    await kv.set(`post:${postId}`, updatedPost);
    
    // Also update user-post if it exists
    if (post.userId) {
      await kv.set(`user-post:${post.userId}:${postId}`, updatedPost);
    }

    console.log(`Post likes updated: ${postId} - upvotes: ${updatedPost.upvotes}`);
    return c.json({ success: true, post: updatedPost });
  } catch (error) {
    console.error("Error updating post likes:", error);
    return c.json({ error: "Failed to update post likes" }, 500);
  }
});

// Update post privacy (owner-only)
app.patch("/make-server-6c9b0e48/posts/:postId/privacy", async (c) => {
  try {
    const authResult = await requireAuth(c);
    if (authResult.error) return authResult.error;
    const user = authResult.user!;

    const postId = c.req.param("postId");
    const body = await c.req.json();
    const { isAnonymous } = body;

    const post = await kv.get(`post:${postId}`);
    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }

    if (post.userId !== user.id) {
      return c.json({ error: "Unauthorized - you can only change privacy on your own posts" }, 403);
    }

    const updatedPost = {
      ...post,
      isAnonymous: isAnonymous === true || isAnonymous === false ? isAnonymous : true,
    };

    await kv.set(`post:${postId}`, updatedPost);
    if (post.userId) {
      await kv.set(`user-post:${post.userId}:${postId}`, updatedPost);
    }

    console.log(`Post privacy updated: ${postId} - isAnonymous: ${updatedPost.isAnonymous}`);
    return c.json({ success: true, post: toPublicPost(updatedPost, user.id) });
  } catch (error) {
    console.error("Error updating post privacy:", error);
    return c.json({ error: "Failed to update post privacy" }, 500);
  }
});

// Upvote a post
app.post("/make-server-6c9b0e48/posts/:postId/upvote", async (c) => {
  try {
    const rateLimited = rateLimitOrReject(c, "vote", 120, 60_000);
    if (rateLimited) return rateLimited;

    const postId = c.req.param("postId");
    const body = await c.req.json().catch(() => ({}));
    const { userId: requestedUserId } = body;

    const { actorId, isAuthenticated, error: actorError } = await resolveActorId(c, requestedUserId);
    if (actorError) return actorError;
    const userId = actorId!;
    
    const post = await kv.get(`post:${postId}`);

    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }

    // Initialize vote tracking
    post.upvotes = post.upvotes || 0;
    post.downvotes = post.downvotes || 0;
    post.upvotedBy = post.upvotedBy || [];
    post.downvotedBy = post.downvotedBy || [];

    // Remove from downvotes if previously downvoted
    if (userId && post.downvotedBy.includes(userId)) {
      post.downvotedBy = post.downvotedBy.filter((id: string) => id !== userId);
      post.downvotes = Math.max(0, post.downvotes - 1);
    }

    let addedUpvote = false;
    // Toggle upvote
    if (userId && post.upvotedBy.includes(userId)) {
      // Remove upvote
      post.upvotedBy = post.upvotedBy.filter((id: string) => id !== userId);
      post.upvotes = Math.max(0, post.upvotes - 1);
    } else {
      // Add upvote
      post.upvotes += 1;
      addedUpvote = true;
      if (userId && !post.upvotedBy.includes(userId)) {
        post.upvotedBy.push(userId);
      }
    }
    
    await kv.set(`post:${postId}`, post);
    
    // Update user-post copy if it exists
    if (post.userId) {
      await kv.set(`user-post:${post.userId}:${postId}`, post);
    }

    let streak = null;
    if (isAuthenticated && addedUpvote && userId) {
      streak = await registerDailyStreakActivity(userId, "upvote");
    }

    console.log(`Post upvoted: ${postId}`);
    return c.json({ success: true, upvotes: post.upvotes, downvotes: post.downvotes, streak });
  } catch (error) {
    console.error("Error upvoting post:", error);
    return c.json({ error: "Failed to upvote post" }, 500);
  }
});

// Downvote a post
app.post("/make-server-6c9b0e48/posts/:postId/downvote", async (c) => {
  try {
    const postId = c.req.param("postId");
    const body = await c.req.json().catch(() => ({}));
    const { userId: requestedUserId } = body;

    const { actorId, error: actorError } = await resolveActorId(c, requestedUserId);
    if (actorError) return actorError;
    const userId = actorId!;
    
    const post = await kv.get(`post:${postId}`);

    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }

    // Initialize vote tracking
    post.upvotes = post.upvotes || 0;
    post.downvotes = post.downvotes || 0;
    post.upvotedBy = post.upvotedBy || [];
    post.downvotedBy = post.downvotedBy || [];

    // Remove from upvotes if previously upvoted
    if (userId && post.upvotedBy.includes(userId)) {
      post.upvotedBy = post.upvotedBy.filter((id: string) => id !== userId);
      post.upvotes = Math.max(0, post.upvotes - 1);
    }

    // Toggle downvote
    if (userId && post.downvotedBy.includes(userId)) {
      // Remove downvote
      post.downvotedBy = post.downvotedBy.filter((id: string) => id !== userId);
      post.downvotes = Math.max(0, post.downvotes - 1);
    } else {
      // Add downvote
      post.downvotes += 1;
      if (userId && !post.downvotedBy.includes(userId)) {
        post.downvotedBy.push(userId);
      }
    }
    
    await kv.set(`post:${postId}`, post);
    
    // Update user-post copy if it exists
    if (post.userId) {
      await kv.set(`user-post:${post.userId}:${postId}`, post);
    }

    console.log(`Post downvoted: ${postId}`);
    return c.json({ success: true, upvotes: post.upvotes, downvotes: post.downvotes });
  } catch (error) {
    console.error("Error downvoting post:", error);
    return c.json({ error: "Failed to downvote post" }, 500);
  }
});

// Flag post as spam (trusted users only - Reddit-style moderation)
app.post("/make-server-6c9b0e48/posts/:postId/flag-spam", async (c) => {
  try {
    const authResult = await requireAuth(c);
    if (authResult.error) return authResult.error;
    const user = authResult.user!;

    const postId = c.req.param("postId");
    const body = await c.req.json();
    const { userId } = body;

    if (!assertMatchingUserId(user.id, userId)) {
      return c.json({ error: "Unauthorized userId" }, 403);
    }

    const { isTrusted } = await getUserReputation(user.id);
    if (!isTrusted) {
      return c.json({ code: "NOT_TRUSTED", error: "Trusted user status required to flag spam" }, 403);
    }

    const post = await kv.get(`post:${postId}`);
    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }

    if (post.hiddenAt) {
      return c.json({ success: true, hidden: true, message: "Post already hidden" });
    }

    const flaggedBy = post.flaggedBy || [];
    if (flaggedBy.includes(user.id)) {
      return c.json({ success: true, flagCount: flaggedBy.length, message: "Already flagged" });
    }

    flaggedBy.push(user.id);
    post.flaggedBy = flaggedBy;
    post.flagCount = flaggedBy.length;

    if (post.flagCount >= SPAM_FLAG_THRESHOLD) {
      post.hiddenAt = new Date().toISOString();
    }

    await kv.set(`post:${postId}`, post);
    if (post.userId) {
      await kv.set(`user-post:${post.userId}:${postId}`, post);
    }

    console.log(`Post ${postId} flagged as spam by trusted user (${post.flagCount}/${SPAM_FLAG_THRESHOLD})${post.hiddenAt ? " - HIDDEN" : ""}`);
    return c.json({
      success: true,
      flagCount: post.flagCount,
      hidden: !!post.hiddenAt,
      message: post.hiddenAt ? "Post hidden due to spam flags" : "Spam flag recorded",
    });
  } catch (error) {
    console.error("Error flagging post:", error);
    return c.json({ error: "Failed to flag post" }, 500);
  }
});

// Bulk update votes for a post (admin only)
app.post("/make-server-6c9b0e48/community/posts/:postId/update-votes", async (c) => {
  try {
    const adminError = requireAdmin(c);
    if (adminError) return adminError;

    const postId = c.req.param("postId");
    const body = await c.req.json();
    const { upvotes, downvotes, upvotedBy, downvotedBy } = body;
    
    const post = await kv.get(`post:${postId}`);

    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }

    // Update votes
    post.upvotes = upvotes || 0;
    post.downvotes = downvotes || 0;
    post.upvotedBy = upvotedBy || [];
    post.downvotedBy = downvotedBy || [];
    
    await kv.set(`post:${postId}`, post);
    
    // Update user-post copy if it exists
    if (post.userId) {
      await kv.set(`user-post:${post.userId}:${postId}`, post);
    }

    console.log(`Post votes bulk updated: ${postId} - ${upvotes} ↑ | ${downvotes} ↓`);
    return c.json({ success: true, upvotes: post.upvotes, downvotes: post.downvotes });
  } catch (error) {
    console.error("Error bulk updating votes:", error);
    return c.json({ error: "Failed to bulk update votes" }, 500);
  }
});

// Bulk update votes for a reply (admin only)
app.post("/make-server-6c9b0e48/community/posts/:postId/replies/:replyId/update-votes", async (c) => {
  try {
    const adminError = requireAdmin(c);
    if (adminError) return adminError;

    const postId = c.req.param("postId");
    const replyId = c.req.param("replyId");
    const body = await c.req.json();
    const { upvotes, downvotes, upvotedBy, downvotedBy } = body;
    
    const post = await kv.get(`post:${postId}`);

    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }

    // Find the reply
    const replyIndex = post.replies?.findIndex((r: any) => r.id === replyId);
    if (replyIndex === -1 || replyIndex === undefined) {
      return c.json({ error: "Reply not found" }, 404);
    }

    // Update reply votes
    post.replies[replyIndex].upvotes = upvotes || 0;
    post.replies[replyIndex].downvotes = downvotes || 0;
    post.replies[replyIndex].upvotedBy = upvotedBy || [];
    post.replies[replyIndex].downvotedBy = downvotedBy || [];
    
    await kv.set(`post:${postId}`, post);
    
    // Update user-post copy if it exists
    if (post.userId) {
      await kv.set(`user-post:${post.userId}:${postId}`, post);
    }

    console.log(`Reply votes bulk updated: ${replyId} - ${upvotes} ↑ | ${downvotes} ↓`);
    return c.json({ success: true, upvotes, downvotes });
  } catch (error) {
    console.error("Error bulk updating reply votes:", error);
    return c.json({ error: "Failed to bulk update reply votes" }, 500);
  }
});

// Reply to a post
app.post("/make-server-6c9b0e48/posts/:postId/reply", async (c) => {
  try {
    const rateLimited = rateLimitOrReject(c, "reply", 40, 60_000);
    if (rateLimited) return rateLimited;

    const postId = c.req.param("postId");
    const body = await c.req.json();
    const { content, userId: requestedUserId } = body;

    const contentCheck = validateContentLength(content, MAX_REPLY_CONTENT_LENGTH);
    if (!contentCheck.ok) {
      return c.json({ error: contentCheck.error }, 400);
    }

    const { actorId, isAuthenticated, error: actorError } = await resolveActorId(c, requestedUserId);
    if (actorError) return actorError;
    const userId = actorId!;

    const post = await kv.get(`post:${postId}`);
    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }

    const replyId = generateId();
    const reply = {
      id: replyId,
      content: contentCheck.value,
      userId: userId || null, // Track who replied
      createdAt: new Date().toISOString(),
      isAnonymous: true,
      upvotes: 0,
      downvotes: 0,
      upvotedBy: [],
      downvotedBy: [],
    };

    post.replies = post.replies || [];
    post.replies.push(reply);
    await kv.set(`post:${postId}`, post);
    
    // Update user-post copy if it exists
    if (post.userId) {
      await kv.set(`user-post:${post.userId}:${postId}`, post);
    }
    
    // Save reply for the user who made it
    if (userId) {
      await kv.set(`user-reply:${userId}:${replyId}`, {
        ...reply,
        postId,
        postContent: post.content.substring(0, 100), // Save preview of original post
      });
    }

    let streak = null;
    if (isAuthenticated && userId) {
      streak = await registerDailyStreakActivity(userId, "reply");
    }

    console.log(`Reply added to post: ${postId}`);
    return c.json({ success: true, reply, streak });
  } catch (error) {
    console.error("Error adding reply:", error);
    return c.json({ error: "Failed to add reply" }, 500);
  }
});

// Upvote a comment/reply
app.post("/make-server-6c9b0e48/posts/:postId/reply/:replyId/upvote", async (c) => {
  try {
    const postId = c.req.param("postId");
    const replyId = c.req.param("replyId");
    const body = await c.req.json().catch(() => ({}));
    const { userId: requestedUserId } = body;

    const { actorId, isAuthenticated, error: actorError } = await resolveActorId(c, requestedUserId);
    if (actorError) return actorError;
    const userId = actorId!;
    
    const post = await kv.get(`post:${postId}`);
    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }

    const reply = post.replies?.find((r: any) => r.id === replyId);
    if (!reply) {
      return c.json({ error: "Reply not found" }, 404);
    }

    // Initialize vote tracking
    reply.upvotes = reply.upvotes || 0;
    reply.downvotes = reply.downvotes || 0;
    reply.upvotedBy = reply.upvotedBy || [];
    reply.downvotedBy = reply.downvotedBy || [];

    // Remove from downvotes if previously downvoted
    if (userId && reply.downvotedBy.includes(userId)) {
      reply.downvotedBy = reply.downvotedBy.filter((id: string) => id !== userId);
      reply.downvotes = Math.max(0, reply.downvotes - 1);
    }

    let addedUpvote = false;
    // Toggle upvote
    if (userId && reply.upvotedBy.includes(userId)) {
      reply.upvotedBy = reply.upvotedBy.filter((id: string) => id !== userId);
      reply.upvotes = Math.max(0, reply.upvotes - 1);
    } else {
      reply.upvotes += 1;
      addedUpvote = true;
      if (userId && !reply.upvotedBy.includes(userId)) {
        reply.upvotedBy.push(userId);
      }
    }

    await kv.set(`post:${postId}`, post);
    
    // Update user-post copy if it exists
    if (post.userId) {
      await kv.set(`user-post:${post.userId}:${postId}`, post);
    }

    let streak = null;
    if (isAuthenticated && addedUpvote && userId) {
      streak = await registerDailyStreakActivity(userId, "reply_upvote");
    }

    console.log(`Reply upvoted: ${replyId} on post ${postId}`);
    return c.json({ success: true, upvotes: reply.upvotes, downvotes: reply.downvotes, streak });
  } catch (error) {
    console.error("Error upvoting reply:", error);
    return c.json({ error: "Failed to upvote reply" }, 500);
  }
});

// Downvote a comment/reply
app.post("/make-server-6c9b0e48/posts/:postId/reply/:replyId/downvote", async (c) => {
  try {
    const postId = c.req.param("postId");
    const replyId = c.req.param("replyId");
    const body = await c.req.json().catch(() => ({}));
    const { userId: requestedUserId } = body;

    const { actorId, error: actorError } = await resolveActorId(c, requestedUserId);
    if (actorError) return actorError;
    const userId = actorId!;
    
    const post = await kv.get(`post:${postId}`);
    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }

    const reply = post.replies?.find((r: any) => r.id === replyId);
    if (!reply) {
      return c.json({ error: "Reply not found" }, 404);
    }

    // Initialize vote tracking
    reply.upvotes = reply.upvotes || 0;
    reply.downvotes = reply.downvotes || 0;
    reply.upvotedBy = reply.upvotedBy || [];
    reply.downvotedBy = reply.downvotedBy || [];

    // Remove from upvotes if previously upvoted
    if (userId && reply.upvotedBy.includes(userId)) {
      reply.upvotedBy = reply.upvotedBy.filter((id: string) => id !== userId);
      reply.upvotes = Math.max(0, reply.upvotes - 1);
    }

    // Toggle downvote
    if (userId && reply.downvotedBy.includes(userId)) {
      reply.downvotedBy = reply.downvotedBy.filter((id: string) => id !== userId);
      reply.downvotes = Math.max(0, reply.downvotes - 1);
    } else {
      reply.downvotes += 1;
      if (userId && !reply.downvotedBy.includes(userId)) {
        reply.downvotedBy.push(userId);
      }
    }

    await kv.set(`post:${postId}`, post);
    
    // Update user-post copy if it exists
    if (post.userId) {
      await kv.set(`user-post:${post.userId}:${postId}`, post);
    }

    console.log(`Reply downvoted: ${replyId} on post ${postId}`);
    return c.json({ success: true, upvotes: reply.upvotes, downvotes: reply.downvotes });
  } catch (error) {
    console.error("Error downvoting reply:", error);
    return c.json({ error: "Failed to downvote reply" }, 500);
  }
});

// Edit a reply
app.put("/make-server-6c9b0e48/posts/:postId/reply/:replyId", async (c) => {
  try {
    const postId = c.req.param("postId");
    const replyId = c.req.param("replyId");
    const body = await c.req.json();
    const { content, userId: requestedUserId } = body;

    const contentCheck = validateContentLength(content, MAX_REPLY_CONTENT_LENGTH);
    if (!contentCheck.ok) {
      return c.json({ error: contentCheck.error }, 400);
    }

    // Get existing post
    const post = await kv.get(`post:${postId}`);
    
    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }

    // Find and update the reply
    const replyIndex = post.replies.findIndex((r: any) => r.id === replyId);
    
    if (replyIndex === -1) {
      return c.json({ error: "Reply not found" }, 404);
    }

    const { actorId, error: actorError } = await resolveActorId(c, requestedUserId);
    if (actorError) return actorError;

    if (post.replies[replyIndex].userId !== actorId) {
      return c.json({ error: "You can only edit your own replies" }, 403);
    }

    // Check if reply is within 5 minutes old
    const replyDate = new Date(post.replies[replyIndex].createdAt);
    const minutesSinceReply = (Date.now() - replyDate.getTime()) / (1000 * 60);
    
    if (minutesSinceReply > 5) {
      return c.json({ error: "Reply can only be edited within 5 minutes of creation" }, 403);
    }

    // Update the reply
    post.replies[replyIndex] = {
      ...post.replies[replyIndex],
      content: contentCheck.value,
      isEdited: true,
      editedAt: new Date().toISOString(),
    };

    await kv.set(`post:${postId}`, post);
    
    // Also update user-post if it exists
    if (post.userId) {
      await kv.set(`user-post:${post.userId}:${postId}`, post);
    }

    console.log(`Reply edited: ${replyId} on post ${postId}`);
    return c.json({ success: true, reply: toPublicPost({ ...post, replies: [post.replies[replyIndex]] }, actorId).replies?.[0] });
  } catch (error) {
    console.error("Error editing reply:", error);
    return c.json({ error: "Failed to edit reply" }, 500);
  }
});

// Delete a reply
app.delete("/make-server-6c9b0e48/posts/:postId/reply/:replyId", async (c) => {
  try {
    const postId = c.req.param("postId");
    const replyId = c.req.param("replyId");
    const body = await c.req.json().catch(() => ({}));
    const requestedUserId = body?.userId;

    // Get existing post
    const post = await kv.get(`post:${postId}`);
    
    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }

    // Find the reply
    const replyIndex = post.replies.findIndex((r: any) => r.id === replyId);
    
    if (replyIndex === -1) {
      return c.json({ error: "Reply not found" }, 404);
    }

    const { actorId, error: actorError } = await resolveActorId(c, requestedUserId);
    if (actorError) return actorError;

    if (post.replies[replyIndex].userId !== actorId) {
      return c.json({ error: "You can only delete your own replies" }, 403);
    }

    // Remove the reply
    post.replies.splice(replyIndex, 1);

    await kv.set(`post:${postId}`, post);
    
    // Also update user-post if it exists
    if (post.userId) {
      await kv.set(`user-post:${post.userId}:${postId}`, post);
    }

    console.log(`Reply deleted: ${replyId} from post ${postId}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting reply:", error);
    return c.json({ error: "Failed to delete reply" }, 500);
  }
});

// ==================== AUTHENTICATION ====================

// Sign up with email and password
app.post("/make-server-6c9b0e48/auth/signup", async (c) => {
  try {
    const rateLimited = rateLimitOrReject(c, "auth-signup", 10, 60_000);
    if (rateLimited) return rateLimited;

    const body = await c.req.json();
    const { email, password, name, languages } = body;

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const supabase = getSupabaseAdmin();
    
    // Create user with admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name: name || 'Friend',
        languages: languages || ['en'],
      },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      // Check if user already exists (check code first, then message)
      const isEmailExists = 
        error.code === 'email_exists' || 
        error.code === 'user_already_exists' ||
        error.message?.includes('already been registered') || 
        error.message?.includes('email_exists');
      
      if (isEmailExists) {
        console.log(`Sign up attempt with existing email: ${email}`);
        return c.json({ 
          error: 'An account with this email already exists. Please sign in instead.',
          code: 'EMAIL_EXISTS'
        }, 409);
      }
      
      // Log other errors
      console.error("Sign up error:", error);
      return c.json({ error: error.message }, 400);
    }

    console.log(`User created: ${data.user?.id}`);
    
    // Send welcome email
    // Note: This requires SMTP configuration in Supabase Dashboard
    await sendWelcomeEmail(
      email,
      name || 'Friend',
      undefined // No confirmation link needed since email_confirm is true
    );
    
    // Sign in the user to get session
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error("Auto sign-in error:", signInError);
      return c.json({ 
        success: true, 
        user: data.user,
        message: "Account created. Please sign in.",
      });
    }

    return c.json({ 
      success: true, 
      user: data.user,
      session: sessionData.session,
      access_token: sessionData.session?.access_token,
    });
  } catch (error) {
    console.error("Sign up error:", error);
    return c.json({ error: "Failed to create account" }, 500);
  }
});

// Sign in with email and password
app.post("/make-server-6c9b0e48/auth/signin", async (c) => {
  try {
    const rateLimited = rateLimitOrReject(c, "auth-signin", 20, 60_000);
    if (rateLimited) return rateLimited;

    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Check if it's invalid credentials (expected error)
      const isInvalidCredentials = 
        error.message?.includes('Invalid login credentials') ||
        error.message?.includes('Email not confirmed') ||
        error.status === 400;
      
      if (isInvalidCredentials) {
        console.log(`Sign in attempt failed for: ${email}`);
        return c.json({ 
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        }, 401);
      }
      
      // Log unexpected errors
      console.error("Sign in error:", error);
      return c.json({ error: error.message }, 401);
    }

    console.log(`User signed in: ${data.user?.id}`);
    return c.json({ 
      success: true, 
      user: data.user,
      session: data.session,
      access_token: data.session?.access_token,
    });
  } catch (error) {
    console.error("Sign in error:", error);
    return c.json({ error: "Failed to sign in" }, 500);
  }
});

// Sign out
app.post("/make-server-6c9b0e48/auth/signout", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    const supabase = getSupabaseClient(accessToken);
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Sign out error:", error);
      return c.json({ error: error.message }, 400);
    }

    console.log("User signed out");
    return c.json({ success: true });
  } catch (error) {
    console.error("Sign out error:", error);
    return c.json({ error: "Failed to sign out" }, 500);
  }
});

// Save user data before logout
app.post("/make-server-6c9b0e48/auth/save-logout-data", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    const supabase = getSupabaseClient(accessToken);
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    const body = await c.req.json();
    const { logoutTimestamp, sessionData } = body;

    // Never trust body userId — always use JWT identity
    const userId = user.id;

    // Update user_profiles with logout timestamp
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        last_logout_at: logoutTimestamp,
        last_activity: sessionData?.lastActivity || new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error("Error updating logout data:", updateError);
      // Don't fail the request - continue with logout
    }

    // Log the logout activity
    const { error: logError } = await supabase
      .from('user_activity_log')
      .insert({
        user_id: userId,
        activity_type: 'logout',
        activity_data: sessionData,
        created_at: logoutTimestamp,
      });

    if (logError) {
      console.error("Error logging logout activity:", logError);
      // Don't fail the request - continue with logout
    }

    console.log("User data saved before logout");
    return c.json({ success: true });
  } catch (error) {
    console.error("Save logout data error:", error);
    // Don't fail - allow logout to proceed
    return c.json({ success: true, warning: "Some data may not have been saved" });
  }
});

// Get current user
app.get("/make-server-6c9b0e48/auth/user", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error) {
      console.error("Get user error:", error);
      return c.json({ error: error.message }, 401);
    }

    return c.json({ 
      success: true, 
      user: toPublicAuthUser(data.user),
    });
  } catch (error) {
    console.error("Get user error:", error);
    return c.json({ error: "Failed to get user" }, 500);
  }
});

// Check if session is valid
app.get("/make-server-6c9b0e48/auth/session", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ valid: false });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      return c.json({ valid: false });
    }

    return c.json({ 
      valid: true,
      user: data.user,
    });
  } catch (error) {
    console.error("Session check error:", error);
    return c.json({ valid: false });
  }
});

// Get user profile
app.get("/make-server-6c9b0e48/auth/profile", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      console.log('Get profile: No access token provided');
      return c.json({ success: false, error: "Not authenticated" }, 401);
    }

    const supabase = getSupabaseAdmin();
    
    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    
    if (userError) {
      console.error('Get profile - getUser error:', userError);
      return c.json({ 
        success: false,
        error: "Invalid session",
        details: userError.message 
      }, 401);
    }
    
    if (!userData.user) {
      console.log('Get profile: No user data returned');
      return c.json({ success: false, error: "Invalid session" }, 401);
    }

    console.log(`Profile fetched for user: ${userData.user.id}`);
    return c.json({ 
      success: true, 
      user: userData.user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return c.json({ success: false, error: "Failed to get profile" }, 500);
  }
});

// Update user profile (name, languages, avatar)
app.put("/make-server-6c9b0e48/auth/profile", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      console.log('Profile update: No access token provided');
      return c.json({ error: "Not authenticated" }, 401);
    }

    const supabase = getSupabaseAdmin();
    
    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    
    if (userError) {
      console.error('Profile update - getUser error:', userError);
      return c.json({ 
        error: "Invalid session",
        details: userError.message 
      }, 401);
    }
    
    if (!userData.user) {
      console.log('Profile update: No user data returned');
      return c.json({ error: "Invalid session" }, 401);
    }

    const body = await c.req.json();
    const { name, languages, avatar_url, about, public_username } = body;

    // Get current user's old username
    const oldUsername = userData.user.user_metadata?.public_username;

    // Validate public_username format if provided
    if (public_username !== undefined && public_username !== '') {
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(public_username)) {
        return c.json({ 
          error: 'Username must be 3-20 characters and contain only letters, numbers, and underscores' 
        }, 400);
      }
      
      // Check if username is already taken (case-insensitive)
      const usernameLower = public_username.toLowerCase();
      const existingUserId = await kv.get(`username:${usernameLower}`);
      
      // If username exists and belongs to someone else, reject
      if (existingUserId && existingUserId !== userData.user.id) {
        return c.json({ 
          error: 'This username is already taken. Please choose another one.' 
        }, 400);
      }
    }

    // Update user metadata
    const { data, error } = await supabase.auth.admin.updateUserById(
      userData.user.id,
      {
        user_metadata: {
          ...userData.user.user_metadata,
          name: name !== undefined ? name : userData.user.user_metadata?.name,
          languages: languages !== undefined ? languages : userData.user.user_metadata?.languages,
          avatar_url: avatar_url !== undefined ? avatar_url : userData.user.user_metadata?.avatar_url,
          about: about !== undefined ? about : userData.user.user_metadata?.about,
          public_username: public_username !== undefined ? public_username : userData.user.user_metadata?.public_username,
        },
      }
    );

    if (error) {
      console.error("Update profile error:", error);
      return c.json({ error: error.message }, 400);
    }

    // Update username registry in KV store
    // Remove old username mapping if it exists and is different from new username
    if (oldUsername && oldUsername !== '' && oldUsername !== public_username) {
      const oldUsernameLower = oldUsername.toLowerCase();
      await kv.del(`username:${oldUsernameLower}`);
      console.log(`Removed old username mapping: ${oldUsernameLower}`);
    }
    
    // Add new username mapping if username is set and not empty
    if (public_username && public_username !== '') {
      const usernameLower = public_username.toLowerCase();
      await kv.set(`username:${usernameLower}`, userData.user.id);
      console.log(`Added username mapping: ${usernameLower} -> ${userData.user.id}`);
    }
    
    // If clearing username (setting to empty), remove the mapping
    if (public_username === '' && oldUsername && oldUsername !== '') {
      const oldUsernameLower = oldUsername.toLowerCase();
      await kv.del(`username:${oldUsernameLower}`);
      console.log(`Cleared username mapping: ${oldUsernameLower}`);
    }

    console.log(`Profile updated for user: ${userData.user.id}`);
    return c.json({ 
      success: true, 
      user: data.user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return c.json({ error: "Failed to update profile" }, 500);
  }
});

// Check if username is available
app.get("/make-server-6c9b0e48/auth/check-username/:username", async (c) => {
  try {
    const username = c.req.param('username');
    
    if (!username) {
      return c.json({ error: "Username is required" }, 400);
    }

    // Validate format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return c.json({ 
        available: false,
        error: 'Username must be 3-20 characters and contain only letters, numbers, and underscores'
      });
    }

    // Check if username exists (case-insensitive)
    const usernameLower = username.toLowerCase();
    const existingUserId = await kv.get(`username:${usernameLower}`);
    
    return c.json({ 
      available: !existingUserId,
      username: username
    });
  } catch (error) {
    console.error("Check username error:", error);
    return c.json({ error: "Failed to check username" }, 500);
  }
});

// Delete authenticated user account (App Store / GDPR requirement)
app.post("/make-server-6c9b0e48/auth/delete-account", async (c) => {
  try {
    const authResult = await requireAuth(c);
    if (authResult.error) return authResult.error;
    const user = authResult.user!;
    const userId = user.id;

    const summary = await deleteUserAccountData(
      userId,
      user.user_metadata?.public_username,
    );

    console.log(`Account deleted: ${userId}`, summary);
    return c.json({ success: true, summary });
  } catch (error) {
    console.error("Delete account error:", error);
    return c.json({ error: "Failed to delete account" }, 500);
  }
});

// Send welcome email to OAuth users (Google, Apple)
app.post("/make-server-6c9b0e48/auth/send-welcome-email", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    const supabase = getSupabaseAdmin();
    
    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    
    if (userError || !userData.user) {
      return c.json({ error: "Invalid session" }, 401);
    }

    const user = userData.user;
    const email = user.email;
    const name = user.user_metadata?.name || user.user_metadata?.full_name || 'Friend';

    if (!email) {
      return c.json({ error: "No email found" }, 400);
    }

    // Check if welcome email was already sent
    const emailSentKey = `welcome-email-sent:${user.id}`;
    const alreadySent = await kv.get(emailSentKey);
    
    if (alreadySent) {
      return c.json({ success: true, message: "Welcome email already sent" });
    }

    // Send welcome email
    await sendWelcomeEmail(email, name);
    
    // Mark as sent
    await kv.set(emailSentKey, true);

    console.log(`Welcome email sent to OAuth user: ${user.id}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return c.json({ error: "Failed to send welcome email" }, 500);
  }
});

// Sync authenticated user's IANA timezone (client-detected; server-validated)
app.put("/make-server-6c9b0e48/auth/timezone", async (c) => {
  try {
    const self = await requireSelfUserId(c);
    if (self.error) return self.error;
    const userId = self.userId!;

    const body = await c.req.json().catch(() => ({}));
    if (body.activity_date || body.streak_count || body.previous_streak) {
      return c.json({ error: "Invalid request fields" }, 400);
    }

    const ianaTimezone = body.iana_timezone;
    if (!isValidIanaTimezone(ianaTimezone)) {
      return c.json({ error: "Invalid timezone" }, 400);
    }

    const supabase = getSupabaseAdmin();
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !userData?.user) {
      return c.json({ error: "User not found" }, 404);
    }

    const existing = userData.user.user_metadata?.iana_timezone;
    if (existing === ianaTimezone) {
      return c.json({ success: true, iana_timezone: ianaTimezone, updated: false });
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...userData.user.user_metadata,
        iana_timezone: ianaTimezone,
      },
    });

    if (updateError) {
      console.error("Timezone update error:", updateError);
      return c.json({ error: "Failed to update timezone" }, 500);
    }

    return c.json({ success: true, iana_timezone: ianaTimezone, updated: true });
  } catch (error) {
    console.error("Timezone sync error:", error);
    return c.json({ error: "Failed to sync timezone" }, 500);
  }
});

// ==================== DAILY STREAK ====================

// Get daily streak state — self only; server derives user from session
app.get("/make-server-6c9b0e48/daily-streak", async (c) => {
  try {
    const self = await requireSelfUserId(c);
    if (self.error) return self.error;
    const userId = self.userId!;
    if (!isSafeKvKeySegment(userId)) {
      return c.json({ error: "Invalid userId" }, 400);
    }
    const streak = await buildDailyStreakState(userId);
    return c.json({ streak });
  } catch (error) {
    console.error("Error fetching daily streak:", error);
    return c.json({ error: "Failed to fetch daily streak" }, 500);
  }
});

// ==================== USER STATS ====================

// Get user stats (for Profile tab) — self only; never trust query userId
app.get("/make-server-6c9b0e48/stats", async (c) => {
  try {
    const self = await requireSelfUserId(c);
    if (self.error) return self.error;
    const userId = self.userId!;

    if (!isSafeKvKeySegment(userId)) {
      return c.json({ error: "Invalid userId" }, 400);
    }
    
    // Get user-specific stats
    const userPosts = await kv.getByPrefix(`user-post:${userId}:`);
    const userReplies = await kv.getByPrefix(`user-reply:${userId}:`);
    
    // Calculate stats
    const totalUpvotesReceived = userPosts?.reduce((sum: number, post: any) => 
      sum + (post.upvotes || 0), 0) || 0;
    
    const stats = {
      secretsShared: userPosts?.length || 0,
      repliesGiven: userReplies?.length || 0,
      upvotesReceived: totalUpvotesReceived,
    };

    return c.json({ stats });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return c.json({ error: "Failed to fetch stats" }, 500);
  }
});

// Get user reputation and trusted status (for spam-flagging permission) — self only
app.get("/make-server-6c9b0e48/user-reputation", async (c) => {
  try {
    const self = await requireSelfUserId(c);
    if (self.error) return self.error;
    const userId = self.userId!;
    if (!isSafeKvKeySegment(userId)) {
      return c.json({ error: "Invalid userId" }, 400);
    }
    const { score, isTrusted } = await getUserReputation(userId);
    return c.json({ score, isTrusted, threshold: TRUSTED_USER_THRESHOLD });
  } catch (error) {
    console.error("Error fetching reputation:", error);
    return c.json({ error: "Failed to fetch reputation" }, 500);
  }
});

// Get user level and achievement data — self only
app.get("/make-server-6c9b0e48/user-level", async (c) => {
  try {
    const self = await requireSelfUserId(c);
    if (self.error) return self.error;
    const userId = self.userId!;
    if (!isSafeKvKeySegment(userId)) {
      return c.json({ error: "Invalid userId" }, 400);
    }
    
    // Get user stats
    const userPosts = await kv.getByPrefix(`user-post:${userId}:`);
    const userReplies = await kv.getByPrefix(`user-reply:${userId}:`);
    
    // Calculate stats
    const secretsShared = userPosts?.length || 0;
    const repliesGiven = userReplies?.length || 0;
    const upvotesReceived = userPosts?.reduce((sum: number, post: any) => 
      sum + (post.upvotes || 0), 0) || 0;
    
    // Calculate total activity points
    const activityPoints = secretsShared + repliesGiven + upvotesReceived;
    
    // Calculate level (5 levels total)
    let level = 1;
    let levelTitle = "New Friend";
    let nextLevelPoints = 10;
    let currentLevelMin = 0;
    
    if (activityPoints >= 100) {
      level = 5;
      levelTitle = "Community Leader";
      nextLevelPoints = 100; // Max level
      currentLevelMin = 100;
    } else if (activityPoints >= 50) {
      level = 4;
      levelTitle = "Active Supporter";
      nextLevelPoints = 100;
      currentLevelMin = 50;
    } else if (activityPoints >= 25) {
      level = 3;
      levelTitle = "Engaged Member";
      nextLevelPoints = 50;
      currentLevelMin = 25;
    } else if (activityPoints >= 10) {
      level = 2;
      levelTitle = "Rising Star";
      nextLevelPoints = 25;
      currentLevelMin = 10;
    }
    
    // Calculate progress to next level
    const progressToNext = level === 5 ? 100 : 
      ((activityPoints - currentLevelMin) / (nextLevelPoints - currentLevelMin)) * 100;
    
    // Calculate achievement badges
    const badges = [];
    
    // Getting Started - Create account
    badges.push({
      id: 'getting-started',
      name: 'Getting Started',
      description: 'Created your account',
      icon: '🎉',
      unlocked: true
    });
    
    // Storyteller - Share 10+ secrets
    if (secretsShared >= 10) {
      badges.push({
        id: 'storyteller',
        name: 'Storyteller',
        description: 'Shared 10+ secrets',
        icon: '💬',
        unlocked: true
      });
    }
    
    // Supportive Friend - Give 25+ replies
    if (repliesGiven >= 25) {
      badges.push({
        id: 'supportive-friend',
        name: 'Supportive Friend',
        description: 'Gave 25+ supportive replies',
        icon: '🤝',
        unlocked: true
      });
    }
    
    // Community Favorite - Receive 50+ upvotes
    if (upvotesReceived >= 50) {
      badges.push({
        id: 'community-favorite',
        name: 'Community Favorite',
        description: 'Received 50+ upvotes',
        icon: '⭐',
        unlocked: true
      });
    }
    
    // Active Participant - Both share and reply
    if (secretsShared >= 5 && repliesGiven >= 5) {
      badges.push({
        id: 'active-participant',
        name: 'Active Participant',
        description: 'Actively sharing and supporting',
        icon: '💜',
        unlocked: true
      });
    }
    
    // Veteran - Get account creation date from user profile
    const userProfile = await kv.get(`user-profile:${userId}`);
    if (userProfile) {
      const accountAge = Date.now() - (userProfile.createdAt || Date.now());
      const daysOld = accountAge / (1000 * 60 * 60 * 24);
      
      if (daysOld >= 30) {
        badges.push({
          id: 'veteran',
          name: 'Veteran',
          description: '30+ days as a member',
          icon: '🎖️',
          unlocked: true
        });
      }
    }
    
    const response = {
      level,
      levelTitle,
      activityPoints,
      nextLevelPoints: level === 5 ? activityPoints : nextLevelPoints,
      progressToNext: Math.min(100, Math.max(0, progressToNext)),
      badges,
      stats: {
        secretsShared,
        repliesGiven,
        upvotesReceived
      }
    };

    return c.json(response);
  } catch (error) {
    console.error("Error fetching user level:", error);
    return c.json({ error: "Failed to fetch user level" }, 500);
  }
});

// Get user's posts/secrets — self only
app.get("/make-server-6c9b0e48/user-posts", async (c) => {
  try {
    const self = await requireSelfUserId(c);
    if (self.error) return self.error;
    const userId = self.userId!;
    if (!isSafeKvKeySegment(userId)) {
      return c.json({ error: "Invalid userId" }, 400);
    }
    
    const userPosts = await kv.getByPrefix(`user-post:${userId}:`);
    
    // Sort by timestamp (newest first)
    const sortedPosts = (userPosts || []).sort((a: any, b: any) => 
      (b.timestamp || 0) - (a.timestamp || 0)
    );

    return c.json({
      posts: sortedPosts.map((post: any) => toPublicPost(post, userId)),
    });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return c.json({ error: "Failed to fetch user posts" }, 500);
  }
});

// Get user's replies — self only
app.get("/make-server-6c9b0e48/user-replies", async (c) => {
  try {
    const self = await requireSelfUserId(c);
    if (self.error) return self.error;
    const userId = self.userId!;
    if (!isSafeKvKeySegment(userId)) {
      return c.json({ error: "Invalid userId" }, 400);
    }
    
    const userReplies = await kv.getByPrefix(`user-reply:${userId}:`);

    return c.json({ replies: userReplies || [] });
  } catch (error) {
    console.error("Error fetching user replies:", error);
    return c.json({ error: "Failed to fetch user replies" }, 500);
  }
});

// ==================== DELETE ENDPOINTS ====================

// ==================== LANDING PAGE / WAITLIST ====================

// Save waitlist email
app.post("/make-server-6c9b0e48/waitlist", async (c) => {
  try {
    const rateLimited = rateLimitOrReject(c, "waitlist", 10, 60_000);
    if (rateLimited) return rateLimited;

    const body = await c.req.json();
    const { email, source } = body;

    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: "Invalid email format" }, 400);
    }

    // Check if email already exists
    const existingEmail = await kv.get(`waitlist:${email}`);
    if (existingEmail) {
      return c.json({ 
        success: true, 
        message: "You're already on the waitlist!",
        alreadyExists: true 
      });
    }

    const emailEntry = {
      email,
      source: source || 'landing-page',
      timestamp: new Date().toISOString(),
      createdAt: Date.now(),
    };

    await kv.set(`waitlist:${email}`, emailEntry);

    console.log(`Waitlist email saved: ${email}`);
    return c.json({ 
      success: true, 
      message: "Thanks for joining our waitlist!",
      alreadyExists: false 
    });
  } catch (error) {
    console.error("Error saving waitlist email:", error);
    return c.json({ error: "Failed to save email" }, 500);
  }
});

// Get all waitlist emails (admin only)
app.get("/make-server-6c9b0e48/waitlist", async (c) => {
  try {
    const adminError = requireAdmin(c);
    if (adminError) return adminError;

    const emails = await kv.getByPrefix("waitlist:");
    
    // Sort by timestamp (newest first)
    const sortedEmails = (emails || []).sort((a: any, b: any) => 
      (b.createdAt || 0) - (a.createdAt || 0)
    );

    return c.json({ 
      emails: sortedEmails,
      count: sortedEmails.length 
    });
  } catch (error) {
    console.error("Error fetching waitlist emails:", error);
    return c.json({ error: "Failed to fetch emails" }, 500);
  }
});

// ==================== DELETE ENDPOINTS ====================

// Delete a post
app.delete("/make-server-6c9b0e48/posts/:postId", async (c) => {
  try {
    const authResult = await requireAuth(c);
    if (authResult.error) return authResult.error;
    const user = authResult.user!;

    const postId = c.req.param("postId");
    
    const post = await kv.get(`post:${postId}`);
    
    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }
    
    if (post.userId !== user.id) {
      return c.json({ error: "Unauthorized - you can only delete your own posts" }, 403);
    }

    await deletePostImageIfOwned(post.imageUrl, user.id);
    
    await kv.del(`post:${postId}`);
    
    // Also delete user-post copy if it exists
    if (post.userId) {
      await kv.del(`user-post:${post.userId}:${postId}`);
    }
    
    console.log(`Post deleted: ${postId}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return c.json({ error: "Failed to delete post" }, 500);
  }
});

// Delete a journal entry
app.delete("/make-server-6c9b0e48/journal/:entryId", async (c) => {
  try {
    const authResult = await requireAuth(c);
    if (authResult.error) return authResult.error;
    const user = authResult.user!;

    const entryId = c.req.param("entryId");
    const entry = await kv.get(`journal:${entryId}`);

    if (!entry) {
      return c.json({ error: "Journal entry not found" }, 404);
    }

    if (entry.ownerId !== user.id) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    await kv.del(`journal:${entryId}`);
    await kv.del(`journal-by-user:${user.id}:${entryId}`);
    console.log(`Journal entry deleted: ${entryId}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting journal entry:", error);
    return c.json({ error: "Failed to delete journal entry" }, 500);
  }
});

// ==================== MONETIZATION & PREMIUM ====================

// Get user's subscription and premium status — self only
app.get("/make-server-6c9b0e48/subscription", async (c) => {
  try {
    const self = await requireSelfUserId(c);
    if (self.error) return self.error;
    const userId = self.userId!;
    const subscription = await getSubscriptionRecord(userId);
    return c.json({
      subscription,
      payments: {
        stripeConfigured: isStripeConfigured(),
      },
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return c.json({ error: "Failed to fetch subscription" }, 500);
  }
});

// Direct upgrades are never allowed — Stripe / RevenueCat webhooks grant entitlements
app.post("/make-server-6c9b0e48/subscription/upgrade", async (c) => {
  try {
    const authResult = await requireAuth(c);
    if (authResult.error) return authResult.error;
    return c.json({
      error: "Direct subscription upgrades are disabled. Use Stripe Checkout or in-app purchase.",
      code: "PAYMENT_REQUIRED",
    }, 403);
  } catch (error) {
    console.error("Error on subscription upgrade:", error);
    return c.json({ error: "Failed to upgrade subscription" }, 500);
  }
});

// Direct credit purchases are never allowed without a payment provider
app.post("/make-server-6c9b0e48/subscription/buy-credits", async (c) => {
  try {
    const authResult = await requireAuth(c);
    if (authResult.error) return authResult.error;
    return c.json({
      error: "Direct credit purchases are disabled. Use Stripe Checkout or in-app purchase.",
      code: "PAYMENT_REQUIRED",
    }, 403);
  } catch (error) {
    console.error("Error on buy-credits:", error);
    return c.json({ error: "Failed to buy credits" }, 500);
  }
});

const ALLOWED_CHECKOUT_PLAN_IDS = new Set([
  "premium_monthly",
  "premium_yearly",
  "pro_monthly",
  "pro_yearly",
]);

function isAllowedCheckoutRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") return true;
    if (host === "betweenus.fun" || host.endsWith(".betweenus.fun")) return true;
    return getAllowedOrigins().some((origin) => {
      try {
        return new URL(origin).hostname.toLowerCase() === host;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

// Authenticated Stripe Checkout Session (web)
app.post("/make-server-6c9b0e48/subscription/checkout", async (c) => {
  try {
    const authResult = await requireAuth(c);
    if (authResult.error) return authResult.error;
    const user = authResult.user!;

    if (!isStripeConfigured()) {
      return c.json({
        error: "Stripe Checkout is not configured",
        code: "STRIPE_NOT_CONFIGURED",
      }, 503);
    }

    const body = await c.req.json().catch(() => ({}));
    const planId = typeof body?.planId === "string" ? body.planId.trim() : "";
    const successUrl = typeof body?.successUrl === "string" ? body.successUrl.trim() : "";
    const cancelUrl = typeof body?.cancelUrl === "string" ? body.cancelUrl.trim() : "";

    if (!ALLOWED_CHECKOUT_PLAN_IDS.has(planId)) {
      return c.json({ error: "Invalid planId", code: "INVALID_PLAN" }, 400);
    }
    if (!successUrl || !cancelUrl || !isAllowedCheckoutRedirectUrl(successUrl) || !isAllowedCheckoutRedirectUrl(cancelUrl)) {
      return c.json({ error: "Invalid successUrl or cancelUrl", code: "INVALID_REDIRECT" }, 400);
    }

    const result = await createStripeCheckoutSession({
      userId: user.id,
      email: user.email || null,
      planId,
      successUrl,
      cancelUrl,
    });

    if (!result.url) {
      return c.json({
        error: result.error || "Failed to create checkout session",
        code: result.code || "STRIPE_CHECKOUT_FAILED",
      }, result.code === "STRIPE_PRICE_MISSING" ? 503 : 500);
    }

    return c.json({ success: true, url: result.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return c.json({ error: "Failed to create checkout session" }, 500);
  }
});

// Stripe Customer Portal (manage / cancel)
app.post("/make-server-6c9b0e48/subscription/portal", async (c) => {
  try {
    const authResult = await requireAuth(c);
    if (authResult.error) return authResult.error;
    const user = authResult.user!;

    const subscription = await getSubscriptionRecord(user.id);
    const customerId = subscription.providerCustomerId;
    if (!customerId || subscription.source !== "stripe") {
      return c.json({
        error: "No Stripe customer on this account",
        code: "NO_STRIPE_CUSTOMER",
      }, 400);
    }

    const body = await c.req.json().catch(() => ({}));
    const returnUrl = typeof body?.returnUrl === "string" ? body.returnUrl.trim() : "";
    if (!returnUrl || !isAllowedCheckoutRedirectUrl(returnUrl)) {
      return c.json({ error: "Invalid returnUrl", code: "INVALID_REDIRECT" }, 400);
    }

    const result = await createStripeBillingPortalSession({
      customerId,
      returnUrl,
    });
    if (!result.url) {
      return c.json({
        error: result.error || "Failed to open billing portal",
        code: result.code || "STRIPE_PORTAL_FAILED",
      }, 500);
    }
    return c.json({ success: true, url: result.url });
  } catch (error) {
    console.error("Error creating billing portal session:", error);
    return c.json({ error: "Failed to open billing portal" }, 500);
  }
});

// Stripe webhooks (server-to-server; no client auth)
app.post("/make-server-6c9b0e48/webhooks/stripe", async (c) => {
  try {
    const secret = getStripeWebhookSecret();
    if (!secret) {
      console.error("Stripe webhook secret not configured");
      return c.json({ error: "Webhook not configured" }, 503);
    }

    const payload = await c.req.text();
    const signature = c.req.header("Stripe-Signature") || c.req.header("stripe-signature");
    const valid = await verifyStripeWebhookSignature(payload, signature, secret);
    if (!valid) {
      return c.json({ error: "Invalid signature", code: "INVALID_SIGNATURE" }, 401);
    }

    let event: any;
    try {
      event = JSON.parse(payload);
    } catch {
      return c.json({ error: "Invalid JSON" }, 400);
    }

    const result = await handleStripeWebhookEvent(event);
    console.log(`Stripe webhook ${event?.type}:`, result);
    return c.json({ received: true, ...result });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return c.json({ error: "Webhook handler failed" }, 500);
  }
});

// RevenueCat webhooks (server-to-server; Authorization bearer = shared secret)
app.post("/make-server-6c9b0e48/webhooks/revenuecat", async (c) => {
  try {
    const secret = getRevenueCatWebhookSecret();
    if (!secret) {
      console.error("RevenueCat webhook secret not configured");
      return c.json({ error: "Webhook not configured" }, 503);
    }

    const authorization = c.req.header("Authorization");
    if (!verifyRevenueCatWebhookAuth(authorization, secret)) {
      return c.json({ error: "Unauthorized", code: "INVALID_SIGNATURE" }, 401);
    }

    const event = await c.req.json().catch(() => null);
    if (!event) {
      return c.json({ error: "Invalid JSON" }, 400);
    }

    const result = await handleRevenueCatWebhookEvent(event);
    console.log(`RevenueCat webhook:`, result);
    return c.json({ received: true, ...result });
  } catch (error) {
    console.error("RevenueCat webhook error:", error);
    return c.json({ error: "Webhook handler failed" }, 500);
  }
});

// Edit own post (JWT ownership required; optional image replace/remove)
app.post("/make-server-6c9b0e48/posts/:postId/edit", async (c) => {
  try {
    const authResult = await requireAuth(c);
    if (authResult.error) return authResult.error;
    const user = authResult.user!;

    const postId = c.req.param("postId");
    const body = await c.req.json();
    const { content, categories, imageUrl, imageAspect, removeImage } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return c.json({ error: "content is required" }, 400);
    }

    const subscription = await kv.get(`subscription:${user.id}`) || {
      tier: "free",
      credits: 0,
    };

    if (subscription.tier !== "pro" && (subscription.credits || 0) <= 0) {
      return c.json({
        error: "No edit credits available. Upgrade to Premium or purchase credits.",
        needsCredits: true,
      }, 403);
    }

    const post = await kv.get(`post:${postId}`);
    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }

    if (post.userId !== user.id) {
      return c.json({ error: "Unauthorized - you can only edit your own posts" }, 403);
    }

    post.editHistory = post.editHistory || [];
    post.editHistory.push({
      content: post.content,
      imageUrl: post.imageUrl || null,
      editedAt: new Date().toISOString(),
    });

    post.content = content.trim();
    if (Array.isArray(categories) && categories.length > 0) {
      post.categories = categories.slice(0, 3);
    }

    if (removeImage === true) {
      await deletePostImageIfOwned(post.imageUrl, user.id);
      post.imageUrl = null;
      post.imageAspect = null;
    } else if (typeof imageUrl === "string" && imageUrl.length > 0) {
      const path = extractPostImagePath(imageUrl);
      if (!path) {
        return c.json({ error: "imageUrl must be a Between Us post-images URL" }, 400);
      }
      if (!path.startsWith(`${user.id}/`)) {
        return c.json({ error: "Unauthorized image ownership" }, 403);
      }
      if (post.imageUrl && post.imageUrl !== imageUrl) {
        await deletePostImageIfOwned(post.imageUrl, user.id);
      }
      post.imageUrl = imageUrl;
      post.imageAspect = imageAspect || post.imageAspect || null;
    }

    post.lastEditedAt = new Date().toISOString();
    post.isEdited = true;

    await kv.set(`post:${postId}`, post);
    await kv.set(`user-post:${user.id}:${postId}`, post);

    if (subscription.tier !== "pro") {
      subscription.credits = (subscription.credits || 0) - 1;
      subscription.updatedAt = new Date().toISOString();
      await kv.set(`subscription:${user.id}`, subscription);
    }

    console.log(`Post edited: ${postId} by user ${user.id}`);
    return c.json({
      success: true,
      post,
      creditsRemaining: subscription.credits,
    });
  } catch (error) {
    console.error("Error editing post:", error);
    return c.json({ error: "Failed to edit post" }, 500);
  }
});

const REPORT_REASONS = [
  "spam",
  "harassment",
  "hate",
  "sexual",
  "personal_info",
  "scam",
  "copyright",
  "other",
] as const;

// Report a post (authenticated or validated anonymous actor)
app.post("/make-server-6c9b0e48/posts/:postId/report", async (c) => {
  try {
    const postId = c.req.param("postId");
    const body = await c.req.json();
    const { reason, details, userId } = body;

    if (!REPORT_REASONS.includes(reason)) {
      return c.json({ error: "Invalid report reason" }, 400);
    }

    const actor = await resolveActorId(c, userId);
    if (actor.error) return actor.error;
    const reporterId = actor.actorId!;

    const post = await kv.get(`post:${postId}`);
    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }

    if (post.userId && post.userId === reporterId) {
      return c.json({ error: "You cannot report your own post" }, 400);
    }

    const existing = await kv.get(`post-report-by-user:${postId}:${reporterId}`);
    if (existing) {
      return c.json({ success: true, message: "Already reported", duplicate: true });
    }

    const reportId = generateId();
    const report = {
      id: reportId,
      postId,
      reason,
      details: typeof details === "string" ? details.slice(0, 500) : "",
      reporterId,
      isAuthenticated: actor.isAuthenticated,
      status: "open",
      createdAt: new Date().toISOString(),
      postSnippet: typeof post.content === "string" ? post.content.slice(0, 200) : "",
      postImageUrl: post.imageUrl || null,
    };

    await kv.set(`report:${reportId}`, report);
    await kv.set(`post-report:${postId}:${reportId}`, report);
    await kv.set(`post-report-by-user:${postId}:${reporterId}`, { reportId, createdAt: report.createdAt });

    return c.json({ success: true, reportId });
  } catch (error) {
    console.error("Error reporting post:", error);
    return c.json({ error: "Failed to report post" }, 500);
  }
});

// Admin: list open reports
app.get("/make-server-6c9b0e48/admin/reports", async (c) => {
  const adminError = requireAdmin(c);
  if (adminError) return adminError;
  try {
    const reports = (await kv.getByPrefix("report:")) || [];
    const sorted = reports.sort((a: any, b: any) =>
      String(b.createdAt || "").localeCompare(String(a.createdAt || "")),
    );
    return c.json({ reports: sorted });
  } catch (error) {
    console.error("Error listing reports:", error);
    return c.json({ error: "Failed to list reports" }, 500);
  }
});

// Check if user can post (based on monthly limit) — self only
app.get("/make-server-6c9b0e48/subscription/can-post", async (c) => {
  try {
    const self = await requireSelfUserId(c);
    if (self.error) return self.error;
    const userId = self.userId!;

    const subscription = await getSubscriptionRecord(userId);

    // Check if we need to reset monthly counter
    const lastReset = new Date(subscription.lastResetDate || 0);
    const now = new Date();
    const daysSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceReset >= 30) {
      subscription.postsThisMonth = 0;
      subscription.lastResetDate = now.toISOString();
      await kv.set(`subscription:${userId}`, subscription);
    }

    const canPost = subscription.postsThisMonth < subscription.monthlyPostLimit;
    const postsRemaining = subscription.monthlyPostLimit - subscription.postsThisMonth;

    return c.json({
      canPost,
      postsThisMonth: subscription.postsThisMonth,
      monthlyPostLimit: subscription.monthlyPostLimit,
      postsRemaining,
      tier: subscription.tier,
    });
  } catch (error) {
    console.error("Error checking post limit:", error);
    return c.json({ error: "Failed to check post limit" }, 500);
  }
});

// Increment post count — self only (server also increments on POST /posts)
app.post("/make-server-6c9b0e48/subscription/increment-post", async (c) => {
  try {
    const self = await requireSelfUserId(c);
    if (self.error) return self.error;
    const userId = self.userId!;

    const body = await c.req.json().catch(() => ({}));
    if (body?.userId && !assertMatchingUserId(userId, body.userId)) {
      return c.json({ error: "Unauthorized userId" }, 403);
    }
    
    const subscription = await kv.get(`subscription:${userId}`) || {
      tier: 'free',
      credits: 0,
      postsThisMonth: 0,
      monthlyPostLimit: 3,
      lastResetDate: new Date().toISOString(),
    };
    
    subscription.postsThisMonth = (subscription.postsThisMonth || 0) + 1;
    subscription.updatedAt = new Date().toISOString();
    
    await kv.set(`subscription:${userId}`, subscription);
    
    return c.json({ success: true, postsThisMonth: subscription.postsThisMonth });
  } catch (error) {
    console.error("Error incrementing post count:", error);
    return c.json({ error: "Failed to increment post count" }, 500);
  }
});

// DEVELOPER TOOL: Clear all public usernames (admin only)
app.post("/make-server-6c9b0e48/admin/clear-all-usernames", async (c) => {
  try {
    const adminError = requireAdmin(c);
    if (adminError) return adminError;

    console.log("🔧 Admin Tool: Clearing all usernames...");
    
    const supabase = getSupabaseAdmin();
    let clearedCount = 0;
    let page = 1;
    const perPage = 1000;
    
    // Paginate through all users
    while (true) {
      // List users from Supabase Auth (pagination)
      const { data: { users }, error } = await supabase.auth.admin.listUsers({
        page,
        perPage,
      });
      
      if (error) {
        console.error("Error listing users:", error);
        throw error;
      }
      
      if (!users || users.length === 0) {
        break; // No more users
      }
      
      console.log(`Processing page ${page}: ${users.length} users`);
      
      // Process each user
      for (const user of users) {
        const oldUsername = user.user_metadata?.public_username;
        
        if (oldUsername) {
          // Remove username from KV registry
          await kv.del(`username:${oldUsername.toLowerCase()}`);
          
          // Create new metadata without public_username
          const newMetadata = { ...user.user_metadata };
          delete newMetadata.public_username;
          
          // Update user metadata to remove public_username
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            {
              user_metadata: newMetadata,
            }
          );
          
          if (updateError) {
            console.error(`Failed to update user ${user.id}:`, updateError);
          } else {
            clearedCount++;
            console.log(`✓ Cleared username "${oldUsername}" for user: ${user.id}`);
          }
        }
      }
      
      // Move to next page
      if (users.length < perPage) {
        break; // This was the last page
      }
      page++;
    }
    
    console.log(`✅ Cleared ${clearedCount} usernames total`);
    
    return c.json({ 
      success: true, 
      count: clearedCount,
      message: `Successfully cleared ${clearedCount} usernames`
    });
  } catch (error) {
    console.error("Error clearing usernames:", error);
    return c.json({ error: "Failed to clear usernames" }, 500);
  }
});

console.log("🚀 Between Us server started!");
Deno.serve(app.fetch);