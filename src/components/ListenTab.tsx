import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  MessageCircle, 
  ThumbsUp, 
  ThumbsDown, 
  SkipForward, 
  Flame, 
  TrendingUp, 
  Sparkles, 
  Shuffle, 
  Loader2, 
  Plus, 
  ArrowUpRight, 
  User, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Shield, 
  AlertCircle, 
  Info 
} from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { useLanguage } from './LanguageContext';
import { getSession } from '../utils/auth';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Reply {
  id: string;
  content: string;
  userId?: string | null;
  isAnonymous: boolean;
  upvotes: number;
  downvotes: number;
  upvotedBy?: string[];
  downvotedBy?: string[];
  createdAt: string;
  isEdited?: boolean;
}

interface Post {
  id: string;
  content: string;
  mood?: string;
  isAnonymous: boolean;
  languages: string[];
  userId?: string | null;
  upvotes: number;
  downvotes: number;
  upvotedBy?: string[];
  downvotedBy?: string[];
  replies: Reply[];
  createdAt: string;
}

export function ListenTab() {
  const { t, language } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [reply, setReply] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandReplies, setExpandReplies] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [userId, setUserId] = useState<string>('');
  const [hasRequestedStory, setHasRequestedStory] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [seenPostIds, setSeenPostIds] = useState<Set<string>>(new Set());
  const [currentFilter, setCurrentFilter] = useState<'controversial' | 'trending' | 'newest' | 'random'>('controversial');
  const [currentGuidelinePage, setCurrentGuidelinePage] = useState(0);

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-6c9b0e48`;

  // Initialize User ID
  useEffect(() => {
    const initUser = () => {
      const session = getSession();
      if (session?.user?.id) {
        setUserId(session.user.id);
      } else {
        // Check for existing anonymous ID
        let anonId = localStorage.getItem('between_us_anon_id');
        if (!anonId) {
          anonId = 'anonymous-user-' + Math.random().toString(36).substr(2, 9);
          localStorage.setItem('between_us_anon_id', anonId);
        }
        setUserId(anonId);
      }
    };
    
    initUser();
    
    // Listen for storage changes (login/logout)
    const handleStorageChange = () => initUser();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Fetch a fresh story based on current filter, avoiding repeats
  const fetchRandomStory = async (filter?: 'controversial' | 'trending' | 'newest' | 'random') => {
    try {
      setIsLoading(true);
      
      // Use provided filter or current filter
      const activeFilter = filter || currentFilter;
      
      // Build query params
      const excludeParam = seenPostIds.size > 0 ? `&exclude=${Array.from(seenPostIds).join(',')}` : '';
      const sortParam = `&sort=${activeFilter}`;
      
      // Fetch posts with filters
      const response = await fetch(`${baseUrl}/posts?language=${language}${excludeParam}${sortParam}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        let availablePosts = data.posts || [];
        
        console.log(`Fetched ${availablePosts.length} posts (Filter: ${activeFilter}, Excluded: ${seenPostIds.size})`);
        
        if (availablePosts.length > 0) {
          // For random filter, pick any post (backend already shuffled)
          // For other filters, take the top result (already sorted by backend)
          const selectedPost = activeFilter === 'random' 
            ? availablePosts[Math.floor(Math.random() * Math.min(5, availablePosts.length))] // Pick from top 5
            : availablePosts[0]; // Take the most relevant one
          
          // Mark this post as seen
          setSeenPostIds(prev => new Set([...prev, selectedPost.id]));
          setCurrentPost(selectedPost);
          setPosts(availablePosts);
          setHasRequestedStory(true);
          
          // Show what kind of content we're showing
          const filterLabels = {
            controversial: t('listen.filter.controversial'),
            trending: t('listen.filter.trending'),
            newest: t('listen.filter.newest'),
            random: t('listen.filter.random')
          };
          
          console.log(`Showing ${filterLabels[activeFilter as keyof typeof filterLabels]} story: ${selectedPost.id}`);
          
        } else {
          // No more fresh posts available - reset seen list
          if (seenPostIds.size > 0) {
            toast.info(t('listen.resetting'), {
              description: t('listen.startingFresh')
            });
            setSeenPostIds(new Set());
            // Try again with empty seen list
            setTimeout(() => fetchRandomStory(activeFilter), 1000);
          } else {
            toast.error(t('listen.noStories'));
          }
        }
      } else {
        console.error('Failed to fetch posts:', await response.text());
        toast.error(t('listen.loadError'));
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error(t('listen.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Change filter and immediately fetch new content
  const changeFilter = (newFilter: 'controversial' | 'trending' | 'newest' | 'random') => {
    setCurrentFilter(newFilter);
    fetchRandomStory(newFilter);
    
    setReply('');
    setExpandReplies(false);
    setEditingReplyId(null);
  };

  const sendSupport = async () => {
    if (!reply.trim() || !currentPost) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${baseUrl}/posts/${currentPost.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          content: reply.trim(),
          isAnonymous: true,
          userId: userId,
        }),
      });

      if (response.ok) {
        toast.success(t('listen.supportSent'));
        setReply('');
        // Refresh to get updated post with new reply
        await fetchRandomStory();
        setExpandReplies(true);
      } else {
        const errorText = await response.text();
        console.error('Failed to send reply:', errorText);
        toast.error(t('listen.replyError'));
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error(t('listen.replyError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostUpvote = async (postId: string) => {
    if (!currentPost) return;
    
    // Optimistic update
    const isUpvoted = currentPost.upvotedBy?.includes(userId);
    const isDownvoted = currentPost.downvotedBy?.includes(userId);
    
    const newUpvotedBy = isUpvoted 
      ? currentPost.upvotedBy?.filter(id => id !== userId) || []
      : [...(currentPost.upvotedBy || []), userId];
      
    const newDownvotedBy = isDownvoted
      ? currentPost.downvotedBy?.filter(id => id !== userId) || []
      : currentPost.downvotedBy || [];
      
    const newUpvotes = (currentPost.upvotes || 0) + (isUpvoted ? -1 : 1);
    const newDownvotes = (currentPost.downvotes || 0) - (isDownvoted ? 1 : 0);
    
    setCurrentPost({
      ...currentPost,
      upvotes: newUpvotes,
      downvotes: newDownvotes,
      upvotedBy: newUpvotedBy,
      downvotedBy: newDownvotedBy
    });

    try {
      const response = await fetch(`${baseUrl}/posts/${postId}/upvote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        console.error('Failed to upvote:', await response.text());
        // Revert on failure (optional, keeping simple for now)
      }
    } catch (error) {
      console.error('Error upvoting post:', error);
    }
  };

  const handlePostDownvote = async (postId: string) => {
    if (!currentPost) return;

    // Optimistic update
    const isUpvoted = currentPost.upvotedBy?.includes(userId);
    const isDownvoted = currentPost.downvotedBy?.includes(userId);
    
    const newDownvotedBy = isDownvoted 
      ? currentPost.downvotedBy?.filter(id => id !== userId) || []
      : [...(currentPost.downvotedBy || []), userId];

    const newUpvotedBy = isUpvoted
      ? currentPost.upvotedBy?.filter(id => id !== userId) || []
      : currentPost.upvotedBy || [];
      
    const newDownvotes = (currentPost.downvotes || 0) + (isDownvoted ? -1 : 1);
    const newUpvotes = (currentPost.upvotes || 0) - (isUpvoted ? 1 : 0);
    
    setCurrentPost({
      ...currentPost,
      upvotes: newUpvotes,
      downvotes: newDownvotes,
      upvotedBy: newUpvotedBy,
      downvotedBy: newDownvotedBy
    });

    try {
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
      }
    } catch (error) {
      console.error('Error downvoting post:', error);
    }
  };

  const handleReplyUpvote = async (postId: string, replyId: string) => {
    if (!currentPost) return;

    // Optimistic update
    const updatedReplies = currentPost.replies.map(r => {
      if (r.id !== replyId) return r;
      
      const isUpvoted = r.upvotedBy?.includes(userId);
      const isDownvoted = r.downvotedBy?.includes(userId);
      
      const newUpvotedBy = isUpvoted 
        ? r.upvotedBy?.filter(id => id !== userId) || []
        : [...(r.upvotedBy || []), userId];
        
      const newDownvotedBy = isDownvoted
        ? r.downvotedBy?.filter(id => id !== userId) || []
        : r.downvotedBy || [];
        
      return {
        ...r,
        upvotes: (r.upvotes || 0) + (isUpvoted ? -1 : 1),
        downvotes: (r.downvotes || 0) - (isDownvoted ? 1 : 0),
        upvotedBy: newUpvotedBy,
        downvotedBy: newDownvotedBy
      };
    });
    
    setCurrentPost({
      ...currentPost,
      replies: updatedReplies
    });

    try {
      const response = await fetch(`${baseUrl}/posts/${postId}/reply/${replyId}/upvote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        console.error('Failed to upvote reply:', await response.text());
      }
    } catch (error) {
      console.error('Error upvoting reply:', error);
    }
  };

  const handleReplyDownvote = async (postId: string, replyId: string) => {
    if (!currentPost) return;

    // Optimistic update
    const updatedReplies = currentPost.replies.map(r => {
      if (r.id !== replyId) return r;
      
      const isUpvoted = r.upvotedBy?.includes(userId);
      const isDownvoted = r.downvotedBy?.includes(userId);
      
      const newDownvotedBy = isDownvoted 
        ? r.downvotedBy?.filter(id => id !== userId) || []
        : [...(r.downvotedBy || []), userId];
        
      const newUpvotedBy = isUpvoted
        ? r.upvotedBy?.filter(id => id !== userId) || []
        : r.upvotedBy || [];
        
      return {
        ...r,
        upvotes: (r.upvotes || 0) - (isUpvoted ? 1 : 0),
        downvotes: (r.downvotes || 0) + (isDownvoted ? -1 : 1),
        upvotedBy: newUpvotedBy,
        downvotedBy: newDownvotedBy
      };
    });
    
    setCurrentPost({
      ...currentPost,
      replies: updatedReplies
    });

    try {
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
      }
    } catch (error) {
      console.error('Error downvoting reply:', error);
    }
  };

  const startEditReply = (reply: Reply) => {
    setEditingReplyId(reply.id);
    setEditContent(reply.content);
  };

  const cancelEditReply = () => {
    setEditingReplyId(null);
    setEditContent('');
  };

  const saveEditReply = async (postId: string, replyId: string) => {
    if (!editContent.trim()) return;

    try {
      const response = await fetch(`${baseUrl}/posts/${postId}/reply/${replyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ content: editContent.trim() }),
      });

      if (response.ok) {
        toast.success(t('listen.replyUpdated'));
        setEditingReplyId(null);
        setEditContent('');
        await fetchRandomStory();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || t('listen.replyUpdateError'));
      }
    } catch (error) {
      console.error('Error updating reply:', error);
      toast.error(t('listen.replyUpdateError'));
    }
  };

  const deleteReply = async (postId: string, replyId: string) => {
    try {
      const response = await fetch(`${baseUrl}/posts/${postId}/reply/${replyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        toast.success(t('listen.replyDeleted'));
        await fetchRandomStory();
      } else {
        console.error('Failed to delete reply:', await response.text());
        toast.error(t('listen.replyDeleteError'));
      }
    } catch (error) {
      console.error('Error deleting reply:', error);
      toast.error(t('listen.replyDeleteError'));
    }
  };

  const skipToNext = () => {
    fetchRandomStory();
    setReply('');
    setExpandReplies(false);
    setEditingReplyId(null);
  };

  if (isLoading && !currentPost) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('listen.loading')}</p>
        </div>
      </div>
    );
  }

  // Show "Receive Stories" button initially
  if (!hasRequestedStory && !currentPost) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-purple-50 to-fuchsia-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
        <div className="flex-1 overflow-hidden relative">
          {/* Swipeable Pages Container */}
          <motion.div
            drag="x"
            dragConstraints={{ left: -window.innerWidth, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset, velocity }) => {
              const swipeThreshold = 50;
              if (offset.x < -swipeThreshold && currentGuidelinePage === 0) {
                setCurrentGuidelinePage(1);
              } else if (offset.x > swipeThreshold && currentGuidelinePage === 1) {
                setCurrentGuidelinePage(0);
              }
            }}
            animate={{ x: currentGuidelinePage === 0 ? 0 : -window.innerWidth }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex h-full"
            style={{ width: '200%' }}
          >
            {/* Page 1: Community Guidelines */}
            <div className="w-full h-full overflow-y-auto scrollbar-hide px-6 pt-8 pb-8" style={{ width: '50%' }}>
              <div className="max-w-md mx-auto flex flex-col h-full">
                {/* Header */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center pb-6"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-6xl mb-4"
                  >
                    👂
                  </motion.div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent mb-2">
                    {t('listen.title')}
                  </h1>
                  <p className="text-base text-gray-700 dark:text-gray-300">
                    {t('listen.subtitle')}
                  </p>
                </motion.div>

                {/* Community Guidelines Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-xl border-2 border-purple-200 dark:border-purple-800 mb-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('guidelines.title')}
                    </h2>
                  </div>
                  <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 text-lg mt-0.5 shrink-0">✓</span>
                      <span><strong>{t('guidelines.respect.title')}:</strong> {t('guidelines.compact.respect')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 text-lg mt-0.5 shrink-0">✓</span>
                      <span><strong>{t('guidelines.anonymity.title')}:</strong> {t('guidelines.compact.anonymity')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 text-lg mt-0.5 shrink-0">✓</span>
                      <span><strong>{t('guidelines.profanity.title')}:</strong> {t('guidelines.compact.profanity')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-red-600 text-lg mt-0.5 shrink-0">✗</span>
                      <span><strong>{t('guidelines.respect.title')}:</strong> {t('guidelines.compact.purpose')}</span>
                    </li>
                  </ul>
                </motion.div>

                {/* Next Button - At bottom of page 1 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-auto pb-6"
                >
                  <Button
                    onClick={() => setCurrentGuidelinePage(1)}
                    className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white px-8 py-6 rounded-2xl shadow-2xl text-base font-semibold transition-all hover:scale-105"
                  >
                    {t('tutorial.next')}
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Page 2: Important to Know + CTA */}
            <div className="w-full h-full overflow-y-auto scrollbar-hide px-6 pt-8 pb-8" style={{ width: '50%' }}>
              <div className="max-w-md mx-auto h-full flex flex-col">
                {/* Show last guideline for continuity */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 mb-4 shadow-xl border-2 border-purple-200 dark:border-purple-800 opacity-50">
                  <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-3">
                      <span className="text-red-600 text-lg mt-0.5 shrink-0">✗</span>
                      <span><strong>{t('guidelines.reminder.title')}:</strong> {t('guidelines.reminder.description')}</span>
                    </li>
                  </ul>
                </div>

                {/* Important Notice Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-5 mb-6 shadow-lg border-2 border-amber-300 dark:border-amber-700"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('guidelines.title')}
                    </h2>
                  </div>
                  <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex items-start gap-3">
                      <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <p><strong>{t('listen.filterPopular')}:</strong> {t('guidelines.compact.respect')}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <p><strong>{t('listen.filterAll')}:</strong> {t('guidelines.compact.purpose')}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Main CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-auto pb-6"
                >
                  <Button
                    onClick={() => fetchRandomStory()}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white px-8 py-6 rounded-2xl shadow-2xl text-base font-semibold transition-all hover:scale-105 flex items-center justify-center gap-3"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <Heart className="w-5 h-5" />
                        {t('listen.title')}
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                    {t('guidelines.subtitle')}
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // No stories available
  if (!currentPost) {
    return (
      <div className="h-full overflow-y-auto scrollbar-hide">
        <div className="max-w-3xl mx-auto p-6 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-6"
            >
              👂
            </motion.div>
            <h2 className="text-foreground mb-4">{t('listen.title')}</h2>
            <p className="text-muted-foreground mb-8">
              {t('listen.noStoriesAvailable')}
            </p>
            <Button
              onClick={fetchRandomStory}
              className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white px-8 py-6 rounded-xl shadow-lg"
            >
              <Heart className="w-6 h-6 mr-2" />
              {t('listen.tryAgain')}
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="max-w-3xl mx-auto p-6 pb-8">
        {/* Filter Buttons */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide"
        >
          <button
            onClick={() => changeFilter('controversial')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
              currentFilter === 'controversial'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg scale-105'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span className="font-medium">{t('listen.filter.controversial')}</span>
          </button>
          <button
            onClick={() => changeFilter('trending')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
              currentFilter === 'trending'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg scale-105'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="font-medium">{t('listen.filter.trending')}</span>
          </button>
          <button
            onClick={() => changeFilter('newest')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
              currentFilter === 'newest'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg scale-105'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">{t('listen.filter.newest')}</span>
          </button>
          <button
            onClick={() => changeFilter('random')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
              currentFilter === 'random'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Shuffle className="w-4 h-4" />
            <span className="font-medium">{t('listen.filter.random')}</span>
          </button>
        </motion.div>

        {/* Story Count Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-4"
        >
          <span className="inline-block bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-1.5 rounded-full text-sm">
            {t('listen.seenCount').replace('{seen}', seenPostIds.size.toString()).replace('{total}', posts.length.toString())}
          </span>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentPost?.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="mb-6"
          >
            {/* Post Card */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700">
              {/* Post Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
                    <span className="text-white text-sm">👤</span>
                  </div>
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                      {t('listen.user.anonymous')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(currentPost?.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <p className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed mb-6">
                {currentPost?.content}
              </p>

              {/* Post Stats & Actions */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handlePostUpvote(currentPost.id)}
                  className={`flex items-center gap-2 transition-colors ${
                    currentPost?.upvotedBy?.includes(userId)
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400'
                  }`}
                >
                  <ThumbsUp className={`w-5 h-5 ${currentPost?.upvotedBy?.includes(userId) ? 'fill-current' : ''}`} />
                  <span className="text-sm font-medium">{currentPost?.upvotes || 0}</span>
                </button>
                <button
                  onClick={() => handlePostDownvote(currentPost.id)}
                  className={`flex items-center gap-2 transition-colors ${
                    currentPost?.downvotedBy?.includes(userId)
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                  }`}
                >
                  <ThumbsDown className={`w-5 h-5 ${currentPost?.downvotedBy?.includes(userId) ? 'fill-current' : ''}`} />
                  <span className="text-sm font-medium">{currentPost?.downvotes || 0}</span>
                </button>
                <button
                  onClick={() => setExpandReplies(!expandReplies)}
                  className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors ml-4"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{t('listen.replies.count').replace('{count}', (currentPost?.replies?.length || 0).toString())}</span>
                </button>
              </div>

              {/* Existing Replies */}
              {expandReplies && currentPost?.replies && currentPost.replies.length > 0 && (
                <div className="mb-6 space-y-4">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    {t('listen.replies.communityResponses').replace('{count}', currentPost.replies.length.toString())}
                  </h3>
                  {currentPost.replies.map((r, idx) => (
                    <div key={r.id || idx} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                      {editingReplyId === r.id ? (
                        /* Edit Mode */
                        <div className="space-y-3">
                          <Input
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="bg-white dark:bg-gray-800"
                            maxLength={500}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => saveEditReply(currentPost.id, r.id)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Save className="w-4 h-4 mr-1" />
                              {t('listen.replies.save')}
                            </Button>
                            <Button
                              onClick={cancelEditReply}
                              size="sm"
                              variant="outline"
                            >
                              <X className="w-4 h-4 mr-1" />
                              {t('listen.replies.cancel')}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* View Mode */
                        <>
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">{r.content}</p>
                            {/* Only show edit/delete buttons for user's own replies */}
                            {r.userId === userId && (
                              <div className="flex gap-2 ml-2">
                                <button
                                  onClick={() => startEditReply(r)}
                                  className="text-blue-500 hover:text-blue-600 transition-colors p-1"
                                  title={t('listen.replies.edit')}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteReply(currentPost.id, r.id)}
                                  className="text-red-500 hover:text-red-600 transition-colors p-1"
                                  title={t('listen.replies.delete')}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleReplyUpvote(currentPost.id, r.id)}
                              className={`flex items-center gap-1 text-xs transition-colors ${
                                r.upvotedBy?.includes(userId)
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-gray-600 dark:text-gray-400 hover:text-green-600'
                              }`}
                            >
                              <ThumbsUp className={`w-3 h-3 ${r.upvotedBy?.includes(userId) ? 'fill-current' : ''}`} />
                              {r.upvotes || 0}
                            </button>
                            <button
                              onClick={() => handleReplyDownvote(currentPost.id, r.id)}
                              className={`flex items-center gap-1 text-xs transition-colors ${
                                r.downvotedBy?.includes(userId)
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-gray-600 dark:text-gray-400 hover:text-red-600'
                              }`}
                            >
                              <ThumbsDown className={`w-3 h-3 ${r.downvotedBy?.includes(userId) ? 'fill-current' : ''}`} />
                              {r.downvotes || 0}
                            </button>
                            {/* Admin Delete Button (Always visible) */}
                            {/* 
                            <button
                              onClick={() => deleteReply(currentPost.id, r.id)}
                              className="ml-auto px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-medium transition-colors"
                            >
                              {t('listen.replies.delete')}
                            </button>
                            */}
                            {r.isEdited && (
                              <span className="text-xs text-gray-500 italic">{t('profile.edited')}</span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Input */}
              <div className="space-y-4">
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder={t('listen.replies.placeholder')}
                  className="min-h-[120px] bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 rounded-xl resize-none"
                  maxLength={500}
                />
                <div className="flex gap-3">
                  <Button
                    onClick={sendSupport}
                    disabled={!reply.trim() || isLoading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white py-6 rounded-xl shadow-lg"
                  >
                    <Heart className="w-5 h-5 mr-2" />
                    {t('listen.sendSupportButton')}
                  </Button>
                  <Button
                    onClick={skipToNext}
                    variant="outline"
                    className="px-6 py-6 rounded-xl border-2 border-gray-300 dark:border-gray-600"
                  >
                    <SkipForward className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}