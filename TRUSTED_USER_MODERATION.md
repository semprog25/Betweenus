# Trusted User Moderation System (Reddit-Style)

A community-driven spam control system where active users earn the right to flag spam.

## How It Works

### 1. User Reputation (Background)

Reputation is computed from:
- **Secrets shared** (posts created)
- **Replies given**
- **Upvotes received** on your posts

**Score** = secrets shared + replies given + upvotes received

### 2. Trusted User Status

Users with **50+ activity points** become **trusted users** and can:
- See a **Flag** (🚩) button on each post in the Community tab
- Flag posts as spam

### 3. Spam Flagging

- Only **logged-in** users can flag
- Only **trusted users** (50+ points) can flag
- Each flag is recorded; users cannot flag the same post twice
- When **3 trusted users** flag the same post, it is **auto-hidden** from the feed

### 4. Hidden Posts

- Hidden posts (`hiddenAt` set) are filtered out of `GET /posts`
- They no longer appear in Community or Listen tabs

## Configuration (Server)

In `src/supabase/functions/server/index.tsx`:

```ts
const TRUSTED_USER_THRESHOLD = 50;  // Activity points to become trusted
const SPAM_FLAG_THRESHOLD = 3;      // Flags before post is hidden
```

## API

### `GET /user-reputation?userId=`

Returns: `{ score, isTrusted, threshold }`

### `POST /posts/:postId/flag-spam`

Body: `{ userId }`

- **401** – Not logged in
- **403** `NOT_TRUSTED` – User doesn't have 50+ points
- **200** – Success; response includes `flagCount`, `hidden` (true if post was hidden)

## Data Model

**Post** (new fields):
- `flaggedBy: string[]` – userIds who flagged
- `flagCount: number`
- `hiddenAt?: string` – ISO timestamp when hidden (present = post is hidden)

## Files

- **Server:** `src/supabase/functions/server/index.tsx` – reputation, flag-spam, filter hidden posts
- **API:** `src/utils/api.tsx` – `getUserReputation`, `flagPostAsSpam`
- **UI:** `src/components/CommunityTab.tsx` – Flag button for trusted users
- **Translations:** `src/components/LanguageContext.tsx` – `community.flagSpam*`
