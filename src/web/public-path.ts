export type PublicPath =
  | { name: 'home' }
  | { name: 'stories' }
  | { name: 'story'; id: string }
  | { name: 'download' }
  | { name: 'privacy' }
  | { name: 'terms' }
  | { name: 'support' }
  | { name: 'about' }

export function parsePublicPath(pathname: string = window.location.pathname): PublicPath {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/stories') return { name: 'stories' }
  if (path === '/download') return { name: 'download' }
  if (path === '/privacy') return { name: 'privacy' }
  if (path === '/terms') return { name: 'terms' }
  if (path === '/support') return { name: 'support' }
  if (path === '/about') return { name: 'about' }
  const storyMatch = path.match(/^\/story\/([^/]+)$/)
  if (storyMatch) return { name: 'story', id: decodeURIComponent(storyMatch[1]) }
  return { name: 'home' }
}

export function pathToHref(path: PublicPath): string {
  switch (path.name) {
    case 'home':
      return '/'
    case 'stories':
      return '/stories'
    case 'story':
      return `/story/${encodeURIComponent(path.id)}`
    case 'download':
      return '/download'
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
