-- Harden post-images: no direct client writes; public read remains intentional for public UGC.
DROP POLICY IF EXISTS post_images_service_insert ON storage.objects;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'post_images_service_role_all'
  ) THEN
    CREATE POLICY post_images_service_role_all
      ON storage.objects
      FOR ALL
      TO service_role
      USING (bucket_id = 'post-images')
      WITH CHECK (bucket_id = 'post-images');
  END IF;
END $$;
