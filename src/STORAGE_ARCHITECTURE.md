# Storage Architecture - Between Us

## Overview
Between Us uses a **hybrid storage approach** combining Supabase (cloud) for persistent data and localStorage (browser) for temporary UI state only.

---

## 🗄️ Primary Storage: Supabase

### Database Type
- **PostgreSQL** database hosted on Supabase
- Project ID: `qoqbdiixztolvtcjdnle`
- URL: `https://qoqbdiixztolvtcjdnle.supabase.co`

### Database Table
All app data is stored in a single key-value table:

```sql
CREATE TABLE kv_store_6c9b0e48 (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);
```

### What's Stored in Supabase

#### 1. User Data (via Supabase Auth)
- User accounts (email/password, OAuth)
- User metadata (name, languages, avatar_url)
- Session tokens
- Authentication state

#### 2. Posts & Secrets
**Key Pattern:** `post:{postId}`
```json
{
  "id": "1730000000000-abc123",
  "content": "User's post content",
  "mood": "anxious",
  "userId": "user-uuid",
  "upvotes": 5,
  "upvotedBy": ["user-id-1", "user-id-2"],
  "replies": [...],
  "languages": ["en"],
  "createdAt": "2025-01-15T12:00:00Z",
  "isAnonymous": true
}
```

**User-Specific Copy:** `user-post:{userId}:{postId}`
- Duplicate stored for quick user-specific queries

#### 3. Check-Ins (Mood Tracking)
**Key Pattern:** `check-in:{checkInId}`
```json
{
  "id": "1730000000000-xyz789",
  "date": "2025-01-15T12:00:00Z",
  "mainMood": "Happy",
  "subMood": "Excited",
  "emoji": "😊",
  "color": "#FFD700",
  "note": "Had a great day!",
  "activities": ["exercise", "meditation"],
  "createdAt": "2025-01-15T12:00:00Z"
}
```

**By Date Index:** `check-in-by-date:2025-01-15`
- For calendar view lookups

#### 4. Journal Entries
**Key Pattern:** `journal:{entryId}`
```json
{
  "id": "1730000000000-jrn456",
  "content": "Journal entry text...",
  "activities": ["work", "family"],
  "mood": "calm",
  "date": "2025-01-15T12:00:00Z",
  "createdAt": "2025-01-15T12:00:00Z"
}
```

#### 5. User Replies
**Key Pattern:** `user-reply:{userId}:{replyId}`
```json
{
  "id": "reply-id-123",
  "content": "Supportive reply...",
  "userId": "user-uuid",
  "postId": "original-post-id",
  "postContent": "Preview of original post...",
  "createdAt": "2025-01-15T12:00:00Z",
  "isAnonymous": true
}
```

#### 6. Subscriptions (Monetization)
**Key Pattern:** `subscription:{userId}`
```json
{
  "tier": "premium",
  "credits": 10,
  "postsThisMonth": 5,
  "monthlyPostLimit": 10,
  "lastResetDate": "2025-01-01T00:00:00Z",
  "expiresAt": "2025-02-01T00:00:00Z",
  "features": {
    "canEditPosts": true,
    "unlimitedPosts": false,
    "prioritySupport": true
  }
}
```

#### 7. Email Tracking
**Key Pattern:** `welcome-email-sent:{userId}`
- Tracks whether welcome email was sent (prevents duplicates)

---

## 💾 Browser Storage: localStorage (Minimal)

### What's Stored Locally

#### 1. Session Data
**Key:** `between_us_session`
```json
{
  "access_token": "jwt-token-here",
  "refresh_token": "refresh-token-here",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "user_metadata": {...}
  },
  "expires_at": 1234567890
}
```

#### 2. Onboarding State
**Key:** `hasCompletedOnboarding`
- Value: `"true"` or not present
- Prevents showing onboarding again

#### 3. Language Preference
**Key:** `between_us_language`
- Value: `"en"`, `"es"`, `"zh"`, `"hi"`, `"de"`, or `"fr"`
- Persists user's language selection

#### 4. Theme Preference
**Key:** `theme`
- Value: `"light"` or `"dark"`
- Persists dark/light mode preference

### Storage Monitoring

The app includes automatic localStorage monitoring in `/App.tsx`:

```typescript
// Check localStorage usage on mount
useEffect(() => {
  if (typeof window !== 'undefined') {
    try {
      let totalSize = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length + key.length;
        }
      }
      
      const sizeInMB = totalSize / (1024 * 1024);
      console.log(`localStorage usage: ${sizeInMB.toFixed(2)} MB`);
      
      // If usage is high (> 4MB), clean up non-essential data
      if (sizeInMB > 4) {
        console.log('localStorage usage high, cleaning up...');
        const keysToKeep = [
          'between_us_session',
          'hasCompletedOnboarding',
          'between_us_language',
          'theme'
        ];
        
        const allKeys = Object.keys(localStorage);
        for (const key of allKeys) {
          if (!keysToKeep.includes(key)) {
            localStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('localStorage check failed:', error);
    }
  }
}, []);
```

---

## 🔄 Data Flow

### Frontend → Backend → Database

```
User Action (React Component)
    ↓
API Function (/utils/api.tsx)
    ↓
callServer() (/utils/supabase/client.tsx)
    ↓
HTTP Request to Supabase Edge Function
    ↓
Hono Server (/supabase/functions/server/index.tsx)
    ↓
KV Store Operations (/supabase/functions/server/kv_store.tsx)
    ↓
PostgreSQL Database (Supabase)
```

