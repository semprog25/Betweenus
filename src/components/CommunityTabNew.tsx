import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Flag, Loader2, Share2, MessageCircle, ChevronDown, ChevronUp, Send, Plus, Search, X, Tag, ArrowUp, ArrowDown, Bookmark, Eye, Edit2, Reply, Award, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from './LanguageContext';
import { getPosts, upvotePost, downvotePost, replyToPost } from '../utils/api';
import { getSession } from '../utils/auth';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// Helper function for relative time
const getRelativeTime = (dateString: string) => {
  const postDate = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return postDate.toLocaleDateString();
};

// Helper function for anonymous names
const generateAnonymousName = (userId: string) => {
  const adjectives = ['Kind', 'Brave', 'Wise', 'Gentle', 'Strong', 'Caring', 'Hopeful', 'Peaceful'];
  const nouns = ['Soul', 'Heart', 'Spirit', 'Friend', 'Voice', 'Listener', 'Helper', 'Guide'];
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const adj = adjectives[hash % adjectives.length];
  const noun = nouns[(hash * 7) % nouns.length];
  const num = (hash % 999) + 1;
  return `${adj} ${noun} ${num}`;
};

export function CommunityTab() {
  const { t, language } = useLanguage();
  const [realPosts, setRealPosts] = useState<any[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [votedPosts, setVotedPosts] = useState<Set<string>>(new Set());
  const [downvotedPosts, setDownvotedPosts] = useState<Set<string>>(new Set());
  const [votedReplies, setVotedReplies] = useState<Set<string>>(new Set());
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [commentSort, setCommentSort] = useState<'newest' | 'oldest' | 'top'>('newest');
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());

  // Load posts
  const loadPosts = async () => {
    setIsLoadingPosts(true);
    try {
      // Try fetching without language filter first to see if posts exist
      const response = await getPosts('all');
      // getPosts returns { success: true, posts: [...] } from the server
      const posts = response?.posts || [];
      console.log('Loaded posts:', posts.length, posts);
      setRealPosts(Array.isArray(posts) ? posts : []);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error('Failed to load posts');
      setRealPosts([]);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [language]);

  // Upvote post
  const handlePostUpvote = async (postId: string) => {
    if (votedPosts.has(postId)) {
      setVotedPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    } else {
      setVotedPosts(prev => new Set(prev).add(postId));
      setDownvotedPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
      
      try {
        await upvotePost(postId);
        await loadPosts();
      } catch (error) {
        console.error('Error upvoting post:', error);
      }
    }
  };

  // Downvote post
  const handlePostDownvote = async (postId: string) => {
    if (downvotedPosts.has(postId)) {
      setDownvotedPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    } else {
      setDownvotedPosts(prev => new Set(prev).add(postId));
      setVotedPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
      
      try {
        await downvotePost(postId);
        await loadPosts();
      } catch (error) {
        console.error('Error downvoting post:', error);
      }
    }
  };

  // Submit comment
  const handleSubmitComment = async (postId: string) => {
    const content = commentInputs[postId];
    if (!content?.trim()) return;

    try {
      const session = getSession();
      const userId = session?.user?.id;
      
      await replyToPost(postId, content, userId);
      toast.success('Comment added!');
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      await loadPosts();
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    }
  };

  // Create new post
  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    
    setIsSubmittingPost(true);
    try {
      const session = getSession();
      const userId = session?.user?.id;
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6c9b0e48/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ 
          content: newPostContent, 
          userId, 
          languages: [language],
          isAnonymous: true 
        })
      });

      if (!response.ok) throw new Error('Failed to create post');
      
      toast.success('Post created successfully!');
      setNewPostContent('');
      setShowNewPostModal(false);
      await loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // Filter and sort posts
  const filteredPosts = realPosts.filter(post => {
    if (searchQuery) {
      return post.content.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl text-purple-600 dark:text-purple-400">Community</h1>
          <button
            onClick={() => setShowNewPostModal(true)}
            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white px-4 py-2 rounded-xl hover:from-purple-700 hover:to-fuchsia-700 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Post</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts..."
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-900/10 rounded-2xl p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-center mb-2">
              <MessageCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
              <div className="text-3xl text-purple-700 dark:text-purple-300">{realPosts.length}</div>
            </div>
            <div className="text-xs text-center text-purple-600 dark:text-purple-400">Total Posts</div>
          </div>
          <div className="bg-gradient-to-br from-fuchsia-100 to-fuchsia-50 dark:from-fuchsia-900/30 dark:to-fuchsia-900/10 rounded-2xl p-4 border border-fuchsia-200 dark:border-fuchsia-800">
            <div className="flex items-center justify-center mb-2">
              <MessageCircle className="w-5 h-5 text-fuchsia-600 dark:text-fuchsia-400 mr-2" />
              <div className="text-3xl text-fuchsia-700 dark:text-fuchsia-300">
                {realPosts.reduce((sum, post) => sum + (post.replies?.length || 0), 0)}
              </div>
            </div>
            <div className="text-xs text-center text-fuchsia-600 dark:text-fuchsia-400">Comments</div>
          </div>
          <div className="bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-900/30 dark:to-pink-900/10 rounded-2xl p-4 border border-pink-200 dark:border-pink-800">
            <div className="flex items-center justify-center mb-2">
              <Heart className="w-5 h-5 text-pink-600 dark:text-pink-400 mr-2" />
              <div className="text-3xl text-pink-700 dark:text-pink-300">
                {realPosts.reduce((sum, post) => sum + (post.upvotes || 0), 0)}
              </div>
            </div>
            <div className="text-xs text-center text-pink-600 dark:text-pink-400">Total Upvotes</div>
          </div>
        </div>

        {/* Posts */}
        {isLoadingPosts ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 rounded-3xl border-2 border-dashed border-purple-300 dark:border-purple-700">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl text-gray-800 dark:text-white mb-2">
              {searchQuery ? 'No posts found' : 'No posts yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {searchQuery 
                ? 'Try a different search term or clear the search to see all posts.'
                : 'Be the first to share your thoughts with the community! Your voice matters here.'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowNewPostModal(true)}
                className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-fuchsia-700 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create First Post
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600 transition-all"
              >
                {/* Post Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center shrink-0">
                      <span className="text-white text-xs sm:text-sm">👤</span>
                    </div>
                    <div>
                      <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                        {generateAnonymousName(post.userId || post.id)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getRelativeTime(post.createdAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSavedPosts(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(post.id)) {
                          newSet.delete(post.id);
                          toast.success('Post unsaved');
                        } else {
                          newSet.add(post.id);
                          toast.success('Post saved');
                        }
                        return newSet;
                      });
                    }}
                    className="text-gray-400 hover:text-purple-500 transition-colors"
                  >
                    <Bookmark className={`w-5 h-5 ${savedPosts.has(post.id) ? 'fill-purple-500 text-purple-500' : ''}`} />
                  </button>
                </div>

                {/* Post Content */}
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed mb-4">
                  {post.content}
                </p>

                {/* Post Actions */}
                <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
                  {/* Upvote/Downvote */}
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-full px-2 sm:px-3 py-1.5">
                    <motion.button
                      onClick={() => handlePostUpvote(post.id)}
                      whileTap={{ scale: 1.3 }}
                      className={`p-1 transition-colors rounded-full ${
                        votedPosts.has(post.id) ? 'text-purple-600 bg-purple-100 dark:bg-purple-900' : 'text-gray-400 hover:text-purple-600'
                      }`}
                    >
                      <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>
                    <span className={`text-sm min-w-[24px] text-center ${
                      votedPosts.has(post.id) 
                        ? 'text-purple-600 dark:text-purple-400 font-bold' 
                        : downvotedPosts.has(post.id)
                        ? 'text-red-600 dark:text-red-400 font-bold'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {(post.upvotes || 0) - (post.downvotes || 0) + (votedPosts.has(post.id) ? 1 : 0) - (downvotedPosts.has(post.id) ? 1 : 0)}
                    </span>
                    <motion.button
                      onClick={() => handlePostDownvote(post.id)}
                      whileTap={{ scale: 1.3 }}
                      className={`p-1 transition-colors rounded-full ${
                        downvotedPosts.has(post.id) ? 'text-red-600 bg-red-100 dark:bg-red-900/30' : 'text-gray-400 hover:text-red-600'
                      }`}
                    >
                      <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>
                  </div>

                  {/* View Comments Button */}
                  <button
                    onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                    className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm">{post.replies?.length || 0}</span>
                    <span className="hidden sm:inline text-sm">Comments</span>
                  </button>

                  <button className="text-gray-400 hover:text-red-500 transition-colors">
                    <Flag className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                {/* Inline Comments Section */}
                <AnimatePresence>
                  {expandedPostId === post.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4"
                    >
                      {/* Comment Sort */}
                      {post.replies && post.replies.length > 1 && (
                        <div className="flex items-center gap-2 mb-4">
                          <button
                            onClick={() => setCommentSort('top')}
                            className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                              commentSort === 'top'
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            🔥 Top
                          </button>
                          <button
                            onClick={() => setCommentSort('newest')}
                            className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                              commentSort === 'newest'
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            ⏰ Newest
                          </button>
                          <button
                            onClick={() => setCommentSort('oldest')}
                            className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                              commentSort === 'oldest'
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            📜 Oldest
                          </button>
                        </div>
                      )}

                      {/* Comments List */}
                      {post.replies && post.replies.length > 0 ? (
                        <div className="space-y-3">
                          {[...post.replies]
                            .sort((a: any, b: any) => {
                              if (commentSort === 'top') return (b.upvotes || 0) - (a.upvotes || 0);
                              if (commentSort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                              if (commentSort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                              return 0;
                            })
                            .map((reply: any, idx: number) => {
                              const voteKey = `${post.id}-${idx}`;
                              const maxUpvotes = Math.max(...post.replies.map((r: any) => r.upvotes || 0));
                              const isTopComment = (reply.upvotes || 0) === maxUpvotes && maxUpvotes >= 3;

                              return (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className={`rounded-xl p-3 sm:p-4 border ${
                                    isTopComment
                                      ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 border-yellow-400 dark:border-yellow-500/50'
                                      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50'
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center shrink-0">
                                      <span className="text-white text-xs font-semibold">
                                        {String.fromCharCode(65 + (idx % 26))}
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                                          {generateAnonymousName(reply.userId || `reply-${idx}`)}
                                        </p>
                                        {isTopComment && (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full text-xs font-semibold">
                                            <Award className="w-3 h-3" />
                                            Top
                                          </span>
                                        )}
                                        <span className="text-xs text-gray-500">
                                          {reply.upvotes || 0} pts
                                        </span>
                                      </div>
                                      <p className="text-gray-800 dark:text-white/90 text-sm leading-relaxed mb-2">
                                        {reply.content}
                                      </p>
                                      <div className="flex items-center gap-3">
                                        <motion.button
                                          onClick={() => {
                                            setVotedReplies((prev) => {
                                              const newSet = new Set(prev);
                                              if (newSet.has(voteKey)) {
                                                newSet.delete(voteKey);
                                              } else {
                                                newSet.add(voteKey);
                                              }
                                              return newSet;
                                            });
                                          }}
                                          whileTap={{ scale: 1.2 }}
                                          className={`flex items-center gap-1 text-xs ${
                                            votedReplies.has(voteKey) 
                                              ? 'text-purple-600 dark:text-purple-400' 
                                              : 'text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'
                                          } transition-colors`}
                                        >
                                          <ArrowUp className="w-3.5 h-3.5" />
                                          Upvote
                                        </motion.button>
                                        <button
                                          onClick={() => {
                                            setReplyingToCommentId(voteKey);
                                            setReplyContent('');
                                          }}
                                          className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                        >
                                          <Reply className="w-3.5 h-3.5" />
                                          Reply
                                        </button>
                                        <button className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                                          <Trash2 className="w-3.5 h-3.5" />
                                          Delete
                                        </button>
                                      </div>

                                      {/* Inline Reply Input */}
                                      <AnimatePresence>
                                        {replyingToCommentId === voteKey && (
                                          <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-3 pl-4 border-l-2 border-purple-500/30"
                                          >
                                            <div className="flex gap-2">
                                              <input
                                                type="text"
                                                value={replyContent}
                                                onChange={(e) => setReplyContent(e.target.value)}
                                                placeholder="Write your reply..."
                                                className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                                                autoFocus
                                              />
                                              <button
                                                onClick={() => {
                                                  if (replyContent.trim()) {
                                                    toast.success('Reply posted!');
                                                    setReplyingToCommentId(null);
                                                    setReplyContent('');
                                                  }
                                                }}
                                                disabled={!replyContent.trim()}
                                                className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                                              >
                                                <Send className="w-4 h-4" />
                                              </button>
                                              <button
                                                onClick={() => {
                                                  setReplyingToCommentId(null);
                                                  setReplyContent('');
                                                }}
                                                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2"
                                              >
                                                <X className="w-4 h-4" />
                                              </button>
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                          <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p>No comments yet. Be the first!</p>
                        </div>
                      )}

                      {/* Add Comment Input */}
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-500 flex items-center justify-center shrink-0">
                            <span className="text-white text-xs">You</span>
                          </div>
                          <div className="flex-1 flex gap-2">
                            <input
                              type="text"
                              value={commentInputs[post.id] || ''}
                              onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSubmitComment(post.id);
                                }
                              }}
                              placeholder="Add a comment..."
                              className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                            />
                            <button
                              onClick={() => handleSubmitComment(post.id)}
                              disabled={!commentInputs[post.id]?.trim()}
                              className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:from-purple-700 hover:to-fuchsia-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              <Send className="w-4 h-4" />
                              <span className="hidden sm:inline text-sm">Send</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* New Post Modal */}
      <AnimatePresence>
        {showNewPostModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNewPostModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white p-6">
                <h3 className="text-2xl">Create New Post</h3>
                <p className="text-purple-100 text-sm mt-1">Share your thoughts with the community</p>
              </div>
              <div className="p-6">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full h-40 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none"
                  autoFocus
                />
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowNewPostModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim() || isSubmittingPost}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-xl hover:from-purple-700 hover:to-fuchsia-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmittingPost ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      'Post'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}