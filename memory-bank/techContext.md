# Tech Context

## App (`Betweenus-main`)
- Vite 6 + React 18 + TypeScript SPA
- Capacitor 8 (`com.betweenus.app`)
- Tailwind v4 + Radix/shadcn
- No react-router — tab state in `App.tsx`
- Edge client: `src/utils/api.tsx`, `src/utils/auth.tsx`
- Config: `src/config/site.ts` → `https://betweenus.fun`

## Website (`betweenus_landing`)
- Static `index.html` + identical `404.html` (GitHub Pages SPA trick)
- CNAME → `betweenus.fun`
- Vanilla JS; calls same Edge Function with anon key
- No build pipeline / no CI

## Backend
- Hono Edge Function `make-server-6c9b0e48`
- KV table `kv_store_6c9b0e48` (RLS service_role only)
- Storage `post-images` (public read, service_role write)
- Auth: email/password via Edge; Google/Apple via Supabase OAuth

## SeaDays Journal patterns (reuse architecture, not branding)
- Best engine: `seadays-landing` `scripts/generateBlogs.js`
- CMS side: `Seadays-main` typed-block articles + publisher gates
- Reuse: slugs, canonicals, Article JSON-LD, sitemap, related articles, static generation
