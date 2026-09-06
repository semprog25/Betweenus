import {
  canRenderAdSlot,
  type AdPlacement,
  ADSENSE_CLIENT_ID,
  ADSENSE_SLOTS,
} from './adsenseConfig'

interface AdSlotProps {
  placement: AdPlacement
  className?: string
  /** Reserved height to reduce CLS when ads are enabled later */
  minHeight?: number
}

/**
 * Journal AdSense slot — disabled by default.
 * Does not load adsbygoogle until configured + consent.
 * Returns null when disabled (no empty containers).
 */
export function AdSlot({ placement, className = '', minHeight = 0 }: AdSlotProps) {
  const enabled = canRenderAdSlot(placement)
  if (!enabled) return null

  const slotId = ADSENSE_SLOTS[placement]
  return (
    <aside
      className={`bu-ad-slot bu-ad-slot--live ${className}`.trim()}
      data-ad-placement={placement}
      aria-label="Advertisement"
      style={minHeight > 0 ? { minHeight } : undefined}
    >
      <ins
        className="adsbygoogle"
        style={{ display: 'block', maxWidth: '100%' }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  )
}
