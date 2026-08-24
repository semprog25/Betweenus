export interface JournalPreviewCard {
  id: string
  title: string
  copy: string
  theme: 'rose' | 'violet' | 'sunset' | 'ocean'
  imageUrl: string
  imageAlt: string
}

export const JOURNAL_PREVIEW_CARDS: JournalPreviewCard[] = [
  {
    id: 'journal-1',
    title: 'Healing After a Breakup',
    copy: 'What it looks like to rebuild trust in yourself when a relationship ends.',
    theme: 'rose',
    imageUrl: '/assets/journal/healing-breakup.jpg',
    imageAlt: 'Person sitting alone by a window, reflecting after a breakup',
  },
  {
    id: 'journal-2',
    title: 'When Friendship Hurts',
    copy: 'The quiet moments when someone close becomes the hardest person to talk to.',
    theme: 'violet',
    imageUrl: '/assets/journal/friendship-hurts.jpg',
    imageAlt: 'Two friends sitting together in a thoughtful, distant moment',
  },
  {
    id: 'journal-3',
    title: 'Learning to Let Go',
    copy: 'Reflections on releasing what you cannot control — and finding peace anyway.',
    theme: 'sunset',
    imageUrl: '/assets/journal/learning-let-go.jpg',
    imageAlt: 'Mountain landscape at sunrise symbolizing peace and letting go',
  },
  {
    id: 'journal-4',
    title: 'The Power of Honest Conversations',
    copy: 'Why saying the unsaid out loud — even anonymously — can change everything.',
    theme: 'ocean',
    imageUrl: '/assets/journal/honest-conversations.jpg',
    imageAlt: 'People having an open, honest conversation together',
  },
]
