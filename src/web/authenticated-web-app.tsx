import { lazy, Suspense, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { CheckInTab } from '../components/CheckInTab'
import { CommunityTab } from '../components/CommunityTab'
import { HomeTab } from '../components/HomeTab'
import { ProfileTab } from '../components/ProfileTab'
import { ContextualHint } from '../components/ContextualHint'
import { Toaster } from '../components/ui/sonner'
import { useTheme } from '../components/ThemeProvider'
import { useLanguage } from '../components/LanguageContext'
import { getUserProfile, signOut, type User } from '../utils/auth'
import { syncUserTimezone } from '../utils/timezone-sync'
import {
  markOnboardingCompleted,
  markTutorialCompleted,
  markWebEnteredApp,
  seedOnboardingMigration,
  shouldLandWebOnStories,
} from '../utils/onboarding-state'
import { stashOpenStoryId } from '../utils/deep-links'
import { notifyAuthChanged } from './use-auth-state'
import {
  WebAppShell,
  navToTab,
  type WebNavId,
} from './web-app-shell'
import { useDailyStreakRefresh } from './daily-streak-panel'
import { MobileWebAppInterstitial } from './mobile-web-app-interstitial'
import { toast } from 'sonner@2.0.3'
import './web.css'

const ShareTab = lazy(() => import('../components/ShareTab').then((m) => ({ default: m.ShareTab })))

interface AuthenticatedWebAppProps {
  user: User | null
}

function pathToNav(path: string): WebNavId | null {
  if (path.startsWith('/app/write')) return 'write'
  if (path.startsWith('/app/stories')) return 'stories'
  if (path.startsWith('/app/saved')) return 'saved'
  if (path.startsWith('/app/activity')) return 'activity'
  if (path.startsWith('/app/messages')) return 'messages'
  if (path.startsWith('/app/settings')) return 'settings'
  if (path.startsWith('/app/profile')) return 'profile'
  if (path === '/app' || path.startsWith('/app/')) return 'home'
  return null
}

function readInitialWebNav(): WebNavId {
  if (typeof window === 'undefined') return 'home'
  const path = window.location.pathname
  if (path.startsWith('/story/')) {
    const id = decodeURIComponent(path.replace(/^\/story\//, '').replace(/\/$/, ''))
    if (id) stashOpenStoryId(id)
    return 'stories'
  }
  const fromPath = pathToNav(path)
  if (fromPath && !(fromPath === 'home' && shouldLandWebOnStories() && (path === '/app' || path === '/'))) {
    return fromPath
  }
  return shouldLandWebOnStories() ? 'stories' : 'home'
}

export function AuthenticatedWebApp({ user }: AuthenticatedWebAppProps) {
  const { theme } = useTheme()
  const { setLanguage } = useLanguage()
  const { refreshKey, refreshStreak } = useDailyStreakRefresh()
  const [activeNav, setActiveNav] = useState<WebNavId>(() => readInitialWebNav())
  const [userName, setUserName] = useState(user?.user_metadata?.name || 'Friend')
  const [profilePicture, setProfilePicture] = useState(user?.user_metadata?.avatar_url || '')
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('between_us_selected_languages')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {
      // ignore
    }
    return ['en']
  })

  useEffect(() => {
    // Migrate BEFORE writing completion flags so existing web users are not
    // treated as brand-new for contextual hints.
    seedOnboardingMigration()
    const isLegacyUser = localStorage.getItem('between_us_hints_seeded') === 'legacy'
    markOnboardingCompleted()
    // Web has no native welcome carousel — enter the app shell directly.
    if (isLegacyUser) {
      localStorage.setItem('hasCompletedTutorial', 'true')
    } else {
      markTutorialCompleted({ enableContextualHints: true })
    }
    document.documentElement.classList.remove('light')
    document.documentElement.classList.add('dark', 'web-browser')
    document.body.classList.add('web-browser')
    return () => {
      document.documentElement.classList.remove('web-browser')
      document.body.classList.remove('web-browser')
    }
  }, [])

  useEffect(() => {
    void syncUserTimezone()
  }, [user?.id])

  useEffect(() => {
    const load = async () => {
      try {
        const fresh = await getUserProfile()
        if (fresh?.user_metadata?.name) setUserName(fresh.user_metadata.name)
        if (fresh?.user_metadata?.avatar_url) setProfilePicture(fresh.user_metadata.avatar_url)
      } catch {
        // session metadata already applied
      }
    }
    void load()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const path = window.location.pathname
    // Keep `/story/:id` shareable for Story Detail + deep links.
    // Only normalize bare marketing `/` into the authenticated app shell.
    if (path === '/') {
      window.history.replaceState({}, '', '/app')
    }
    markWebEnteredApp()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const syncStoryPath = () => {
      const path = window.location.pathname
      if (!path.startsWith('/story/')) return
      const id = decodeURIComponent(path.replace(/^\/story\//, '').replace(/\/$/, ''))
      if (!id) return
      stashOpenStoryId(id)
      setActiveNav('stories')
      window.dispatchEvent(new CustomEvent('between_us_open_story', { detail: { storyId: id } }))
    }

    syncStoryPath()
    window.addEventListener('popstate', syncStoryPath)
    return () => window.removeEventListener('popstate', syncStoryPath)
  }, [])

  const handleLanguagesChange = (languages: string[]) => {
    setSelectedLanguages(languages)
    localStorage.setItem('between_us_selected_languages', JSON.stringify(languages))
    if (languages.length > 0) setLanguage(languages[0] as 'en')
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch {
      // still clear local UX
    }
    notifyAuthChanged()
    window.history.replaceState({}, '', '/')
    toast.message('Signed out')
  }

  const handleNavChange = (nav: WebNavId) => {
    setActiveNav(nav)
  }

  const activeTab = navToTab(activeNav)

  const tabFallback = (
    <div className="flex h-full items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-fuchsia-400" aria-hidden="true" />
    </div>
  )

  return (
    <MobileWebAppInterstitial>
    <div className="dark web-browser h-screen">
      <WebAppShell
        activeNav={activeNav}
        setActiveNav={handleNavChange}
        user={user}
        profilePicture={profilePicture}
        streakRefreshKey={refreshKey}
      >
        <div className="bu-web-hint shrink-0">
          <ContextualHint hintId="discover" active={activeNav === 'stories' || activeNav === 'messages'} />
          <ContextualHint hintId="share" active={activeTab === 'share'} />
          <ContextualHint hintId="checkin" active={activeTab === 'checkin'} />
          <ContextualHint hintId="community" active={activeNav === 'home'} />
        </div>
        {/* Stories (+ Messages) = full Community MVP */}
        {(activeNav === 'stories' || activeNav === 'messages') && (
          <CommunityTab
            selectedLanguages={selectedLanguages}
            initialViewMode="all"
            webShell
            onStreakActivity={refreshStreak}
          />
        )}
        {activeTab === 'share' && (
          <Suspense fallback={tabFallback}>
            <ShareTab webShell onStreakActivity={refreshStreak} />
          </Suspense>
        )}
        {activeTab === 'checkin' && (
          <CheckInTab
            userName={userName}
            profilePicture={profilePicture}
            webShell
            onNavigateToProfile={() => setActiveNav('profile')}
          />
        )}
        {activeNav === 'saved' && (
          <CommunityTab
            selectedLanguages={selectedLanguages}
            initialViewMode="saved"
            webShell
            onStreakActivity={refreshStreak}
          />
        )}
        {activeNav === 'home' && (
          <HomeTab
            selectedLanguages={selectedLanguages}
            webShell
            onNavigateToWrite={() => setActiveNav('write')}
            onNavigateToCheckIn={() => setActiveNav('activity')}
            onNavigateToStories={() => setActiveNav('stories')}
          />
        )}
        {activeTab === 'profile' && (
          <ProfileTab
            selectedLanguages={selectedLanguages}
            onLanguagesChange={handleLanguagesChange}
            userName={userName}
            profilePicture={profilePicture}
            onProfilePictureChange={setProfilePicture}
            webShell
          />
        )}
      </WebAppShell>
      <Toaster theme={theme} />
    </div>
    </MobileWebAppInterstitial>
  )
}
