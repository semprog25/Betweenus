import { Megaphone } from 'lucide-react'
import { useLanguage } from './LanguageContext'

/**
 * Labeled native-style ad placeholder for feed spacing.
 * Real AdMob native ads load on device; on web this keeps layout stable and honest.
 */
export function FeedAdCard() {
  const { t } = useLanguage()

  return (
    <aside
      className="rounded-2xl border border-dashed border-border bg-muted/40 p-4"
      aria-label={t('ads.label')}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        <Megaphone className="w-3.5 h-3.5" aria-hidden="true" />
        {t('ads.label')}
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {t('ads.placeholder')}
      </p>
    </aside>
  )
}
