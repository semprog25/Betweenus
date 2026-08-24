/**
 * Optional: append a query param when opening your own marketing site from native
 * so cookie/consent banners can be skipped (SeaDays uses seadays_client=ios_app).
 */
export interface OwnedMarketingSiteConfig {
  hostname: string
  queryKey: string
  queryValue: string
}

export function withOwnedSiteClientParam(url: string, config?: OwnedMarketingSiteConfig): string {
  if (!config) return url
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')
    if (host !== config.hostname.replace(/^www\./, '')) return url
    parsed.searchParams.set(config.queryKey, config.queryValue)
    return parsed.toString()
  } catch {
    return url
  }
}

export async function openPromoLink(
  link: string,
  ownedSite?: OwnedMarketingSiteConfig
): Promise<void> {
  const url = withOwnedSiteClientParam(link, ownedSite)

  try {
    const { Capacitor } = await import('@capacitor/core')
    const { Browser } = await import('@capacitor/browser')
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url })
      return
    }
  } catch {
    // Capacitor not installed — web fallback below
  }

  window.open(url, '_blank', 'noopener,noreferrer')
}
