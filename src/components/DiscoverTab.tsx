import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Flame,
  TrendingUp,
  Sparkles,
  Shuffle,
  Loader2,
  User,
  Edit2,
  Trash2,
  Save,
  X,
  Compass,
  RefreshCw,
} from 'lucide-react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Input } from './ui/input'
import { toast } from 'sonner@2.0.3'
import { useLanguage } from './LanguageContext'
import { callServer } from '../utils/supabase/client'
import { getActorId } from '../utils/actor-id'

interface Reply {
  id: string
  content: string
  userId?: string | null
  isAnonymous: boolean
  upvotes: number
  downvotes: number
  upvotedBy?: string[]
  downvotedBy?: string[]
  createdAt: string
  isEdited?: boolean
}

interface Post {
  id: string
  content: string
  mood?: string
  isAnonymous: boolean
  languages: string[]
  userId?: string | null
  upvotes: number
  downvotes: number
  upvotedBy?: string[]
  downvotedBy?: string[]
  replies: Reply[]
  createdAt: string
  imageUrl?: string
  imageAspect?: 'square' | 'wide' | 'portrait'
  categories?: string[]
}

interface DiscoverTabProps {
  selectedLanguages: string[]
}

type DiscoverFilter = 'trending' | 'newest' | 'controversial' | 'random'

const MAX_POSTS = 25

