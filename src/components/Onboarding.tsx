import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { AnimatedLogo } from './AnimatedLogo';
import { AuthStep } from './AuthStep';
import { OnboardingProgress } from './OnboardingProgress';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Heart, Shield, Globe, Sparkles, ArrowRight, Check, Award, Hand } from 'lucide-react';
import { useLanguage, LANGUAGES } from './LanguageContext';
import logoImage from '../assets/betweenus-logo.png';

// Cycling language question texts (like Mac setup)
const LANGUAGE_QUESTIONS = [
  { lang: 'en', text: 'Choose your language' },
  { lang: 'es', text: 'Elige tu idioma' },
  { lang: 'zh', text: '选择您的语言' },
  { lang: 'hi', text: 'अपनी भाषा चुनें' },
  { lang: 'de', text: 'Wählen Sie Ihre Sprache' },
  { lang: 'fr', text: 'Choisissez votre langue' },
];

const getOnboardingSteps = (t: (key: string) => string, userName?: string) => [
  {
    title: t('onboarding.welcome.title'),
    subtitle: t('onboarding.welcome.subtitle'),
    icon: Heart,
    gradient: 'from-pink-500 via-fuchsia-500 to-purple-600',
    description: t('onboarding.welcome.description'),
    greeting: userName ? `${t('checkin.welcome')} ${userName}!` : t('onboarding.welcome.title'),
  },
  {
    title: t('onboarding.anonymity.title'),
    subtitle: t('onboarding.anonymity.subtitle'),
    icon: Shield,
    gradient: 'from-cyan-500 via-blue-500 to-purple-600',
    description: t('onboarding.anonymity.description'),
  },
  {
    title: t('onboarding.track.title'),
    subtitle: t('onboarding.track.subtitle'),
    icon: Sparkles,
    gradient: 'from-orange-500 via-pink-500 to-fuchsia-600',
    description: t('onboarding.track.description'),
  },
  {
    title: t('onboarding.community.title'),
    subtitle: t('onboarding.community.subtitle'),
    icon: Globe,
    gradient: 'from-green-500 via-teal-500 to-cyan-600',
    description: t('onboarding.community.description'),
  },
  {
    title: t('onboarding.levels.title'),
    subtitle: t('onboarding.levels.subtitle'),
    icon: Award,
    gradient: 'from-yellow-500 via-amber-500 to-orange-600',
    description: t('onboarding.levels.description'),
  },
];

