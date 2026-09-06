import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { AuthStep } from './AuthStep'
import { OnboardingProgress } from './OnboardingProgress'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { ArrowRight, Check, Hand } from 'lucide-react'
import { useLanguage, LANGUAGES } from './LanguageContext'
import logoImage from '../assets/betweenus-logo.png'

// Cycling language question texts (like Mac setup)
const LANGUAGE_QUESTIONS = [
  { lang: 'en', text: 'Choose your language' },
  { lang: 'es', text: 'Elige tu idioma' },
  { lang: 'zh', text: '选择您的语言' },
  { lang: 'hi', text: 'अपनी भाषा चुनें' },
  { lang: 'de', text: 'Wählen Sie Ihre Sprache' },
  { lang: 'fr', text: 'Choisissez votre langue' },
]

/**
 * Native first-run setup: language → optional name → auth.
 * Feature education moved to the short Welcome screen + in-app contextual hints.
 */
export function Onboarding({ onComplete }: { onComplete: (languages: string[], name?: string) => void }) {
  const { t, setLanguage } = useLanguage()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedLanguage, setSelectedLanguage] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [cyclingTextIndex, setCyclingTextIndex] = useState(0)

  const backgroundOrbs = useMemo(
    () =>
      [...Array(5)].map((_, i) => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        x: Math.random() * 100 - 50,
        y: Math.random() * 100 - 50,
        isEven: i % 2 === 0,
      })),
    []
  )

  useEffect(() => {
    if (currentStep !== 0) return
    const interval = setInterval(() => {
      setCyclingTextIndex((prev) => (prev + 1) % LANGUAGE_QUESTIONS.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [currentStep])

  // Language (0) → Name (1) → Auth (2)
  const totalSteps = 3
  const isLanguageStep = currentStep === 0
  const isNameStep = currentStep === 1
  const isAuthStep = currentStep === 2

  const handleLanguageSelect = (code: string) => {
    setSelectedLanguage(code)
    setLanguage(code as 'en')
  }

  const handleNext = () => {
    if (currentStep === 0 && !selectedLanguage) return
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
      return
    }
    onComplete([selectedLanguage], userName || undefined)
  }

  const handleAuthComplete = (skipAuth?: boolean) => {
    if (skipAuth) {
      console.log('User skipped authentication')
    } else {
      console.log('User completed authentication')
    }
    onComplete([selectedLanguage], userName || undefined)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 pt-24 relative overflow-hidden bg-[#0f0f1e]">
      <OnboardingProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
        label={t('onboarding.progress') || 'Getting started'}
      />
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {backgroundOrbs.map((orb, i) => (
          <motion.div
            key={i}
            className={`absolute w-64 h-64 rounded-full blur-3xl opacity-20 bg-gradient-to-br ${
              orb.isEven ? 'from-purple-500 to-fuchsia-500' : 'from-cyan-500 to-blue-500'
            }`}
            style={{
              left: `${orb.left}%`,
              top: `${orb.top}%`,
            }}
            animate={{
              x: [0, orb.x, 0],
              y: [0, orb.y, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {isLanguageStep && (
          <motion.div
            key="language-step"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="max-w-lg w-full text-center relative z-10"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex justify-center mb-8"
            >
              <img src={logoImage} alt="Between Us" className="h-12 w-auto" />
            </motion.div>

            <div className="mb-12 h-16 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.h1
                  key={cyclingTextIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="text-4xl text-white"
                >
                  {LANGUAGE_QUESTIONS[cyclingTextIndex].text}
                </motion.h1>
              </AnimatePresence>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 gap-4 mb-8"
            >
              {LANGUAGES.map((lang, index) => (
                <motion.button
                  key={lang.code}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleLanguageSelect(lang.code)}
                  aria-pressed={selectedLanguage === lang.code}
                  aria-label={`${lang.name} (${lang.code})`}
                  className={`relative p-6 rounded-2xl border-2 transition-all min-h-[88px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                    selectedLanguage === lang.code
                      ? 'bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border-purple-500 shadow-lg shadow-purple-500/50'
                      : 'bg-white/5 border-gray-700 hover:border-gray-500'
                  }`}
                >
                  {selectedLanguage === lang.code && (
                    <motion.div
                      layoutId="selected-language"
                      className="absolute top-3 right-3"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <Check className="w-5 h-5 text-purple-400" />
                    </motion.div>
                  )}
                  <div className="text-4xl mb-2">{lang.flag}</div>
                  <div className="text-white font-medium">{lang.name}</div>
                </motion.button>
              ))}
            </motion.div>

            <Button
              onClick={handleNext}
              disabled={!selectedLanguage}
              className={`w-full py-6 rounded-2xl shadow-lg transition-all ${
                selectedLanguage
                  ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 hover:opacity-90 text-white'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {t('onboarding.button.next')}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        )}

        {isNameStep && (
          <motion.div
            key="name-step"
            initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotateY: -10 }}
            transition={{ duration: 0.5 }}
            className="max-w-lg w-full text-center relative z-10"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex justify-center mb-8"
            >
              <img src={logoImage} alt="Between Us" className="h-12 w-auto" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500 p-1 rounded-3xl mb-6"
            >
              <div className="bg-[#0f0f1e] rounded-3xl p-8 backdrop-blur-sm">
                <h1 className="text-white mb-2">{t('onboarding.name.title')}</h1>
                <p className="text-gray-400 mb-6">{t('onboarding.name.subtitle')}</p>
                <Input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder={t('onboarding.name.placeholder')}
                  className="bg-white/10 border-gray-700 text-white placeholder:text-gray-500 text-center py-6 rounded-xl"
                  autoFocus
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="flex justify-center mb-8"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
                <Hand className="w-12 h-12 text-white" />
              </div>
            </motion.div>

            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => setCurrentStep(0)}
                variant="ghost"
                className="text-gray-400 hover:text-white"
              >
                {t('checkin.back')}
              </Button>
              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 hover:opacity-90 text-white px-8 py-6 rounded-xl shadow-lg"
              >
                {t('onboarding.button.next')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {isAuthStep && (
          <AuthStep
            userName={userName}
            selectedLanguages={[selectedLanguage]}
            onComplete={handleAuthComplete}
            onBack={() => setCurrentStep(currentStep - 1)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
