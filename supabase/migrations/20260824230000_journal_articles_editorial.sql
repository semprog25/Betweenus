-- Between Us editorial Journal (NOT the private check-in journal KV API)
-- Access: Edge Function service_role only. No public/authenticated client writes.

CREATE TABLE IF NOT EXISTS public.journal_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en',
  translation_group_id UUID NULL,
  title TEXT NOT NULL,
  subtitle TEXT NULL,
  excerpt TEXT NOT NULL,
  body TEXT NOT NULL,
  featured_image TEXT NULL,
  featured_image_alt TEXT NULL,
  social_image TEXT NULL,
  author TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  featured BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  seo_title TEXT NULL,
  seo_description TEXT NULL,
  canonical_url TEXT NULL,
  noindex BOOLEAN NOT NULL DEFAULT false,
  reading_time_minutes INTEGER NULL,
  related_article_ids UUID[] NOT NULL DEFAULT '{}',
  sponsored BOOLEAN NOT NULL DEFAULT false,
  advertisement_disclosure TEXT NULL,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID NULL,
  updated_by UUID NULL,
  CONSTRAINT journal_articles_locale_slug_unique UNIQUE (locale, slug)
);

CREATE INDEX IF NOT EXISTS journal_articles_status_published_at_idx
  ON public.journal_articles (status, published_at DESC);

CREATE INDEX IF NOT EXISTS journal_articles_translation_group_id_idx
  ON public.journal_articles (translation_group_id);

CREATE INDEX IF NOT EXISTS journal_articles_locale_idx
  ON public.journal_articles (locale);

CREATE INDEX IF NOT EXISTS journal_articles_category_idx
  ON public.journal_articles (category);

ALTER TABLE public.journal_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS journal_articles_service_role_all ON public.journal_articles;
CREATE POLICY journal_articles_service_role_all
  ON public.journal_articles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- No policies for anon/authenticated — clients must go through Edge Function.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'journal-images',
  'journal-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS journal_images_public_read ON storage.objects;
CREATE POLICY journal_images_public_read
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'journal-images');

DROP POLICY IF EXISTS journal_images_service_role_all ON storage.objects;
CREATE POLICY journal_images_service_role_all
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'journal-images')
  WITH CHECK (bucket_id = 'journal-images');
