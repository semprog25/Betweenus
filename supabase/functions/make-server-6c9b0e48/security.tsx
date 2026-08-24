import type { Context } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const DEFAULT_ALLOWED_ORIGINS = [
  "https://betweenus.fun",
  "https://www.betweenus.fun",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:4174",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:4173",
  "http://127.0.0.1:4174",
  "capacitor://localhost",
  "ionic://localhost",
  "http://localhost",
  "https://localhost",
];

export const MAX_POST_CONTENT_LENGTH = 5000;
export const MAX_REPLY_CONTENT_LENGTH = 2000;
export const MAX_JOURNAL_CONTENT_LENGTH = 10000;
export const MAX_CHECKIN_NOTE_LENGTH = 2000;
export const MAX_FEED_LIMIT = 50;
export const DEFAULT_FEED_LIMIT = 25;
export const MAX_USERNAME_LENGTH = 24;

const ANONYMOUS_VOTER_PATTERN = /^anonymous-user-[a-z0-9]{6,24}$/;
const SAFE_KV_SEGMENT_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export function getAllowedOrigins(): string[] {
  const configured = Deno.env.get("BETWEENUS_ALLOWED_ORIGINS");
  if (!configured) return DEFAULT_ALLOWED_ORIGINS;
  return configured.split(",").map((origin) => origin.trim()).filter(Boolean);
}

export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;
  return getAllowedOrigins().includes(origin);
}

export function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
}

export function getSupabaseClient(accessToken?: string) {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    accessToken
      ? {
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        }
      : undefined,
  );
}

export async function getAuthUser(c: Context) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return null;

  const supabase = getSupabaseClient(token);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export async function requireAuth(c: Context) {
  const user = await getAuthUser(c);
  if (!user) {
    return { user: null, error: c.json({ error: "Authentication required" }, 401) };
  }
  return { user, error: null };
}

function timingSafeEqualString(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  if (left.length !== right.length) {
    let diff = left.length ^ right.length;
    for (let i = 0; i < left.length; i++) {
      diff |= left[i] ^ left[i];
    }
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < left.length; i++) {
    mismatch |= left[i] ^ right[i];
  }
  return mismatch === 0;
}

export function requireAdmin(c: Context) {
  const configuredSecret = Deno.env.get("BETWEENUS_ADMIN_SECRET");
  if (!configuredSecret) {
    return c.json({ error: "Admin endpoint disabled" }, 403);
  }

  const providedSecret = c.req.header("X-Admin-Secret");
  if (!providedSecret || !timingSafeEqualString(providedSecret, configuredSecret)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return null;
}

export function assertMatchingUserId(
  authenticatedUserId: string,
  requestedUserId: string | null | undefined,
) {
  if (!requestedUserId || requestedUserId !== authenticatedUserId) {
    return false;
  }
  return true;
}

/**
 * Payment-mutating endpoints stay locked unless BETWEENUS_ENV is explicitly development.
 * Missing/misconfigured env must not allow free premium upgrades.
 */
export function isProductionRuntime(): boolean {
  const env = (Deno.env.get("BETWEENUS_ENV") || "").toLowerCase().trim();
  return env !== "development" && env !== "dev" && env !== "local";
}

export function isValidAnonymousActorId(actorId: string | null | undefined): boolean {
  if (!actorId) return false;
  return ANONYMOUS_VOTER_PATTERN.test(actorId);
}

export function isSafeKvKeySegment(value: string | null | undefined): boolean {
  if (!value) return false;
  if (value.includes("%") || value.includes("_") || value.includes("..")) return false;
  return SAFE_KV_SEGMENT_PATTERN.test(value) || UUID_PATTERN.test(value) ||
    isValidAnonymousActorId(value);
}

/**
 * Resolve the acting user for votes/replies/reports.
 * Authenticated users always use JWT identity — client userId is ignored except for mismatch checks.
 * Anonymous users may use a device-scoped anonymous ID with strict format validation.
 */
export async function resolveActorId(
  c: Context,
  requestedUserId?: string | null,
): Promise<{ actorId: string | null; isAuthenticated: boolean; error: Response | null }> {
  const auth = await requireAuth(c);

  if (auth.user) {
    if (requestedUserId && requestedUserId !== auth.user.id) {
      return {
        actorId: null,
        isAuthenticated: true,
        error: c.json({ error: "Unauthorized userId" }, 403),
      };
    }
    return { actorId: auth.user.id, isAuthenticated: true, error: null };
  }

  if (isValidAnonymousActorId(requestedUserId)) {
    return { actorId: requestedUserId!, isAuthenticated: false, error: null };
  }

  return {
    actorId: null,
    isAuthenticated: false,
    error: c.json({ error: "Valid anonymous voter ID or authentication required" }, 401),
  };
}

export async function resolveAuthenticatedActorId(
  c: Context,
  requestedUserId?: string | null,
): Promise<{ actorId: string | null; error: Response | null }> {
  const auth = await requireAuth(c);
  if (!auth.user) {
    return { actorId: null, error: auth.error };
  }
  if (requestedUserId && requestedUserId !== auth.user.id) {
    return { actorId: null, error: c.json({ error: "Unauthorized userId" }, 403) };
  }
  return { actorId: auth.user.id, error: null };
}

/**
 * Self-only identity for profile/stats/subscription reads.
 * Never trust a client-supplied userId query/body for these surfaces.
 */
export async function requireSelfUserId(c: Context): Promise<{
  userId: string | null;
  user: Awaited<ReturnType<typeof getAuthUser>>;
  error: Response | null;
}> {
  const auth = await requireAuth(c);
  if (!auth.user) {
    return { userId: null, user: null, error: auth.error };
  }
  return { userId: auth.user.id, user: auth.user, error: null };
}

export function clampLimit(
  raw: string | null | undefined,
  fallback: number = DEFAULT_FEED_LIMIT,
  max: number = MAX_FEED_LIMIT,
): number {
  const parsed = raw ? Number.parseInt(String(raw), 10) : NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

export function validateContentLength(
  content: unknown,
  maxLength: number,
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof content !== "string") {
    return { ok: false, error: "Content must be a string" };
  }
  const trimmed = content.trim();
  if (!trimmed) {
    return { ok: false, error: "Content is required" };
  }
  if (trimmed.length > maxLength) {
    return { ok: false, error: `Content exceeds maximum length of ${maxLength}` };
  }
  return { ok: true, value: trimmed };
}

export function getClientIp(c: Context): string {
  const forwarded = c.req.header("x-forwarded-for") || c.req.header("cf-connecting-ip") || "";
  const first = forwarded.split(",")[0]?.trim();
  return first || "unknown";
}

export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}

