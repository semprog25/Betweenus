import { useCallback, useEffect, useState } from 'react'
import {
  BookOpen,
  CalendarCheck,
  EyeOff,
  Filter,
  HeartHandshake,
  Loader2,
  MessageCircle,
  Shield,
  ThumbsUp,
  Users,
} from 'lucide-react'
import { AuthModal } from './auth-modal'
import { setPendingAuthAction } from '../utils/auth'
import { callServer } from '../utils/supabase/client'
import { HeroLivingDecor } from './hero-living-decor'
import { RotatingHeroCards } from './rotating-hero-cards'
import { StoreButtons } from './public-pages'
import { PublicAtmosphere, PublicFooter, PublicHeader } from './public-chrome'
import {
  loadJournalHomeCards,
  type JournalPreviewCard,
} from './journal-preview-cards'
import {
  navigatePublic,
  resolvePublicPath,
  featureHref,
  isStaticOwnedPublicPath,
  pathToHref,
  type PublicPath,
} from './public-path'
import './web.css'

interface PublicPost {
  id: string
  content: string
  isAnonymous?: boolean
  upvotes?: number
  downvotes?: number
  replies?: unknown[]
  replyCount?: number
  createdAt?: string
  timestamp?: number
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

function netVotes(post: PublicPost): number {
  return (post.upvotes || 0) - (post.downvotes || 0)
}

interface PublicWebsiteProps {
  onRequireAuth: (mode: 'login' | 'signup') => void
}

export function PublicWebsite({ onRequireAuth }: PublicWebsiteProps) {
  const [path, setPath] = useState<PublicPath>(() => resolvePublicPath())
  const [story, setStory] = useState<PublicPost | null>(null)
  const [storyError, setStoryError] = useState('')
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    const sync = () => setPath(resolvePublicPath())
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
      : 'Between Us — Say what you can\'t say anywhere else'
  }, [path])

  // Static HTML owns SEO/marketing routes on GitHub Pages (HTTP 200).
  // If the SPA somehow owns one of these paths, exit immediately — no flash/loop.
  useEffect(() => {
    if (!isStaticOwnedPublicPath(path)) return
    window.location.replace(pathToHref(path))
  }, [path])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const auth = params.get('auth')
    if (auth === 'login' || auth === 'signup') {
      setAuthMode(auth)
      setAuthOpen(true)
      onRequireAuth(auth)
      params.delete('auth')
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`
      window.history.replaceState({}, '', next)
    }
  }, [onRequireAuth])

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setAuthOpen(true)
    onRequireAuth(mode)
  }

  const gateAction = (type: 'me_too' | 'reply' | 'spill' | 'generic' = 'generic') => {
    setPendingAuthAction({ type })
    openAuth('signup')
  }

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
    if (path.name === 'story') void loadStory(path.id)
  }, [path, loadStory])

  const go = (next: PublicPath) => {
    setMobileNavOpen(false)
    // Prefer static HTML for SEO + GitHub Pages HTTP 200 status
    if (isStaticOwnedPublicPath(next)) {
      window.location.assign(pathToHref(next))
      return
    }
    navigatePublic(next)
    setPath(next)
  }

  // Never render SPA chrome for static-owned routes — HTML files own them.
  if (isStaticOwnedPublicPath(path)) {
    return null
  }

  return (
    <div className={`bu-public-root${authOpen ? ' bu-public-root--auth-open' : ''}`}>
      <PublicAtmosphere />

      <PublicHeader
        currentPath={path}
        mobileNavOpen={mobileNavOpen}
        onToggleMobileNav={() => setMobileNavOpen((open) => !open)}
        onNavigate={go}
        onOpenAuth={openAuth}
      />

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

        {path.name === 'story' && (
          <StoryDetail
            story={story}
            error={storyError}
            onBack={() => go({ name: 'stories' })}
            onGateVote={() => gateAction('me_too')}
            onGateComment={() => gateAction('reply')}
          />
        )}
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
      href: featureHref('anonymous-stories'),
    },
    {
      icon: Filter,
      title: 'Spill your story',
      copy: 'Write what you have been carrying and publish it to the community feed when you are ready.',
      accent: 'violet',
      href: featureHref('spill'),
    },
    {
      icon: HeartHandshake,
      title: 'React & Connect',
      copy: 'Upvote, reply, and engage with stories that resonate. Find people who get it without revealing who you are.',
      accent: 'pink',
      href: featureHref('react-and-discuss'),
    },
    {
      icon: Shield,
      title: 'Safety First',
      copy: 'Moderation, reporting, and privacy controls help keep the community respectful and your participation protected.',
      accent: 'orange',
      href: featureHref('safety-and-privacy'),
    },
    {
      icon: CalendarCheck,
      title: 'Daily Check-ins',
      copy: 'Track how you are feeling with private daily check-ins — separate from the public story feed.',
      accent: 'teal',
      href: featureHref('daily-check-ins'),
    },
    {
      icon: BookOpen,
      title: 'Editorial Journal',
      copy: 'Read longer essays on gossip, friendship, and relationship drama — separate from anonymous community Stories.',
      accent: 'purple',
      href: featureHref('editorial-journal'),
    },
  ] as const

  return (
    <section className="bu-home-section bu-home-section--features" aria-label="Why people love Between Us">
      <div className="bu-features-section">
        <div className="bu-features-header">
          <h2 id="features-title" className="bu-section-title bu-section-title--accent">Why people love Between Us</h2>
          <p className="bu-section-copy">
            Read, react, and share anonymously — with tools that keep the experience safe and personal.{' '}
            <a href="/features" className="bu-inline-link">Explore all features</a>
          </p>
        </div>
        <div className="bu-features-grid">
          {features.map(({ icon: Icon, title, copy, accent, href }) => (
            <a key={title} href={href} className={`bu-feature-card bu-feature-card--${accent}`}>
              <span className="bu-feature-card-icon" aria-hidden="true">
                <Icon size={22} strokeWidth={1.75} />
              </span>
              <h3 className="bu-feature-card-title">{title}</h3>
              <p className="bu-feature-card-copy">{copy}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

function JournalHomeSection({ onOpenJournal }: { onOpenJournal: () => void }) {
  const [cards, setCards] = useState<JournalPreviewCard[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    void loadJournalHomeCards().then((next) => {
      if (cancelled) return
      setCards(next)
      setLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

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
        {!loaded ? (
          <p className="bu-journal-home-empty">Loading Journal…</p>
        ) : cards.length === 0 ? (
          <div className="bu-journal-home-empty" role="status">
            <p>Editorial stories will appear here as the Between Us Journal publishes.</p>
            <p className="bu-journal-home-empty-note">Separate from anonymous community Stories in the app.</p>
          </div>
        ) : (
          <div className="bu-journal-home-grid">
            {cards.map((card) => (
              <a
                key={card.id}
                href={card.href || '/journal/'}
                className={`bu-journal-home-card bu-journal-home-card--${card.theme}`}
              >
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
              </a>
            ))}
          </div>
        )}
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
