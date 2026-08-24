/** Curated marketing previews — not tied to the live public feed API. */
export type HeroCardAccent =
  | 'magenta'
  | 'coral'
  | 'violet'
  | 'teal'
  | 'blue-violet'
  | 'warm-pink'

export interface HeroPreviewCard {
  id: string
  content: string
  accent: HeroCardAccent
}

export const HERO_PREVIEW_POOL: HeroPreviewCard[] = [
  {
    id: 'hero-1',
    content: "I found my partner's secret phone. What I discovered changed everything.",
    accent: 'magenta',
  },
  {
    id: 'hero-2',
    content: "I'm falling in love with my best friend and I don't know what to do.",
    accent: 'warm-pink',
  },
  {
    id: 'hero-3',
    content: "Nobody knows why I really left my last relationship.",
    accent: 'violet',
  },
  {
    id: 'hero-4',
    content: "I've been pretending everything is fine at home for months.",
    accent: 'blue-violet',
  },
  {
    id: 'hero-5',
    content: "My coworker doesn't know I saw the messages on their screen.",
    accent: 'teal',
  },
  {
    id: 'hero-6',
    content: "The secret I have never told my best friend is eating me alive.",
    accent: 'coral',
  },
  {
    id: 'hero-7',
    content: "I think my partner is still talking to their ex. I haven't said a word.",
    accent: 'magenta',
  },
  {
    id: 'hero-8',
    content: "We agreed to keep it casual. I lied — I'm completely in love.",
    accent: 'warm-pink',
  },
  {
    id: 'hero-9',
    content: "I matched with someone I definitely should not have matched with.",
    accent: 'violet',
  },
  {
    id: 'hero-10',
    content: "My family thinks we broke up. We didn't. We just stopped telling them.",
    accent: 'blue-violet',
  },
  {
    id: 'hero-11',
    content: "I know who sent the anonymous note. I haven't told anyone yet.",
    accent: 'teal',
  },
  {
    id: 'hero-12',
    content: "I've never told anyone what really happened that night.",
    accent: 'coral',
  },
]

/** Initial three visible hero slots (first slice of pool). */
export const HERO_PREVIEW_INITIAL = HERO_PREVIEW_POOL.slice(0, 3)