export function rateLimitOrReject(
  c: Context,
  scope: string,
  max: number,
  windowMs: number,
): Response | null {
  const key = `${scope}:${getClientIp(c)}`;
  if (!checkRateLimit(key, max, windowMs)) {
    return c.json({ error: "Too many requests. Please try again later." }, 429);
  }
  return null;
}

function toPublicReply(reply: any, viewerId?: string | null) {
  const upvotedBy = Array.isArray(reply?.upvotedBy) ? reply.upvotedBy : [];
  const downvotedBy = Array.isArray(reply?.downvotedBy) ? reply.downvotedBy : [];
  const publicReply: Record<string, unknown> = {
    id: reply?.id,
    content: reply?.content,
    isAnonymous: reply?.isAnonymous !== false,
    upvotes: reply?.upvotes || 0,
    downvotes: reply?.downvotes || 0,
    upvotedBy: viewerId && upvotedBy.includes(viewerId) ? [viewerId] : [],
    downvotedBy: viewerId && downvotedBy.includes(viewerId) ? [viewerId] : [],
    createdAt: reply?.createdAt,
    isEdited: Boolean(reply?.isEdited),
    editedAt: reply?.editedAt || null,
  };

  if (reply?.isAnonymous === false && reply?.userId && !isValidAnonymousActorId(reply.userId)) {
    publicReply.userId = reply.userId;
  }

  return publicReply;
}

/**
 * Strip internal identity / vote-list fields from public feed and story responses.
 * Viewer-only vote arrays preserve client UI without leaking other actors.
 */
export function toPublicPost(post: any, viewerId?: string | null) {
  if (!post || typeof post !== "object") return post;

  const upvotedBy = Array.isArray(post.upvotedBy) ? post.upvotedBy : [];
  const downvotedBy = Array.isArray(post.downvotedBy) ? post.downvotedBy : [];
  const replies = Array.isArray(post.replies)
    ? post.replies.map((reply: any) => toPublicReply(reply, viewerId))
    : [];

  const publicPost: Record<string, unknown> = {
    id: post.id,
    content: post.content,
    mood: post.mood || null,
    isAnonymous: post.isAnonymous !== false,
    languages: Array.isArray(post.languages) ? post.languages : ["en"],
    categories: Array.isArray(post.categories) ? post.categories : ["General"],
    imageUrl: post.imageUrl || null,
    imageAspect: post.imageAspect || null,
    upvotes: post.upvotes || 0,
    downvotes: post.downvotes || 0,
    upvotedBy: viewerId && upvotedBy.includes(viewerId) ? [viewerId] : [],
    downvotedBy: viewerId && downvotedBy.includes(viewerId) ? [viewerId] : [],
    replies,
    replyCount: replies.length,
    createdAt: post.createdAt,
    timestamp: post.timestamp,
    isEdited: Boolean(post.isEdited),
    editedAt: post.editedAt || post.lastEditedAt || null,
  };

  if (post.isAnonymous === false && post.userId && !isValidAnonymousActorId(post.userId)) {
    publicPost.userId = post.userId;
  }

  return publicPost;
}

export function toPublicAuthUser(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown>; created_at?: string }) {
  return {
    id: user.id,
    email: user.email || null,
    created_at: user.created_at || null,
    user_metadata: {
      username: user.user_metadata?.username || null,
      full_name: user.user_metadata?.full_name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
    },
  };
}

export async function resolveOptionalViewerId(c: Context): Promise<string | null> {
  const authUser = await getAuthUser(c);
  if (authUser?.id) return authUser.id;

  const viewerId =
    c.req.query("viewerId") ||
    c.req.header("x-betweenus-viewer-id") ||
    null;

  if (isValidAnonymousActorId(viewerId)) return viewerId;
  return null;
}
