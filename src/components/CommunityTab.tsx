import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Share2, Bookmark, Search, TrendingUp, Clock, Filter, ThumbsUp, ThumbsDown, RefreshCw, X, Flag, Globe, Flame, User, ArrowLeft } from 'lucide-react';
import { getCategoryIcon } from './CategoryIcons';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Skeleton } from './ui/skeleton';
import { toast } from 'sonner@2.0.3';
import { useLanguage } from './LanguageContext';
import { SocialShareCard } from './SocialShareCard';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { getSession } from '../utils/auth';
import { getUserReputation, flagPostAsSpam } from '../utils/api';
import { getActorId } from '../utils/actor-id';
import { consumeOpenStoryId } from '../utils/deep-links';

// Helper function for relative time
const getRelativeTime = (dateString: string, t: (key: string) => string) => {
  const postDate = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) return t('time.justNow');
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}${t('time.ago.m')}`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}${t('time.ago.h')}`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}${t('time.ago.d')}`;
  return postDate.toLocaleDateString();
};

// Helper function for anonymous names
const generateAnonymousName = (userId: string, t: (key: string) => string) => {
  const adjectives = ['Kind', 'Brave', 'Wise', 'Gentle', 'Strong', 'Caring', 'Hopeful', 'Peaceful'];
  const nouns = ['Soul', 'Heart', 'Spirit', 'Friend', 'Writer', 'Reader', 'Helper', 'Guide'];
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const adj = adjectives[hash % adjectives.length];
  const noun = nouns[(hash * 7) % nouns.length];
  const num = (hash % 999) + 1;
  return `${t(`anon.adj.${adj}`)} ${t(`anon.noun.${noun}`)} ${num}`;
};

interface CommunityPost {
  id: string;
  content: string;
  userId?: string;
  username?: string;
  profilePicture?: string;
  isAnonymous?: boolean;
  upvotes: number;
  downvotes?: number;
  upvotedBy?: string[];
  downvotedBy?: string[];
  replies: any[];
  replyCount?: number;
  createdAt: string;
  categories?: string[];
  isControversial?: boolean;
  imageUrl?: string;
  imageAspect?: 'square' | 'wide' | 'portrait';
}

interface CommunityTabProps {
  selectedLanguages: string[]
  initialViewMode?: 'all' | 'saved'
  webShell?: boolean
  onStreakActivity?: () => void
}

const COMMUNITY_FEED_LIMIT = 15;
const COMMUNITY_CACHE_TTL_MS = 45_000;

type CommunityFeedKind = 'controversial' | 'trending' | 'newest' | 'discussed' | 'all'
type CommunityMediaFilter = 'all' | 'media' | 'text'

type CommunityPostsCache = {
  cacheKey: string
  posts: CommunityPost[]
  nextCursor: string | null
  stats: { posts: number; replies: number; upvotes: number; downvotes: number } | null
  fetchedAt: number
}

const communityFeedCaches = new Map<string, CommunityPostsCache>()

function getLanguagesCacheKey(languages: string[]) {
  return (languages.length > 0 ? languages : ['en']).join(',')
}

function buildCommunityCacheKey(parts: {
  languages: string[]
  feed: CommunityFeedKind
  media: CommunityMediaFilter
  category: string
  q: string
  viewMode: 'all' | 'saved'
}) {
  return [
    parts.viewMode,
    parts.feed,
    parts.media,
    parts.category || 'All',
    parts.q.trim().toLowerCase() || '-',
    getLanguagesCacheKey(parts.languages),
  ].join(':')
}

function getCommunityAuthHeaders(): Record<string, string> {
  const session = getSession()
  const token = session?.accessToken || publicAnonKey
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

async function parseCommunityResponse(response: Response) {
  return response.json().catch(() => null)
}

export function CommunityTab({
  selectedLanguages,
  initialViewMode = 'all',
  webShell = false,
  onStreakActivity,
}: CommunityTabProps) {
  const { t } = useLanguage();
  const currentUserSession = getSession();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [feedStats, setFeedStats] = useState<{ posts: number; replies: number; upvotes: number; downvotes: number } | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<CommunityFeedKind>('controversial');
  const [mediaFilter, setMediaFilter] = useState<CommunityMediaFilter>('all');
  const [viewMode, setViewMode] = useState<'all' | 'saved'>(initialViewMode);
  const [savedPosts, setSavedPosts] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('between-us-saved-posts');
      if (saved) return new Set(JSON.parse(saved) as string[]);
    } catch {
      // ignore
    }
    return new Set();
  });
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [showRepliesForPost, setShowRepliesForPost] = useState<Set<string>>(new Set());
  const [replyText, setReplyText] = useState<{ [postId: string]: string }>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  /** Web Story Detail — full conversation page (browser shell only). */
  const [detailPostId, setDetailPostId] = useState<string | null>(null);
  /** Keep the opened story even if the feed reload drops it from `posts`. */
  const [detailPostCache, setDetailPostCache] = useState<CommunityPost | null>(null);
  const [userId, setUserId] = useState(() => getActorId() || '');
  const [isTrustedUser, setIsTrustedUser] = useState(false);
  const [flaggingPostId, setFlaggingPostId] = useState<string | null>(null);
  const feedRequestIdRef = useRef(0);

  useEffect(() => {
    const syncActorId = () => {
      const actorId = getActorId();
      if (actorId) setUserId(actorId);
    };

    syncActorId();
    window.addEventListener('storage', syncActorId);
    window.addEventListener('focus', syncActorId);

    return () => {
      window.removeEventListener('storage', syncActorId);
      window.removeEventListener('focus', syncActorId);
    };
  }, []);

  useEffect(() => {
    setViewMode(initialViewMode)
  }, [initialViewMode])

  // Open a story shared via /story/:id (pathname, ?p= restore, or stashed deep link)
  useEffect(() => {
    let cancelled = false

    const resolveStoryId = (): string | null => {
      if (typeof window !== 'undefined') {
        const match = window.location.pathname.match(/^\/story\/([^/]+)/)
        if (match?.[1]) return decodeURIComponent(match[1])
      }
      return consumeOpenStoryId()
    }

    const openSharedStory = async (storyId: string) => {
      if (!storyId || cancelled) return
      try {
        const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-6c9b0e48`
        const actor = getActorId()
        const viewerQuery = actor ? `?viewerId=${encodeURIComponent(actor)}` : ''
        const response = await fetch(
          `${baseUrl}/posts/${encodeURIComponent(storyId)}${viewerQuery}`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } },
        )
        if (!response.ok || cancelled) {
          if (!cancelled && response.status === 404) {
            toast.error(t('community.storyNotFound', 'Story not found'))
          }
          return
        }
        const data = await response.json()
        const full = data?.post
        if (!full?.id || cancelled) return

        setPosts((prev) => {
          const exists = prev.some((p) => p.id === full.id)
          if (exists) {
            return prev.map((p) => (p.id === full.id ? { ...p, ...full, replies: full.replies || [] } : p))
          }
          return [{ ...full, replies: full.replies || [] }, ...prev]
        })
        setExpandedPosts((prev) => {
          const next = new Set(prev)
          next.add(full.id)
          return next
        })
        setShowRepliesForPost((prev) => {
          const next = new Set(prev)
          next.add(full.id)
          return next
        })
        if (webShell) {
          setDetailPostCache(full)
          setDetailPostId(full.id)
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/story/')) {
            window.history.replaceState({}, '', `/story/${encodeURIComponent(full.id)}`)
          }
        } else {
          window.setTimeout(() => {
            document.getElementById(`community-post-${full.id}`)?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            })
          }, 120)
        }
        toast.message(t('community.openedSharedStory', 'Opened shared story'))
      } catch {
        // non-blocking
      }
    }

    const initialId = resolveStoryId()
    if (initialId) void openSharedStory(initialId)

    const handleOpenStoryEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ storyId?: string }>).detail
      const id = detail?.storyId || resolveStoryId()
      if (id) void openSharedStory(id)
    }

    window.addEventListener('between_us_open_story', handleOpenStoryEvent as EventListener)
    return () => {
      cancelled = true
      window.removeEventListener('between_us_open_story', handleOpenStoryEvent as EventListener)
    }
  }, [t, webShell])

  // Load trusted user status for spam-flagging (deferred — must not block feed paint)
  useEffect(() => {
    let cancelled = false;
    const session = getSession();
    if (!session?.user?.id) {
      setIsTrustedUser(false);
      return;
    }
    const timer = window.setTimeout(() => {
      getUserReputation(session.user.id).then((res) => {
        if (!cancelled && res.isTrusted !== undefined) setIsTrustedUser(res.isTrusted);
      }).catch(() => {});
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [userId]);

  const handleFlagSpam = async (postId: string) => {
    const session = getSession();
    if (!session?.user?.id || !isTrustedUser) return;
    if (!confirm(t('community.flagSpamConfirm'))) return;

    setFlaggingPostId(postId);
    try {
      const res = await flagPostAsSpam(postId, session.user.id);
      if (res.success) {
        if (res.hidden) {
          setPosts((prev) => prev.filter((p) => p.id !== postId));
          toast.success(t('community.flagSpamHidden'));
        } else {
          toast.success(t('community.flagSpamRecorded'));
        }
      } else if (res.code === 'NOT_TRUSTED') {
        toast.error(t('community.flagSpamNotTrusted'));
        setIsTrustedUser(false);
      } else {
        toast.error(res.error || t('community.flagSpamError'));
      }
    } catch {
      toast.error(t('community.flagSpamError'));
    } finally {
      setFlaggingPostId(null);
    }
  };

  const categories = [
    { id: 'All' }, 
    { id: 'Controversial' },
    { id: 'Clickbait' },
    { id: 'Exposed' },
    { id: 'Heartbreak' },
    { id: 'Shocking' },
    { id: 'Confessions' },
    { id: 'Dark Secrets' },
    { id: 'Drama' },
    { id: 'Tea & Gossip' },
    { id: 'Money Problems' },
    { id: 'NSFW Stories' },
    { id: 'Unpopular Opinions' },
    { id: 'Addictions' },
    { id: 'Mental Health' }, 
    { id: 'Relationships' }, 
    { id: 'Career' },
    { id: 'Family' },
    { id: 'Education' },
    { id: 'Self-Care' },
    { id: 'Personal Growth' },
    { id: 'Anxiety' },
    { id: 'Depression' },
    { id: 'Friendships' },
    { id: 'Motivation' },
    { id: 'Random' }
  ];

  const getCategoryTranslation = (categoryId: string) => {
    const key = categoryId.replace(/[^a-zA-Z]/g, '');
    return t(`category.${key}`);
  };

  // Load saved posts from localStorage on mount (state already hydrated from localStorage)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('between-us-saved-posts');
      if (saved) {
        setSavedPosts(new Set(JSON.parse(saved)));
      }
    } catch (error) {
      console.error('Error loading saved posts:', error);
    }
  }, []);

  // Save to localStorage whenever savedPosts changes
  useEffect(() => {
    try {
      localStorage.setItem('between-us-saved-posts', JSON.stringify([...savedPosts]));
    } catch (error) {
      console.error('Error saving posts to localStorage:', error);
    }
  }, [savedPosts]);

  const activeCacheKey = buildCommunityCacheKey({
    languages: selectedLanguages,
    feed: sortBy,
    media: mediaFilter,
    category: selectedCategory,
    q: searchQuery,
    viewMode,
  });

  const fetchFeedPage = async (options?: { cursor?: string | null; silent?: boolean }) => {
    const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-6c9b0e48`;
    const languagesParam = selectedLanguages.length > 0 ? selectedLanguages.join(',') : 'en';
    const actor = getActorId();
    const viewerQuery = actor ? `&viewerId=${encodeURIComponent(actor)}` : '';
    const cursor = options?.cursor || null;

    if (viewMode === 'saved') {
      const ids = [...savedPosts].slice(0, 50);
      if (ids.length === 0) {
        return { posts: [] as CommunityPost[], nextCursor: null, stats: { posts: 0, replies: 0, upvotes: 0, downvotes: 0 }, _statsParams: null };
      }
      const response = await fetch(
        `${baseUrl}/posts?ids=${encodeURIComponent(ids.join(','))}${viewerQuery}`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` } },
      );
      if (!response.ok) throw new Error('Failed to fetch saved posts');
      const data = await response.json();
      return {
        posts: (data?.posts || []) as CommunityPost[],
        nextCursor: null,
        stats: null,
        _statsParams: null,
      };
    }

    const params = new URLSearchParams();
    params.set('language', languagesParam);
    params.set('feed', sortBy);
    params.set('media', mediaFilter);
    params.set('limit', String(COMMUNITY_FEED_LIMIT));
    if (selectedCategory && selectedCategory !== 'All') params.set('category', selectedCategory);
    if (searchQuery.trim()) params.set('q', searchQuery.trim().slice(0, 120));
    if (cursor) params.set('cursor', cursor);
    params.set('stats', '0');

    const response = await fetch(
      `${baseUrl}/posts?${params.toString()}${viewerQuery}`,
      { headers: { Authorization: `Bearer ${publicAnonKey}` } },
    );
    if (!response.ok) throw new Error('Failed to fetch posts');
    const data = await response.json();
    return {
      posts: (data?.posts || []) as CommunityPost[],
      nextCursor: (data?.nextCursor as string | null) || null,
      stats: null as { posts: number; replies: number; upvotes: number; downvotes: number } | null,
      _statsParams: !cursor
        ? `${baseUrl}/posts?${(() => {
            const sp = new URLSearchParams();
            sp.set('language', languagesParam);
            sp.set('feed', sortBy);
            sp.set('media', mediaFilter);
            sp.set('statsOnly', '1');
            if (selectedCategory && selectedCategory !== 'All') sp.set('category', selectedCategory);
            if (searchQuery.trim()) sp.set('q', searchQuery.trim().slice(0, 120));
            return sp.toString();
          })()}${viewerQuery}`
        : null,
    };
  };

  const loadPosts = async (options?: { silent?: boolean; force?: boolean }) => {
    const silent = options?.silent === true;
    const cacheKey = buildCommunityCacheKey({
      languages: selectedLanguages,
      feed: sortBy,
      media: mediaFilter,
      category: selectedCategory,
      q: searchQuery,
      viewMode,
    });
    const cached = communityFeedCaches.get(cacheKey);
    const cacheFresh = cached && Date.now() - cached.fetchedAt < COMMUNITY_CACHE_TTL_MS;

    if (cacheFresh && !options?.force) {
      setPosts(cached.posts);
      setNextCursor(cached.nextCursor);
      setFeedStats(cached.stats);
      setIsLoadingPosts(false);
      // Soft revalidate in background
      const requestId = ++feedRequestIdRef.current;
      void fetchFeedPage({ silent: true })
        .then((result) => {
          if (requestId !== feedRequestIdRef.current) return;
          communityFeedCaches.set(cacheKey, {
            cacheKey,
            posts: result.posts,
            nextCursor: result.nextCursor,
            stats: result.stats,
            fetchedAt: Date.now(),
          });
          setPosts(result.posts);
          setNextCursor(result.nextCursor);
          if (result.stats) setFeedStats(result.stats);
        })
        .catch(() => {});
      return;
    }

    if (!silent) setIsLoadingPosts(true);
    const requestId = ++feedRequestIdRef.current;
    try {
      const result = await fetchFeedPage();
      if (requestId !== feedRequestIdRef.current) return;
      communityFeedCaches.set(cacheKey, {
        cacheKey,
        posts: result.posts,
        nextCursor: result.nextCursor,
        stats: result.stats,
        fetchedAt: Date.now(),
      });
      setPosts(result.posts);
      setNextCursor(result.nextCursor);
      setIsLoadingPosts(false);

      if (result._statsParams) {
        void fetch(result._statsParams, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        })
          .then(async (statsRes) => {
            if (requestId !== feedRequestIdRef.current) return;
            if (!statsRes.ok) return;
            const statsData = await statsRes.json();
            const stats = statsData?.stats || null;
            if (!stats) return;
            setFeedStats(stats);
            const existing = communityFeedCaches.get(cacheKey);
            if (existing) {
              communityFeedCaches.set(cacheKey, { ...existing, stats });
            }
          })
          .catch(() => {});
      } else if (result.stats) {
        setFeedStats(result.stats);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      if (!silent) {
        toast.error('Failed to load posts');
        setPosts([]);
        setNextCursor(null);
      }
      setIsLoadingPosts(false);
    }
  };

  const loadMorePosts = async () => {
    if (!nextCursor || isLoadingMore || viewMode === 'saved') return;
    setIsLoadingMore(true);
    try {
      const result = await fetchFeedPage({ cursor: nextCursor });
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const merged = [...prev, ...result.posts.filter((p) => !seen.has(p.id))];
        communityFeedCaches.set(activeCacheKey, {
          cacheKey: activeCacheKey,
          posts: merged,
          nextCursor: result.nextCursor,
          stats: feedStats,
          fetchedAt: Date.now(),
        });
        return merged;
      });
      setNextCursor(result.nextCursor);
    } catch (error) {
      console.error('Error loading more posts:', error);
      toast.error('Failed to load more posts');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const refreshPosts = async () => {
    setIsRefreshing(true);
    try {
      await loadPosts({ force: true });
      toast.success(t('community.toast.refreshed'));
    } catch {
      toast.error('Failed to refresh posts');
    } finally {
      setTimeout(() => setIsRefreshing(false), 300);
    }
  };

  useEffect(() => {
    void loadPosts();
  }, [selectedLanguages, sortBy, mediaFilter, selectedCategory, searchQuery, viewMode]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // Check if a post is truly viral/controversial
  const isControversialPost = (post: CommunityPost) => {
    const replyLen = post.replyCount ?? post.replies?.length ?? 0;
    const totalEngagement = (post.upvotes || 0) + replyLen;
    return replyLen >= 10 && totalEngagement >= 15;
  };

  // Get top 2 replies for a post
  const getTopTwoReplies = (replies: any[]) => {
    if (!replies || replies.length === 0) return [];
    return [...replies]
      .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
      .slice(0, 2);
  };

  const ensurePostRepliesLoaded = async (postId: string) => {
    const existing = posts.find((p) => p.id === postId);
    if (existing && Array.isArray(existing.replies) && existing.replies.length > 0) return;
    try {
      const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-6c9b0e48`;
      const actor = getActorId();
      const viewerQuery = actor ? `?viewerId=${encodeURIComponent(actor)}` : '';
      const response = await fetch(`${baseUrl}/posts/${encodeURIComponent(postId)}${viewerQuery}`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      const full = data?.post;
      if (!full?.id) return;
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, ...full, replies: full.replies || [] } : p)));
      setDetailPostCache((prev) => (prev?.id === postId ? { ...prev, ...full, replies: full.replies || [] } : prev))
    } catch {
      // non-blocking
    }
  };

  const openStoryDetail = (postId: string) => {
    if (!webShell || !postId) return
    const fromFeed = posts.find((p) => p.id === postId)
    if (fromFeed) setDetailPostCache(fromFeed)
    setDetailPostId(postId)
    setShowRepliesForPost((prev) => {
      const next = new Set(prev)
      next.add(postId)
      return next
    })
    void ensurePostRepliesLoaded(postId)
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', `/story/${encodeURIComponent(postId)}`)
    }
  }

  const closeStoryDetail = () => {
    setDetailPostId(null)
    setDetailPostCache(null)
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/story/')) {
      window.history.replaceState({}, '', '/app')
    }
  }

  // Handle share to social media
  const handleShareToSocial = (post: CommunityPost) => {
    setSelectedPost(post);
    setShareModalOpen(true);
  };

  // Handle upvoting a post
  const handlePostUpvote = async (postId: string) => {
    // Optimistic update
    const previousPosts = [...posts];
    setPosts(currentPosts => currentPosts.map(post => {
      if (post.id === postId) {
        const hasUpvoted = post.upvotedBy?.includes(userId);
        const hasDownvoted = post.downvotedBy?.includes(userId);
        
        let newUpvotes = post.upvotes || 0;
        let newDownvotes = post.downvotes || 0;
        let newUpvotedBy = post.upvotedBy ? [...post.upvotedBy] : [];
        let newDownvotedBy = post.downvotedBy ? [...post.downvotedBy] : [];
        
        if (hasUpvoted) {
          // Remove upvote
          newUpvotes--;
          newUpvotedBy = newUpvotedBy.filter(id => id !== userId);
        } else {
          // Add upvote
          newUpvotes++;
          newUpvotedBy.push(userId);
          
          if (hasDownvoted) {
            // Remove downvote if exists
            newDownvotes--;
            newDownvotedBy = newDownvotedBy.filter(id => id !== userId);
          }
        }
        
        return {
          ...post,
          upvotes: newUpvotes,
          downvotes: newDownvotes,
          upvotedBy: newUpvotedBy,
          downvotedBy: newDownvotedBy
        };
      }
      return post;
    }));

    try {
      const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-6c9b0e48`;
      const response = await fetch(`${baseUrl}/posts/${postId}/upvote`, {
        method: 'POST',
        headers: getCommunityAuthHeaders(),
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        console.error('Failed to upvote:', await response.text());
        setPosts(previousPosts); // Revert on failure
        toast.error(t('community.voteFailed'));
        return
      }
      const result = await parseCommunityResponse(response)
      if (result?.streak) onStreakActivity?.()
    } catch (error) {
      console.error('Error upvoting post:', error);
      setPosts(previousPosts); // Revert on error
      toast.error(t('community.voteFailed'));
    }
  };

  // Handle downvoting a post
  const handlePostDownvote = async (postId: string) => {
    // Optimistic update
    const previousPosts = [...posts];
    setPosts(currentPosts => currentPosts.map(post => {
      if (post.id === postId) {
        const hasUpvoted = post.upvotedBy?.includes(userId);
        const hasDownvoted = post.downvotedBy?.includes(userId);
        
        let newUpvotes = post.upvotes || 0;
        let newDownvotes = post.downvotes || 0;
        let newUpvotedBy = post.upvotedBy ? [...post.upvotedBy] : [];
        let newDownvotedBy = post.downvotedBy ? [...post.downvotedBy] : [];
        
        if (hasDownvoted) {
          // Remove downvote
          newDownvotes--;
          newDownvotedBy = newDownvotedBy.filter(id => id !== userId);
        } else {
          // Add downvote
          newDownvotes++;
          newDownvotedBy.push(userId);
          
          if (hasUpvoted) {
            // Remove upvote if exists
            newUpvotes--;
            newUpvotedBy = newUpvotedBy.filter(id => id !== userId);
          }
        }
        
        return {
          ...post,
          upvotes: newUpvotes,
          downvotes: newDownvotes,
          upvotedBy: newUpvotedBy,
          downvotedBy: newDownvotedBy
        };
      }
      return post;
    }));

    try {
      const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-6c9b0e48`;
      const response = await fetch(`${baseUrl}/posts/${postId}/downvote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        console.error('Failed to downvote:', await response.text());
        setPosts(previousPosts); // Revert on failure
        toast.error(t('community.voteFailed'));
      }
    } catch (error) {
      console.error('Error downvoting post:', error);
      setPosts(previousPosts); // Revert on error
      toast.error(t('community.voteFailed'));
    }
  };

  // Handle upvoting a reply
  const handleReplyUpvote = async (postId: string, replyId: string) => {
    // Optimistic update
    const previousPosts = [...posts];
    setPosts(currentPosts => currentPosts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          replies: post.replies.map(reply => {
            if (reply.id === replyId) {
              const hasUpvoted = reply.upvotedBy?.includes(userId);
              const hasDownvoted = reply.downvotedBy?.includes(userId);
              
              let newUpvotes = reply.upvotes || 0;
              let newDownvotes = reply.downvotes || 0;
              let newUpvotedBy = reply.upvotedBy ? [...reply.upvotedBy] : [];
              let newDownvotedBy = reply.downvotedBy ? [...reply.downvotedBy] : [];
              
              if (hasUpvoted) {
                newUpvotes--;
                newUpvotedBy = newUpvotedBy.filter((id: string) => id !== userId);
              } else {
                newUpvotes++;
                newUpvotedBy.push(userId);
                if (hasDownvoted) {
                  newDownvotes--;
                  newDownvotedBy = newDownvotedBy.filter((id: string) => id !== userId);
                }
              }
              
              return {
                ...reply,
                upvotes: newUpvotes,
                downvotes: newDownvotes,
                upvotedBy: newUpvotedBy,
                downvotedBy: newDownvotedBy
              };
            }
            return reply;
          })
        };
      }
      return post;
    }));

    try {
      const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-6c9b0e48`;
      const response = await fetch(`${baseUrl}/posts/${postId}/reply/${replyId}/upvote`, {
        method: 'POST',
        headers: getCommunityAuthHeaders(),
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        console.error('Failed to upvote reply:', await response.text());
        setPosts(previousPosts); // Revert
        toast.error(t('community.voteFailed'));
        return
      }
      const result = await parseCommunityResponse(response)
      if (result?.streak) onStreakActivity?.()
    } catch (error) {
      console.error('Error upvoting reply:', error);
      setPosts(previousPosts); // Revert
      toast.error(t('community.voteFailed'));
    }
  };

  // Handle downvoting a reply
  const handleReplyDownvote = async (postId: string, replyId: string) => {
    // Optimistic update
    const previousPosts = [...posts];
    setPosts(currentPosts => currentPosts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          replies: post.replies.map(reply => {
            if (reply.id === replyId) {
              const hasUpvoted = reply.upvotedBy?.includes(userId);
              const hasDownvoted = reply.downvotedBy?.includes(userId);
              
              let newUpvotes = reply.upvotes || 0;
              let newDownvotes = reply.downvotes || 0;
              let newUpvotedBy = reply.upvotedBy ? [...reply.upvotedBy] : [];
              let newDownvotedBy = reply.downvotedBy ? [...reply.downvotedBy] : [];
              
              if (hasDownvoted) {
                newDownvotes--;
                newDownvotedBy = newDownvotedBy.filter((id: string) => id !== userId);
              } else {
                newDownvotes++;
                newDownvotedBy.push(userId);
                if (hasUpvoted) {
                  newUpvotes--;
                  newUpvotedBy = newUpvotedBy.filter((id: string) => id !== userId);
                }
              }
              
              return {
                ...reply,
                upvotes: newUpvotes,
                downvotes: newDownvotes,
                upvotedBy: newUpvotedBy,
                downvotedBy: newDownvotedBy
              };
            }
            return reply;
          })
        };
      }
      return post;
    }));

    try {
      const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-6c9b0e48`;
      const response = await fetch(`${baseUrl}/posts/${postId}/reply/${replyId}/downvote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        console.error('Failed to downvote reply:', await response.text());
        setPosts(previousPosts); // Revert
        toast.error(t('community.voteFailed'));
      }
    } catch (error) {
      console.error('Error downvoting reply:', error);
      setPosts(previousPosts); // Revert
      toast.error(t('community.voteFailed'));
    }
  };

  // Handle deleting a reply (ADMIN TOOL)
  const handleDeleteReply = async (postId: string, replyId: string) => {
    if (!confirm(t('community.reply.deleteConfirm'))) {
      return;
    }
    
    try {
      const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-6c9b0e48`;
      const response = await fetch(`${baseUrl}/posts/${postId}/reply/${replyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        toast.success(t('listen.replyDeleted'));
        await loadPosts();
      } else {
        console.error('Failed to delete reply:', await response.text());
        toast.error(t('listen.replyDeleteError'));
      }
    } catch (error) {
      console.error('Error deleting reply:', error);
      toast.error(t('listen.replyDeleteError'));
    }
  };

  // Handle submitting a new reply
  const handleSubmitReply = async (postId: string) => {
    const content = replyText[postId];
    if (!content || !content.trim()) return;

    try {
      const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-6c9b0e48`;
      const response = await fetch(`${baseUrl}/posts/${postId}/reply`, {
        method: 'POST',
        headers: getCommunityAuthHeaders(),
        body: JSON.stringify({
          content: content,
          isAnonymous: true,
          userId: userId
        }),
      });

      if (response.ok) {
        const result = await parseCommunityResponse(response)
        toast.success(t('community.reply.posted'));
        setReplyText({ ...replyText, [postId]: '' });
        if (result?.streak) onStreakActivity?.()
        
        // Refresh posts to show new reply
        await loadPosts();
      } else {
        console.error('Failed to post reply:', await response.text());
        toast.error(t('community.reply.postError'));
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error(t('community.reply.postError'));
    }
  };

  const filteredPosts = posts;
  const detailPost = detailPostId
    ? (posts.find((p) => p.id === detailPostId) || (detailPostCache?.id === detailPostId ? detailPostCache : null))
    : null

  // Keep the detail cache in sync with feed mutations (votes, replies, saves).
  useEffect(() => {
    if (!detailPostId) return
    const fromFeed = posts.find((p) => p.id === detailPostId)
    if (fromFeed) setDetailPostCache(fromFeed)
  }, [posts, detailPostId])

  if (webShell && detailPostId && !detailPost) {
    return (
      <div className="bu-web-tab-content">
        <div className="bu-web-feed space-y-4 pb-8">
          <button
            type="button"
            onClick={closeStoryDetail}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-2 text-sm font-medium text-fuchsia-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('community.backToStories')}
          </button>
          <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-16">
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>
    )
  }

  if (webShell && detailPostId && detailPost) {
    const replies = Array.isArray(detailPost.replies) ? detailPost.replies : []
    const isControversial = isControversialPost(detailPost)
    return (
      <div className="bu-web-tab-content">
        <div className="bu-web-feed space-y-5 pb-10">
          <button
            type="button"
            onClick={closeStoryDetail}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-2 text-sm font-medium text-fuchsia-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('community.backToStories')}
          </button>

          <article className={`rounded-2xl border bg-white p-5 dark:bg-gray-800 ${
            isControversial
              ? 'border-orange-500 dark:border-orange-600'
              : 'border-gray-200 dark:border-gray-700'
          }`}>
            {isControversial && (
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1.5 text-sm font-semibold text-white">
                <Flame className="h-4 w-4" aria-hidden="true" />
                {t('category.Controversial')}
              </div>
            )}

            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {detailPost.isAnonymous !== false ? (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-400 to-gray-600">
                    <User className="h-5 w-5 text-white" aria-hidden="true" />
                  </div>
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500">
                    {detailPost.profilePicture ? (
                      <img src={detailPost.profilePicture} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-lg text-white">{(detailPost.username || 'U')[0].toUpperCase()}</span>
                    )}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    {detailPost.isAnonymous !== false
                      ? generateAnonymousName(detailPost.userId || detailPost.id, t)
                      : (detailPost.username || 'User')}
                  </p>
                  <p className="text-xs text-gray-500">{getRelativeTime(detailPost.createdAt, t)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = new Set(savedPosts)
                  if (next.has(detailPost.id)) {
                    next.delete(detailPost.id)
                    toast.success(t('community.postUnsaved'))
                  } else {
                    next.add(detailPost.id)
                    toast.success(t('community.postSaved'))
                  }
                  setSavedPosts(next)
                }}
                className={`rounded-xl p-2 transition-all ${
                  savedPosts.has(detailPost.id)
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-purple-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-purple-900/30'
                }`}
                aria-label={t('community.tabSaved')}
              >
                <Bookmark className={`h-5 w-5 ${savedPosts.has(detailPost.id) ? 'fill-current' : ''}`} />
              </button>
            </div>

            <p className="whitespace-pre-wrap break-words text-lg leading-relaxed text-gray-800 dark:text-gray-100">
              {detailPost.content}
            </p>

            {detailPost.imageUrl && (
              <div className={`mt-4 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-700 ${
                detailPost.imageAspect === 'portrait' ? 'max-w-[280px] aspect-[3/4]' :
                detailPost.imageAspect === 'wide' ? 'max-w-full aspect-video' :
                'max-w-[320px] aspect-square'
              }`}>
                <img src={detailPost.imageUrl} alt="" className="h-full w-full object-cover" />
              </div>
            )}

            {detailPost.categories && detailPost.categories.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {detailPost.categories.map((categoryName, idx) => {
                  const IconComponent = getCategoryIcon(categoryName)
                  return (
                    <span
                      key={`${categoryName}-${idx}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                    >
                      <IconComponent className="h-3.5 w-3.5" aria-hidden="true" />
                      {getCategoryTranslation(categoryName)}
                    </span>
                  )
                })}
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-gray-200 pt-4 dark:border-gray-700">
              <button
                type="button"
                onClick={() => handlePostUpvote(detailPost.id)}
                className={`inline-flex items-center gap-2 transition-colors ${
                  detailPost.upvotedBy?.includes(userId)
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-600 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400'
                }`}
              >
                <ThumbsUp className={`h-5 w-5 ${detailPost.upvotedBy?.includes(userId) ? 'fill-current' : ''}`} />
                <span className="text-sm font-medium">{detailPost.upvotes || 0}</span>
              </button>
              <button
                type="button"
                onClick={() => handlePostDownvote(detailPost.id)}
                className={`inline-flex items-center gap-2 transition-colors ${
                  detailPost.downvotedBy?.includes(userId)
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400'
                }`}
              >
                <ThumbsDown className={`h-5 w-5 ${detailPost.downvotedBy?.includes(userId) ? 'fill-current' : ''}`} />
                <span className="text-sm font-medium">{detailPost.downvotes || 0}</span>
              </button>
              <span className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm font-medium">
                  {detailPost.replyCount ?? replies.length} {t('community.repliesCount')}
                </span>
              </span>
              <button
                type="button"
                onClick={() => handleShareToSocial(detailPost)}
                className="ml-auto inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-2 text-sm font-medium text-white"
              >
                <Share2 className="h-4 w-4" aria-hidden="true" />
                {t('community.shareSocial')}
              </button>
            </div>
          </article>

          <section aria-labelledby="story-conversation-heading" className="space-y-4">
            <h2 id="story-conversation-heading" className="text-base font-semibold text-foreground">
              {t('community.conversation')}
            </h2>

            {replies.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-card/40 px-4 py-6 text-sm text-muted-foreground">
                {t('community.noRepliesYet')}
              </p>
            ) : (
              <ul className="space-y-3">
                {replies.map((reply, idx) => (
                  <li key={reply.id || `detail-reply-${detailPost.id}-${idx}`} className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-fuchsia-400">
                      <User className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="rounded-2xl bg-gray-100 px-4 py-3 dark:bg-gray-700">
                        <p className="mb-1 text-sm font-medium text-purple-600 dark:text-purple-400">
                          {generateAnonymousName(reply.userId || `reply-${idx}`, t)}
                        </p>
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-800 dark:text-white">
                          {reply.content}
                        </p>
                      </div>
                      <div className="mt-1.5 ml-2 flex flex-wrap items-center gap-3">
                        <span className="text-xs text-gray-500">{getRelativeTime(reply.createdAt, t)}</span>
                        <button
                          type="button"
                          onClick={() => handleReplyUpvote(detailPost.id, reply.id)}
                          className={`inline-flex items-center gap-1 text-xs transition-colors ${
                            reply.upvotedBy?.includes(userId)
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-600 hover:text-green-600 dark:text-gray-400'
                          }`}
                        >
                          <ThumbsUp className={`h-3 w-3 ${reply.upvotedBy?.includes(userId) ? 'fill-current' : ''}`} />
                          {reply.upvotes || 0}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReplyDownvote(detailPost.id, reply.id)}
                          className={`inline-flex items-center gap-1 text-xs transition-colors ${
                            reply.downvotedBy?.includes(userId)
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-600 hover:text-red-600 dark:text-gray-400'
                          }`}
                        >
                          <ThumbsDown className={`h-3 w-3 ${reply.downvotedBy?.includes(userId) ? 'fill-current' : ''}`} />
                          {reply.downvotes || 0}
                        </button>
                        {currentUserSession && reply.userId === currentUserSession.user?.id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteReply(detailPost.id, reply.id)}
                            className="rounded-full bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600">
                <User className="h-3.5 w-3.5 text-white" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <textarea
                  value={replyText[detailPost.id] || ''}
                  onChange={(e) => setReplyText({ ...replyText, [detailPost.id]: e.target.value })}
                  placeholder={t('community.writeReply')}
                  className="w-full resize-none rounded-2xl border-0 bg-gray-100 px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                />
                {replyText[detailPost.id]?.trim() && (
                  <button
                    type="button"
                    onClick={() => handleSubmitReply(detailPost.id)}
                    className="mt-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-2 text-sm font-medium text-white"
                  >
                    {t('community.postReply')}
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>

        {selectedPost && (
          <SocialShareCard
            isOpen={shareModalOpen}
            onClose={() => {
              setShareModalOpen(false)
              setSelectedPost(null)
            }}
            postContent={selectedPost.content}
            bestComment={{
              text: getTopTwoReplies(selectedPost.replies)[0]?.content || 'No responses yet',
              upvotes: getTopTwoReplies(selectedPost.replies)[0]?.upvotes || 0,
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div className={webShell ? 'bu-web-tab-content' : 'h-full overflow-y-auto scrollbar-hide'}>
      <div className={webShell
        ? 'bu-web-feed space-y-4 pb-8'
        : 'max-w-4xl mx-auto px-4 sm:px-6 py-4 space-y-4 pb-24'
      }>
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-100 to-fuchsia-100 dark:from-purple-900/30 dark:to-fuchsia-900/30 rounded-2xl p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold text-purple-900 dark:text-purple-100">{t('community.feed')}</h1>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                {t('community.shareSupport')}
              </p>
            </div>
          </div>
          
          {/* View Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setViewMode('all')}
              aria-pressed={viewMode === 'all'}
              className={`flex-1 px-3 py-2 rounded-xl font-medium text-sm text-center transition-colors ${
                viewMode === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
              }`}
            >
              {t('community.tabAll')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('saved')}
              aria-pressed={viewMode === 'saved'}
              className={`flex-1 px-3 py-2 rounded-xl font-medium text-sm text-center transition-colors ${
                viewMode === 'saved'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
              }`}
            >
              {t('community.tabSaved')} ({savedPosts.size})
            </button>
          </div>
          
          {viewMode === 'all' && (
            <>
              <div className={`flex gap-2 mb-2 ${webShell ? 'flex-wrap' : 'overflow-x-auto scrollbar-hide'}`} role="group" aria-label="Feed sort">
                {([
                  ['controversial', t('community.filterControversial')],
                  ['trending', t('community.filterTrending')],
                  ['newest', t('community.filterNew')],
                  ['discussed', t('community.filterDiscussed') || 'Discussed'],
                  ['all', t('community.filterAllFeed') || 'All'],
                ] as Array<[CommunityFeedKind, string]>).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSortBy(id)}
                    aria-pressed={sortBy === id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                      sortBy === id
                        ? id === 'controversial'
                          ? 'bg-orange-600 text-white'
                          : 'bg-purple-600 text-white'
                        : id === 'controversial'
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                          : 'bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {id === 'controversial' ? <Flame className="w-4 h-4 shrink-0" /> : null}
                    {id === 'trending' ? <ThumbsUp className="w-4 h-4 shrink-0" /> : null}
                    {id === 'newest' ? <Clock className="w-4 h-4 shrink-0" /> : null}
                    {id === 'discussed' ? <MessageCircle className="w-4 h-4 shrink-0" /> : null}
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={refreshPosts}
                  disabled={isRefreshing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {t('community.filterRefresh')}
                </button>
              </div>
              <div className={`flex gap-2 ${webShell ? 'flex-wrap' : 'overflow-x-auto scrollbar-hide'}`} role="group" aria-label="Content type">
                {([
                  ['all', t('community.mediaAll') || 'All'],
                  ['media', t('community.mediaWithPictures') || 'With pictures'],
                  ['text', t('community.mediaTextOnly') || 'Text only'],
                ] as Array<[CommunityMediaFilter, string]>).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMediaFilter(id)}
                    aria-pressed={mediaFilter === id}
                    className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                      mediaFilter === id
                        ? 'bg-fuchsia-600 text-white'
                        : 'bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('community.searchPlaceholder')}
            className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => { setSearchInput(''); setSearchQuery(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className={`flex gap-2 pb-2 ${webShell ? 'flex-wrap' : 'overflow-x-auto scrollbar-hide'}`}>
          <Filter className="w-5 h-5 text-gray-400 shrink-0 mt-1.5" />
          {categories.map(category => {
            const isAll = category.id === 'All';
            const isHotCategory = ['Controversial', 'Clickbait', 'Exposed', 'Shocking', 'Confessions', 'Dark Secrets', 'Drama', 'NSFW Stories', 'Unpopular Opinions'].includes(category.id);
            const isSelected = selectedCategory === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors font-medium ${
                  isSelected
                    ? isHotCategory && !isAll
                      ? 'bg-orange-600 text-white'
                      : 'bg-purple-600 text-white'
                    : isHotCategory
                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {isHotCategory && !isSelected && (
                  <Flame className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                )}
                {!isAll && (!isHotCategory || isSelected) && (() => {
                  const CatIcon = getCategoryIcon(category.id);
                  return <CatIcon className="w-4 h-4" />;
                })()}
                {getCategoryTranslation(category.id)}
              </button>
            );
          })}
        </div>

        {/* Stats — MVP required; visually compact */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-900/10 rounded-xl px-3 py-2.5 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <div className="text-xl font-semibold text-purple-700 dark:text-purple-300">{feedStats?.posts ?? filteredPosts.length}</div>
            </div>
            <div className="text-[11px] text-center text-purple-600 dark:text-purple-400">{t('community.statPosts')}</div>
          </div>
          <div className="bg-gradient-to-br from-fuchsia-100 to-fuchsia-50 dark:from-fuchsia-900/30 dark:to-fuchsia-900/10 rounded-xl px-3 py-2.5 border border-fuchsia-200 dark:border-fuchsia-800">
            <div className="flex items-center justify-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400" />
              <div className="text-xl font-semibold text-fuchsia-700 dark:text-fuchsia-300">
                {feedStats?.replies ?? filteredPosts.reduce((sum, post) => sum + (post.replyCount ?? post.replies?.length ?? 0), 0)}
              </div>
            </div>
            <div className="text-[11px] text-center text-fuchsia-600 dark:text-fuchsia-400">{t('community.statReplies')}</div>
          </div>
          <div className="bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-900/10 rounded-xl px-3 py-2.5 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-center gap-1.5">
              <ThumbsUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              <div className="text-xl font-semibold text-green-700 dark:text-green-300">
                {feedStats?.upvotes ?? filteredPosts.reduce((sum, post) => sum + (post.upvotes || 0), 0)}
              </div>
            </div>
            <div className="text-[11px] text-center text-green-600 dark:text-green-400">{t('community.statUpvotes')}</div>
          </div>
          <div className="bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-900/10 rounded-xl px-3 py-2.5 border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-center gap-1.5">
              <ThumbsDown className="w-4 h-4 text-red-600 dark:text-red-400" />
              <div className="text-xl font-semibold text-red-700 dark:text-red-300">
                {feedStats?.downvotes ?? filteredPosts.reduce((sum, post) => sum + (post.downvotes || 0), 0)}
              </div>
            </div>
            <div className="text-[11px] text-center text-red-600 dark:text-red-400">{t('community.statDownvotes')}</div>
          </div>
        </div>

        {/* Posts */}
        {isLoadingPosts ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <div className="flex gap-2 mt-4">
                   <Skeleton className="h-8 w-16 rounded-full" />
                   <Skeleton className="h-8 w-16 rounded-full" />
                   <Skeleton className="h-8 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 rounded-3xl border-2 border-dashed border-purple-300 dark:border-purple-700">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl text-gray-800 dark:text-white mb-2">
              {searchQuery || viewMode === 'saved' ? t('community.noPostsFound') : t('community.noPosts')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {viewMode === 'saved' 
                ? t('community.noSaved')
                : searchQuery 
                ? t('community.noSearch')
                : t('community.emptyDesc')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => {
              const topReplies = getTopTwoReplies(post.replies || []);
              const isControversial = isControversialPost(post);
              
              return (
                <div
                  key={post.id}
                  id={`community-post-${post.id}`}
                  className={`bg-white dark:bg-gray-800 rounded-2xl p-4 border ${
                    isControversial 
                      ? 'border-orange-500 dark:border-orange-600' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {/* Controversial Badge */}
                  {isControversial && (
                    <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-sm font-semibold">
                      <Flame className="w-4 h-4" />
                      {t('category.Controversial')}
                      <span className="text-xs opacity-80">{t('community.hotTopic')}</span>
                    </div>
                  )}

                  {/* Post Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar - Anonymous or Profile Picture */}
                      {post.isAnonymous !== false ? (
                        // Anonymous post
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      ) : (
                        // Public post with profile picture
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center shrink-0 overflow-hidden">
                          {post.profilePicture ? (
                            <img src={post.profilePicture} alt={post.username || 'User'} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white text-lg">
                              {(post.username || 'U')[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                          {post.isAnonymous !== false ? generateAnonymousName(post.userId || post.id, t) : (post.username || 'User')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getRelativeTime(post.createdAt, t)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {/* Flag as spam (trusted users only) */}
                      {isTrustedUser && (
                        <button
                          onClick={() => handleFlagSpam(post.id)}
                          disabled={flaggingPostId === post.id}
                          title={t('community.flagSpam')}
                          className="p-2 rounded-xl text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all disabled:opacity-50"
                        >
                          <Flag className={`w-5 h-5 ${flaggingPostId === post.id ? 'animate-pulse' : ''}`} />
                        </button>
                      )}
                      {/* Save/Bookmark Button */}
                      <button
                        onClick={() => {
                          const newSaved = new Set(savedPosts);
                          if (newSaved.has(post.id)) {
                            newSaved.delete(post.id);
                            toast.success(t('community.postUnsaved'));
                          } else {
                            newSaved.add(post.id);
                            toast.success(t('community.postSaved'));
                          }
                          setSavedPosts(newSaved);
                        }}
                        className={`p-2 rounded-xl transition-all ${
                          savedPosts.has(post.id)
                            ? 'bg-purple-600 text-white shadow-lg'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                        }`}
                      >
                        <Bookmark className={`w-5 h-5 ${savedPosts.has(post.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div
                    className={`mb-4 ${webShell ? 'cursor-pointer rounded-xl outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-fuchsia-400' : ''}`}
                    role={webShell ? 'link' : undefined}
                    tabIndex={webShell ? 0 : undefined}
                    aria-label={webShell ? t('community.openStory') : undefined}
                    onClick={webShell ? () => openStoryDetail(post.id) : undefined}
                    onKeyDown={webShell ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        openStoryDetail(post.id)
                      }
                    } : undefined}
                  >
                    <p className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed mb-3">
                      {expandedPosts.has(post.id) || post.content.length <= 200
                        ? post.content
                        : `${post.content.slice(0, 200)}...`}
                    </p>
                    {post.imageUrl && (
                      <div className={`mt-3 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 ${
                        post.imageAspect === 'portrait' ? 'max-w-[280px] aspect-[3/4]' :
                        post.imageAspect === 'wide' ? 'max-w-full aspect-video' :
                        'max-w-[320px] aspect-square'
                      }`}>
                        <img
                          src={post.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Read More Button */}
                    {post.content.length > 200 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (webShell) {
                            openStoryDetail(post.id)
                            return
                          }
                          const newExpanded = new Set(expandedPosts);
                          if (newExpanded.has(post.id)) {
                            newExpanded.delete(post.id);
                          } else {
                            newExpanded.add(post.id);
                          }
                          setExpandedPosts(newExpanded);
                        }}
                        className="text-purple-600 dark:text-purple-400 text-sm font-medium hover:underline"
                      >
                        {webShell
                          ? t('community.openStory')
                          : (expandedPosts.has(post.id) ? t('community.showLess') : t('community.readMore'))}
                      </button>
                    )}
                    
                    {/* Category Tags */}
                    {post.categories && post.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {post.categories.map((categoryName, idx) => {
                          const IconComponent = getCategoryIcon(categoryName);
                          const hotCategories = ['Controversial', 'Clickbait', 'Exposed', 'Shocking', 'Confessions', 
                                                 'Dark Secrets', 'Drama', 'NSFW Stories', 'Unpopular Opinions'];
                          const isHot = hotCategories.includes(categoryName);
                          
                          return (
                            <span
                              key={idx}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                                isHot
                                  ? 'bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700'
                                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700'
                              }`}
                            >
                              <IconComponent className="w-3.5 h-3.5" />
                              {getCategoryTranslation(categoryName)}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Top 2 Replies */}
                  {topReplies.length > 0 && (
                    <div className="mb-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 font-medium">
                        <Heart className="w-4 h-4 fill-current" />
                        {t('community.bestResponses')}
                      </div>
                      
                      {topReplies.map((reply, idx) => (
                        <div
                          key={reply.id || `reply-${post.id}-${idx}`}
                          className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/30 dark:to-fuchsia-900/30 rounded-xl p-4 border border-purple-200 dark:border-purple-700"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-500 flex items-center justify-center shrink-0">
                              <span className="text-white text-xs font-semibold">
                                {String.fromCharCode(65 + idx)}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">
                                {generateAnonymousName(reply.userId || `reply-${idx}`, t)}
                              </p>
                              <p className="text-gray-800 dark:text-white/90 text-sm leading-relaxed">
                                {reply.content}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <button
                                  onClick={() => handleReplyUpvote(post.id, reply.id)}
                                  className={`flex items-center gap-1 text-xs transition-colors ${
                                    reply.upvotedBy?.includes(userId)
                                      ? 'text-green-600 dark:text-green-400'
                                      : 'text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400'
                                  }`}
                                >
                                  <ThumbsUp className={`w-3 h-3 ${reply.upvotedBy?.includes(userId) ? 'fill-current' : ''}`} />
                                  {reply.upvotes || 0}
                                </button>
                                <button
                                  onClick={() => handleReplyDownvote(post.id, reply.id)}
                                  className={`flex items-center gap-1 text-xs transition-colors ${
                                    reply.downvotedBy?.includes(userId)
                                      ? 'text-red-600 dark:text-red-400'
                                      : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                                  }`}
                                >
                                  <ThumbsDown className={`w-3 h-3 ${reply.downvotedBy?.includes(userId) ? 'fill-current' : ''}`} />
                                  {reply.downvotes || 0}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Post Actions */}
                  <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePostUpvote(post.id)}
                      className={`flex items-center gap-2 transition-colors ${
                        post.upvotedBy?.includes(userId)
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400'
                      }`}
                    >
                      <motion.div
                        initial={false}
                        animate={post.upvotedBy?.includes(userId) ? { scale: [1, 1.5, 1], rotate: [0, -10, 10, 0] } : { scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ThumbsUp className={`w-5 h-5 ${post.upvotedBy?.includes(userId) ? 'fill-current' : ''}`} />
                      </motion.div>
                      <motion.span 
                        key={post.upvotes}
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-sm font-medium"
                      >
                        {post.upvotes || 0}
                      </motion.span>
                    </motion.button>

                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePostDownvote(post.id)}
                      className={`flex items-center gap-2 transition-colors ${
                        post.downvotedBy?.includes(userId)
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                      }`}
                    >
                      <motion.div
                        initial={false}
                        animate={post.downvotedBy?.includes(userId) ? { scale: [1, 1.5, 1], rotate: [0, -10, 10, 0] } : { scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ThumbsDown className={`w-5 h-5 ${post.downvotedBy?.includes(userId) ? 'fill-current' : ''}`} />
                      </motion.div>
                      <motion.span 
                        key={post.downvotes}
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-sm font-medium"
                      >
                        {post.downvotes || 0}
                      </motion.span>
                    </motion.button>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        if (webShell) {
                          openStoryDetail(post.id)
                          return
                        }
                        const newShowReplies = new Set(showRepliesForPost);
                        if (newShowReplies.has(post.id)) {
                          newShowReplies.delete(post.id);
                        } else {
                          newShowReplies.add(post.id);
                          void ensurePostRepliesLoaded(post.id);
                        }
                        setShowRepliesForPost(newShowReplies);
                      }}
                      className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">{post.replyCount ?? post.replies?.length ?? 0} {t('community.repliesCount')}</span>
                    </button>

                    <button
                      onClick={() => handleShareToSocial(post)}
                      className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white px-4 py-2 rounded-xl hover:from-purple-700 hover:to-fuchsia-700 transition-all shadow-lg hover:shadow-xl ml-auto group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      <Share2 className="w-4 h-4 relative z-10" />
                      <span className="text-sm font-medium relative z-10">{t('community.shareSocial')}</span>
                    </button>
                  </div>

                  {/* Inline Replies Section */}
                  <AnimatePresence>
                    {showRepliesForPost.has(post.id) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                      >
                        {/* All Replies */}
                        <div className="space-y-3 mb-4">
                          {post.replies.map((reply, idx) => (
                            <div
                              key={reply.id || `inline-reply-${post.id}-${idx}`}
                              className="flex items-start gap-3"
                            >
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-fuchsia-400 flex items-center justify-center shrink-0">
                                <User className="w-3 h-3 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2.5">
                                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">
                                    {generateAnonymousName(reply.userId || `reply-${idx}`, t)}
                                  </p>
                                  <p className="text-gray-800 dark:text-white text-sm leading-relaxed">
                                    {reply.content}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3 mt-1 ml-4">
                                  <span className="text-xs text-gray-500">
                                    {getRelativeTime(reply.createdAt, t)}
                                  </span>
                                  <button
                                    onClick={() => handleReplyUpvote(post.id, reply.id)}
                                    className={`flex items-center gap-1 text-xs transition-colors ${
                                      reply.upvotedBy?.includes(userId)
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400'
                                    }`}
                                  >
                                    <ThumbsUp className={`w-3 h-3 ${reply.upvotedBy?.includes(userId) ? 'fill-current' : ''}`} />
                                    {reply.upvotes || 0}
                                  </button>
                                  <button
                                    onClick={() => handleReplyDownvote(post.id, reply.id)}
                                    className={`flex items-center gap-1 text-xs transition-colors ${
                                      reply.downvotedBy?.includes(userId)
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                                    }`}
                                  >
                                    <ThumbsDown className={`w-3 h-3 ${reply.downvotedBy?.includes(userId) ? 'fill-current' : ''}`} />
                                    {reply.downvotes || 0}
                                  </button>
                                  {/* Delete Reply Button - Only show if reply belongs to current user */}
                                  {currentUserSession && reply.userId === currentUserSession.user?.id && (
                                    <button
                                      onClick={() => handleDeleteReply(post.id, reply.id)}
                                      className="ml-2 px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-medium transition-colors"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add Reply Input */}
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shrink-0">
                            <User className="w-3 h-3 text-white" />
                          </div>
                          <div className="flex-1">
                            <textarea
                              value={replyText[post.id] || ''}
                              onChange={(e) => setReplyText({ ...replyText, [post.id]: e.target.value })}
                              placeholder="Write a supportive reply..."
                              className="w-full bg-gray-100 dark:bg-gray-700 border-0 rounded-2xl px-4 py-2.5 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                              rows={2}
                            />
                            {replyText[post.id] && replyText[post.id].trim() && (
                              <button
                                onClick={() => handleSubmitReply(post.id)}
                                className="mt-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-xl hover:from-purple-700 hover:to-fuchsia-700 transition-all text-sm font-medium"
                              >
                                Post Reply
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
            {nextCursor && viewMode === 'all' && (
              <div className="pt-2 pb-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => void loadMorePosts()}
                  disabled={isLoadingMore}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-purple-600 text-white disabled:opacity-50 transition-colors"
                >
                  {isLoadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Social Share Modal */}
      {selectedPost && (
        <SocialShareCard
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedPost(null);
          }}
          postContent={selectedPost.content}
          bestComment={{
            text: getTopTwoReplies(selectedPost.replies)[0]?.content || 'No responses yet',
            upvotes: getTopTwoReplies(selectedPost.replies)[0]?.upvotes || 0
          }}
        />
      )}
    </div>
  );
}