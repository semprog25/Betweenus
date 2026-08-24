import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Share2, Bookmark, Search, TrendingUp, Clock, Filter, Sparkles, ThumbsUp, ThumbsDown, RefreshCw, X, Flag, Globe, Flame, User } from 'lucide-react';
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

const COMMUNITY_SEEN_POSTS_STORAGE_KEY = 'between_us_community_seen_posts';
const MAX_TRACKED_SEEN_POSTS = 250;

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
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [freshnessScores, setFreshnessScores] = useState<Record<string, number>>({});
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'trending' | 'controversial'>('newest');
  const [viewMode, setViewMode] = useState<'all' | 'saved'>(initialViewMode);
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [showRepliesForPost, setShowRepliesForPost] = useState<Set<string>>(new Set());
  const [replyText, setReplyText] = useState<{ [postId: string]: string }>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userId, setUserId] = useState(() => getActorId() || '');
  const [isTrustedUser, setIsTrustedUser] = useState(false);
  const [flaggingPostId, setFlaggingPostId] = useState<string | null>(null);

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

  // Load trusted user status for spam-flagging (Reddit-style moderation)
  useEffect(() => {
    const session = getSession();
    if (session?.user?.id) {
      getUserReputation(session.user.id).then((res) => {
        if (res.isTrusted !== undefined) setIsTrustedUser(res.isTrusted);
      }).catch(() => {});
    } else {
      setIsTrustedUser(false);
    }
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

  // Load saved posts from localStorage on mount
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

  // Helper function to fetch posts - filter by user's selected languages only
  const getPosts = async (languages: string[]) => {
    const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-6c9b0e48`;
    const languagesParam = languages.length > 0 ? languages.join(',') : 'en';
    const actor = getActorId();
    const viewerQuery = actor ? `&viewerId=${encodeURIComponent(actor)}` : '';
    const response = await fetch(`${baseUrl}/posts?language=${encodeURIComponent(languagesParam)}${viewerQuery}`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });

    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to fetch posts');
  };

  const loadSeenPostIds = () => {
    try {
      const rawValue = localStorage.getItem(COMMUNITY_SEEN_POSTS_STORAGE_KEY);
      if (!rawValue) return [] as string[];
      const parsedValue = JSON.parse(rawValue);
      if (!Array.isArray(parsedValue)) return [] as string[];
      return parsedValue.filter((value): value is string => typeof value === 'string');
    } catch {
      return [] as string[];
    }
  };

  const persistSeenPostIds = (postIds: string[]) => {
    try {
      localStorage.setItem(
        COMMUNITY_SEEN_POSTS_STORAGE_KEY,
        JSON.stringify(postIds.slice(-MAX_TRACKED_SEEN_POSTS))
      );
    } catch {
      // Ignore storage write failures to avoid blocking feed rendering
    }
  };

  const buildFreshnessScores = (postsData: CommunityPost[]) => {
    const seenPostIds = loadSeenPostIds();
    let seenPostIdSet = new Set(seenPostIds);
    const hasUnseenPosts = postsData.some((post) => !seenPostIdSet.has(post.id));

    if (!hasUnseenPosts) {
      seenPostIdSet = new Set();
      persistSeenPostIds([]);
    }

    const nowMs = Date.now();
    const scoreByPostId = postsData.reduce<Record<string, number>>((acc, post) => {
      const postTimeMs = new Date(post.createdAt).getTime();
      const ageHours = Number.isNaN(postTimeMs) ? 48 : Math.max(1, (nowMs - postTimeMs) / 3600000);
      const isSeen = seenPostIdSet.has(post.id);
      const engagementScore = (post.upvotes || 0) + (post.downvotes || 0) + (post.replies?.length || 0) * 2;
      const isViralOrHeavilyEngaged = engagementScore >= 30 || isControversialPost(post);
      const recentBoost = Math.max(0, 1.2 - ageHours / 72);
      const seenPenalty = isSeen ? -2.2 : 2.4;
      const viralPenalty = isViralOrHeavilyEngaged ? -0.9 : 0.3;
      const randomJitter = Math.random() * 0.8;

      acc[post.id] = seenPenalty + recentBoost + viralPenalty + randomJitter;
      return acc;
    }, {});

    const refreshedSeenIds = [...seenPostIds, ...postsData.map((post) => post.id)];
    persistSeenPostIds(refreshedSeenIds);
    return scoreByPostId;
  };

  // Load posts
  const loadPosts = async () => {
    setIsLoadingPosts(true);
    try {
      const response = await getPosts(selectedLanguages);
      const postsData = response?.posts || [];
      console.log(`Loaded community posts for languages ${selectedLanguages.join(',')}:`, postsData.length);
      
      const nextFreshnessScores = buildFreshnessScores(postsData);
      setFreshnessScores(nextFreshnessScores);
      setPosts(postsData);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error('Failed to load posts');
      setPosts([]);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Refresh posts with animation
  const refreshPosts = async () => {
    setIsRefreshing(true);
    try {
      // Fetch posts based on current sort filter and selected languages
      const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-6c9b0e48`;
      const languagesParam = selectedLanguages.length > 0 ? selectedLanguages.join(',') : 'en';
      const actor = getActorId();
      const viewerQuery = actor ? `&viewerId=${encodeURIComponent(actor)}` : '';
      const response = await fetch(`${baseUrl}/posts?language=${encodeURIComponent(languagesParam)}&sort=${sortBy}${viewerQuery}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const postsData = data?.posts || [];
        console.log(`Refreshed ${postsData.length} posts with filter: ${sortBy}`);
        const nextFreshnessScores = buildFreshnessScores(postsData);
        setFreshnessScores(nextFreshnessScores);
        setPosts(postsData);
        
        // Show toast based on what filter is active
        const filterMessages = {
          newest: t('community.toast.newest'),
          trending: t('community.toast.trending'),
          controversial: t('community.toast.controversial'),
        };
        toast.success(filterMessages[sortBy] || t('community.toast.refreshed'));
      } else {
        throw new Error('Failed to refresh');
      }
    } catch (error) {
      console.error('Error refreshing posts:', error);
      toast.error('Failed to refresh posts');
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [selectedLanguages]);

  // Check if a post is truly viral/controversial
  const isControversialPost = (post: CommunityPost) => {
    // Controversial: 10+ replies AND high engagement (upvotes + replies >= 15)
    const totalEngagement = (post.upvotes || 0) + (post.replies?.length || 0);
    return (post.replies?.length || 0) >= 10 && totalEngagement >= 15;
  };

  // Get top 2 replies for a post
  const getTopTwoReplies = (replies: any[]) => {
    if (!replies || replies.length === 0) return [];
    return [...replies]
      .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
      .slice(0, 2);
  };

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

  // Filter and sort posts
  const filteredPosts = posts
    .filter(post => {
      // Search filter
      if (searchQuery && !post.content.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Category filter
      if (selectedCategory !== 'All') {
        // Since selectedCategory is now just the ID (e.g., "Dark Secrets"), we can compare directly
        if (!post.categories?.some(cat => cat.toLowerCase() === selectedCategory.toLowerCase())) {
          return false;
        }
      }
      
      // View mode filter
      if (viewMode === 'saved' && !savedPosts.has(post.id)) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      const freshnessDelta = (freshnessScores[b.id] || 0) - (freshnessScores[a.id] || 0);

      if (sortBy === 'newest') {
        if (freshnessDelta !== 0) return freshnessDelta;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'trending') {
        const trendingDelta = (b.upvotes + b.replies.length * 2) - (a.upvotes + a.replies.length * 2);
        if (trendingDelta !== 0) return trendingDelta;
        return freshnessDelta;
      }
      if (sortBy === 'controversial') {
        // Controversial score: combination of downvotes, upvote/downvote ratio, and high engagement
        const aTotal = (a.upvotes || 0) + (a.downvotes || 0);
        const bTotal = (b.upvotes || 0) + (b.downvotes || 0);
        const aRatio = aTotal > 0 ? Math.abs((a.upvotes || 0) - (a.downvotes || 0)) / aTotal : 0;
        const bRatio = bTotal > 0 ? Math.abs((b.upvotes || 0) - (b.downvotes || 0)) / bTotal : 0;
        const aScore = aTotal * (1 - aRatio) + (a.replies?.length || 0) * 5;
        const bScore = bTotal * (1 - bRatio) + (b.replies?.length || 0) * 5;
        const controversialDelta = bScore - aScore;
        if (controversialDelta !== 0) return controversialDelta;
        return freshnessDelta;
      }
      return freshnessDelta;
    });

  return (
    <div className={`h-full overflow-y-auto scrollbar-hide ${webShell ? 'bu-web-tab-content' : ''}`}>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 pb-24">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-100 to-fuchsia-100 dark:from-purple-900/30 dark:to-fuchsia-900/30 rounded-3xl p-6 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl text-purple-900 dark:text-purple-100">{t('community.feed')}</h1>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                {t('community.shareSupport')}
              </p>
            </div>
          </div>
          
          {/* View Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setViewMode('all')}
              className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all ${
                viewMode === 'all'
                  ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg'
                  : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              {t('community.tabAll')}
            </button>
            <button
              onClick={() => setViewMode('saved')}
              className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all ${
                viewMode === 'saved'
                  ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg'
                  : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              {t('community.tabSaved')} ({savedPosts.size})
            </button>
          </div>
          
          {/* Sort & Filter */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            <button
              onClick={() => setSortBy('trending')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                sortBy === 'trending'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              {t('community.filterTrending')}
            </button>
            <button
              onClick={() => setSortBy('controversial')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                sortBy === 'controversial'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50'
              }`}
            >
              <Flame className="w-4 h-4" />
              {t('community.filterControversial')}
            </button>
            <button
              onClick={() => setSortBy('newest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                sortBy === 'newest'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              {t('community.filterNew')}
            </button>
            <button
              onClick={refreshPosts}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {t('community.filterRefresh')}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('community.searchPlaceholder')}
            className="w-full pl-10 pr-10 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          <Filter className="w-5 h-5 text-gray-400 shrink-0 mt-1.5" />
          {categories.map(category => {
            const isAll = category.id === 'All';
            const isHotCategory = ['Controversial', 'Clickbait', 'Exposed', 'Shocking', 'Confessions', 'Dark Secrets', 'Drama', 'NSFW Stories', 'Unpopular Opinions'].includes(category.id);
            const isSelected = selectedCategory === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all font-medium ${
                  isSelected
                    ? isAll
                      ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg'
                      : isHotCategory
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30 animate-pulse'
                      : 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg'
                    : isHotCategory
                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50 border-2 border-orange-300 dark:border-orange-700'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {isHotCategory && !isSelected && (
                  <span className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center animate-bounce">
                    <Flame className="w-3 h-3 text-white" />
                  </span>
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

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-900/10 rounded-2xl p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-center mb-2">
              <MessageCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
              <div className="text-3xl text-purple-700 dark:text-purple-300">{filteredPosts.length}</div>
            </div>
            <div className="text-xs text-center text-purple-600 dark:text-purple-400">{t('community.statPosts')}</div>
          </div>
          <div className="bg-gradient-to-br from-fuchsia-100 to-fuchsia-50 dark:from-fuchsia-900/30 dark:to-fuchsia-900/10 rounded-2xl p-4 border border-fuchsia-200 dark:border-fuchsia-800">
            <div className="flex items-center justify-center mb-2">
              <MessageCircle className="w-5 h-5 text-fuchsia-600 dark:text-fuchsia-400 mr-2" />
              <div className="text-3xl text-fuchsia-700 dark:text-fuchsia-300">
                {filteredPosts.reduce((sum, post) => sum + post.replies.length, 0)}
              </div>
            </div>
            <div className="text-xs text-center text-fuchsia-600 dark:text-fuchsia-400">{t('community.statReplies')}</div>
          </div>
          <div className="bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-900/10 rounded-2xl p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-center mb-2">
              <ThumbsUp className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
              <div className="text-3xl text-green-700 dark:text-green-300">
                {filteredPosts.reduce((sum, post) => sum + (post.upvotes || 0), 0)}
              </div>
            </div>
            <div className="text-xs text-center text-green-600 dark:text-green-400">{t('community.statUpvotes')}</div>
          </div>
          <div className="bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-900/10 rounded-2xl p-4 border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-center mb-2">
              <ThumbsDown className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
              <div className="text-3xl text-red-700 dark:text-red-300">
                {filteredPosts.reduce((sum, post) => sum + (post.downvotes || 0), 0)}
              </div>
            </div>
            <div className="text-xs text-center text-red-600 dark:text-red-400">{t('community.statDownvotes')}</div>
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
            {filteredPosts.map((post, index) => {
              const topReplies = getTopTwoReplies(post.replies);
              const isControversial = isControversialPost(post);
              
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border ${
                    isControversial 
                      ? 'border-orange-500 dark:border-orange-600 shadow-lg shadow-orange-500/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600'
                  } transition-all`}
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
                  <div className="mb-4">
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
                        onClick={() => {
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
                        {expandedPosts.has(post.id) ? t('community.showLess') : t('community.readMore')}
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
                      onClick={() => {
                        const newShowReplies = new Set(showRepliesForPost);
                        if (newShowReplies.has(post.id)) {
                          newShowReplies.delete(post.id);
                        } else {
                          newShowReplies.add(post.id);
                        }
                        setShowRepliesForPost(newShowReplies);
                      }}
                      className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">{post.replies.length} {t('community.repliesCount')}</span>
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
                </motion.div>
              );
            })}
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