import { lazy, Suspense, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { CheckInTab } from '../components/CheckInTab'
import { CommunityTab } from '../components/CommunityTab'
import { ProfileTab } from '../components/ProfileTab'
import { Toaster } from '../components/ui/sonner'
import { useTheme } from '../components/ThemeProvider'
import { useLanguage } from '../components/LanguageContext'
import { getUserProfile, signOut, type User } from '../utils/auth'
import { notifyAuthChanged } from './use-auth-state'
import { WebAppShell, type AppTab } from './web-app-shell'
import { toast } from 'sonner@2.0.3'
import './web.css'

const ShareTab = lazy(() => import('../components/ShareTab').then((m) => ({ default: m.ShareTab })))
const DiscoverTab = lazy(() => import('../components/DiscoverTab').then((m) => ({ default: m.DiscoverTab })))

interface AuthenticatedWebAppProps {
  user: User | null
}

export function AuthenticatedWebApp({ user }: AuthenticatedWebAppProps) {
  const { theme } = useTheme()
  const { setLanguage } = useLanguage()
  const [activeTab, setActiveTab] = useState<AppTab>('discover')
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
    localStorage.setItem('hasCompletedOnboarding', 'true')
    localStorage.setItem('hasCompletedTutorial', 'true')
    document.documentElement.classList.remove('light')
    document.documentElement.classList.add('dark')
  }, [])

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
    if (path.startsWith('/story/')) {
      const id = decodeURIComponent(path.replace(/^\/story\//, '').replace(/\/$/, ''))
      if (id) {
        try {
          localStorage.setItem('between_us_open_story_id', id)
        } catch {
          // ignore
        }
        setActiveTab('community')
      }
    } else if (path.startsWith('/app/write') || path === '/app/write') {
      setActiveTab('share')
    } else if (path.startsWith('/app/profile') || path.startsWith('/app/settings')) {
      setActiveTab('profile')
    } else if (path.startsWith('/app/stories')) {
      setActiveTab('community')
    }
    if (path === '/' || path.startsWith('/app')) {
      window.history.replaceState({}, '', '/app')
    }
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

  const tabFallback = (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-fuchsia-400" aria-hidden="true" />
    </div>
  )

  return (
    <div className="dark h-screen">
      <WebAppShell
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onSignOut={handleSignOut}
      >
        {activeTab === 'discover' && (
          <Suspense fallback={tabFallback}>
            <DiscoverTab selectedLanguages={selectedLanguages} />
          </Suspense>
        )}
        {activeTab === 'share' && (
          <Suspense fallback={tabFallback}>
            <ShareTab />
          </Suspense>
        )}
        {activeTab === 'checkin' && (
          <CheckInTab
            userName={userName}
            profilePicture={profilePicture}
            onNavigateToProfile={() => setActiveTab('profile')}
          />
        )}
        {activeTab === 'community' && <CommunityTab selectedLanguages={selectedLanguages} />}
        {activeTab === 'profile' && (
          <ProfileTab
            selectedLanguages={selectedLanguages}
            onLanguagesChange={handleLanguagesChange}
            userName={userName}
            profilePicture={profilePicture}
            onProfilePictureChange={setProfilePicture}
          />
        )}
      </WebAppShell>
      <Toaster theme={theme} />
    </div>
  )
}
