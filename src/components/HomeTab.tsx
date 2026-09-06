import { useCallback, useEffect, useState } from 'react'
import {
  BookOpen,
  CheckCircle,
  Compass,
  Loader2,
  MessageSquarePlus,
  Sparkles,
  X,
  BookMarked,
  LayoutGrid,
  Lock,
} from 'lucide-react'
import { useLanguage } from './LanguageContext'
import { callServer } from '../utils/supabase/client'
import { getActorId } from '../utils/actor-id'
import {
  isWebFirstSessionPending,
  markWebFirstSessionDone,
} from '../utils/onboarding-state'
import {
  loadJournalHomeCards,
  type JournalPreviewCard,
} from '../web/journal-preview-cards'

interface FeaturedPost {
  id: string
  content: string
  createdAt: string
  upvotes?: number
  downvotes?: number
  replies?: unknown[]
  replyCount?: number
}

interface HomeTabProps {
  selectedLanguages: string[]
  webShell?: boolean
  onNavigateToWrite?: () => void
  onNavigateToCheckIn?: () => void
  onNavigateToStories?: () => void
}

function openExternalPath(path: string) {
  if (typeof window === 'undefined') return
  window.location.assign(path)
}

export function HomeTab({
  selectedLanguages,
  webShell = false,
  onNavigateToWrite,
  onNavigateToCheckIn,
  onNavigateToStories,
}: HomeTabProps) {
  const { t } = useLanguage()
  const [featured, setFeatured] = useState<FeaturedPost | null>(null)
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true)
  const [journeyCards, setJourneyCards] = useState<JournalPreviewCard[]>([])
  const [isLoadingJourney, setIsLoadingJourney] = useState(true)
  const [showFirstSession, setShowFirstSession] = useState(false)

  useEffect(() => {
    setShowFirstSession(isWebFirstSessionPending())
  }, [])

  const loadFeatured = useCallback(async () => {
    setIsLoadingFeatured(true)
    try {
      const languagesParam = selectedLanguages.length > 0 ? selectedLanguages.join(',') : 'en'
      const actor = getActorId()
      const viewerQuery = actor ? `&viewerId=${encodeURIComponent(actor)}` : ''
      const result = await callServer(
        `/posts?language=${encodeURIComponent(languagesParam)}&sort=trending&limit=1${viewerQuery}`,
        { method: 'GET' },
      )
      if (result.success && Array.isArray(result.posts) && result.posts.length > 0) {
        setFeatured(result.posts[0] as FeaturedPost)
      } else {
        setFeatured(null)
      }
    } catch {
      setFeatured(null)
    } finally {
      setIsLoadingFeatured(false)
    }
  }, [selectedLanguages])

  useEffect(() => {
    void loadFeatured()
  }, [loadFeatured])

  useEffect(() => {
    let cancelled = false
    setIsLoadingJourney(true)
    loadJournalHomeCards()
      .then((cards) => {
        if (!cancelled) setJourneyCards(cards.slice(0, 2))
      })
      .catch(() => {
        if (!cancelled) setJourneyCards([])
      })
      .finally(() => {
        if (!cancelled) setIsLoadingJourney(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleDismissFirstSession = () => {
    markWebFirstSessionDone()
    setShowFirstSession(false)
  }

  const handleStartWithStories = () => {
    markWebFirstSessionDone()
    setShowFirstSession(false)
    onNavigateToStories?.()
  }

  const handleOpenJourney = () => {
    openExternalPath('/journal/')
  }

  const handleOpenGuides = () => {
    openExternalPath('/guides/')
  }

  const handleOpenFeatures = () => {
    openExternalPath('/features')
  }

  const handleOpenArticle = (href: string) => {
    openExternalPath(href)
  }

  const replyCount = featured?.replyCount ?? featured?.replies?.length ?? 0
  const score = (featured?.upvotes || 0) - (featured?.downvotes || 0)

  return (
    <div className={`h-full overflow-y-auto scrollbar-hide ${webShell ? 'bu-web-tab-content pb-8' : 'pb-24'}`}>
      <div className={`mx-auto space-y-5 ${webShell ? 'max-w-none px-0 py-0' : 'max-w-3xl px-4 py-4'}`}>
        {!webShell && (
          <header className="space-y-1">
            <h1 className="text-xl font-bold text-foreground">{t('home.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('home.subtitle')}</p>
          </header>
        )}

        {showFirstSession && (
          <section
            aria-labelledby="home-first-session-title"
            className="relative rounded-2xl border border-fuchsia-500/30 bg-gradient-to-br from-purple-950/80 to-fuchsia-950/40 p-4 shadow-lg"
          >
            <button
              type="button"
              onClick={handleDismissFirstSession}
              className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-lg text-fuchsia-100/80 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
              aria-label={t('home.firstSession.dismiss')}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-fuchsia-300">
              {t('home.firstSession.eyebrow')}
            </p>
            <h2 id="home-first-session-title" className="mt-1 pr-8 text-base font-semibold text-white">
              {t('home.firstSession.title')}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">
              {t('home.firstSession.body')}
            </p>
            <ul className="mt-3 space-y-1.5 text-xs text-zinc-400">
              <li>{t('home.firstSession.pointStories')}</li>
              <li>{t('home.firstSession.pointSpill')}</li>
              <li>{t('home.firstSession.pointPrivate')}</li>
            </ul>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleStartWithStories}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
              >
                <Compass className="h-4 w-4" aria-hidden="true" />
                {t('home.firstSession.cta')}
              </button>
              <button
                type="button"
                onClick={handleDismissFirstSession}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-3 text-sm text-zinc-400 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
              >
                {t('home.firstSession.skip')}
              </button>
            </div>
          </section>
        )}

        <section aria-label={t('home.quickActions')} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={onNavigateToStories}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-600 to-fuchsia-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 sm:col-span-1"
          >
            <Compass className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t('home.browseStories')}
          </button>
          <button
            type="button"
            onClick={onNavigateToWrite}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
          >
            <MessageSquarePlus className="h-4 w-4 shrink-0 text-purple-500" aria-hidden="true" />
            {t('home.write')}
          </button>
          <button
            type="button"
            onClick={onNavigateToCheckIn}
            className="flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
          >
            <span className="inline-flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0 text-purple-500" aria-hidden="true" />
              {t('home.checkIn')}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
              <Lock className="h-3 w-3" aria-hidden="true" />
              {t('home.checkInPrivate')}
            </span>
          </button>
        </section>

        <section aria-labelledby="home-happening-heading" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 id="home-happening-heading" className="text-sm font-semibold text-foreground">
              {t('home.whatsHappening')}
            </h2>
            {onNavigateToStories && (
              <button
                type="button"
                onClick={onNavigateToStories}
                className="min-h-[44px] px-2 text-xs font-medium text-purple-600 dark:text-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 rounded-lg"
              >
                {t('home.seeStories')}
              </button>
            )}
          </div>

          {isLoadingFeatured ? (
            <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-10">
              <Loader2 className="h-6 w-6 animate-spin text-purple-500" aria-label={t('home.loadingStories')} />
            </div>
          ) : featured ? (
            <button
              type="button"
              onClick={onNavigateToStories}
              className="w-full rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
            >
              <div className="mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-purple-500" aria-hidden="true" />
                <span>{t('home.featuredLabel')}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{score}</span>
                {replyCount > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{replyCount} {t('discover.comments')}</span>
                  </>
                )}
              </div>
              <p className="line-clamp-4 text-sm font-medium leading-relaxed text-foreground whitespace-pre-wrap break-words">
                {featured.content}
              </p>
            </button>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">{t('home.noFeatured')}</p>
              {onNavigateToWrite && (
                <button
                  type="button"
                  onClick={onNavigateToWrite}
                  className="mt-3 min-h-[44px] text-sm font-medium text-purple-600 dark:text-purple-400"
                >
                  {t('home.writeFirst')}
                </button>
              )}
            </div>
          )}
        </section>

        <section aria-labelledby="home-journey-heading" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 id="home-journey-heading" className="text-sm font-semibold text-foreground">
              {t('home.fromJourney')}
            </h2>
            <button
              type="button"
              onClick={handleOpenJourney}
              className="min-h-[44px] px-2 text-xs font-medium text-purple-600 dark:text-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 rounded-lg"
            >
              {t('home.browseJourney')}
            </button>
          </div>

          {isLoadingJourney ? (
            <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-8">
              <Loader2 className="h-5 w-5 animate-spin text-purple-500" aria-hidden="true" />
            </div>
          ) : journeyCards.length > 0 ? (
            <ul className="space-y-2">
              {journeyCards.map((card) => (
                <li key={card.id}>
                  <button
                    type="button"
                    onClick={() => handleOpenArticle(card.href || '/journal/')}
                    className="flex w-full gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
                  >
                    {card.imageUrl ? (
                      <img
                        src={card.imageUrl}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-xl object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-500">
                        <BookOpen className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-foreground line-clamp-2">
                        {card.title}
                      </span>
                      {card.copy && (
                        <span className="mt-0.5 block text-xs text-muted-foreground line-clamp-2">
                          {card.copy}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <button
              type="button"
              onClick={handleOpenJourney}
              className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-4 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
            >
              <BookOpen className="h-5 w-5 shrink-0 text-purple-500" aria-hidden="true" />
              <span className="text-sm text-muted-foreground">{t('home.journeyEmpty')}</span>
            </button>
          )}
        </section>

        {webShell && (
          <section aria-labelledby="home-explore-heading" className="space-y-3">
            <h2 id="home-explore-heading" className="text-sm font-semibold text-foreground">
              {t('home.exploreEditorial')}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('home.exploreEditorialHint')}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={handleOpenJourney}
                className="flex min-h-[48px] items-center gap-2 rounded-2xl border border-border bg-card px-3 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
              >
                <BookOpen className="h-4 w-4 shrink-0 text-purple-500" aria-hidden="true" />
                <span>
                  <span className="block">{t('home.exploreJournal')}</span>
                  <span className="block text-[11px] font-normal text-muted-foreground">{t('home.exploreJournalHint')}</span>
                </span>
              </button>
              <button
                type="button"
                onClick={handleOpenGuides}
                className="flex min-h-[48px] items-center gap-2 rounded-2xl border border-border bg-card px-3 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
              >
                <BookMarked className="h-4 w-4 shrink-0 text-purple-500" aria-hidden="true" />
                <span>
                  <span className="block">{t('home.exploreGuides')}</span>
                  <span className="block text-[11px] font-normal text-muted-foreground">{t('home.exploreGuidesHint')}</span>
                </span>
              </button>
              <button
                type="button"
                onClick={handleOpenFeatures}
                className="flex min-h-[48px] items-center gap-2 rounded-2xl border border-border bg-card px-3 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
              >
                <LayoutGrid className="h-4 w-4 shrink-0 text-purple-500" aria-hidden="true" />
                <span>
                  <span className="block">{t('home.exploreFeatures')}</span>
                  <span className="block text-[11px] font-normal text-muted-foreground">{t('home.exploreFeaturesHint')}</span>
                </span>
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
