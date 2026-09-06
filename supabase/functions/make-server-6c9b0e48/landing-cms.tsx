/**
 * Between Us editorial Journal CMS (Landing CMS).
 * Separate from private check-in journal KV endpoints.
 */
import type { Context } from "npm:hono";
import type { Hono } from "npm:hono";
import {
  getSupabaseAdmin,
  requireAuth,
  requireLandingCmsAdmin,
  parseLandingCmsBootstrapAdminIds,
  normalizeAuthUserId,
  rateLimitOrReject,
} from "./security.tsx";

const ROUTE = "/make-server-6c9b0e48/landing-cms";
const TABLE = "journal_articles";
const BUCKET = "journal-images";
const ALLOWED_STATUSES = new Set(["draft", "scheduled", "published", "archived"]);
const ALLOWED_LOCALES = new Set(["en", "de", "fr", "es", "hi", "zh"]);
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_TITLE = 200;
const MAX_SUBTITLE = 300;
const MAX_EXCERPT = 500;
const MAX_BODY = 200_000;
const MAX_AUTHOR = 120;
const MAX_CATEGORY = 80;
const MAX_TAG = 40;
const MAX_TAGS = 20; // client UI caps at 8; keep 20 for backwards-compatible imports
const MAX_SEO = 300;
const MAX_URL = 500;
const MAX_IMAGE_PATH = 500;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "em", "b", "i", "u", "s", "blockquote",
  "ul", "ol", "li", "h1", "h2", "h3", "h4", "a", "img", "hr", "span",
  "figure", "figcaption",
  "table", "thead", "tbody", "tr", "th", "td",
]);