export function DiscoverTab({ selectedLanguages }: DiscoverTabProps) {
  const { t } = useLanguage()
  const [posts, setPosts] = useState<Post[]>([])
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [currentFilter, setCurrentFilter] = useState<DiscoverFilter>('trending')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingReply, setIsSubmittingReply] = useState<string | null>(null)
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    setUserId(getActorId() || '')
  }, [])

  const fetchDiscoverPosts = useCallback(async (filter: DiscoverFilter = currentFilter) => {
    setIsLoading(true)
    try {
      const languagesParam = selectedLanguages.length > 0 ? selectedLanguages.join(',') : 'en'
      const result = await callServer(
        `/posts?language=${encodeURIComponent(languagesParam)}&sort=${filter}&limit=${MAX_POSTS}`,
        { method: 'GET' },
      )

      if (result.success) {
        const loaded = (result.posts || []) as Post[]
        setPosts(loaded)
        if (loaded.length === 0) {
          setExpandedPostId(null)
        }
      } else {
        toast.error(t('discover.loadError'))
      }
    } catch {
      toast.error(t('discover.loadError'))
    } finally {
      setIsLoading(false)
    }
  }, [currentFilter, selectedLanguages, t])

  useEffect(() => {
    fetchDiscoverPosts(currentFilter)
  }, [fetchDiscoverPosts, currentFilter])

  const handleFilterChange = (filter: DiscoverFilter) => {
    setCurrentFilter(filter)
    setExpandedPostId(null)
  }

  const updatePostInState = (postId: string, updater: (post: Post) => Post) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? updater(p) : p)))
  }

  const handlePostVote = async (postId: string, direction: 'up' | 'down') => {
    const actor = getActorId()
    if (!actor) {
      toast.error(t('discover.voteError'))
      return
    }

    const post = posts.find((p) => p.id === postId)
    if (!post) return

    const isUp = direction === 'up'
    const isUpvoted = post.upvotedBy?.includes(actor)
    const isDownvoted = post.downvotedBy?.includes(actor)

    updatePostInState(postId, (p) => {
      let upvotedBy = [...(p.upvotedBy || [])]
      let downvotedBy = [...(p.downvotedBy || [])]
      let upvotes = p.upvotes || 0
      let downvotes = p.downvotes || 0

      if (isUp) {
        if (isUpvoted) {
          upvotedBy = upvotedBy.filter((id) => id !== actor)
          upvotes = Math.max(0, upvotes - 1)
        } else {
          upvotedBy.push(actor)
          upvotes += 1
          if (isDownvoted) {
            downvotedBy = downvotedBy.filter((id) => id !== actor)
            downvotes = Math.max(0, downvotes - 1)
          }
        }
      } else if (isDownvoted) {
        downvotedBy = downvotedBy.filter((id) => id !== actor)
        downvotes = Math.max(0, downvotes - 1)
      } else {
        downvotedBy.push(actor)
        downvotes += 1
        if (isUpvoted) {
          upvotedBy = upvotedBy.filter((id) => id !== actor)
          upvotes = Math.max(0, upvotes - 1)
        }
      }

      return { ...p, upvotes, downvotes, upvotedBy, downvotedBy }
    })

    const endpoint = direction === 'up' ? 'upvote' : 'downvote'
    const result = await callServer(`/posts/${postId}/${endpoint}`, {
      method: 'POST',
      body: JSON.stringify({ userId: actor }),
    })

    if (!result.success) {
      fetchDiscoverPosts(currentFilter)
      toast.error(t('discover.voteError'))
    }
  }

  const handleReplyVote = async (postId: string, replyId: string, direction: 'up' | 'down') => {
    const actor = getActorId()
    if (!actor) return

    const post = posts.find((p) => p.id === postId)
    const reply = post?.replies?.find((r) => r.id === replyId)
    if (!reply) return

    updatePostInState(postId, (p) => ({
      ...p,
      replies: p.replies.map((r) => {
        if (r.id !== replyId) return r
        const isUpvoted = r.upvotedBy?.includes(actor)
        const isDownvoted = r.downvotedBy?.includes(actor)
        if (direction === 'up') {
          if (isUpvoted) {
            return {
              ...r,
              upvotes: Math.max(0, (r.upvotes || 0) - 1),
              upvotedBy: r.upvotedBy?.filter((id) => id !== actor) || [],
            }
          }
          return {
            ...r,
            upvotes: (r.upvotes || 0) + 1,
            upvotedBy: [...(r.upvotedBy || []), actor],
            downvotes: isDownvoted ? Math.max(0, (r.downvotes || 0) - 1) : r.downvotes,
            downvotedBy: isDownvoted ? r.downvotedBy?.filter((id) => id !== actor) || [] : r.downvotedBy,
          }
        }
        if (isDownvoted) {
          return {
            ...r,
            downvotes: Math.max(0, (r.downvotes || 0) - 1),
            downvotedBy: r.downvotedBy?.filter((id) => id !== actor) || [],
          }
        }
        return {
          ...r,
          downvotes: (r.downvotes || 0) + 1,
          downvotedBy: [...(r.downvotedBy || []), actor],
          upvotes: isUpvoted ? Math.max(0, (r.upvotes || 0) - 1) : r.upvotes,
          upvotedBy: isUpvoted ? r.upvotedBy?.filter((id) => id !== actor) || [] : r.upvotedBy,
        }
      }),
    }))

    const endpoint = direction === 'up' ? 'upvote' : 'downvote'
    await callServer(`/posts/${postId}/reply/${replyId}/${endpoint}`, {
      method: 'POST',
      body: JSON.stringify({ userId: actor }),
    })
  }

  const handleSubmitComment = async (postId: string) => {
    const content = replyDrafts[postId]?.trim()
    if (!content) return

    const actor = getActorId()
    if (!actor) {
      toast.error(t('discover.commentError'))
      return
    }

    setIsSubmittingReply(postId)
    try {
      const result = await callServer(`/posts/${postId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ content, userId: actor }),
      })

      if (result.success && result.reply) {
        updatePostInState(postId, (p) => ({
          ...p,
          replies: [...(p.replies || []), result.reply],
        }))
        setReplyDrafts((prev) => ({ ...prev, [postId]: '' }))
        toast.success(t('discover.commentPosted'))
      } else {
        toast.error(t('discover.commentError'))
      }
    } catch {
      toast.error(t('discover.commentError'))
    } finally {
      setIsSubmittingReply(null)
    }
  }

  const handleDeleteReply = async (postId: string, replyId: string) => {
    const result = await callServer(`/posts/${postId}/reply/${replyId}`, { method: 'DELETE' })
    if (result.success) {
      updatePostInState(postId, (p) => ({
        ...p,
        replies: p.replies.filter((r) => r.id !== replyId),
      }))
      toast.success(t('discover.commentDeleted'))
    } else {
      toast.error(t('discover.commentDeleteError'))
    }
  }

  const handleSaveEditReply = async (postId: string, replyId: string) => {
    if (!editContent.trim()) return
    const result = await callServer(`/posts/${postId}/reply/${replyId}`, {
      method: 'PUT',
      body: JSON.stringify({ content: editContent.trim() }),
    })
    if (result.success) {
      updatePostInState(postId, (p) => ({
        ...p,
        replies: p.replies.map((r) =>
          r.id === replyId ? { ...r, content: editContent.trim(), isEdited: true } : r,
        ),
      }))
      setEditingReplyId(null)
      setEditContent('')
      toast.success(t('discover.commentUpdated'))
    } else {
      toast.error(result.error || t('discover.commentUpdateError'))
    }
  }

  const filters: { id: DiscoverFilter; icon: typeof Flame; label: string }[] = [
    { id: 'trending', icon: TrendingUp, label: t('discover.filter.trending') },
    { id: 'newest', icon: Sparkles, label: t('discover.filter.newest') },
    { id: 'controversial', icon: Flame, label: t('discover.filter.hot') },
    { id: 'random', icon: Shuffle, label: t('discover.filter.random') },
  ]

  return (
    <div className="h-full overflow-y-auto scrollbar-hide pb-24">
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-purple-600 dark:text-purple-400" strokeWidth={2} />
            <div>
              <h1 className="text-lg font-bold text-foreground">{t('discover.title')}</h1>
              <p className="text-xs text-muted-foreground">{t('discover.subtitle')}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchDiscoverPosts(currentFilter)}
            disabled={isLoading}
            aria-label={t('discover.refresh')}
            className="shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {filters.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleFilterChange(id)}
              className={`px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap text-sm font-medium transition-all min-h-[44px] ${
                currentFilter === id
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>

        {isLoading && posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <p className="text-sm text-muted-foreground">{t('discover.loading')}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Compass className="w-12 h-12 text-purple-400 mx-auto mb-4" strokeWidth={1.5} />
            <p className="text-foreground font-medium mb-2">{t('discover.empty')}</p>
            <p className="text-sm text-muted-foreground mb-6">{t('discover.emptyHint')}</p>
            <Button onClick={() => fetchDiscoverPosts(currentFilter)}>{t('discover.tryAgain')}</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, index) => {
              const isExpanded = expandedPostId === post.id
              const score = (post.upvotes || 0) - (post.downvotes || 0)

              return (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.03, 0.3) }}
                  className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
                        <button
                          type="button"
                          onClick={() => handlePostVote(post.id, 'up')}
                          aria-label={t('discover.upvote')}
                          className={`p-1.5 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
                            post.upvotedBy?.includes(userId)
                              ? 'text-green-600 bg-green-50 dark:bg-green-950/30'
                              : 'text-muted-foreground hover:text-green-600 hover:bg-muted'
                          }`}
                        >
                          <ThumbsUp className={`w-5 h-5 ${post.upvotedBy?.includes(userId) ? 'fill-current' : ''}`} />
                        </button>
                        <span className="text-sm font-semibold tabular-nums text-foreground">{score}</span>
                        <button
                          type="button"
                          onClick={() => handlePostVote(post.id, 'down')}
                          aria-label={t('discover.downvote')}
                          className={`p-1.5 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
                            post.downvotedBy?.includes(userId)
                              ? 'text-red-600 bg-red-50 dark:bg-red-950/30'
                              : 'text-muted-foreground hover:text-red-600 hover:bg-muted'
                          }`}
                        >
                          <ThumbsDown className={`w-5 h-5 ${post.downvotedBy?.includes(userId) ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                          <User className="w-3.5 h-3.5" />
                          <span>{t('discover.anonymous')}</span>
                          <span aria-hidden="true">·</span>
                          <time dateTime={post.createdAt}>
                            {new Date(post.createdAt).toLocaleDateString()}
                          </time>
                          {(post.replies?.length || 0) > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{post.replies.length} {t('discover.comments')}</span>
                            </>
                          )}
                        </div>

                        <p className="text-foreground leading-relaxed whitespace-pre-wrap break-words">
                          {post.content}
                        </p>

                        {post.imageUrl && (
                          <div className="mt-3 rounded-xl overflow-hidden bg-muted">
                            <img src={post.imageUrl} alt="" className="w-full max-h-80 object-cover" />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                          className="mt-3 flex items-center gap-1.5 text-sm text-purple-600 dark:text-purple-400 font-medium min-h-[44px]"
                        >
                          <MessageCircle className="w-4 h-4" />
                          {isExpanded ? t('discover.hideComments') : t('discover.viewComments')}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-border space-y-3">
                        {(post.replies || []).map((reply) => (
                          <div key={reply.id} className="bg-muted/50 rounded-xl p-3">
                            {editingReplyId === reply.id ? (
                              <div className="space-y-2">
                                <Input
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  maxLength={500}
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleSaveEditReply(post.id, reply.id)}>
                                    <Save className="w-4 h-4 mr-1" />
                                    {t('discover.save')}
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingReplyId(null)}>
                                    <X className="w-4 h-4 mr-1" />
                                    {t('discover.cancel')}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm text-foreground break-words">{reply.content}</p>
                                <div className="flex items-center gap-3 mt-2">
                                  <button
                                    type="button"
                                    onClick={() => handleReplyVote(post.id, reply.id, 'up')}
                                    className={`flex items-center gap-1 text-xs min-h-[36px] px-2 ${
                                      reply.upvotedBy?.includes(userId) ? 'text-green-600' : 'text-muted-foreground'
                                    }`}
                                  >
                                    <ThumbsUp className="w-3 h-3" />
                                    {reply.upvotes || 0}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleReplyVote(post.id, reply.id, 'down')}
                                    className={`flex items-center gap-1 text-xs min-h-[36px] px-2 ${
                                      reply.downvotedBy?.includes(userId) ? 'text-red-600' : 'text-muted-foreground'
                                    }`}
                                  >
                                    <ThumbsDown className="w-3 h-3" />
                                    {reply.downvotes || 0}
                                  </button>
                                  {reply.userId === userId && (
                                    <div className="ml-auto flex gap-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingReplyId(reply.id)
                                          setEditContent(reply.content)
                                        }}
                                        className="p-2 text-blue-500"
                                        aria-label={t('discover.edit')}
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteReply(post.id, reply.id)}
                                        className="p-2 text-red-500"
                                        aria-label={t('discover.delete')}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        ))}

                        <Textarea
                          value={replyDrafts[post.id] || ''}
                          onChange={(e) =>
                            setReplyDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          placeholder={t('discover.commentPlaceholder')}
                          className="min-h-[88px] resize-none"
                          maxLength={500}
                        />
                        <Button
                          onClick={() => handleSubmitComment(post.id)}
                          disabled={!replyDrafts[post.id]?.trim() || isSubmittingReply === post.id}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          {isSubmittingReply === post.id ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <MessageCircle className="w-4 h-4 mr-2" />
                          )}
                          {t('discover.postComment')}
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
