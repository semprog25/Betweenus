import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { Capacitor } from '@capacitor/core'
import { Button } from './ui/button'
import {
  Compass,
  MessageSquarePlus,
  CheckCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { useLanguage } from './LanguageContext'
import { markTutorialCompleted } from '../utils/onboarding-state'
import logoImage from '../assets/betweenus-logo.png'

interface TutorialProps {
  onComplete: () => void
}

type WelcomePhase = 'welcome' | 'tour'

const TOUR_STEPS = [
  {
    id: 'discover',
    icon: Compass,
    titleKey: 'welcome.tour.discover.title',
    bodyKey: 'welcome.tour.discover.body',
    gradient: 'from-cyan-500 via-blue-500 to-purple-600',
  },
  {
    id: 'write',
    icon: MessageSquarePlus,
    titleKey: 'welcome.tour.write.title',
    bodyKey: 'welcome.tour.write.body',
    gradient: 'from-orange-500 via-pink-500 to-red-600',
  },
  {
    id: 'checkin',
    icon: CheckCircle,
    titleKey: 'welcome.tour.checkin.title',
    bodyKey: 'welcome.tour.checkin.body',
    gradient: 'from-purple-500 via-pink-500 to-fuchsia-600',
  },
] as const

const BENEFITS = [
  'welcome.benefit.share',
  'welcome.benefit.discover',
  'welcome.benefit.checkin',
] as const

/**
 * Short welcome experience (replaces the old 4-page feature tutorial).
 * Primary CTA enters the app immediately; "How it works" is optional (≤3 steps).
 */
export function Tutorial({ onComplete }: TutorialProps) {
  const { t } = useLanguage()
  const prefersReducedMotion = useReducedMotion()
  const [phase, setPhase] = useState<WelcomePhase>('welcome')
  const [tourStep, setTourStep] = useState(0)

  const finish = () => {
    markTutorialCompleted({ enableContextualHints: true })
    onComplete()
  }

  const handleStartExploring = () => {
    finish()
  }

  const handleHowItWorks = () => {
    setPhase('tour')
    setTourStep(0)
  }

  const handleTourNext = () => {
    if (tourStep < TOUR_STEPS.length - 1) {
      setTourStep(tourStep + 1)
      return
    }
    finish()
  }

  const handleTourSkip = () => {
    finish()
  }

  const handleTourBack = () => {
    if (tourStep > 0) {
      setTourStep(tourStep - 1)
      return
    }
    setPhase('welcome')
  }

  // Android system Back: move within Welcome/tour; never corrupt completion state.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    let remove: (() => void) | undefined
    let cancelled = false

    void import('@capacitor/app').then(({ App }) => {
      if (cancelled) return
      App.addListener('backButton', ({ canGoBack }) => {
        if (phase === 'tour') {
          if (tourStep > 0) {
            setTourStep((step) => Math.max(0, step - 1))
            return
          }
          setPhase('welcome')
          return
        }
        // On the root Welcome screen, allow default (minimize/exit) — do not mark complete.
        if (canGoBack) {
          window.history.back()
          return
        }
        void App.minimizeApp()
      }).then((handle) => {
        remove = () => {
          void handle.remove()
        }
      })
    })

    return () => {
      cancelled = true
      remove?.()
    }
  }, [phase, tourStep])

  const currentTour = TOUR_STEPS[tourStep]
  const TourIcon = currentTour.icon
  const panelTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.25 }
  const welcomeTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.3 }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-[#0f0f1e]"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), var(--safe-area-inset-top, 0px), 48px)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), var(--safe-area-inset-bottom, 0px), 24px)',
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {!prefersReducedMotion && (
          <>
            <motion.div
              className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 bg-gradient-to-br from-purple-500 to-fuchsia-500"
              animate={{ x: [0, 80, 0], y: [0, -60, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
              style={{ top: '8%', left: '5%' }}
            />
            <motion.div
              className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 bg-gradient-to-br from-cyan-500 to-blue-500"
              animate={{ x: [0, -60, 0], y: [0, 80, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
              style={{ bottom: '8%', right: '5%' }}
            />
          </>
        )}
      </div>

      <div className="relative mx-auto flex min-h-full w-full max-w-lg items-center justify-center p-6">
        <div className="relative w-full">
          <AnimatePresence mode="wait">
            {phase === 'welcome' ? (
              <motion.div
                key="welcome"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -16 }}
                transition={welcomeTransition}
                className="rounded-3xl border border-white/10 bg-white/5 p-8 sm:p-10 backdrop-blur-sm"
              >
                <div className="flex justify-center mb-6">
                  <img src={logoImage} alt="Between Us" className="h-10 w-auto" />
                </div>

                <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500 mb-5">
                  <Sparkles className="w-7 h-7 text-white" aria-hidden="true" />
                </div>

                <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-3">
                  {t('welcome.title')}
                </h1>
                <p className="text-gray-300 leading-relaxed mb-8">
                  {t('welcome.subtitle')}
                </p>

                <ul className="space-y-3 mb-10">
                  {BENEFITS.map((key) => (
                    <li key={key} className="flex items-start gap-3">
                      <span
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gradient-to-br from-purple-400 to-fuchsia-400"
                        aria-hidden="true"
                      />
                      <span className="text-gray-200">{t(key)}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleStartExploring}
                    className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white hover:opacity-90"
                  >
                    {t('welcome.cta.start')}
                    <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                  </Button>
                  <Button
                    onClick={handleHowItWorks}
                    variant="ghost"
                    className="w-full min-h-[44px] text-gray-300 hover:text-white hover:bg-white/5"
                  >
                    {t('welcome.cta.howItWorks')}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={`tour-${tourStep}`}
                initial={prefersReducedMotion ? false : { opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, x: -40 }}
                transition={panelTransition}
                className="rounded-3xl border border-white/10 bg-white/5 p-8 sm:p-10 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <p className="text-xs text-gray-400">
                    {t('welcome.tour.progress')
                      .replace('{current}', String(tourStep + 1))
                      .replace('{total}', String(TOUR_STEPS.length))}
                  </p>
                  <button
                    type="button"
                    onClick={handleTourSkip}
                    className="min-h-[44px] px-3 text-sm text-gray-400 hover:text-white"
                  >
                    {t('welcome.tour.skip')}
                  </button>
                </div>

                <div
                  className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${currentTour.gradient} mb-6`}
                >
                  <TourIcon className="w-8 h-8 text-white" aria-hidden="true" />
                </div>

                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">
                  {t(currentTour.titleKey)}
                </h2>
                <p className="text-gray-300 leading-relaxed mb-8">
                  {t(currentTour.bodyKey)}
                </p>

                <div className="flex items-center justify-center gap-2 mb-8" aria-hidden="true">
                  {TOUR_STEPS.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 rounded-full transition-all duration-300 motion-reduce:transition-none ${
                        index === tourStep
                          ? `w-8 bg-gradient-to-r ${currentTour.gradient}`
                          : 'w-2 bg-gray-600'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex gap-3">
                  {(tourStep > 0 || phase === 'tour') && (
                    <Button
                      onClick={handleTourBack}
                      variant="outline"
                      className="flex-1 min-h-[48px] border-white/20 bg-transparent text-gray-200 hover:bg-white/5"
                    >
                      {t('welcome.tour.back')}
                    </Button>
                  )}
                  <Button
                    onClick={handleTourNext}
                    className={`flex-1 min-h-[48px] bg-gradient-to-r ${currentTour.gradient} text-white hover:opacity-90`}
                  >
                    {tourStep < TOUR_STEPS.length - 1
                      ? t('welcome.tour.next')
                      : t('welcome.cta.start')}
                    <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
