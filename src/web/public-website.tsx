import { useCallback, useEffect, useState } from 'react'
import {
  Compass,
  EyeOff,
  Heart,
  HeartHandshake,
  Loader2,
  MessageCircle,
  Shield,
  Sparkles,
  Star,
  ThumbsUp,
  Users,
} from 'lucide-react'
import logoImage from '../assets/betweenus-logo.png'
import { callServer } from '../utils/supabase/client'
import { setPendingAuthAction } from '../utils/auth'
import { AuthModal } from './auth-modal'
import { navigatePublic, parsePublicPath, type PublicPath } from './public-path'
import './web.css'

interface PublicPost {
  id: string
  content: string
  isAnonymous?: boolean
  upvotes?: number
  downvotes?: number
  replies?: unknown[]
  createdAt?: string
  categories?: string[]
  imageUrl?: string
}

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.betweenus.app'
const HAS_APP_STORE_LISTING = false

function formatTimeAgo(iso?: string): string {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 60) return `${Math.max(1, mins)}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function truncate(text: string, max = 160): string {
  const clean = text.trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max).trim()}…`
}

function netVotes(post: PublicPost): number {
  return (post.upvotes || 0) - (post.downvotes || 0)
}

interface PublicWebsiteProps {
  onRequireAuth: (mode: 'login' | 'signup') => void
}

