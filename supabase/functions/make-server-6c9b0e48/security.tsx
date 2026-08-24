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
];

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

export function requireAdmin(c: Context) {
  const configuredSecret = Deno.env.get("BETWEENUS_ADMIN_SECRET");
  if (!configuredSecret) {
    return c.json({ error: "Admin endpoint disabled" }, 403);
  }

  const providedSecret = c.req.header("X-Admin-Secret");
  if (!providedSecret || providedSecret !== configuredSecret) {
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

export function isProductionRuntime(): boolean {
  return Deno.env.get("BETWEENUS_ENV") === "production";
}

const ANONYMOUS_VOTER_PATTERN = /^anonymous-user-[a-z0-9]{6,24}$/;

export function isValidAnonymousActorId(actorId: string | null | undefined): boolean {
  if (!actorId) return false;
  return ANONYMOUS_VOTER_PATTERN.test(actorId);
}

/**
 * Resolve the acting user for votes/replies.
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
