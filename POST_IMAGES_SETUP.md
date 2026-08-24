# Post Images Setup - Supabase Storage

To enable image/GIF attachments on posts, create a Supabase Storage bucket for post images.

## Step 1: Create the Bucket

### Option A: Using the script (recommended)

1. Get your **service role key**: Supabase Dashboard → Project Settings → API → `service_role` (secret)
2. Run:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your_key npm run create-post-images-bucket
   ```
3. You should see: `✓ Bucket "post-images" created successfully`

### Option B: Manual via Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/qoqbdiixztolvtcjdnle)
2. Navigate to **Storage** in the left sidebar
3. Click **"New Bucket"**
4. Configure:
   - **Name:** `post-images`
   - **Public bucket:** Toggle **ON** (so images can be viewed in the app)
   - Click **Create Bucket**

## Step 2: Storage Policies (Optional)

For a public bucket, the default policies may work. If uploads fail, add:

1. Go to **Storage** → **Policies** for `post-images`
2. Add policy for **INSERT** (upload):
   - Policy name: `Allow uploads`
   - Allowed operation: INSERT
   - Target roles: `authenticated`, `anon` (or use RLS to restrict as needed)
   - USING expression: `true` (or your custom rule)
3. Add policy for **SELECT** (read):
   - Policy name: `Allow public read`
   - Allowed operation: SELECT
   - Target roles: `anon`, `authenticated`
   - USING expression: `true`

**Note:** The app uploads via the Edge Function (`/upload-post-image`), which uses the service role key, so it bypasses RLS. The bucket just needs to exist and be public for the returned URLs to work.

## Step 3: Verify

1. Create a post with an image on the Share page
2. View it in the Community tab
3. The image should display with correct aspect ratio (square, wide, or portrait)

## Supported Formats

- **Images:** JPEG, PNG, WebP
- **Animated:** GIF
- **Max size:** 5MB per image

## Aspect Ratios

Images are automatically classified as:
- **Square** – ratio between 0.9 and 1.1
- **Wide** – landscape (ratio > 1.1)
- **Portrait** – vertical (ratio < 0.9)

These are displayed with appropriate styling (Instagram-style) in the Community and Listen tabs.