export function PublicWebsite({ onRequireAuth }: PublicWebsiteProps) {
  const [path, setPath] = useState<PublicPath>(() => parsePublicPath())
  const [heroPosts, setHeroPosts] = useState<PublicPost[]>([])
  const [isLoadingHero, setIsLoadingHero] = useState(true)
  const [feedPosts, setFeedPosts] = useState<PublicPost[]>([])
  const [feedSort, setFeedSort] = useState<'trending' | 'newest' | 'controversial'>('trending')
  const [isLoadingFeed, setIsLoadingFeed] = useState(true)
  const [feedError, setFeedError] = useState(false)
  const [story, setStory] = useState<PublicPost | null>(null)
  const [storyError, setStoryError] = useState('')
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    const sync = () => setPath(parsePublicPath())
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const previous = root.className
    root.classList.remove('light')
    root.classList.add('dark')
    return () => {
      root.className = previous
    }
  }, [])

  useEffect(() => {
    document.title = path.name === 'story'
      ? 'Story | Between Us'
      : path.name === 'download'
        ? 'Download | Between Us'
        : 'Between Us — Say what you can\'t say anywhere else'
  }, [path])

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setAuthOpen(true)
    onRequireAuth(mode)
  }

  const gateAction = (type: 'me_too' | 'reply' | 'spill' | 'generic' = 'generic') => {
    setPendingAuthAction({ type })
    openAuth('signup')
  }

  const loadHero = useCallback(async () => {
    setIsLoadingHero(true)
    try {
      const result = await callServer('/posts?sort=trending&limit=3', { method: 'GET' })
      if (result?.success && Array.isArray(result.posts)) setHeroPosts(result.posts)
      else setHeroPosts([])
    } catch {
      setHeroPosts([])
    } finally {
      setIsLoadingHero(false)
    }
  }, [])

  const loadFeed = useCallback(async (sort: typeof feedSort) => {
    setIsLoadingFeed(true)
    setFeedError(false)
    try {
      const result = await callServer(`/posts?sort=${sort}&limit=12`, { method: 'GET' })
      if (result?.success && Array.isArray(result.posts)) {
        setFeedPosts(result.posts)
      } else {
        setFeedPosts([])
        setFeedError(true)
      }
    } catch {
      setFeedPosts([])
      setFeedError(true)
    } finally {
      setIsLoadingFeed(false)
    }
  }, [])

  const loadStory = useCallback(async (id: string) => {
    setStory(null)
    setStoryError('')
    try {
      const result = await callServer(`/posts/${encodeURIComponent(id)}`, { method: 'GET' })
      if (result?.success && result.post) setStory(result.post)
      else setStoryError('Story not found.')
    } catch {
      setStoryError('Could not load this story.')
    }
  }, [])

  useEffect(() => {
    void loadHero()
  }, [loadHero])

  useEffect(() => {
    if (path.name === 'home' || path.name === 'stories') void loadFeed(feedSort)
  }, [path.name, feedSort, loadFeed])

  useEffect(() => {
    if (path.name === 'story') void loadStory(path.id)
  }, [path, loadStory])

  const go = (next: PublicPath) => {
    setMobileNavOpen(false)
    navigatePublic(next)
    setPath(next)
  }

  return (
    <div className="bu-public-root">
      <div className="bu-public-atmosphere" aria-hidden="true">
        <div className="bu-public-atmosphere-radials" />
        <div className="bu-public-atmosphere-glow bu-public-atmosphere-glow--purple" />
        <div className="bu-public-atmosphere-glow bu-public-atmosphere-glow--violet" />
        <div className="bu-public-atmosphere-glow bu-public-atmosphere-glow--orange" />
        <div className="bu-public-atmosphere-glow bu-public-atmosphere-glow--pink" />
        <div className="bu-public-atmosphere-stars" />
        <div className="bu-public-atmosphere-dots" />
      </div>

      <header className="bu-public-header">
        <div className="bu-public-shell bu-public-header-inner">
          <button type="button" onClick={() => go({ name: 'home' })} className="bu-public-logo-btn" aria-label="Between Us home">
            <img src={logoImage} alt="Between Us" className="bu-public-logo-img" />
          </button>

          <nav className="bu-public-nav-desktop" aria-label="Primary">
            <button type="button" onClick={() => go({ name: 'stories' })}>Stories</button>
            <button type="button" onClick={() => go({ name: 'about' })}>About</button>
            <button type="button" onClick={() => go({ name: 'privacy' })}>Privacy</button>
            <button type="button" onClick={() => go({ name: 'support' })}>Support</button>
          </nav>

          <div className="bu-public-header-actions">
            <button type="button" onClick={() => openAuth('login')} className="bu-public-login-btn">
              Log in
            </button>
            <button type="button" onClick={() => openAuth('signup')} className="bu-public-signup-btn">
              Sign up
            </button>
            <button
              type="button"
              className="bu-public-nav-toggle"
              aria-label="Open menu"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((open) => !open)}
            >
              ☰
            </button>
          </div>
        </div>
        {mobileNavOpen && (
          <div className="bu-public-mobile-menu">
            <button type="button" onClick={() => go({ name: 'stories' })}>Stories</button>
            <button type="button" onClick={() => go({ name: 'about' })}>About</button>
            <button type="button" onClick={() => go({ name: 'privacy' })}>Privacy</button>
            <button type="button" onClick={() => go({ name: 'support' })}>Support</button>
            <button type="button" onClick={() => openAuth('login')}>Log in</button>
          </div>
        )}
      </header>

      <main className="bu-public-shell bu-public-main">
        {path.name === 'home' && (
          <>
            <section className="bu-hero" aria-label="Between Us hero">
              <HeroDecorations />

              <div className="bu-hero-copy">
                <span className="bu-hero-eyebrow">Anonymous stories. Real people.</span>
                <h1 className="bu-hero-title">
                  Say what you can&apos;t<br />
                  <span className="bu-hero-title-accent">say anywhere else.</span>
                </h1>
                <p className="bu-hero-subtitle">
                  Read real stories from people who get it.
                  Share anonymously. Connect deeply.
                </p>
                <div className="bu-hero-cta-row">
                  <button type="button" className="bu-btn-primary" onClick={() => go({ name: 'stories' })}>
                    Explore Stories
                  </button>
                  <button type="button" className="bu-btn-secondary" onClick={() => go({ name: 'download' })}>
                    Download the App
                  </button>
                </div>
              </div>

              <div className="bu-hero-cards-wrap">
                <div className="bu-hero-cards" aria-label="Story previews">
                  {isLoadingHero ? (
                    <div className="bu-hero-cards-empty">
                      <Loader2 className="h-6 w-6 animate-spin text-fuchsia-400" aria-label="Loading story previews" />
                    </div>
                  ) : heroPosts.length === 0 ? (
                    <div className="bu-hero-cards-empty">
                      Public story previews appear here when stories are available.
                    </div>
                  ) : (
                    heroPosts.slice(0, 3).map((post, index) => (
                      <HeroStoryCard
                        key={post.id}
                        post={post}
                        floatIndex={index + 1}
                        onRead={() => go({ name: 'story', id: post.id })}
                      />
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className="bu-trust-strip" aria-label="Why Between Us">
              {[
                { icon: EyeOff, label: 'Anonymous' },
                { icon: HeartHandshake, label: 'No Judgment' },
                { icon: Users, label: 'Real Conversations' },
                { icon: Shield, label: 'Private & Safe' },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="bu-trust-item">
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </span>
              ))}
            </section>

            <StoriesSection
              feedSort={feedSort}
              setFeedSort={setFeedSort}
              isLoadingFeed={isLoadingFeed}
              feedError={feedError}
              feedPosts={feedPosts}
              onOpenStory={(id) => go({ name: 'story', id })}
              onGate={() => gateAction('generic')}
              onRetry={() => void loadFeed(feedSort)}
              onJoin={() => openAuth('signup')}
            />
          </>
        )}

        {path.name === 'stories' && (
          <StoriesSection
            feedSort={feedSort}
            setFeedSort={setFeedSort}
            isLoadingFeed={isLoadingFeed}
            feedError={feedError}
            feedPosts={feedPosts}
            onOpenStory={(id) => go({ name: 'story', id })}
            onGate={() => gateAction('generic')}
            onRetry={() => void loadFeed(feedSort)}
            onJoin={() => openAuth('signup')}
            title="Stories"
          />
        )}

        {path.name === 'story' && (
          <StoryDetail
            story={story}
            error={storyError}
            onBack={() => go({ name: 'stories' })}
            onGateVote={() => gateAction('me_too')}
            onGateComment={() => gateAction('reply')}
          />
        )}

        {path.name === 'download' && <DownloadPage />}
        {path.name === 'about' && (
          <LegalLike title="About Between Us" body="Between Us is an anonymous text-and-image community. Write what you can't say elsewhere, discover stories from people who get it, and connect without performing for an audience." />
        )}
        {path.name === 'privacy' && (
          <LegalLike title="Privacy" body="We design Between Us so your public posts stay anonymous to other users. Account email is used for authentication only. Private check-ins and personal journal entries are never shown on the public website. Contact privacy@betweenus.semprog.de with questions." />
        )}
        {path.name === 'terms' && (
          <LegalLike title="Terms" body="By using Between Us you agree to be respectful, avoid doxxing and hate, and not use the service as a substitute for professional care. Contact legal@betweenus.semprog.de for legal inquiries." />
        )}
        {path.name === 'support' && (
          <LegalLike title="Support" body="Need help? Email support@betweenus.fun. For privacy concerns: privacy@betweenus.semprog.de." />
        )}
      </main>

      <footer className="bu-public-footer">
        <div className="bu-public-shell bu-public-footer-inner">
          <img src={logoImage} alt="Between Us" className="bu-public-logo-img" />
          <div className="bu-public-footer-links">
            <button type="button" onClick={() => go({ name: 'stories' })}>Stories</button>
            <button type="button" onClick={() => go({ name: 'download' })}>Download</button>
            <button type="button" onClick={() => go({ name: 'privacy' })}>Privacy</button>
            <button type="button" onClick={() => go({ name: 'terms' })}>Terms</button>
            <button type="button" onClick={() => go({ name: 'support' })}>Support</button>
          </div>
          <p className="bu-public-footer-copy">© {new Date().getFullYear()} Between Us</p>
        </div>
      </footer>

      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onModeChange={setAuthMode}
      />
    </div>
  )
}

function HeroDecorations() {
  return (
    <div className="bu-hero-decor" aria-hidden="true">
      <span className="bu-hero-decor-item bu-hero-decor-item--heart bu-hero-decor-item--1">
        <Heart size={14} strokeWidth={1.75} />
      </span>
      <span className="bu-hero-decor-item bu-hero-decor-item--sparkle bu-hero-decor-item--2">
        <Sparkles size={12} strokeWidth={1.75} />
      </span>
      <span className="bu-hero-decor-item bu-hero-decor-item--star bu-hero-decor-item--3">
        <Star size={10} strokeWidth={1.75} />
      </span>
      <span className="bu-hero-decor-item bu-hero-decor-item--dot bu-hero-decor-item--4" />
      <span className="bu-hero-decor-item bu-hero-decor-item--dot bu-hero-decor-item--5" />
      <span className="bu-hero-decor-item bu-hero-decor-item--squiggle bu-hero-decor-item--6">
        <svg viewBox="0 0 48 16" fill="none" aria-hidden="true">
          <path d="M2 10 C10 2, 18 14, 26 6 S42 12, 46 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
      <span className="bu-hero-decor-item bu-hero-decor-item--heart bu-hero-decor-item--7 bu-hero-decor-item--desktop">
        <Heart size={11} strokeWidth={1.75} />
      </span>
      <span className="bu-hero-decor-item bu-hero-decor-item--sparkle bu-hero-decor-item--8 bu-hero-decor-item--desktop">
        <Sparkles size={14} strokeWidth={1.75} />
      </span>
      <span className="bu-hero-decor-item bu-hero-decor-item--star bu-hero-decor-item--9 bu-hero-decor-item--desktop">
        <Star size={12} strokeWidth={1.75} />
      </span>
      <span className="bu-hero-decor-item bu-hero-decor-item--curve bu-hero-decor-item--10 bu-hero-decor-item--desktop">
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M4 24 C12 8, 24 8, 28 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
      <span className="bu-hero-decor-item bu-hero-decor-item--squiggle bu-hero-decor-item--11 bu-hero-decor-item--desktop">
        <svg viewBox="0 0 40 20" fill="none" aria-hidden="true">
          <path d="M2 14 Q12 4, 22 12 T38 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
      <span className="bu-hero-decor-item bu-hero-decor-item--dot bu-hero-decor-item--12 bu-hero-decor-item--desktop" />
      <span className="bu-hero-decor-item bu-hero-decor-item--dot bu-hero-decor-item--13 bu-hero-decor-item--desktop bu-hero-decor-item--accent-orange" />
      <span className="bu-hero-decor-item bu-hero-decor-item--star bu-hero-decor-item--14 bu-hero-decor-item--wide">
        <Star size={9} strokeWidth={1.75} />
      </span>
    </div>
  )
}

function HeroStoryCard({
  post,
  floatIndex,
  onRead,
}: {
  post: PublicPost
  floatIndex: number
  onRead: () => void
}) {
  return (
    <article className={`bu-hero-card bu-hero-card--float-${floatIndex}`}>
      <div className="bu-story-card-meta">
        <span>Anonymous</span>
        <span>{formatTimeAgo(post.createdAt)}</span>
      </div>
      <p className="bu-story-card-body">{truncate(post.content, 120)}</p>
      <div className="bu-story-card-stats">
        <span className="bu-story-card-stat">
          <ThumbsUp size={14} aria-hidden="true" />
          {netVotes(post)}
        </span>
        <span className="bu-story-card-stat">
          <MessageCircle size={14} aria-hidden="true" />
          {post.replies?.length || 0}
        </span>
        {post.categories?.[0] && (
          <span className="bu-story-card-category">{post.categories[0]}</span>
        )}
      </div>
      <div className="bu-story-card-actions">
        <button type="button" className="bu-story-card-link" onClick={onRead}>
          Read more
        </button>
      </div>
    </article>
  )
}

function FeedStoryCard({
  post,
  onOpenStory,
  onGate,
}: {
  post: PublicPost
  onOpenStory: (id: string) => void
  onGate: () => void
}) {
  return (
    <article className="bu-story-card">
      <div className="bu-story-card-meta">
        <span>Anonymous</span>
        <span>{formatTimeAgo(post.createdAt)}</span>
      </div>
      <p className="bu-story-card-body">{truncate(post.content, 180)}</p>
      <div className="bu-story-card-stats">
        <span className="bu-story-card-stat">
          <ThumbsUp size={14} aria-hidden="true" />
          {netVotes(post)}
        </span>
        <span className="bu-story-card-stat">
          <MessageCircle size={14} aria-hidden="true" />
          {post.replies?.length || 0}
        </span>
        {post.categories?.[0] && (
          <span className="bu-story-card-category">{post.categories[0]}</span>
        )}
      </div>
      <div className="bu-story-card-actions">
        <button type="button" className="bu-story-card-link" onClick={() => onOpenStory(post.id)}>
          Read more
        </button>
        <button type="button" className="bu-story-card-link bu-story-card-link-muted" onClick={onGate}>
          Vote / Comment
        </button>
      </div>
    </article>
  )
}

function StoriesSection({
  feedSort,
  setFeedSort,
  isLoadingFeed,
  feedError,
  feedPosts,
  onOpenStory,
  onGate,
  onRetry,
  onJoin,
  title = 'Live stories',
}: {
  feedSort: 'trending' | 'newest' | 'controversial'
  setFeedSort: (sort: 'trending' | 'newest' | 'controversial') => void
  isLoadingFeed: boolean
  feedError: boolean
  feedPosts: PublicPost[]
  onOpenStory: (id: string) => void
  onGate: () => void
  onRetry: () => void
  onJoin: () => void
  title?: string
}) {
  return (
    <section className="bu-feed-section" id="stories" aria-label={title}>
      <div className="bu-feed-header">
        <h2 className="bu-feed-title">{title}</h2>
        <div className="bu-feed-filters" role="tablist" aria-label="Story filters">
          {([
            ['trending', 'Trending'],
            ['newest', 'Newest'],
            ['controversial', 'Most Discussed'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={feedSort === value}
              onClick={() => setFeedSort(value)}
              className={`bu-feed-filter${feedSort === value ? ' is-active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoadingFeed ? (
        <div className="bu-feed-loading">
          <Loader2 className="h-7 w-7 animate-spin text-fuchsia-400" aria-label="Loading stories" />
        </div>
      ) : feedPosts.length === 0 ? (
        <div className="bu-empty-state">
          <Compass size={28} className="text-fuchsia-400" aria-hidden="true" />
          <h3>{feedError ? 'Stories are taking a moment' : 'No stories in this view yet'}</h3>
          <p>
            {feedError
              ? 'We could not reach the public feed. Check your connection and try again.'
              : 'The community feed is quiet right now. Join Between Us to be part of the first wave of stories.'}
          </p>
          <div className="bu-hero-cta-row" style={{ justifyContent: 'center', marginTop: '0.5rem' }}>
            {feedError ? (
              <button type="button" className="bu-btn-secondary" onClick={onRetry}>
                Try again
              </button>
            ) : (
              <button type="button" className="bu-btn-primary" onClick={onJoin}>
                Join Between Us
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bu-feed-grid">
          {feedPosts.map((post) => (
            <FeedStoryCard key={post.id} post={post} onOpenStory={onOpenStory} onGate={onGate} />
          ))}
        </div>
      )}
    </section>
  )
}

function StoryDetail({
  story,
  error,
  onBack,
  onGateVote,
  onGateComment,
}: {
  story: PublicPost | null
  error: string
  onBack: () => void
  onGateVote: () => void
  onGateComment: () => void
}) {
  if (error) {
    return (
      <div className="bu-story-detail">
        <button type="button" onClick={onBack} className="bu-story-back">← Back to stories</button>
        <p className="bu-hero-subtitle">{error}</p>
      </div>
    )
  }
  if (!story) {
    return (
      <div className="bu-feed-loading">
        <Loader2 className="h-8 w-8 animate-spin text-fuchsia-400" aria-label="Loading story" />
      </div>
    )
  }
  return (
    <article className="bu-story-detail">
      <button type="button" onClick={onBack} className="bu-story-back">← Back to stories</button>
      <div className="bu-story-detail-card">
        <div className="bu-story-card-meta">
          <span>Anonymous</span>
          <span>{formatTimeAgo(story.createdAt)}</span>
        </div>
        {story.imageUrl && (
          <img src={story.imageUrl} alt="" className="mb-4 max-h-80 w-full rounded-xl object-cover" />
        )}
        <p className="bu-story-detail-content">{story.content}</p>
        <div className="bu-story-card-stats" style={{ marginTop: '1.25rem' }}>
          <span className="bu-story-card-stat">
            <ThumbsUp size={14} aria-hidden="true" />
            {netVotes(story)}
          </span>
          <span className="bu-story-card-stat">
            <MessageCircle size={14} aria-hidden="true" />
            {story.replies?.length || 0}
          </span>
          {story.categories?.[0] && (
            <span className="bu-story-card-category">{story.categories[0]}</span>
          )}
        </div>
        <div className="bu-hero-cta-row" style={{ marginTop: '1.25rem' }}>
          <button type="button" className="bu-btn-secondary" onClick={onGateVote}>
            Vote
          </button>
          <button type="button" className="bu-btn-secondary" onClick={onGateComment}>
            Comment
          </button>
        </div>
        <p className="bu-hero-subtitle" style={{ marginTop: '0.75rem', fontSize: '0.8125rem' }}>
          Sign in to vote, comment, or write your own story.
        </p>
      </div>
    </article>
  )
}

function DownloadPage() {
  return (
    <section className="bu-download-page">
      <img src={logoImage} alt="Between Us" className="bu-download-logo" />
      <h1 className="bu-download-title">Download Between Us</h1>
      <p className="bu-download-copy">
        Get the full experience on your phone — write stories, react, and stay in the conversation.
      </p>
      <div className="bu-download-buttons">
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="bu-store-btn bu-store-btn-primary"
        >
          Google Play
        </a>
        {HAS_APP_STORE_LISTING ? (
          <a href="#" className="bu-store-btn bu-store-btn-secondary">
            App Store
          </a>
        ) : (
          <span className="bu-store-btn bu-store-btn-disabled" aria-disabled="true">
            App Store — coming soon
          </span>
        )}
      </div>
    </section>
  )
}

function LegalLike({ title, body }: { title: string; body: string }) {
  return (
    <section className="bu-legal-page">
      <h1>{title}</h1>
      <p>{body}</p>
    </section>
  )
}
