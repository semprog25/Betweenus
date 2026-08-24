#!/usr/bin/env node
/**
 * One-time script to create the post-images bucket in Supabase Storage.
 * Run: SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/create-post-images-bucket.mjs
 *
 * Get your service role key: Supabase Dashboard → Project Settings → API → service_role
 */

import { createClient } from '@supabase/supabase-js';

const projectId = 'qoqbdiixztolvtcjdnle';
const supabaseUrl = `https://${projectId}.supabase.co`;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Get it from:');
  console.error('  Supabase Dashboard → Project Settings → API → service_role');
  console.error('');
  console.error('Run: SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/create-post-images-bucket.mjs');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  const bucket = 'post-images';

  const { data, error } = await supabase.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: '5MB',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  });

  if (error) {
    if (error.message?.includes('already exists') || error.message?.includes('Bucket already exists')) {
      console.log(`Bucket "${bucket}" already exists. No action needed.`);
      return;
    }
    console.error('Failed to create bucket:', error.message);
    process.exit(1);
  }

  console.log(`✓ Bucket "${bucket}" created successfully (public, 5MB limit, images only).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
