export interface JournalPreviewCard {
  id: string
  title: string
  copy: string
  theme: 'rose' | 'violet' | 'sunset' | 'ocean'
  imageUrl: string
  imageAlt: string
  href?: string
  slug?: string
}

export interface JournalHomeCardsPayload {
  generatedAt?: string
  articles: JournalPreviewCard[]
}

/**
 * Loads homepage Journal cards from the static generator output.
 * Empty array = tasteful empty state (no fabricated placeholders).
 */
export async function loadJournalHomeCards(): Promise<JournalPreviewCard[]> {
  try {
    const res = await fetch('/journal/home-cards.json', { cache: 'no-cache' })
    if (!res.ok) return []
    const data = (await res.json()) as JournalHomeCardsPayload
    if (!Array.isArray(data?.articles)) return []
    return data.articles.filter((card) => card?.title && card?.href)
  } catch {
    return []
  }
}
