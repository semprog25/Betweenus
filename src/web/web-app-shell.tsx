import { Suspense, type ReactNode } from 'react'
import {
  Bookmark,
  CheckCircle,
  Globe,
  Home,
  Loader2,
  LogOut,
  MessageSquarePlus,
  PenSquare,
  Settings,
  User,
} from 'lucide-react'
import logoImage from '../assets/betweenus-logo.png'
import type { User as AuthUser } from '../utils/auth'

export type AppTab = 'discover' | 'share' | 'checkin' | 'community' | 'profile'

interface NavItem {
  id: AppTab | 'home' | 'write' | 'settings'
  label: string
  icon: typeof Home
  tab: AppTab
  disabled?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home, tab: 'discover' },
  { id: 'community', label: 'Stories', icon: Globe, tab: 'community' },
  { id: 'write', label: 'Write a Story', icon: PenSquare, tab: 'share' },
  { id: 'checkin', label: 'Check-in', icon: CheckCircle, tab: 'checkin' },
  { id: 'profile', label: 'Profile', icon: User, tab: 'profile' },
  { id: 'settings', label: 'Settings', icon: Settings, tab: 'profile' },
]

interface WebAppShellProps {
  activeTab: AppTab
  setActiveTab: (tab: AppTab) => void
  user: AuthUser | null
  onSignOut: () => void
  children: ReactNode
}

export function WebAppShell({ activeTab, setActiveTab, user, onSignOut, children }: WebAppShellProps) {
  const displayName = user?.user_metadata?.public_username
    || user?.user_metadata?.name
    || user?.email?.split('@')[0]
    || 'Member'

  return (
    <div className="flex h-screen overflow-hidden bg-[#07060c] text-zinc-100">
      <aside className="bu-web-sidebar">
        <div className="border-b border-white/8 px-4 py-4">
          <img src={logoImage} alt="Between Us" className="h-7 w-auto max-w-[150px] object-contain" />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="App">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const showActive = item.id === 'home' || item.id === 'discover'
              ? activeTab === 'discover' && item.id === 'home'
              : item.id === 'write'
                ? activeTab === 'share'
                : activeTab === item.tab

            return (
              <button
                key={item.id}
                type="button"
                disabled={item.disabled}
                onClick={() => setActiveTab(item.tab)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  showActive
                    ? 'bg-fuchsia-500/15 text-fuchsia-100'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                } disabled:opacity-40`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {item.label}
              </button>
            )
          })}
          <div className="px-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('share')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-orange-400 px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/20"
            >
              <MessageSquarePlus className="h-4 w-4" />
              Write a Story
            </button>
          </div>
        </nav>
        <div className="border-t border-white/8 p-3">
          <div className="mb-2 truncate px-2 text-sm font-medium text-zinc-200">{displayName}</div>
          <div className="mb-3 truncate px-2 text-xs text-zinc-500">{user?.email}</div>
          <button
            type="button"
            onClick={onSignOut}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/8 bg-[#0b0912]/90 px-4 backdrop-blur lg:px-6">
          <div className="bu-web-mobile-header-logo items-center gap-3">
            <img src={logoImage} alt="Between Us" className="h-6 w-auto max-w-[130px] object-contain" />
          </div>
          <h1 className="bu-web-page-title font-[Syne,system-ui,sans-serif] text-lg font-semibold text-white">
            {activeTab === 'share' ? 'Write a Story' : activeTab === 'discover' ? 'Home' : activeTab === 'community' ? 'Stories' : activeTab === 'checkin' ? 'Check-in' : 'Profile'}
          </h1>
          <button
            type="button"
            onClick={() => setActiveTab('share')}
            className="bu-web-mobile-write rounded-xl bg-gradient-to-r from-fuchsia-500 to-orange-400 px-3 py-1.5 text-xs font-semibold text-white"
          >
            Write
          </button>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto h-full max-w-3xl">
            <Suspense
              fallback={(
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-fuchsia-400" />
                </div>
              )}
            >
              {children}
            </Suspense>
          </div>
        </main>

        <nav className="bu-web-mobile-nav shrink-0 border-t border-white/8 bg-[#0b0912]" aria-label="Mobile">
          {[
            { tab: 'discover' as AppTab, icon: Home, label: 'Home' },
            { tab: 'community' as AppTab, icon: Globe, label: 'Stories' },
            { tab: 'share' as AppTab, icon: PenSquare, label: 'Write' },
            { tab: 'checkin' as AppTab, icon: CheckCircle, label: 'Check-in' },
            { tab: 'profile' as AppTab, icon: User, label: 'Profile' },
          ].map(({ tab, icon: Icon, label }) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] ${
                activeTab === tab ? 'text-fuchsia-300' : 'text-zinc-500'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      <aside className="bu-web-rail">
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">
            <Bookmark className="h-4 w-4 text-fuchsia-400" />
            Tips
          </div>
          <p className="text-xs leading-relaxed text-zinc-500">
            Stay anonymous in public. Vote and reply with care. Your private check-ins never appear on the public site.
          </p>
        </div>
      </aside>
    </div>
  )
}
