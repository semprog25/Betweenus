-- Targeted Community feed ranking without shipping every post JSON blob to Edge.
-- Used by Edge Function make-server-6c9b0e48 via service role RPC.
-- Preserves hidden/deleted filtering. Does not expose private data beyond public posts.

CREATE OR REPLACE FUNCTION public.community_feed_ids(
  p_feed text DEFAULT 'controversial',
  p_limit integer DEFAULT 15,
  p_media text DEFAULT 'all',
  p_languages text[] DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_q text DEFAULT NULL,
  p_cursor_score numeric DEFAULT NULL,
  p_cursor_ts bigint DEFAULT NULL,
  p_cursor_id text DEFAULT NULL
)
RETURNS TABLE (
  post_id text,
  score numeric,
  ts bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT
      value->>'id' AS id,
      COALESCE((value->>'upvotes')::int, 0) AS upvotes,
      COALESCE((value->>'downvotes')::int, 0) AS downvotes,
      COALESCE(jsonb_array_length(COALESCE(value->'replies', '[]'::jsonb)), 0) AS reply_count,
      COALESCE((value->>'timestamp')::bigint, 0) AS ts,
      CASE
        WHEN (value->>'imageUrl') IS NOT NULL AND btrim(value->>'imageUrl') <> '' THEN true
        ELSE false
      END AS has_media,
      COALESCE(value->'languages', '[]'::jsonb) AS languages,
      COALESCE(value->'categories', '[]'::jsonb) AS categories,
      COALESCE(value->>'content', '') AS content
    FROM kv_store_6c9b0e48
    WHERE key LIKE 'post:%'
      AND COALESCE(value->>'hiddenAt', '') = ''
      AND COALESCE(value->>'deletedAt', '') = ''
  ),
  filtered AS (
    SELECT
      b.*,
      CASE lower(coalesce(p_feed, 'controversial'))
        WHEN 'trending' THEN (b.upvotes + b.downvotes + b.reply_count * 2)::numeric
        WHEN 'discussed' THEN (b.reply_count * 10 + b.upvotes + b.downvotes)::numeric
        WHEN 'newest' THEN b.ts::numeric
        WHEN 'all' THEN b.ts::numeric
        ELSE (
          LEAST(b.upvotes, b.downvotes) * 2
          + b.upvotes
          + b.downvotes
          + b.reply_count
        )::numeric
      END AS score
    FROM base b
    WHERE
      (
        p_media IS NULL
        OR lower(p_media) = 'all'
        OR (lower(p_media) IN ('media', 'pictures', 'with_pictures') AND b.has_media)
        OR (lower(p_media) IN ('text', 'text_only') AND NOT b.has_media)
      )
      AND (
        p_languages IS NULL
        OR cardinality(p_languages) = 0
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(b.languages) lang
          WHERE lower(lang) = ANY (
            SELECT lower(x) FROM unnest(p_languages) AS x
          )
        )
      )
      AND (
        p_category IS NULL
        OR p_category = ''
        OR lower(p_category) = 'all'
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(b.categories) cat
          WHERE lower(cat) = lower(p_category)
        )
      )
      AND (
        p_q IS NULL
        OR length(trim(p_q)) = 0
        OR b.content ILIKE '%' || trim(p_q) || '%'
      )
  ),
  ranked AS (
    SELECT f.id, f.score, f.ts
    FROM filtered f
    WHERE
      p_cursor_id IS NULL
      OR (
        f.score < p_cursor_score
        OR (f.score = p_cursor_score AND f.ts < p_cursor_ts)
        OR (f.score = p_cursor_score AND f.ts = p_cursor_ts AND f.id < p_cursor_id)
      )
    ORDER BY f.score DESC, f.ts DESC, f.id DESC
    LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 15), 50))
  )
  SELECT ranked.id AS post_id, ranked.score, ranked.ts FROM ranked;
$$;

CREATE OR REPLACE FUNCTION public.community_feed_stats(
  p_media text DEFAULT 'all',
  p_languages text[] DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_q text DEFAULT NULL
)
RETURNS TABLE (
  posts bigint,
  replies bigint,
  upvotes bigint,
  downvotes bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT
      COALESCE((value->>'upvotes')::int, 0) AS upvotes,
      COALESCE((value->>'downvotes')::int, 0) AS downvotes,
      COALESCE(jsonb_array_length(COALESCE(value->'replies', '[]'::jsonb)), 0) AS reply_count,
      CASE
        WHEN (value->>'imageUrl') IS NOT NULL AND btrim(value->>'imageUrl') <> '' THEN true
        ELSE false
      END AS has_media,
      COALESCE(value->'languages', '[]'::jsonb) AS languages,
      COALESCE(value->'categories', '[]'::jsonb) AS categories,
      COALESCE(value->>'content', '') AS content
    FROM kv_store_6c9b0e48
    WHERE key LIKE 'post:%'
      AND COALESCE(value->>'hiddenAt', '') = ''
      AND COALESCE(value->>'deletedAt', '') = ''
  )
  SELECT
    count(*)::bigint AS posts,
    coalesce(sum(b.reply_count), 0)::bigint AS replies,
    coalesce(sum(b.upvotes), 0)::bigint AS upvotes,
    coalesce(sum(b.downvotes), 0)::bigint AS downvotes
  FROM base b
  WHERE
    (
      p_media IS NULL
      OR lower(p_media) = 'all'
      OR (lower(p_media) IN ('media', 'pictures', 'with_pictures') AND b.has_media)
      OR (lower(p_media) IN ('text', 'text_only') AND NOT b.has_media)
    )
    AND (
      p_languages IS NULL
      OR cardinality(p_languages) = 0
      OR EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(b.languages) lang
        WHERE lower(lang) = ANY (
          SELECT lower(x) FROM unnest(p_languages) AS x
        )
      )
    )
    AND (
      p_category IS NULL
      OR p_category = ''
      OR lower(p_category) = 'all'
      OR EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(b.categories) cat
        WHERE lower(cat) = lower(p_category)
      )
    )
    AND (
      p_q IS NULL
      OR length(trim(p_q)) = 0
      OR b.content ILIKE '%' || trim(p_q) || '%'
    );
$$;

REVOKE ALL ON FUNCTION public.community_feed_ids(
  text, integer, text, text[], text, text, numeric, bigint, text
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.community_feed_stats(
  text, text[], text, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.community_feed_ids(
  text, integer, text, text[], text, text, numeric, bigint, text
) TO service_role;

GRANT EXECUTE ON FUNCTION public.community_feed_stats(
  text, text[], text, text
) TO service_role;
