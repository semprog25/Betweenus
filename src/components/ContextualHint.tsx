import { useEffect, useId, useState } from 'react'
import { X } from 'lucide-react'
import { useLanguage } from './LanguageContext'
import {
  type ContextualHintId,
  dismissContextualHint,
  isContextualHintDismissed,
  shouldShowContextualHints,
} from '../utils/onboarding-state'

interface ContextualHintProps {
  hintId: ContextualHintId
  /** When false, the hint is not evaluated (e.g. wrong tab). */
  active: boolean
}

const HINT_COPY_KEYS: Record<ContextualHintId, string> = {
  discover: 'hint.discover',
  share: 'hint.share',
  checkin: 'hint.checkin',
  community: 'hint.community',
}

/**
 * Lightweight first-visit coach mark. Non-blocking, dismissible, persisted.
 * Does not steal focus — dismiss control is keyboard-reachable via Tab.
 */
export function ContextualHint({ hintId, active }: ContextualHintProps) {
  const { t } = useLanguage()
  const titleId = useId()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!active) {
      setIsVisible(false)
      return
    }
    if (!shouldShowContextualHints()) {
      setIsVisible(false)
      return
    }
    if (isContextualHintDismissed(hintId)) {
      setIsVisible(false)
      return
    }
    setIsVisible(true)
  }, [active, hintId])

  const handleDismiss = () => {
    dismissContextualHint(hintId)
    setIsVisible(false)
  }

  if (!isVisible) return null

  const message = t(HINT_COPY_KEYS[hintId])

  return (
    <div
      role="status"
      aria-labelledby={titleId}
      className="pointer-events-auto mx-auto mb-2 w-full max-w-md px-3 sm:px-4"
    >
      <div className="relative flex items-center gap-2 rounded-xl border border-purple-500/25 bg-purple-950/85 px-3 py-1.5 text-left shadow-sm backdrop-blur-md">
        <p
          id={titleId}
          className="min-w-0 flex-1 text-xs leading-snug text-purple-50 line-clamp-2"
        >
          {message}
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={t('hint.dismiss')}
          className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg text-purple-100 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
