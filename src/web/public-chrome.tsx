import logoImage from '../assets/betweenus-logo.png'
import type { PublicPath } from './public-path'

export const PUBLIC_PRIMARY_NAV: Array<{
  name: PublicPath['name']
  label: string
  href?: string
}> = [
  { name: 'stories', label: 'Stories', href: '/stories' },
  { name: 'features', label: 'Features', href: '/features' },
  { name: 'journal', label: 'Journal', href: '/journal/' },
  { name: 'guides', label: 'Guides', href: '/guides/' },
  { name: 'download', label: 'Download', href: '/download' },
]

export const PUBLIC_FOOTER_NAV: Array<{
  name: PublicPath['name']
  label: string
  href?: string
}> = [
  ...PUBLIC_PRIMARY_NAV,
  { name: 'journey', label: 'Journey', href: '/journey' },
  { name: 'privacy', label: 'Privacy', href: '/privacy' },
  { name: 'terms', label: 'Terms', href: '/terms' },
  { name: 'support', label: 'Support', href: '/support' },
]

export function PublicAtmosphere() {
  return (
    <div className="bu-public-atmosphere" aria-hidden="true">
      <div className="bu-public-atmosphere-radials" />
      <div className="bu-public-atmosphere-glow bu-public-atmosphere-glow--purple" />
      <div className="bu-public-atmosphere-glow bu-public-atmosphere-glow--violet" />
      <div className="bu-public-atmosphere-glow bu-public-atmosphere-glow--orange" />
      <div className="bu-public-atmosphere-glow bu-public-atmosphere-glow--pink" />
      <div className="bu-public-atmosphere-stars" />
      <div className="bu-public-atmosphere-dots" />
    </div>
  )
}

interface PublicHeaderProps {
  currentPath: PublicPath
  mobileNavOpen: boolean
  onToggleMobileNav: () => void
  onNavigate: (path: PublicPath) => void
  onOpenAuth: (mode: 'login' | 'signup') => void
}

export function PublicHeader({
  currentPath,
  mobileNavOpen,
  onToggleMobileNav,
  onNavigate,
  onOpenAuth,
}: PublicHeaderProps) {
  const isCurrent = (name: PublicPath['name']) => {
    if (name === 'journal') return currentPath.name === 'journal' || currentPath.name === 'journalArticle'
    if (name === 'features') return currentPath.name === 'features' || currentPath.name === 'feature'
    if (name === 'guides') return currentPath.name === 'guides' || currentPath.name === 'guide'
    return currentPath.name === name
  }

  return (
    <header className="bu-public-header">
      <div className="bu-public-shell bu-public-header-inner">
        <button
          type="button"
          onClick={() => onNavigate({ name: 'home' })}
          className="bu-public-logo-btn"
          aria-label="Between Us home"
        >
          <img src={logoImage} alt="Between Us" className="bu-public-logo-img" />
        </button>

        <nav className="bu-public-nav-desktop" aria-label="Primary">
          {PUBLIC_PRIMARY_NAV.map(({ name, label }) => (
            <button
              key={name}
              type="button"
              onClick={() => onNavigate({ name })}
              aria-current={isCurrent(name) ? 'page' : undefined}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="bu-public-header-actions">
          <button type="button" onClick={() => onOpenAuth('login')} className="bu-public-login-btn">
            Log in
          </button>
          <button type="button" onClick={() => onOpenAuth('signup')} className="bu-public-signup-btn">
            Sign up
          </button>
          <button
            type="button"
            className="bu-public-nav-toggle"
            aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileNavOpen}
            onClick={onToggleMobileNav}
          >
            ☰
          </button>
        </div>
      </div>
      {mobileNavOpen && (
        <div className="bu-public-mobile-menu">
          {PUBLIC_PRIMARY_NAV.map(({ name, label }) => (
            <button key={name} type="button" onClick={() => onNavigate({ name })}>
              {label}
            </button>
          ))}
          <button type="button" onClick={() => onOpenAuth('login')}>Log in</button>
          <button type="button" onClick={() => onOpenAuth('signup')}>Sign up</button>
        </div>
      )}
    </header>
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

interface PublicFooterProps {
  onNavigate: (path: PublicPath) => void
  hiddenOnHome?: boolean
  variant?: 'default' | 'home'
}

export function PublicFooter({
  onNavigate,
  hiddenOnHome = false,
  variant = 'default',
}: PublicFooterProps) {
  if (hiddenOnHome) return null

  return (
    <footer className={`bu-public-footer${variant === 'home' ? ' bu-public-footer--home' : ''}`}>
      <div className="bu-public-footer-bar">
        <div className="bu-public-shell bu-public-footer-inner">
          <div className="bu-public-footer-brand">
            <button
              type="button"
              onClick={() => onNavigate({ name: 'home' })}
              className="bu-public-footer-logo-btn"
              aria-label="Between Us home"
            >
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
            {PUBLIC_FOOTER_NAV.map(({ name, label }) => (
              <button key={name} type="button" onClick={() => onNavigate({ name })}>
                {label}
              </button>
            ))}
          </nav>

          <p className="bu-public-footer-copy">
            © {new Date().getFullYear()} Between Us
            <span className="bu-public-footer-credit">Developed and built by{" "}<a href="https://semprog.de" target="_blank" rel="noopener" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: "2px" }}>SEMPROG</a></span>
          </p>
        </div>
      </div>
    </footer>
  )
}
