import { useState } from 'react'
import { Flag, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { toast } from 'sonner@2.0.3'
import { useLanguage } from './LanguageContext'
import { reportPost, type ReportReason } from '../utils/api'

const REASONS: ReportReason[] = [
  'spam',
  'harassment',
  'hate',
  'sexual',
  'personal_info',
  'scam',
  'copyright',
  'other',
]

interface ReportPostModalProps {
  postId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReportPostModal({ postId, open, onOpenChange }: ReportPostModalProps) {
  const { t } = useLanguage()
  const [reason, setReason] = useState<ReportReason>('spam')
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!postId) return
    setIsSubmitting(true)
    try {
      const res = await reportPost(postId, reason, details)
      if (res.duplicate) {
        toast.success(t('report.alreadyReported'))
      } else {
        toast.success(t('report.success'))
      }
      onOpenChange(false)
      setDetails('')
      setReason('spam')
    } catch (error) {
      console.error(error)
      toast.error(t('report.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="report-desc">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-orange-500" aria-hidden="true" />
            {t('report.title')}
          </DialogTitle>
          <DialogDescription id="report-desc">
            {t('report.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2" role="radiogroup" aria-label={t('report.reasonLabel')}>
          {REASONS.map((value) => (
            <label
              key={value}
              className={`flex items-center gap-3 rounded-xl border px-3 py-3 cursor-pointer min-h-[44px] ${
                reason === value
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <input
                type="radio"
                name="report-reason"
                value={value}
                checked={reason === value}
                onChange={() => setReason(value)}
                className="accent-purple-600"
              />
              <span className="text-sm text-foreground">{t(`report.reason.${value}`)}</span>
            </label>
          ))}
        </div>

        <Textarea
          value={details}
          onChange={(e) => setDetails(e.target.value.slice(0, 500))}
          placeholder={t('report.detailsPlaceholder')}
          className="min-h-[88px] resize-none"
          maxLength={500}
          aria-label={t('report.detailsPlaceholder')}
        />

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {t('report.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !postId}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {t('report.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