### Example Flow: Creating a Post

1. **User types post in ShareTab.tsx**
2. **Calls:** `createPost()` from `/utils/api.tsx`
3. **Sends:** POST to `/make-server-6c9b0e48/posts`
4. **Server:** Validates, generates ID, stores in DB
5. **Response:** Returns post object to frontend
6. **UI Update:** Shows success toast

---

## 🔐 Authentication Storage

### Supabase Auth Handles:
- User registration
- Login sessions
- Password hashing
- OAuth tokens (Google, Apple)
- Email verification
- Password reset

### Session Persistence:
- Access tokens stored in localStorage
- Refresh tokens auto-refresh expired sessions
- Server validates tokens on protected routes

---

## 📊 Storage Limits

### Supabase (Current Tier)
- **Database:** 500 MB (free tier)
- **Storage:** 1 GB for file uploads (not currently used)
- **Bandwidth:** 2 GB/month
- **Rows:** Unlimited on free tier

### localStorage
- **Limit:** ~5-10 MB per domain (browser dependent)
- **Current Usage:** <1 MB (monitored in App.tsx)
- **Auto-cleanup:** Triggered if usage > 4 MB

---

## 🚀 Scaling Considerations

### When to Upgrade Supabase

1. **Database Size > 400 MB**
   - Upgrade to Pro tier ($25/month)
   - Gets 8 GB database

2. **Need for Advanced Features**
   - Database backups
   - Point-in-time recovery
   - Custom domains

3. **High Traffic**
   - More API requests
   - More concurrent connections

### Future Storage Options

1. **Supabase Storage (Files)**
   - For user avatars (currently using Dicebear)
   - For image uploads in posts
   - For journal attachments

2. **Separate Tables (Instead of KV Store)**
   - Better query performance
   - Relational data integrity
   - Indexes on frequently queried fields

3. **Caching Layer**
   - Redis for hot data
   - CDN for static assets

---

## 🔍 How to View Your Data

### 1. Supabase Dashboard
Visit: https://supabase.com/dashboard/project/qoqbdiixztolvtcjdnle

**Database Tables:**
- Go to "Database" → "Tables"
- View `kv_store_6c9b0e48` table
- See all stored keys and values

**Authentication:**
- Go to "Authentication" → "Users"
- View all registered users

### 2. Browser DevTools
**localStorage:**
- Open DevTools (F12)
- Go to "Application" → "Local Storage"
- See keys: `between_us_session`, `hasCompletedOnboarding`, etc.

**Network Requests:**
- "Network" tab
- Filter by "make-server"
- See all API calls and responses

---

## 🛡️ Data Security

### What's Protected:
✅ User passwords (hashed by Supabase)
✅ Session tokens (JWT with expiry)
✅ Database credentials (server-side only)
✅ Service role key (never sent to client)

### What's Anonymous:
✅ All posts/secrets (no username shown)
✅ All replies (anonymous by default)
✅ Check-ins (private to user)
✅ Journal entries (private to user)

### Access Control:
- Frontend uses `SUPABASE_ANON_KEY` (limited permissions)
- Backend uses `SUPABASE_SERVICE_ROLE_KEY` (full access)
- User data tied to auth session
- Posts can only be edited/deleted by creator

---

## 📝 Summary

| Data Type | Storage Location | Persistence | Size Limit |
|-----------|-----------------|-------------|------------|
| User Accounts | Supabase Auth | Permanent | Unlimited |
| Posts/Secrets | Supabase DB | Permanent | 500 MB total |
| Check-ins | Supabase DB | Permanent | 500 MB total |
| Journal Entries | Supabase DB | Permanent | 500 MB total |
| Subscriptions | Supabase DB | Permanent | 500 MB total |
| Session Tokens | localStorage | Until logout | ~10 KB |
| Language Pref | localStorage | Permanent | <1 KB |
| Theme Pref | localStorage | Permanent | <1 KB |
| Onboarding State | localStorage | Permanent | <1 KB |

**Total Backend Storage Used:** Currently < 1 MB (early stage)
**Total Frontend Storage:** < 100 KB (minimal)

---

## 🔧 Maintenance Tasks

### Regular Monitoring
1. Check Supabase dashboard for storage usage
2. Monitor localStorage console logs
3. Review error logs in server

### Cleanup (If Needed)
```sql
-- Delete old test data (run in Supabase SQL editor)
DELETE FROM kv_store_6c9b0e48 WHERE key LIKE 'test-%';

-- Delete very old posts (example: > 1 year)
DELETE FROM kv_store_6c9b0e48 
WHERE key LIKE 'post:%' 
AND value->>'createdAt' < '2024-01-01';
```

### Backup
Supabase Pro provides automatic daily backups.
Free tier: Manual export via dashboard.

---

## 🎯 Conclusion

Your Between Us app uses **Supabase as the primary storage** for all persistent data, with localStorage only for temporary UI state. This is the correct architecture for a production web app, ensuring:

✅ Data persists across devices
✅ Scalable backend infrastructure  
✅ Secure user authentication
✅ Fast access to user-specific data
✅ No localStorage quota issues

All user data, posts, check-ins, journals, and subscriptions are safely stored in Supabase's PostgreSQL database and will persist indefinitely!