export function Onboarding({ onComplete }: { onComplete: (languages: string[], name?: string) => void }) {
  const { t, setLanguage } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [cyclingTextIndex, setCyclingTextIndex] = useState(0);

  // Generate static random values for background orbs to prevent re-renders
  const backgroundOrbs = useMemo(() => 
    [...Array(5)].map((_, i) => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      x: Math.random() * 100 - 50,
      y: Math.random() * 100 - 50,
      isEven: i % 2 === 0,
    })), []
  );

  // Animated cycling text effect (like Mac setup)
  useEffect(() => {
    if (currentStep === 0) {
      const interval = setInterval(() => {
        setCyclingTextIndex((prev) => (prev + 1) % LANGUAGE_QUESTIONS.length);
      }, 2000); // Change every 2 seconds
      return () => clearInterval(interval);
    }
  }, [currentStep]);

  // Total steps: Language (0) → Name (1) → Info Steps (2-6) → Auth (7)
  const totalSteps = 8;
  const isLanguageStep = currentStep === 0;
  const isNameStep = currentStep === 1;
  const isAuthStep = currentStep === 7;
  const isInfoStep = currentStep >= 2 && currentStep <= 6;
  const infoStepIndex = currentStep - 2;

  const ONBOARDING_STEPS = useMemo(() => getOnboardingSteps(t, userName), [t, userName]);
  const isLastInfoStep = currentStep === 6;

  const handleLanguageSelect = (code: string) => {
    setSelectedLanguage(code);
    setLanguage(code as any);
  };

  const handleNext = () => {
    if (currentStep === 0 && !selectedLanguage) {
      return; // Don't proceed without language
    }
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete([selectedLanguage], userName || undefined);
    }
  };

  const handleAuthComplete = (skipAuth?: boolean) => {
    if (skipAuth) {
      console.log('User skipped authentication');
    } else {
      console.log('User completed authentication');
    }
    onComplete([selectedLanguage], userName || undefined);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 pt-24 relative overflow-hidden bg-[#0f0f1e]">
      <OnboardingProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
        label={t('onboarding.progress') || 'Getting started'}
      />
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
        {/* Step 1: Language Selection with Cycling Text */}
        {isLanguageStep && (
          <motion.div
            key="language-step"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="max-w-lg w-full text-center relative z-10"
          >
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex justify-center mb-8"
            >
              <img 
                src={logoImage} 
                alt="Between Us" 
                className="h-12 w-auto"
              />
            </motion.div>

            {/* Cycling Question Text */}
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

            {/* Language Grid */}
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

            {/* Continue Button */}
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

        {/* Step 2: Name Input */}
        {isNameStep && (
          <motion.div
            key="name-step"
            initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotateY: -10 }}
            transition={{ duration: 0.5 }}
            className="max-w-lg w-full text-center relative z-10"
          >
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex justify-center mb-8"
            >
              <img 
                src={logoImage} 
                alt="Between Us" 
                className="h-12 w-auto"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500 p-1 rounded-3xl mb-6"
            >
              <div className="bg-[#0f0f1e] rounded-3xl p-8 backdrop-blur-sm">
                <h1 className="text-white mb-2">
                  {t('onboarding.name.title')}
                </h1>
                
                <p className="text-gray-400 mb-6">
                  {t('onboarding.name.subtitle')}
                </p>

                <Input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder={t('onboarding.name.placeholder')}
                  className="bg-white/10 border-gray-700 text-white placeholder:text-gray-500 text-center py-6 rounded-xl"
                  autoFocus
                />
              </div>
            </motion.div>

            {/* Animated icon */}
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

        {/* Steps 3-6: Info Steps */}
        {isInfoStep && (
          <motion.div
            key={`info-step-${infoStepIndex}`}
            initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotateY: -10 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="max-w-lg w-full text-center relative z-10"
          >
            {/* Step indicator */}
            <div className="flex justify-center gap-2 mb-8">
              {ONBOARDING_STEPS.map((_, index) => (
                <motion.div
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === infoStepIndex
                      ? 'w-8 bg-gradient-to-r from-purple-500 to-fuchsia-500'
                      : index < infoStepIndex
                      ? 'w-1.5 bg-purple-500/50'
                      : 'w-1.5 bg-gray-600'
                  }`}
                  layoutId={index === infoStepIndex ? 'activeStep' : undefined}
                />
              ))}
            </div>

            {/* Logo Banner */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex justify-center mb-8"
            >
              <img 
                src={logoImage} 
                alt="Between Us" 
                className="h-12 w-auto"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`bg-gradient-to-br ${ONBOARDING_STEPS[infoStepIndex].gradient} p-1 rounded-3xl mb-6`}
            >
              <div className="bg-[#0f0f1e] rounded-3xl p-8 backdrop-blur-sm">
                {infoStepIndex === 0 && userName ? (
                  <h1 className="text-white mb-2">
                    {ONBOARDING_STEPS[infoStepIndex].greeting}
                  </h1>
                ) : (
                  <h1 className="text-white mb-2">
                    {ONBOARDING_STEPS[infoStepIndex].title}
                  </h1>
                )}
                
                <p className="text-gray-400 mb-6">
                  {ONBOARDING_STEPS[infoStepIndex].subtitle}
                </p>

                <p className="text-gray-300 leading-relaxed">
                  {ONBOARDING_STEPS[infoStepIndex].description}
                </p>
              </div>
            </motion.div>

            {/* Animated icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="flex justify-center mb-8"
            >
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${ONBOARDING_STEPS[infoStepIndex].gradient} flex items-center justify-center`}>
                {(() => {
                  const StepIcon = ONBOARDING_STEPS[infoStepIndex].icon;
                  return <StepIcon className="w-12 h-12 text-white" />;
                })()}
              </div>
            </motion.div>

            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => setCurrentStep(currentStep - 1)}
                variant="ghost"
                className="text-gray-400 hover:text-white"
              >
                {t('checkin.back')}
              </Button>
              
              <Button
                onClick={handleNext}
                className={`bg-gradient-to-r ${ONBOARDING_STEPS[infoStepIndex].gradient} hover:opacity-90 text-white px-8 py-6 rounded-xl shadow-lg`}
              >
                {isLastInfoStep ? (
                  <>
                    {t('onboarding.button.getStarted')}
                    <Sparkles className="ml-2 w-5 h-5" />
                  </>
                ) : (
                  <>
                    {t('onboarding.button.next')}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 7: Authentication */}
        {isAuthStep && (
          <AuthStep
            userName={userName}
            selectedLanguages={[selectedLanguage]}
            onComplete={handleAuthComplete}
            onBack={() => setCurrentStep(currentStep - 1)}
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .float-animation {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}