-- Optional card thumbnail for Journal articles (falls back to featured_image).
-- Backwards compatible: nullable, no data rewrite required.

ALTER TABLE public.journal_articles
  ADD COLUMN IF NOT EXISTS thumbnail_image TEXT NULL;
