export type PublicPath =
  | { name: 'home' }
  | { name: 'stories' }
  | { name: 'story'; id: string }
  | { name: 'journal' }
  | { name: 'journalArticle'; slug: string }
  | { name: 'features' }
  | { name: 'feature'; slug: string }
  | { name: 'guides' }
  | { name: 'guide'; slug: string }
  | { name: 'download' }
  | { name: 'journey' }
  | { name: 'privacy' }
  | { name: 'terms' }
  | { name: 'support' }
  | { name: 'about' }

/** Static Journal listing URL (directory index). */
export const JOURNAL_INDEX_HREF = '/journal/'

/** Canonical static article URL with trailing slash for GH Pages directories. */
export function journalArticleHref(slug: string): string {
  const clean = slug.replace(/^\/+|\/+$/g, '')
  return `/journal/${encodeURIComponent(clean)}/`
}

export function featureHref(slug?: string): string {
  if (!slug) return '/features'
  return `/features/${encodeURIComponent(slug)}`
}

export function guideHref(slug?: string): string {
  if (!slug) return '/guides/'
  return `/guides/${encodeURIComponent(slug)}`
}

/** Routes owned by static HTML on GitHub Pages (HTTP 200). */
export function isStaticOwnedPublicPath(path: PublicPath): boolean {
  switch (path.name) {
    case 'journal':
    case 'journalArticle':
    case 'features':
    case 'feature':
    case 'guides':
    case 'guide':
    case 'journey':
    case 'about':
    case 'download':
    case 'privacy':
    case 'terms':
    case 'support':
    case 'stories':
      return true
    default:
      return false
  }
}

export function parsePublicPath(pathname: string = window.location.pathname): PublicPath {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/journal') return { name: 'journal' }
  const journalArticleMatch = path.match(/^\/journal\/([^/]+)$/)
  if (journalArticleMatch && journalArticleMatch[1] !== 'index.html') {
    return { name: 'journalArticle', slug: decodeURIComponent(journalArticleMatch[1]) }
  }
  if (path === '/features') return { name: 'features' }
  const featureMatch = path.match(/^\/features\/([^/]+)$/)
  if (featureMatch) return { name: 'feature', slug: decodeURIComponent(featureMatch[1]) }
  if (path === '/guides') return { name: 'guides' }
  const guideMatch = path.match(/^\/guides\/([^/]+)$/)
  if (guideMatch) return { name: 'guide', slug: decodeURIComponent(guideMatch[1]) }
  if (path === '/stories') return { name: 'stories' }
  if (path === '/download') return { name: 'download' }
  if (path === '/journey') return { name: 'journey' }
  if (path === '/privacy') return { name: 'privacy' }
  if (path === '/terms') return { name: 'terms' }
  if (path === '/support') return { name: 'support' }
  if (path === '/about') return { name: 'about' }
  const storyMatch = path.match(/^\/story\/([^/]+)$/)
  if (storyMatch) return { name: 'story', id: decodeURIComponent(storyMatch[1]) }
  return { name: 'home' }
}

/**
 * GitHub Pages has no SPA rewrite. `public/404.html` redirects unknown paths to
 * `/?p=<original-path-without-leading-slash>`. Restore that path before routing.
 * Returns the restored pathname, or null when no fallback param is present.
 */
export function restoreGithubPagesSpaPath(): string | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const encoded = params.get('p')
  if (!encoded) return null

  let decoded = encoded
  try {
    decoded = decodeURIComponent(encoded)
  } catch {
    // keep raw
  }
  const restoredPath = `/${decoded.replace(/^\/+/, '')}`
  const hash = window.location.hash || ''
  window.history.replaceState({}, '', `${restoredPath}${hash}`)
  return restoredPath.replace(/\/+$/, '') || '/'
}

/** Parse the current location, after applying the GitHub Pages `?p=` restore when needed. */
export function resolvePublicPath(): PublicPath {
  restoreGithubPagesSpaPath()
  return parsePublicPath()
}

export function pathToHref(path: PublicPath): string {
  switch (path.name) {
    case 'home':
      return '/'
    case 'stories':
      return '/stories'
    case 'journal':
      return JOURNAL_INDEX_HREF
    case 'journalArticle':
      return journalArticleHref(path.slug)
    case 'features':
      return featureHref()
    case 'feature':
      return featureHref(path.slug)
    case 'guides':
      return guideHref()
    case 'guide':
      return guideHref(path.slug)
    case 'story':
      return `/story/${encodeURIComponent(path.id)}`
    case 'download':
      return '/download'
    case 'journey':
      return '/journey'
    case 'privacy':
      return '/privacy'
    case 'terms':
      return '/terms'
    case 'support':
      return '/support'
    case 'about':
      return '/about'
  }
}

export function navigatePublic(path: PublicPath, replace = false) {
  const href = pathToHref(path)
  if (replace) window.history.replaceState({}, '', href)
  else window.history.pushState({}, '', href)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
