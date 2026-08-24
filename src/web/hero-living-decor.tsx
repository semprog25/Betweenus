import { Heart, Sparkles, Star } from 'lucide-react'
import { useMemo } from 'react'

type DecorKind = 'heart' | 'star' | 'sparkle' | 'dot'
type DecorColor = 'magenta' | 'violet' | 'pink' | 'purple' | 'orange'

interface LivingDecorSpec {
  id: string
  kind: DecorKind
  color: DecorColor
  top: string
  left: string
  size: number
  duration: number
  delay: number
  drift: 'a' | 'b' | 'c'
  mobile?: boolean
}

const DESKTOP_SPECS: LivingDecorSpec[] = [
  { id: 'd1', kind: 'heart', color: 'magenta', top: '7%', left: '5%', size: 22, duration: 11, delay: 0, drift: 'a' },
  { id: 'd2', kind: 'sparkle', color: 'violet', top: '12%', left: '34%', size: 18, duration: 8.5, delay: 1.2, drift: 'b' },
  { id: 'd3', kind: 'star', color: 'pink', top: '5%', left: '72%', size: 16, duration: 9.5, delay: 0.4, drift: 'c' },
  { id: 'd4', kind: 'dot', color: 'purple', top: '20%', left: '58%', size: 6, duration: 7, delay: 2.1, drift: 'a' },
  { id: 'd5', kind: 'dot', color: 'orange', top: '16%', left: '88%', size: 5, duration: 6.5, delay: 0.8, drift: 'b' },
  { id: 'd6', kind: 'heart', color: 'pink', top: '28%', left: '91%', size: 20, duration: 10, delay: 1.6, drift: 'c', mobile: true },
  { id: 'd7', kind: 'sparkle', color: 'orange', top: '34%', left: '78%', size: 20, duration: 8, delay: 2.4, drift: 'a' },
  { id: 'd8', kind: 'star', color: 'violet', top: '42%', left: '62%', size: 14, duration: 9, delay: 0.2, drift: 'b' },
  { id: 'd9', kind: 'dot', color: 'magenta', top: '48%', left: '12%', size: 7, duration: 7.5, delay: 1.8, drift: 'c' },
  { id: 'd10', kind: 'star', color: 'orange', top: '52%', left: '44%', size: 12, duration: 11.5, delay: 3, drift: 'a' },
  { id: 'd11', kind: 'heart', color: 'violet', top: '58%', left: '82%', size: 18, duration: 8.8, delay: 1.1, drift: 'b' },
  { id: 'd12', kind: 'dot', color: 'pink', top: '64%', left: '28%', size: 5, duration: 6.2, delay: 2.7, drift: 'c' },
  { id: 'd13', kind: 'sparkle', color: 'magenta', top: '68%', left: '52%', size: 16, duration: 9.2, delay: 0.6, drift: 'a' },
  { id: 'd14', kind: 'star', color: 'purple', top: '74%', left: '68%', size: 15, duration: 10.5, delay: 2.2, drift: 'b' },
  { id: 'd15', kind: 'dot', color: 'orange', top: '78%', left: '8%', size: 6, duration: 7.8, delay: 1.4, drift: 'c', mobile: true },
  { id: 'd16', kind: 'heart', color: 'magenta', top: '18%', left: '18%', size: 16, duration: 8.2, delay: 3.2, drift: 'b', mobile: true },
  { id: 'd17', kind: 'sparkle', color: 'violet', top: '36%', left: '6%', size: 14, duration: 9.8, delay: 0.9, drift: 'a' },
  { id: 'd18', kind: 'star', color: 'pink', top: '82%', left: '38%', size: 13, duration: 10.2, delay: 2.5, drift: 'c' },
]

function DecorIcon({ kind, size }: { kind: DecorKind; size: number }) {
  if (kind === 'heart') return <Heart size={size} strokeWidth={1.75} />
  if (kind === 'sparkle') return <Sparkles size={size} strokeWidth={1.75} />
  if (kind === 'star') return <Star size={size} strokeWidth={1.75} />
  return null
}

export function HeroLivingDecor() {
  const specs = useMemo(() => DESKTOP_SPECS, [])

  return (
    <div className="bu-hero-decor" aria-hidden="true">
      {specs.map((spec) => (
        <span
          key={spec.id}
          className={[
            'bu-hero-decor-particle',
            `bu-hero-decor-particle--${spec.kind}`,
            `bu-hero-decor-particle--color-${spec.color}`,
            `bu-hero-decor-particle--drift-${spec.drift}`,
            spec.mobile ? 'bu-hero-decor-particle--mobile' : 'bu-hero-decor-particle--desktop-only',
          ].join(' ')}
          style={{
            top: spec.top,
            left: spec.left,
            ['--bu-decor-size' as string]: `${spec.size}px`,
            ['--bu-decor-duration' as string]: `${spec.duration}s`,
            ['--bu-decor-delay' as string]: `${spec.delay}s`,
          }}
        >
          {spec.kind !== 'dot' && <DecorIcon kind={spec.kind} size={spec.size} />}
        </span>
      ))}
    </div>
  )
}
