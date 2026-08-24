# Supabase Storage Setup for Email Logo

## Step 1: Upload Logo to Supabase Storage

### 1.1 Create a Public Bucket
1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New Bucket"**
4. Name it: `email-assets`
5. Make it **Public** (toggle ON)
6. Click **Create Bucket**

### 1.2 Upload the Between Us Logo
1. Click on the `email-assets` bucket
2. Click **Upload File**
3. Upload your white Between Us logo PNG file (name it: `between-us-logo-white.png`)
4. Click **Upload**

### 1.3 Get the Public URL
After uploading, you'll get a URL like this:
```
https://[YOUR-PROJECT-REF].supabase.co/storage/v1/object/public/email-assets/between-us-logo-white.png
```

## Step 2: Update Email Templates

1. Copy the public URL from Supabase Storage
2. In each email template HTML file, find this placeholder:
   ```
   YOUR_SUPABASE_PROJECT_URL
   ```
3. Replace it with your actual Supabase project URL (without the `/storage/v1/...` part)
4. Example:
   ```html
   <!-- Before -->
   <img src="https://YOUR_SUPABASE_PROJECT_URL.supabase.co/storage/v1/object/public/email-assets/between-us-logo-white.png" ...>
   
   <!-- After (example) -->
   <img src="https://abcdefghijk.supabase.co/storage/v1/object/public/email-assets/between-us-logo-white.png" ...>
   ```

## Step 3: Find Your Supabase Project URL

Your project URL is in the format: `https://[PROJECT-REF].supabase.co`

Find it here:
1. Supabase Dashboard → **Settings** → **API**
2. Look for **Project URL** or **Project API URL**
3. It will look like: `https://xyzabc123.supabase.co`

## Alternative: Use Direct URL

If you already uploaded the logo, you can also:
1. Click on the uploaded file in Supabase Storage
2. Click **"Get URL"** or **"Copy URL"**
3. Copy the entire URL
4. Replace the entire `src` attribute in the templates with this URL

## Recommended Logo Specifications

For best email client compatibility:
- **Format**: PNG with transparent background
- **Dimensions**: 400px × 400px (will display at 200px × 200px for retina)
- **File Size**: Under 100KB
- **Background**: Transparent or solid color

## Troubleshooting

### Logo Not Showing in Emails?
1. ✅ Verify bucket is set to **Public**
2. ✅ Check the URL works in a browser
3. ✅ Ensure no typos in the URL
4. ✅ Wait 5-10 minutes for CDN cache if just uploaded

### Security Note
- Public buckets are safe for logos and public assets
- Never store sensitive data in public buckets
- This is the standard way to host email assets

---

**Quick Reference:**
- Bucket Name: `email-assets`
- File Name: `between-us-logo-white.png`
- Bucket Type: Public
- Usage: Email templates only
