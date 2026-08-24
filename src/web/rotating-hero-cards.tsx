import { useCallback, useEffect, useRef, useState } from 'react'
import { HERO_PREVIEW_INITIAL, HERO_PREVIEW_POOL, type HeroPreviewCard } from './hero-preview-cards'

type DeckRole =
  | 'front'
  | 'middle'
  | 'back'
  | 'middle-mobile'
  | 'exiting'
  | 'entering-back'

const DEAL_MS = 850
const PAUSE_MS = 4200

type DeckTriple = [HeroPreviewCard, HeroPreviewCard, HeroPreviewCard]

interface DeckLayer {
  card: HeroPreviewCard
  role: DeckRole
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return reduced
}

function useIsMobileHero(): boolean {
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const sync = () => setMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return mobile
}

function buildLayers(
  deck: DeckTriple,
  phase: 'idle' | 'dealing',
  exitingCard: HeroPreviewCard | null,
  incomingCard: HeroPreviewCard | null,
  isMobile: boolean,
): DeckLayer[] {
  if (phase === 'dealing' && exitingCard && incomingCard) {
    const layers: DeckLayer[] = []
    if (!isMobile) {
      layers.push({ card: incomingCard, role: 'entering-back' })
    }
    layers.push({ card: deck[2], role: isMobile ? 'middle-mobile' : 'middle' })
    layers.push({ card: deck[1], role: 'front' })
    layers.push({ card: exitingCard, role: 'exiting' })
    return layers
  }

  const layers: DeckLayer[] = [
    { card: deck[1], role: isMobile ? 'middle-mobile' : 'middle' },
    { card: deck[0], role: 'front' },
  ]
  if (!isMobile) {
    layers.unshift({ card: deck[2], role: 'back' })
  }
  return layers
}

interface RotatingHeroCardsProps {
  onExplore: () => void
}

export function RotatingHeroCards({ onExplore }: RotatingHeroCardsProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const isMobile = useIsMobileHero()
  const poolIndexRef = useRef(HERO_PREVIEW_INITIAL.length)
  const dealingRef = useRef(false)
  const deckRef = useRef<DeckTriple>([
    HERO_PREVIEW_INITIAL[0],
    HERO_PREVIEW_INITIAL[1],
    HERO_PREVIEW_INITIAL[2],
  ])

  const [deck, setDeck] = useState<DeckTriple>(() => deckRef.current)
  const [phase, setPhase] = useState<'idle' | 'dealing'>('idle')
  const [exitingCard, setExitingCard] = useState<HeroPreviewCard | null>(null)
  const [incomingCard, setIncomingCard] = useState<HeroPreviewCard | null>(null)

  deckRef.current = deck

  const dealNext = useCallback(() => {
    if (dealingRef.current) return

    const current = deckRef.current
    const nextCard = HERO_PREVIEW_POOL[poolIndexRef.current % HERO_PREVIEW_POOL.length]
    poolIndexRef.current += 1

    if (prefersReducedMotion) {
      setDeck([current[1], current[2], nextCard])
      return
    }

    dealingRef.current = true
    setExitingCard(current[0])
    setIncomingCard(nextCard)
    setPhase('dealing')

    window.setTimeout(() => {
      setDeck([current[1], current[2], nextCard])
      setExitingCard(null)
      setIncomingCard(null)
      setPhase('idle')
      dealingRef.current = false
    }, DEAL_MS)
  }, [prefersReducedMotion])

  useEffect(() => {
    let timeoutId = 0
    let cancelled = false

    const runCycle = () => {
      timeoutId = window.setTimeout(() => {
        if (cancelled) return
        dealNext()
        timeoutId = window.setTimeout(() => {
          if (!cancelled) runCycle()
        }, DEAL_MS + PAUSE_MS)
      }, PAUSE_MS)
    }

    runCycle()
    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [dealNext])

  const layers = buildLayers(deck, phase, exitingCard, incomingCard, isMobile)

  return (
    <div
      className={`bu-hero-deck${isMobile ? ' bu-hero-deck--mobile' : ''}${prefersReducedMotion ? ' bu-hero-deck--static' : ''}`}
      aria-label="Story previews"
      aria-live="polite"
    >
      {layers.map(({ card, role }) => (
        <DeckCard key={card.id} card={card} role={role} onExplore={onExplore} />
      ))}
    </div>
  )
}

function DeckCard({
  card,
  role,
  onExplore,
}: {
  card: HeroPreviewCard
  role: DeckRole
  onExplore: () => void
}) {
  return (
    <article className={`bu-hero-deck-card bu-hero-deck-card--${role} bu-hero-deck-card--accent-${card.accent}`}>
      <div className="bu-story-card-meta">
        <span>Anonymous</span>
      </div>
      <p className="bu-story-card-body">{card.content}</p>
      <div className="bu-story-card-actions">
        <button type="button" className="bu-story-card-link" onClick={onExplore}>
          Read more
        </button>
      </div>
    </article>
  )
}
