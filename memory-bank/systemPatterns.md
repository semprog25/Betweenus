# System Patterns

## Trust model
Clients may use the anon key. Authorization happens inside the Edge Function.
Never trust client: `userId`, `ownerId`, `role`, `premium`, moderation, ads flags.

## Key server helpers
- `requireAuth` / `requireSelfUserId` / `resolveActorId`
- `toPublicPost()` — sanitizes public feed/story
- `anonymous-user-*` pattern for anon actors
- Timing-safe admin secret compare
- Rate limits, content length caps, feed clamp (25/50)

## Public vs private
- Public: sanitized posts, story pages, waitlist POST
- Private: journal (personal), stats, subscription, ownership mutations

## Domain split
- `betweenus.fun` = website only
- App may use GitHub Pages hosting but must not own the custom domain
- Deep links: story URLs open website; Universal/App Links when configured (not yet)

## Personal journal vs editorial Journal
- Personal: KV `journal:*` — private user diary in Check-in tab (unchanged)
- Editorial Between Us Journal: PostgreSQL `journal_articles` + Edge `/landing-cms/*` + static `public/journal/` + `journal-admin.html`
- Public article ads: presentation-only in `scripts/generateJournal.js` via `journal-ad-placement.cjs` (word-count gated slots). CMS body stays content-only. Ads stay off until AdSense IDs + CMP consent env flags.