function estimateReadingTimeMinutes(html: string): number {
  const WORDS_PER_MINUTE = 225;
  const cleaned = stripParserLabelLeakage(html);
  const text = cleaned.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = text ? text.split(" ").filter(Boolean).length : 0;
  if (!words) return 1;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** Remove ChatGPT/parser instruction labels that accidentally leaked into body HTML. */
function stripParserLabelLeakage(html: string): string {
  let cleaned = String(html || "");

  // Truncate only at an exact label-only FINAL VERIFICATION / FINAL REQUIREMENT paragraph.
  // Do not use open-ended [\s\S]*$ from a bare keyword match — that can erase article prose.
  const verifyTail =
    /<p\b[^>]*>\s*(?:<(?:strong|em|b|i)\b[^>]*>\s*)*FINAL\s+(?:VERIFICATION|REQUIREMENT)\s*(?:<\/(?:strong|em|b|i)>\s*)*<\/p>/i;
  const verifyMatch = cleaned.match(verifyTail);
  if (verifyMatch && typeof verifyMatch.index === "number") {
    cleaned = cleaned.slice(0, verifyMatch.index);
  }

  cleaned = cleaned.replace(/<p\b[^>]*>\s*Do not publish the four articles\.?\s*<\/p>/gi, "");

  cleaned = cleaned.replace(
    /<(p|h[1-6]|li)(\b[^>]*)>([\s\S]*?)<\/\1>/gi,
    (_full, tag, attrs, inner) => {
      const plain = String(inner || "")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
      const key = plain.replace(/:$/, "").toLowerCase();
      const labelOnly = new Set([
        "title",
        "slug",
        "excerpt",
        "category",
        "tags",
        "tag",
        "seo title",
        "seo description",
        "keywords",
        "seo keywords",
        "sections",
        "section",
        "heading",
        "block",
        "content",
        "paragraph",
        "callout",
        "tip",
        "quote",
        "checklist",
        "table",
        "final cta paragraph",
        "final cta",
        "closing cta",
        "call to action",
        "cta",
        "cta paragraph",
        "final verification",
        "final requirement",
      ]);
      if (labelOnly.has(key) || /^section\s*0*\d+$/i.test(key)) return "";
      return `<${tag}${attrs}>${inner}</${tag}>`;
    },
  );
  return cleaned.replace(/<p>\s*<\/p>/gi, "").replace(/\n{3,}/g, "\n\n").trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Strict allowlist HTML sanitizer for editorial body content. */
export function sanitizeEditorialHtml(input: unknown): string {
  if (typeof input !== "string") return "";
  let html = input
    .replace(/<\s*(script|style|iframe|object|embed|form|link|meta|base|svg)[\s\S]*?>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|form|link|meta|base|svg)[^>]*\/?\s*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, "$1=$2#$2")
    .replace(/(href|src)\s*=\s*(["'])\s*data:[^"']*\2/gi, "$1=$2#$2");

  html = html.replace(/<\/?([a-z0-9]+)([^>]*)\/?>/gi, (full, rawTag, rawAttrs) => {
    const tag = String(rawTag).toLowerCase();
    const isClose = full.startsWith("</");
    if (!ALLOWED_TAGS.has(tag)) return "";
    if (isClose) return `</${tag}>`;

    if (tag === "br" || tag === "hr") return `<${tag} />`;

    const attrs: string[] = [];
    if (tag === "a") {
      const hrefMatch = String(rawAttrs).match(/href\s*=\s*(["'])(.*?)\1/i);
      if (hrefMatch) {
        const href = hrefMatch[2].trim();
        if (/^https?:\/\//i.test(href) || href.startsWith("/") || href.startsWith("#")) {
          attrs.push(`href="${escapeHtml(href)}"`);
          attrs.push('rel="noopener noreferrer"');
          if (/^https?:\/\//i.test(href)) attrs.push('target="_blank"');
        }
      }
    }
    if (tag === "img") {
      const srcMatch = String(rawAttrs).match(/src\s*=\s*(["'])(.*?)\1/i);
      const altMatch = String(rawAttrs).match(/alt\s*=\s*(["'])(.*?)\1/i);
      if (srcMatch) {
        const src = srcMatch[2].trim();
        if (
          /^https:\/\/qoqbdiixztolvtcjdnle\.supabase\.co\/storage\//i.test(src) ||
          /^https:\/\/betweenus\.fun\//i.test(src) ||
          src.startsWith("/assets/") ||
          src.startsWith("/journal/")
        ) {
          attrs.push(`src="${escapeHtml(src)}"`);
          attrs.push(`alt="${escapeHtml(altMatch?.[2] || "")}"`);
          attrs.push('loading="lazy"');
        } else {
          return "";
        }
      } else {
        return "";
      }
    }
    return attrs.length ? `<${tag} ${attrs.join(" ")}>` : `<${tag}>`;
  });

  return html.trim();
}

function asTrimmedString(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (!t || t.length > max) return null;
  return t;
}

function normalizeSlug(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const slug = value.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  if (!SLUG_PATTERN.test(slug) || slug.length > 120) return null;
  return slug;
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const t = item.trim().toLowerCase().slice(0, MAX_TAG);
    if (!t || out.includes(t)) continue;
    out.push(t);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

function normalizeRelatedIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((id): id is string => typeof id === "string" && UUID_PATTERN.test(id))
    .slice(0, 12);
}

function isSafeImageRef(value: string | null | undefined): boolean {
  if (!value) return true;
  if (value.length > MAX_IMAGE_PATH) return false;
  if (value.includes("..") || value.includes("\\")) return false;
  if (value.startsWith("journal/")) return true;
  if (/^https:\/\/qoqbdiixztolvtcjdnle\.supabase\.co\/storage\/v1\/object\/public\/journal-images\//i.test(value)) {
    return true;
  }
  if (/^https:\/\/betweenus\.fun\/assets\/journal\//i.test(value)) return true;
  if (value.startsWith("/assets/journal/")) return true;
  return false;
}

function computePublicImageUrl(pathOrUrl: string | null): string | null {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://") || pathOrUrl.startsWith("/")) {
    return pathOrUrl;
  }
  const base = Deno.env.get("SUPABASE_URL") || "https://qoqbdiixztolvtcjdnle.supabase.co";
  return `${base}/storage/v1/object/public/${BUCKET}/${pathOrUrl.replace(/^\//, "")}`;
}

interface ArticleInput {
  slug?: string;
  locale?: string;
  translation_group_id?: string | null;
  title?: string;
  subtitle?: string | null;
  excerpt?: string;
  body?: string;
  featured_image?: string | null;
  featured_image_alt?: string | null;
  thumbnail_image?: string | null;
  social_image?: string | null;
  author?: string;
  category?: string;
  tags?: string[];
  status?: string;
  featured?: boolean;
  published_at?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  canonical_url?: string | null;
  noindex?: boolean;
  related_article_ids?: string[];
  sponsored?: boolean;
  advertisement_disclosure?: string | null;
  allow_missing_image?: boolean;
}

function validateArticlePayload(
  body: ArticleInput,
  opts: { partial?: boolean; forPublish?: boolean } = {},
): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
  const partial = Boolean(opts.partial);
  const forPublish = Boolean(opts.forPublish);
  const data: Record<string, unknown> = {};

  if (!partial || body.slug !== undefined) {
    const slug = normalizeSlug(body.slug);
    if (!slug) return { ok: false, error: "Invalid slug (lowercase kebab-case required)" };
    data.slug = slug;
  }

  if (!partial || body.locale !== undefined) {
    const locale = typeof body.locale === "string" ? body.locale.trim().toLowerCase() : "en";
    if (!ALLOWED_LOCALES.has(locale)) return { ok: false, error: "Unsupported locale" };
    data.locale = locale;
  }

  if (body.translation_group_id !== undefined) {
    if (body.translation_group_id === null || body.translation_group_id === "") {
      data.translation_group_id = null;
    } else if (typeof body.translation_group_id === "string" && UUID_PATTERN.test(body.translation_group_id)) {
      data.translation_group_id = body.translation_group_id;
    } else {
      return { ok: false, error: "Invalid translation_group_id" };
    }
  }

  if (!partial || body.title !== undefined) {
    const title = asTrimmedString(body.title, MAX_TITLE);
    if (!title) return { ok: false, error: "Title is required" };
    data.title = title;
  }

  if (body.subtitle !== undefined) {
    if (body.subtitle === null || body.subtitle === "") data.subtitle = null;
    else {
      const subtitle = asTrimmedString(body.subtitle, MAX_SUBTITLE);
      if (!subtitle) return { ok: false, error: "Subtitle too long" };
      data.subtitle = subtitle;
    }
  }

  if (!partial || body.excerpt !== undefined) {
    const excerpt = asTrimmedString(body.excerpt, MAX_EXCERPT);
    if (!excerpt) return { ok: false, error: "Excerpt is required" };
    data.excerpt = excerpt;
  }

  if (!partial || body.body !== undefined) {
    if (typeof body.body !== "string" || !body.body.trim()) {
      return { ok: false, error: "Body is required" };
    }
    if (body.body.length > MAX_BODY) return { ok: false, error: "Body too long" };
    const withoutLabels = stripParserLabelLeakage(body.body);
    const sanitized = sanitizeEditorialHtml(withoutLabels);
    if (!sanitized) return { ok: false, error: "Body is empty after sanitization" };
    data.body = sanitized;
    data.reading_time_minutes = estimateReadingTimeMinutes(sanitized);
  }

  if (!partial || body.author !== undefined) {
    const author = asTrimmedString(body.author, MAX_AUTHOR);
    if (!author) return { ok: false, error: "Author is required" };
    data.author = author;
  }

  if (!partial || body.category !== undefined) {
    const category = asTrimmedString(body.category, MAX_CATEGORY);
    if (!category) return { ok: false, error: "Category is required" };
    data.category = category;
  }

  if (body.tags !== undefined) data.tags = normalizeTags(body.tags);
  if (body.related_article_ids !== undefined) data.related_article_ids = normalizeRelatedIds(body.related_article_ids);

  if (body.featured_image !== undefined) {
    const img = body.featured_image === null || body.featured_image === ""
      ? null
      : asTrimmedString(body.featured_image, MAX_IMAGE_PATH);
    if (img === null && body.featured_image) return { ok: false, error: "Invalid featured_image" };
    if (!isSafeImageRef(img)) return { ok: false, error: "Unsafe featured_image path" };
    data.featured_image = img;
  }

  if (body.featured_image_alt !== undefined) {
    data.featured_image_alt = body.featured_image_alt
      ? asTrimmedString(body.featured_image_alt, MAX_TITLE)
      : null;
  }

  if (body.social_image !== undefined) {
    const img = body.social_image === null || body.social_image === ""
      ? null
      : asTrimmedString(body.social_image, MAX_IMAGE_PATH);
    if (img === null && body.social_image) return { ok: false, error: "Invalid social_image" };
    if (!isSafeImageRef(img)) return { ok: false, error: "Unsafe social_image path" };
    data.social_image = img;
  }

  if (body.thumbnail_image !== undefined) {
    const img = body.thumbnail_image === null || body.thumbnail_image === ""
      ? null
      : asTrimmedString(body.thumbnail_image, MAX_IMAGE_PATH);
    if (img === null && body.thumbnail_image) return { ok: false, error: "Invalid thumbnail_image" };
    if (!isSafeImageRef(img)) return { ok: false, error: "Unsafe thumbnail_image path" };
    data.thumbnail_image = img;
  }

  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !ALLOWED_STATUSES.has(body.status)) {
      return { ok: false, error: "Invalid status" };
    }
    data.status = body.status;
  }

  if (body.featured !== undefined) data.featured = Boolean(body.featured);
  if (body.noindex !== undefined) data.noindex = Boolean(body.noindex);
  if (body.sponsored !== undefined) data.sponsored = Boolean(body.sponsored);

  if (body.published_at !== undefined) {
    if (body.published_at === null || body.published_at === "") {
      data.published_at = null;
    } else {
      const d = new Date(String(body.published_at));
      if (Number.isNaN(d.getTime())) return { ok: false, error: "Invalid published_at" };
      data.published_at = d.toISOString();
    }
  }

  if (body.seo_title !== undefined) {
    data.seo_title = body.seo_title ? asTrimmedString(body.seo_title, MAX_SEO) : null;
  }
  if (body.seo_description !== undefined) {
    data.seo_description = body.seo_description
      ? asTrimmedString(body.seo_description, MAX_SEO)
      : null;
  }
  if (body.canonical_url !== undefined) {
    if (!body.canonical_url) data.canonical_url = null;
    else {
      const url = asTrimmedString(body.canonical_url, MAX_URL);
      if (!url || !/^https:\/\/betweenus\.fun\//i.test(url)) {
        return { ok: false, error: "canonical_url must be https://betweenus.fun/..." };
      }
      data.canonical_url = url;
    }
  }
  if (body.advertisement_disclosure !== undefined) {
    data.advertisement_disclosure = body.advertisement_disclosure
      ? asTrimmedString(body.advertisement_disclosure, MAX_SEO)
      : null;
  }

  if (forPublish) {
    const required = ["title", "slug", "excerpt", "body", "category", "author"] as const;
    for (const key of required) {
      if (!data[key] && body[key] === undefined) {
        // checked against merged row later
      }
    }
  }

  return { ok: true, data };
}

function assertPublishReady(row: Record<string, unknown>, allowMissingImage: boolean): string | null {
  if (!row.title || !row.slug || !row.excerpt || !row.body || !row.category || !row.author) {
    return "Publishing requires title, slug, excerpt, body, category, and author";
  }
  if (!row.featured_image && !allowMissingImage) {
    return "Publishing requires a featured image (or set allow_missing_image)";
  }
  return null;
}

function mapArticle(row: Record<string, unknown>) {
  return {
    ...row,
    featured_image_url: computePublicImageUrl(
      typeof row.featured_image === "string" ? row.featured_image : null,
    ),
    thumbnail_image_url: computePublicImageUrl(
      typeof row.thumbnail_image === "string" ? row.thumbnail_image : null,
    ),
    social_image_url: computePublicImageUrl(
      typeof row.social_image === "string" ? row.social_image : null,
    ),
  };
}

async function gate(c: Context) {
  const limited = rateLimitOrReject(c, "landing-cms", 120, 60_000);
  if (limited) return { error: limited, user: null };
  return requireLandingCmsAdmin(c);
}

export function registerLandingCmsRoutes(app: Hono) {
  app.get(`${ROUTE}/me`, async (c) => {
    try {
      const auth = await requireLandingCmsAdmin(c);
      if (auth.error) {
        // Distinguish auth vs forbidden for CMS login UX
        const userAuth = await requireAuth(c);
        if (userAuth.error) return userAuth.error;
        return c.json({
          success: false,
          error: "No CMS access",
          userId: userAuth.user!.id,
          role: null,
          bootstrapHint: true,
        }, 403);
      }
      const bootstrap = parseLandingCmsBootstrapAdminIds().has(
        normalizeAuthUserId(auth.user!.id),
      );
      return c.json({
        success: true,
        userId: auth.user!.id,
        email: auth.user!.email || null,
        role: "admin",
        isBootstrapAdmin: bootstrap,
      });
    } catch (e) {
      console.error("landing-cms/me:", e);
      return c.json({ error: "Failed" }, 500);
    }
  });

  app.get(`${ROUTE}/journal-articles`, async (c) => {
    try {
      const g = await gate(c);
      if (g.error) return g.error;
      const status = c.req.query("status");
      const locale = c.req.query("locale") || "en";
      const supabase = getSupabaseAdmin();
      let q = supabase.from(TABLE).select("*").eq("locale", locale).order("updated_at", {
        ascending: false,
      });
      if (status && ALLOWED_STATUSES.has(status)) q = q.eq("status", status);
      const { data, error } = await q.limit(200);
      if (error) {
        console.error("journal-articles list:", error);
        return c.json({ error: "Failed to list articles" }, 500);
      }
      return c.json({ success: true, articles: (data || []).map(mapArticle) });
    } catch (e) {
      console.error("landing-cms list:", e);
      return c.json({ error: "Failed" }, 500);
    }
  });

  app.get(`${ROUTE}/journal-articles/:id`, async (c) => {
    try {
      const g = await gate(c);
      if (g.error) return g.error;
      const id = c.req.param("id");
      if (!UUID_PATTERN.test(id)) return c.json({ error: "Invalid id" }, 400);
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
      if (error) return c.json({ error: "Failed to fetch article" }, 500);
      if (!data) return c.json({ error: "Not found" }, 404);
      return c.json({ success: true, article: mapArticle(data) });
    } catch (e) {
      console.error("landing-cms get:", e);
      return c.json({ error: "Failed" }, 500);
    }
  });

  app.post(`${ROUTE}/journal-articles`, async (c) => {
    try {
      const g = await gate(c);
      if (g.error) return g.error;
      const body = await c.req.json().catch(() => ({})) as ArticleInput;
      const validated = validateArticlePayload({
        ...body,
        status: body.status || "draft",
        locale: body.locale || "en",
      });
      if (!validated.ok) return c.json({ error: validated.error }, 400);
      const row = {
        ...validated.data,
        status: (validated.data.status as string) || "draft",
        featured: Boolean(validated.data.featured),
        noindex: Boolean(validated.data.noindex),
        sponsored: Boolean(validated.data.sponsored),
        tags: (validated.data.tags as string[]) || [],
        related_article_ids: (validated.data.related_article_ids as string[]) || [],
        created_by: g.user!.id,
        updated_by: g.user!.id,
        updated_at: new Date().toISOString(),
      };
      if (row.status === "published") {
        const pubErr = assertPublishReady(row, Boolean(body.allow_missing_image));
        if (pubErr) return c.json({ error: pubErr }, 400);
        if (!row.published_at) row.published_at = new Date().toISOString();
      }
      if (row.status === "scheduled") {
        if (!row.published_at) return c.json({ error: "scheduled requires published_at" }, 400);
        if (new Date(String(row.published_at)).getTime() <= Date.now()) {
          return c.json({ error: "scheduled published_at must be in the future" }, 400);
        }
      }
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from(TABLE).insert(row).select("*").single();
      if (error) {
        console.error("journal insert:", error);
        if (String(error.message || "").includes("duplicate") || error.code === "23505") {
          return c.json({ error: "Slug already exists for this locale" }, 409);
        }
        return c.json({ error: "Failed to create article" }, 500);
      }
      return c.json({ success: true, article: mapArticle(data) });
    } catch (e) {
      console.error("landing-cms create:", e);
      return c.json({ error: "Failed" }, 500);
    }
  });

  app.patch(`${ROUTE}/journal-articles/:id`, async (c) => {
    try {
      const g = await gate(c);
      if (g.error) return g.error;
      const id = c.req.param("id");
      if (!UUID_PATTERN.test(id)) return c.json({ error: "Invalid id" }, 400);
      const body = await c.req.json().catch(() => ({})) as ArticleInput;
      const validated = validateArticlePayload(body, { partial: true });
      if (!validated.ok) return c.json({ error: validated.error }, 400);
      if (Object.keys(validated.data).length === 0) {
        return c.json({ error: "No valid fields to update" }, 400);
      }
      const patch = {
        ...validated.data,
        updated_by: g.user!.id,
        updated_at: new Date().toISOString(),
      };
      if (patch.status === "scheduled") {
        const publishedAt = patch.published_at;
        if (!publishedAt) return c.json({ error: "scheduled requires published_at" }, 400);
      }
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from(TABLE)
        .update(patch)
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (error) {
        if (error.code === "23505") return c.json({ error: "Slug already exists for this locale" }, 409);
        console.error("journal patch:", error);
        return c.json({ error: "Failed to update article" }, 500);
      }
      if (!data) return c.json({ error: "Not found" }, 404);
      return c.json({ success: true, article: mapArticle(data) });
    } catch (e) {
      console.error("landing-cms patch:", e);
      return c.json({ error: "Failed" }, 500);
    }
  });

  app.delete(`${ROUTE}/journal-articles/:id`, async (c) => {
    try {
      const g = await gate(c);
      if (g.error) return g.error;
      const id = c.req.param("id");
      if (!UUID_PATTERN.test(id)) return c.json({ error: "Invalid id" }, 400);
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from(TABLE).delete().eq("id", id).select("id").maybeSingle();
      if (error) return c.json({ error: "Failed to delete" }, 500);
      if (!data) return c.json({ error: "Not found" }, 404);
      return c.json({ success: true });
    } catch (e) {
      console.error("landing-cms delete:", e);
      return c.json({ error: "Failed" }, 500);
    }
  });

  app.post(`${ROUTE}/journal-articles/:id/publish`, async (c) => {
    try {
      const g = await gate(c);
      if (g.error) return g.error;
      const id = c.req.param("id");
      if (!UUID_PATTERN.test(id)) return c.json({ error: "Invalid id" }, 400);
      const body = await c.req.json().catch(() => ({})) as { allow_missing_image?: boolean; published_at?: string };
      const supabase = getSupabaseAdmin();
      const { data: existing, error: fetchErr } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
      if (fetchErr) return c.json({ error: "Failed to fetch" }, 500);
      if (!existing) return c.json({ error: "Not found" }, 404);
      const pubErr = assertPublishReady(existing, Boolean(body.allow_missing_image));
      if (pubErr) return c.json({ error: pubErr }, 400);
      let publishedAt = existing.published_at || new Date().toISOString();
      if (body.published_at) {
        const d = new Date(body.published_at);
        if (Number.isNaN(d.getTime())) return c.json({ error: "Invalid published_at" }, 400);
        publishedAt = d.toISOString();
      }
      const status = new Date(publishedAt).getTime() > Date.now() ? "scheduled" : "published";
      const { data, error } = await supabase
        .from(TABLE)
        .update({
          status,
          published_at: publishedAt,
          updated_by: g.user!.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .single();
      if (error) return c.json({ error: "Failed to publish" }, 500);
      return c.json({ success: true, article: mapArticle(data) });
    } catch (e) {
      console.error("landing-cms publish:", e);
      return c.json({ error: "Failed" }, 500);
    }
  });

  app.post(`${ROUTE}/journal-articles/:id/archive`, async (c) => {
    try {
      const g = await gate(c);
      if (g.error) return g.error;
      const id = c.req.param("id");
      if (!UUID_PATTERN.test(id)) return c.json({ error: "Invalid id" }, 400);
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from(TABLE)
        .update({
          status: "archived",
          updated_by: g.user!.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (error) return c.json({ error: "Failed to archive" }, 500);
      if (!data) return c.json({ error: "Not found" }, 404);
      return c.json({ success: true, article: mapArticle(data) });
    } catch (e) {
      console.error("landing-cms archive:", e);
      return c.json({ error: "Failed" }, 500);
    }
  });

  app.post(`${ROUTE}/journal-articles/:id/preview`, async (c) => {
    try {
      const g = await gate(c);
      if (g.error) return g.error;
      const id = c.req.param("id");
      if (!UUID_PATTERN.test(id)) return c.json({ error: "Invalid id" }, 400);
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).maybeSingle();
      if (error) return c.json({ error: "Failed" }, 500);
      if (!data) return c.json({ error: "Not found" }, 404);
      const article = mapArticle(data);
      return c.json({
        success: true,
        preview: {
          ...article,
          body: sanitizeEditorialHtml(String(data.body || "")),
          isPreview: true,
          public: false,
        },
      });
    } catch (e) {
      console.error("landing-cms preview:", e);
      return c.json({ error: "Failed" }, 500);
    }
  });

  app.post(`${ROUTE}/journal-images/signed-upload`, async (c) => {
    try {
      const g = await gate(c);
      if (g.error) return g.error;
      const body = await c.req.json().catch(() => ({})) as {
        filename?: string;
        contentType?: string;
        byteSize?: number;
      };
      const contentType = typeof body.contentType === "string" ? body.contentType.toLowerCase() : "";
      if (!ALLOWED_IMAGE_MIME.has(contentType)) {
        return c.json({ error: "Unsupported image type" }, 400);
      }
      if (typeof body.byteSize === "number" && (body.byteSize <= 0 || body.byteSize > MAX_UPLOAD_BYTES)) {
        return c.json({ error: "Image exceeds 5MB limit" }, 400);
      }
      const rawName = typeof body.filename === "string" ? body.filename : "image.jpg";
      const ext = contentType === "image/png"
        ? "png"
        : contentType === "image/webp"
          ? "webp"
          : contentType === "image/gif"
            ? "gif"
            : "jpg";
      const safeBase = rawName
        .toLowerCase()
        .replace(/\.[a-z0-9]+$/, "")
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || "image";
      const path = `journal/${Date.now()}-${safeBase}.${ext}`;
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
      if (error || !data) {
        console.error("signed upload:", error);
        return c.json({ error: "Failed to create upload URL" }, 500);
      }
      return c.json({
        success: true,
        path,
        token: data.token,
        signedUrl: data.signedUrl,
        publicUrl: computePublicImageUrl(path),
      });
    } catch (e) {
      console.error("landing-cms signed-upload:", e);
      return c.json({ error: "Failed" }, 500);
    }
  });

  /**
   * Push published Journal articles to the live website (betweenus.fun).
   * Triggers a GitHub Actions workflow on betweenus_landing that regenerates
   * static /journal pages and commits them for GitHub Pages.
   */
  app.post(`${ROUTE}/journal/push-live`, async (c) => {
    try {
      const g = await gate(c);
      if (g.error) return g.error;
      const limited = rateLimitOrReject(c, "landing-cms-push-live", 3, 5 * 60_000);
      if (limited) return limited;

      const token = Deno.env.get("LANDING_GITHUB_TOKEN") || "";
      const repo = Deno.env.get("LANDING_GITHUB_REPO") || "semprog25/betweenus_landing";
      if (!token) {
        return c.json({
          error: "Live push is not configured. Set LANDING_GITHUB_TOKEN on the Edge Function.",
        }, 503);
      }

      const supabase = getSupabaseAdmin();
      const { data: rows, error } = await supabase
        .from(TABLE)
        .select("id,title,slug,status,published_at")
        .in("status", ["published", "scheduled"]);
      if (error) return c.json({ error: "Failed to load articles" }, 500);

      const now = Date.now();
      const live = (rows || []).filter((r) => {
        if (r.status === "published") return true;
        if (r.status === "scheduled" && r.published_at) {
          return new Date(String(r.published_at)).getTime() <= now;
        }
        return false;
      });

      const dispatchRes = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
          "User-Agent": "BetweenUs-LandingCMS",
        },
        body: JSON.stringify({
          event_type: "journal-push-live",
          client_payload: {
            triggered_by: g.user!.id,
            article_count: live.length,
            at: new Date().toISOString(),
          },
        }),
      });

      if (dispatchRes.status !== 204 && dispatchRes.status !== 200) {
        const detail = await dispatchRes.text().catch(() => "");
        console.error("landing-cms push-live github:", dispatchRes.status, detail.slice(0, 500));
        return c.json({
          error: "Failed to start live deploy. Check LANDING_GITHUB_TOKEN permissions (repo).",
          status: dispatchRes.status,
        }, 502);
      }

      return c.json({
        success: true,
        articleCount: live.length,
        message: live.length
          ? `Deploy started for ${live.length} live article(s). Homepage and /journal/ update in about 1–2 minutes.`
          : "Deploy started. No published articles yet — the live Journal will show empty until you publish.",
        siteUrl: "https://betweenus.fun/journal/",
        actionsUrl: `https://github.com/${repo}/actions`,
      });
    } catch (e) {
      console.error("landing-cms push-live:", e);
      return c.json({ error: "Failed" }, 500);
    }
  });
}
