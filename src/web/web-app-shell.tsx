import { Suspense, type ReactNode } from 'react'
import {
  Activity,
  Bookmark,
  Globe,
  Home,
  Loader2,
  MessageSquare,
  MessageSquarePlus,
  PenSquare,
  Settings,
  User,
} from 'lucide-react'
import logoImage from '../assets/betweenus-logo.png'
import type { User as AuthUser } from '../utils/auth'
import { DailyStreakPanel } from './daily-streak-panel'
import { ImpactPanel } from './impact-panel'
import { TrendingTopicsPanel } from './trending-topics-panel'

export type AppTab = 'discover' | 'share' | 'checkin' | 'community' | 'profile'

export type WebNavId =
  | 'home'
  | 'stories'
  | 'write'
  | 'activity'
  | 'messages'
  | 'profile'
  | 'saved'
  | 'settings'

interface NavItem {
  id: WebNavId
  label: string
  icon: typeof Home
  tab: AppTab
  communityView?: 'all' | 'saved'
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home, tab: 'discover' },
  { id: 'stories', label: 'Stories', icon: Globe, tab: 'community', communityView: 'all' },
  { id: 'write', label: 'Write a Story', icon: PenSquare, tab: 'share' },
  { id: 'activity', label: 'Activity', icon: Activity, tab: 'checkin' },
  { id: 'messages', label: 'Messages', icon: MessageSquare, tab: 'community', communityView: 'all' },
  { id: 'profile', label: 'Profile', icon: User, tab: 'profile' },
  { id: 'saved', label: 'Saved', icon: Bookmark, tab: 'community', communityView: 'saved' },
  { id: 'settings', label: 'Settings', icon: Settings, tab: 'profile' },
]

const PAGE_TITLES: Record<WebNavId, string> = {
  home: 'Home',
  stories: 'Stories',
  write: 'Write a Story',
  activity: 'Activity',
  messages: 'Messages',
  profile: 'Profile',
  saved: 'Saved',
  settings: 'Settings',
}

interface WebAppShellProps {
  activeNav: WebNavId
  setActiveNav: (nav: WebNavId) => void
  user: AuthUser | null
  profilePicture?: string
  streakRefreshKey?: number
  children: ReactNode
}

export function WebAppShell({
  activeNav,
  setActiveNav,
  user,
  profilePicture,
  streakRefreshKey = 0,
  children,
}: WebAppShellProps) {
  const displayName = user?.user_metadata?.public_username
    || user?.user_metadata?.name
    || user?.email?.split('@')[0]
    || 'Member'

  const avatarUrl = profilePicture || user?.user_metadata?.avatar_url || ''
  const initials = displayName.slice(0, 1).toUpperCase()

  const handleNavClick = (item: NavItem) => {
    setActiveNav(item.id)
  }

  return (
    <div className="bu-web-app flex h-screen overflow-hidden bg-[#05040a] text-zinc-100">
      <aside className="bu-web-sidebar" aria-label="Sidebar navigation">
        <div className="bu-web-sidebar-brand">
          <img src={logoImage} alt="Between Us" className="h-7 w-auto max-w-[150px] object-contain" />
        </div>

        <nav className="bu-web-sidebar-nav" aria-label="App">
          {NAV_ITEMS.filter((item) => item.id !== 'write').map((item) => {
            const Icon = item.icon
            const isActive = activeNav === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item)}
                className={`bu-web-nav-item ${isActive ? 'is-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="bu-web-sidebar-profile">
          <button
            type="button"
            onClick={() => setActiveNav('profile')}
            className="bu-web-profile-btn"
            aria-label="View profile"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="bu-web-profile-avatar" />
            ) : (
              <span className="bu-web-profile-avatar bu-web-profile-avatar--fallback">{initials}</span>
            )}
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-medium text-zinc-100">{displayName}</span>
              <span className="block truncate text-xs text-fuchsia-300/80">View profile</span>
            </span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bu-web-header">
          <div className="bu-web-mobile-header-logo items-center gap-3">
            <img src={logoImage} alt="Between Us" className="h-6 w-auto max-w-[130px] object-contain" />
          </div>

          <div className="bu-web-header-main">
            <h1 className="bu-web-page-title font-[Syne,system-ui,sans-serif] text-xl font-semibold text-white">
              {PAGE_TITLES[activeNav]}
            </h1>
            {activeNav === 'home' && (
              <button
                type="button"
                onClick={() => setActiveNav('write')}
                className="bu-web-header-cta hidden sm:inline-flex"
              >
                <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
                Write a Story
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setActiveNav('write')}
            className="bu-web-mobile-write rounded-xl bg-gradient-to-r from-fuchsia-500 to-orange-400 px-3 py-1.5 text-xs font-semibold text-white"
          >
            Write
          </button>
        </header>

        <div className="bu-web-body">
          <main className="bu-web-main min-h-0 flex-1 overflow-y-auto">
            <div className="bu-web-main-inner">
              <Suspense
                fallback={(
                  <div className="flex h-full items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-fuchsia-400" />
                  </div>
                )}
              >
                {children}
              </Suspense>
            </div>
          </main>

          <aside className="bu-web-rail" aria-label="Insights">
            <DailyStreakPanel refreshKey={streakRefreshKey} />
            <ImpactPanel />
            <TrendingTopicsPanel />
          </aside>
        </div>

        <nav className="bu-web-mobile-nav shrink-0 border-t border-white/8 bg-[#0b0912]" aria-label="Mobile">
          {[
            { nav: 'home' as WebNavId, icon: Home, label: 'Home' },
            { nav: 'stories' as WebNavId, icon: Globe, label: 'Stories' },
            { nav: 'write' as WebNavId, icon: PenSquare, label: 'Write' },
            { nav: 'activity' as WebNavId, icon: Activity, label: 'Activity' },
            { nav: 'profile' as WebNavId, icon: User, label: 'Profile' },
          ].map(({ nav, icon: Icon, label }) => (
            <button
              key={nav}
              type="button"
              onClick={() => setActiveNav(nav)}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] ${
                activeNav === nav ? 'text-fuchsia-300' : 'text-zinc-500'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}

export function navToTab(nav: WebNavId): AppTab {
  const item = NAV_ITEMS.find((entry) => entry.id === nav)
  return item?.tab ?? 'discover'
}

export function navCommunityView(nav: WebNavId): 'all' | 'saved' {
  const item = NAV_ITEMS.find((entry) => entry.id === nav)
  return item?.communityView ?? 'all'
}
