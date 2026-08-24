-- Between Us: verify KV store is not publicly writable/readable
-- Table: kv_store_6c9b0e48 (used by Edge Function service role only)

ALTER TABLE IF EXISTS public.kv_store_6c9b0e48 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kv_store_service_role_only_select" ON public.kv_store_6c9b0e48;
DROP POLICY IF EXISTS "kv_store_service_role_only_insert" ON public.kv_store_6c9b0e48;
DROP POLICY IF EXISTS "kv_store_service_role_only_update" ON public.kv_store_6c9b0e48;
DROP POLICY IF EXISTS "kv_store_service_role_only_delete" ON public.kv_store_6c9b0e48;

CREATE POLICY "kv_store_service_role_only_select"
  ON public.kv_store_6c9b0e48
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "kv_store_service_role_only_insert"
  ON public.kv_store_6c9b0e48
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "kv_store_service_role_only_update"
  ON public.kv_store_6c9b0e48
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "kv_store_service_role_only_delete"
  ON public.kv_store_6c9b0e48
  FOR DELETE
  TO service_role
  USING (true);

-- post-images bucket: public read, authenticated upload via edge function only
-- Apply via Supabase Storage policies in dashboard if not already set
