/** Homepage featured section — marketing cards, not live feed. */
export interface FeaturedStoryCard {
  id: string
  hook: string
  tag: string
}

export const FEATURED_STORY_CARDS: FeaturedStoryCard[] = [
  {
    id: 'feat-1',
    hook: 'The secret I have never told my best friend.',
    tag: 'Friendship',
  },
  {
    id: 'feat-2',
    hook: 'I found something on my partner\'s phone.',
    tag: 'Relationships',
  },
  {
    id: 'feat-3',
    hook: 'Nobody knows why I really left.',
    tag: 'Moving on',
  },
  {
    id: 'feat-4',
    hook: 'I have been pretending everything is fine.',
    tag: 'Hidden truth',
  },
  {
    id: 'feat-5',
    hook: 'My crush has no idea what I almost said.',
    tag: 'Crushes',
  },
  {
    id: 'feat-6',
    hook: 'We said we were just friends. That was a lie.',
    tag: 'Secrets',
  },
]
