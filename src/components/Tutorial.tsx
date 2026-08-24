import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { CheckCircle, Compass, MessageSquarePlus, ArrowRight, X, Award } from 'lucide-react';
import { useLanguage } from './LanguageContext';

interface TutorialProps {
  onComplete: () => void;
}

export function Tutorial({ onComplete }: TutorialProps) {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: t('tutorial.checkin.title') || 'Daily Check-In',
      description: t('tutorial.checkin.description') || 'Track your mood and emotions daily. Share how you feel, what activities you did, and add journal notes. Build streaks and earn points!',
      icon: CheckCircle,
      gradient: 'from-purple-500 via-pink-500 to-fuchsia-600',
      features: [
        t('tutorial.checkin.feature1') || 'Choose from 6 main moods',
        t('tutorial.checkin.feature2') || 'Add detailed emotions',
        t('tutorial.checkin.feature3') || 'Track activities and journal',
        t('tutorial.checkin.feature4') || 'Build daily streaks'
      ]
    },
    {
      title: t('tutorial.discover.title') || 'Discover & Discuss',
      description: t('tutorial.discover.description') || 'Browse community gossip and stories. Vote on posts and join text discussions.',
      icon: Compass,
      gradient: 'from-cyan-500 via-blue-500 to-purple-600',
      features: [
        t('tutorial.discover.feature1') || 'Explore trending and new posts',
        t('tutorial.discover.feature2') || 'Upvote and downvote posts',
        t('tutorial.discover.feature3') || 'Leave comments and replies',
        t('tutorial.discover.feature4') || 'Filter by trending, new, or hot',
      ]
    },
    {
      title: t('tutorial.share.title') || 'Share Your Thoughts',
      description: t('tutorial.share.description') || 'Anonymously share what\'s on your mind. Choose your mood, write your thoughts, and receive support from the community in a safe space.',
      icon: MessageSquarePlus,
      gradient: 'from-orange-500 via-pink-500 to-red-600',
      features: [
        t('tutorial.share.feature1') || 'Completely anonymous',
        t('tutorial.share.feature2') || 'Express your feelings',
        t('tutorial.share.feature3') || 'Receive community support',
        t('tutorial.share.feature4') || 'Safe and judgment-free'
      ]
    },
    {
      title: t('tutorial.levels.title') || 'Level Up & Earn Badges',
      description: t('tutorial.levels.description') || 'Track your progress with levels and achievement badges. Every interaction counts towards your journey in the Between Us community!',
      icon: Award,
      gradient: 'from-yellow-500 via-amber-500 to-orange-600',
      features: [
        t('tutorial.levels.feature1') || 'Progress through 5 levels',
        t('tutorial.levels.feature2') || 'Earn activity points',
        t('tutorial.levels.feature3') || 'Unlock achievement badges',
        t('tutorial.levels.feature4') || 'Track your journey'
      ]
    }
  ];

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black p-6">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 bg-gradient-to-br from-purple-500 to-fuchsia-500"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ top: '10%', left: '10%' }}
        />
        <motion.div
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 bg-gradient-to-br from-cyan-500 to-blue-500"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ bottom: '10%', right: '10%' }}
        />
      </div>

      {/* Skip button */}
      <button
        onClick={handleSkip}
        aria-label="Skip tutorial"
        className="absolute top-[max(var(--safe-area-inset-top),24px)] right-6 z-10 p-2 rounded-full bg-gray-200/50 dark:bg-gray-800/50 hover:bg-gray-300/50 dark:hover:bg-gray-700/50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {/* Content */}
      <div className="relative max-w-lg w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 sm:p-12"
          >
            {/* Icon */}
            <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${currentStepData.gradient} mb-6`}>
              <Icon className="w-8 h-8 text-white" />
            </div>

            {/* Title */}
            <h2 className="mb-4 text-gray-900 dark:text-white">
              {currentStepData.title}
            </h2>

            {/* Description */}
            <p className="mb-8 text-gray-600 dark:text-gray-400">
              {currentStepData.description}
            </p>

            {/* Features */}
            <ul className="space-y-3 mb-8">
              {currentStepData.features.map((feature, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  className="flex items-start gap-3"
                >
                  <div className={`mt-0.5 p-1 rounded-full bg-gradient-to-br ${currentStepData.gradient}`}>
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </motion.li>
              ))}
            </ul>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? `w-8 bg-gradient-to-r ${currentStepData.gradient}`
                      : 'w-2 bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  variant="outline"
                  className="flex-1"
                >
                  {t('tutorial.back') || 'Back'}
                </Button>
              )}
              <Button
                onClick={handleNext}
                className={`flex-1 bg-gradient-to-r ${currentStepData.gradient} text-white hover:opacity-90`}
              >
                {currentStep < steps.length - 1 ? (
                  <>
                    {t('tutorial.next') || 'Next'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  t('tutorial.getStarted') || 'Get Started'
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}