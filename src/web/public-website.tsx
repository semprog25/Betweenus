import { useCallback, useEffect, useState } from 'react'
import {
  BookOpen,
  CalendarCheck,
  Compass,
  EyeOff,
  Filter,
  HeartHandshake,
  Loader2,
  MessageCircle,
  Shield,
  ThumbsUp,
  Users,
} from 'lucide-react'
import logoImage from '../assets/betweenus-logo.png'
import { AuthModal } from './auth-modal'
import { setPendingAuthAction } from '../utils/auth'
import { HeroLivingDecor } from './hero-living-decor'
import { RotatingHeroCards } from './rotating-hero-cards'
import {
  AboutPage,
  PrivacyPage,
  StoreButtons,
  SupportPage,
  TermsPage,
} from './public-pages'
import { JOURNAL_PREVIEW_CARDS } from './journal-preview-cards'
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
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [path.name])

  useEffect(() => {
    const root = document.documentElement
    if (path.name !== 'home') {
      root.classList.remove('bu-home-snap')
      return
    }
    root.classList.add('bu-home-snap')
    return () => root.classList.remove('bu-home-snap')
  }, [path.name])

  useEffect(() => {
    document.title = path.name === 'story'
      ? 'Story | Between Us'
      : path.name === 'journal'
        ? 'Journal | Between Us'
        : path.name === 'download'
          ? 'Download | Between Us'
          : path.name === 'stories'
            ? 'Stories | Between Us'
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
    if (path.name === 'stories') void loadFeed(feedSort)
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
    <div className={`bu-public-root${authOpen ? ' bu-public-root--auth-open' : ''}`}>
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
            <button type="button" onClick={() => go({ name: 'journal' })}>Journal</button>
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
            <button type="button" onClick={() => go({ name: 'journal' })}>Journal</button>
            <button type="button" onClick={() => go({ name: 'about' })}>About</button>
            <button type="button" onClick={() => go({ name: 'privacy' })}>Privacy</button>
            <button type="button" onClick={() => go({ name: 'support' })}>Support</button>
            <button type="button" onClick={() => openAuth('login')}>Log in</button>
            <button type="button" onClick={() => openAuth('signup')}>Sign up</button>
          </div>
        )}
      </header>

      <main className={`bu-public-shell bu-public-main${path.name === 'home' ? ' bu-public-main--snap' : ''}${path.name === 'download' ? ' bu-public-main--download' : ''}`}>
        {path.name === 'home' && (
          <>
            <section className="bu-home-section bu-home-section--hero" aria-label="Between Us hero">
              <div className="bu-hero">
                <HeroLivingDecor />

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
                  <RotatingHeroCards onExplore={() => go({ name: 'stories' })} />
                </div>
              </div>

              <div className="bu-trust-strip" aria-label="Why Between Us">
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
              </div>
            </section>

            <WhyPeopleLoveSection />

            <JournalHomeSection onOpenJournal={() => go({ name: 'journal' })} />

            <HomeDownloadSection onNavigate={go} />
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
            variant="page"
          />
        )}

        {path.name === 'journal' && <JournalPage onJoin={() => openAuth('signup')} />}

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
        {path.name === 'about' && <AboutPage />}
        {path.name === 'privacy' && <PrivacyPage />}
        {path.name === 'terms' && <TermsPage />}
        {path.name === 'support' && <SupportPage />}
      </main>

      <PublicFooter onNavigate={go} hiddenOnHome={path.name === 'home'} />

      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onModeChange={setAuthMode}
      />
    </div>
  )
}

