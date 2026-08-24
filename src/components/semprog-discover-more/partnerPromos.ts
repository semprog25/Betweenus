/**
 * Semprog partner app catalog — keep in sync with https://semprog.de/ slidesData.
 * When adding a new Semprog app, add an entry here and a matching theme in SemprogDiscoverMoreCarousel.tsx.
 */
export interface PartnerPromo {
  id: string
  name: string
  logo?: string
  nameLogo?: string
  logoText?: string
  link: string
  tagline: string
  bait: string
  theme: string
  lightText?: boolean
}

export const SEMPROG_PARTNER_PROMOS: PartnerPromo[] = [
  {
    id: 'seadays',
    name: 'SeaDays',
    logo: 'https://soqkgrfzluewpuiguypm.supabase.co/storage/v1/object/sign/seadays_storage/seadays.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MTZlZmJjMy0xODA3LTRjNDItYjI4MC1mZTA1NmI4ZDlkZWEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzZWFkYXlzX3N0b3JhZ2Uvc2VhZGF5cy5wbmciLCJpYXQiOjE3NjQ1MzE3ODIsImV4cCI6MzM0MTMzMTc4Mn0.EVBfh3N7AW_MYdpPizc5eVqVMkzubXPrIgUWm2aAtYc',
    link: 'https://seadays.app/',
    tagline: 'Your Ultimate Cruise Planning Companion',
    bait: 'Cruise Mode: ON 🚢 The ultimate hack for stress-free planning is here.',
    theme: 'seadays',
    lightText: true,
  },
  {
    id: 'dexora',
    name: 'Dexora',
    logo: 'https://ncnjkrjpxkbceetnxsjl.supabase.co/storage/v1/object/public/S3/Dexora.png',
    link: 'https://www.dexora.app/',
    tagline: 'Your offline Pokémon GO companion',
    bait: 'Your offline Pokémon GO companion',
    theme: 'dexora',
    lightText: true,
  },
  {
    id: 'anspry',
    name: 'Anspry',
    logo: 'https://anspry.de/anspry-logo-mark.png',
    link: 'https://anspry.de/',
    tagline: "Find what you're owed.",
    bait: 'Money left on the table? 💰 Refunds, compensation, and valid challenges — sorted.',
    theme: 'anspry',
    lightText: true,
  },
  {
    id: 'skister',
    name: 'Skister',
    logo: 'https://ayomhapkzckbhgwxenwr.supabase.co/storage/v1/object/public/SkisterApp/SkisterLogoWeb.png',
    link: 'https://skister.app/',
    tagline: 'Share ski gear with people you trust',
    bait: 'Share ski gear with people you trust 🎿 Invite-only, free in your private network.',
    theme: 'skister',
    lightText: true,
  },
  {
    id: 'between-us',
    name: 'Between Us',
    logo: 'https://qoqbdiixztolvtcjdnle.supabase.co/storage/v1/object/sign/betweenus3/betweenus.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lMTYxZDg1My1iMGRlLTRkNjQtYTQxYS0xNTY5MmFmMGJhNWEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJiZXR3ZWVudXMzL2JldHdlZW51cy5wbmciLCJpYXQiOjE3NjQ1MzE5NjMsImV4cCI6MzM0MTMzMTk2M30.Y2YtSYTaspr-sUaFpli7ghszWt8nZjictCRJX2wkbGw',
    link: 'https://betweenus.fun/',
    tagline: 'Your Safe Space for Mental Wellness',
    bait: 'Secrets are heavy. 🤫 Dump your gossip anonymously or discover what others are hiding.',
    theme: 'between-us',
    lightText: true,
  },
  {
    id: 'callio',
    name: 'Callio',
    logo: 'https://qoqbdiixztolvtcjdnle.supabase.co/storage/v1/object/public/Storage/Calli0logo.png',
    link: 'https://trycallio.app/',
    tagline: 'Stay Anonymous on Every Call',
    bait: 'Want privacy on every call? 📞 Random names in your log — your real contacts stay hidden.',
    theme: 'callio',
    lightText: true,
  },
  {
    id: 'pixxy',
    name: 'Pixxy',
    logo: 'https://ncnjkrjpxkbceetnxsjl.supabase.co/storage/v1/object/public/S3/pixxy.png',
    link: 'https://pixxy.semprog.de/index.html',
    tagline: 'Gamified Photography Learning',
    bait: 'Level up your shots 📸 Gamified photography learning and photosharing — coming soon.',
    theme: 'pixxy',
    lightText: true,
  },
  {
    id: 'the-allocation',
    name: 'The Allocation',
    logoText: 'THE ALLOCATION',
    link: 'https://semprog25.github.io/Theallocation/',
    tagline: 'Access Is Allocated.',
    bait: 'Rare assets. Private access. 🥃 Whisky casks, hypercars — invitation by application only.',
    theme: 'allocation',
    lightText: true,
  },
  {
    id: 'glamgenie',
    name: 'GlamGenie',
    logo: 'https://qoqbdiixztolvtcjdnle.supabase.co/storage/v1/object/public/Nisha/GlamGenie2026.png',
    link: 'https://glamgenie.in/',
    tagline: 'Book your glow, on the Go!',
    bait: 'Book your glow, on the Go! 💄 Premium beauty services at your doorstep — Pan-India.',
    theme: 'glamgenie',
    lightText: true,
  },
  {
    id: 'broken',
    name: 'Broken',
    logo: 'https://aktlnldjuvrhrragkzbz.supabase.co/storage/v1/object/public/brokenbucket/Broken%20White.svg',
    link: 'https://broken.semprog.de/',
    tagline: "You're Not Broken. You're Breaking Through.",
    bait: "Heartbroken? 💔 Don't text your ex. Chat with people who actually get it.",
    theme: 'broken',
    lightText: true,
  },
]