function WhyPeopleLoveSection() {
  const features = [
    {
      icon: EyeOff,
      title: '100% Anonymous',
      copy: 'Share without attaching your real identity. Posts stay anonymous so you can say what you actually mean.',
      accent: 'magenta',
    },
    {
      icon: Filter,
      title: 'Smart Filters',
      copy: 'Browse trending, newest, and most discussed stories — and filter by the topics and languages you care about.',
      accent: 'violet',
    },
    {
      icon: HeartHandshake,
      title: 'React & Connect',
      copy: 'Upvote, reply, and engage with stories that resonate. Find people who get it without revealing who you are.',
      accent: 'pink',
    },
    {
      icon: Shield,
      title: 'Safety First',
      copy: 'Moderation, reporting, and privacy controls help keep the community respectful and your participation protected.',
      accent: 'orange',
    },
    {
      icon: CalendarCheck,
      title: 'Daily Check-ins',
      copy: 'Track how you are feeling with private daily check-ins — separate from the public story feed.',
      accent: 'teal',
    },
    {
      icon: BookOpen,
      title: 'Real Stories',
      copy: 'Discover anonymous stories from real people navigating relationships, secrets, awkward moments, and everyday drama.',
      accent: 'purple',
    },
  ] as const

  return (
    <section className="bu-home-section bu-home-section--features" aria-label="Why people love Between Us">
      <div className="bu-features-section">
        <div className="bu-features-header">
          <h2 id="features-title" className="bu-section-title bu-section-title--accent">Why people love Between Us</h2>
          <p className="bu-section-copy">
            Read, react, and share anonymously — with tools that keep the experience safe and personal.
          </p>
        </div>
        <div className="bu-features-grid">
          {features.map(({ icon: Icon, title, copy, accent }) => (
            <article key={title} className={`bu-feature-card bu-feature-card--${accent}`}>
              <span className="bu-feature-card-icon" aria-hidden="true">
                <Icon size={22} strokeWidth={1.75} />
              </span>
              <h3 className="bu-feature-card-title">{title}</h3>
              <p className="bu-feature-card-copy">{copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function JournalHomeSection({ onOpenJournal }: { onOpenJournal: () => void }) {
  return (
    <section className="bu-home-section bu-home-section--journal" aria-labelledby="journal-home-title">
      <div className="bu-journal-home">
        <div className="bu-journal-home-header">
          <div className="bu-journal-home-heading">
            <p className="bu-section-eyebrow">From the Journal</p>
            <h2 id="journal-home-title" className="bu-section-title bu-section-title--accent">Between Us Journal</h2>
          </div>
          <button type="button" className="bu-btn-primary bu-journal-home-cta" onClick={onOpenJournal}>
            View Journal
          </button>
        </div>
        <div className="bu-journal-home-grid">
          {JOURNAL_PREVIEW_CARDS.map((card) => (
            <article key={card.id} className={`bu-journal-home-card bu-journal-home-card--${card.theme}`}>
              <div className="bu-journal-home-card-visual">
                <img
                  src={card.imageUrl}
                  alt={card.imageAlt}
                  className="bu-journal-home-card-image"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="bu-journal-home-card-body">
                <h3 className="bu-journal-home-card-title">{card.title}</h3>
                <p className="bu-journal-home-card-copy">{card.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function HomeDownloadSection({ onNavigate }: { onNavigate: (path: PublicPath) => void }) {
  return (
    <section className="bu-home-section bu-home-section--download" aria-labelledby="home-download-title">
      <div className="bu-home-download-stack">
        <div className="bu-home-download">
          <div className="bu-home-download-inner">
            <h2 id="home-download-title" className="bu-section-title bu-section-title--accent">Take Between Us with you</h2>
            <p className="bu-section-copy">
              Spill, react, and stay in the conversation on Android and iOS.
            </p>
            <StoreButtons className="bu-home-download-stores" />
          </div>
        </div>
        <PublicFooter onNavigate={onNavigate} variant="home" />
      </div>
    </section>
  )
}

function JournalPage({ onJoin }: { onJoin: () => void }) {
  return (
    <section className="bu-journal-page" aria-labelledby="journal-page-title">
      <p className="bu-section-eyebrow">Between Us Journal</p>
      <h1 id="journal-page-title" className="bu-section-title">Editorial stories &amp; reflections</h1>
      <p className="bu-section-copy">
        The Journal is where the Between Us team publishes editorial content — guides, reflections, and stories about connection and anonymity.
        It is separate from the anonymous community feed inside the app.
      </p>
      <div className="bu-journal-teaser-grid bu-journal-page-teasers">
        {[
          { title: 'Connection', copy: 'How anonymity changes what people are willing to say.' },
          { title: 'Relationships', copy: 'Reflections on trust, secrets, and saying the hard thing.' },
          { title: 'Community', copy: 'What it means to hold space for strangers who get it.' },
        ].map((item) => (
          <div key={item.title} className="bu-journal-teaser-card">
            <h3 className="bu-journal-teaser-title">{item.title}</h3>
            <p className="bu-journal-teaser-copy">{item.copy}</p>
            <span className="bu-journal-teaser-status">Coming soon</span>
          </div>
        ))}
      </div>
      <div className="bu-hero-cta-row">
        <button type="button" className="bu-btn-primary" onClick={onJoin}>
          Sign up
        </button>
      </div>
    </section>
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
  title = 'Stories',
  variant = 'page',
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
  variant?: 'page'
}) {
  const showQuietState = !isLoadingFeed && (feedPosts.length === 0 || feedError)

  return (
    <section className="bu-feed-section" id="stories" aria-label={title}>
      <div className="bu-feed-header">
        <div>
          <h2 className="bu-feed-title">{title}</h2>
          {variant === 'page' && (
            <p className="bu-feed-intro">
              Browse public stories from the community. Sign in to vote, comment, and write your own.
            </p>
          )}
        </div>
        {!showQuietState && (
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
        )}
      </div>

      {isLoadingFeed ? (
        <div className="bu-feed-loading">
          <Loader2 className="h-7 w-7 animate-spin text-fuchsia-400" aria-label="Loading stories" />
        </div>
      ) : showQuietState ? (
        <div className="bu-empty-state bu-empty-state--page">
          <Compass size={28} className="text-fuchsia-400" aria-hidden="true" />
          <h3>Stories will appear here soon</h3>
          <p>
            The public story wall refreshes as the community grows. Join Between Us to read, react, and share anonymously.
          </p>
          <div className="bu-hero-cta-row" style={{ justifyContent: 'center', marginTop: '0.5rem' }}>
            <button type="button" className="bu-btn-primary" onClick={onJoin}>
              Sign up
            </button>
            <button type="button" className="bu-btn-secondary" onClick={onRetry}>
              Refresh
            </button>
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
    <section className="bu-download-page" aria-labelledby="download-page-title">
      <div className="bu-download-page-inner">
        <img src={logoImage} alt="Between Us" className="bu-download-logo" />
        <h1 id="download-page-title" className="bu-download-title">Take Between Us with you</h1>
        <p className="bu-download-copy">
          Spill, react, and stay in the conversation on Android and iOS.
        </p>
        <StoreButtons className="bu-download-page-stores" />
      </div>
    </section>
  )
}

function TikTokIcon() {
  return (
    <svg className="bu-footer-social-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.6 5.82s.51.5 0 0A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.1 4.1 0 0 1-1-.48z"
      />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg className="bu-footer-social-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"
      />
    </svg>
  )
}

function PublicFooter({
  onNavigate,
  hiddenOnHome = false,
  variant = 'default',
}: {
  onNavigate: (path: PublicPath) => void
  hiddenOnHome?: boolean
  variant?: 'default' | 'home'
}) {
  if (hiddenOnHome) return null

  const footerLinks = [
    ['stories', 'Stories'],
    ['journal', 'Journal'],
    ['about', 'About'],
    ['privacy', 'Privacy'],
    ['terms', 'Terms'],
    ['support', 'Support'],
  ] as const

  return (
    <footer className={`bu-public-footer${variant === 'home' ? ' bu-public-footer--home' : ''}`}>
      <div className="bu-public-footer-bar">
        <div className="bu-public-shell bu-public-footer-inner">
          <div className="bu-public-footer-brand">
            <button type="button" onClick={() => onNavigate({ name: 'home' })} className="bu-public-footer-logo-btn" aria-label="Between Us home">
              <img src={logoImage} alt="Between Us" className="bu-public-logo-img" />
            </button>
            <p className="bu-public-footer-tagline">
              Say what you can&apos;t say anywhere else. Anonymous stories from people who get it.
            </p>
            <div className="bu-public-footer-social">
              <span className="bu-footer-social-btn" aria-label="TikTok — coming soon">
                <TikTokIcon />
              </span>
              <span className="bu-footer-social-btn" aria-label="Instagram — coming soon">
                <InstagramIcon />
              </span>
            </div>
          </div>

          <nav className="bu-public-footer-nav" aria-label="Footer">
            {footerLinks.map(([name, label]) => (
              <button key={name} type="button" onClick={() => onNavigate({ name })}>
                {label}
              </button>
            ))}
          </nav>

          <p className="bu-public-footer-copy">© {new Date().getFullYear()} Between Us</p>
        </div>
      </div>
    </footer>
  )
}
