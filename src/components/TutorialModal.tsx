import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, BookOpen, Heart, MessageCircle, Users, Trophy, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from './LanguageContext';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps = useMemo(() => [
    {
      icon: Heart,
      title: t('tutorial.welcome.title'),
      description: t('tutorial.welcome.description'),
      content: [
        t('tutorial.welcome.feature1'),
        t('tutorial.welcome.feature2'),
        t('tutorial.welcome.feature3'),
        t('tutorial.welcome.feature4'),
      ],
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Heart,
      title: t('tutorial.checkin.title'),
      description: t('tutorial.checkin.description'),
      content: [
        t('tutorial.checkin.feature1'),
        t('tutorial.checkin.feature2'),
        t('tutorial.checkin.feature3'),
        t('tutorial.checkin.feature4'),
      ],
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: MessageCircle,
      title: t('tutorial.share.title'),
      description: t('tutorial.share.description'),
      content: [
        t('tutorial.share.feature1'),
        t('tutorial.share.feature2'),
        t('tutorial.share.feature3'),
        t('tutorial.share.feature4'),
      ],
      color: 'from-fuchsia-500 to-purple-500',
    },
    {
      icon: Users,
      title: t('tutorial.listen.title'),
      description: t('tutorial.listen.description'),
      content: [
        t('tutorial.listen.feature1'),
        t('tutorial.listen.feature2'),
        t('tutorial.listen.feature3'),
        t('tutorial.listen.feature4'),
      ],
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Trophy,
      title: t('tutorial.rewards.title'),
      description: t('tutorial.rewards.description'),
      content: [
        t('tutorial.rewards.feature1'),
        t('tutorial.rewards.feature2'),
        t('tutorial.rewards.feature3'),
        t('tutorial.rewards.feature4'),
      ],
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: Shield,
      title: t('tutorial.safety.title'),
      description: t('tutorial.safety.description'),
      content: [
        t('tutorial.safety.feature1'),
        t('tutorial.safety.feature2'),
        t('tutorial.safety.feature3'),
        t('tutorial.safety.feature4'),
      ],
      color: 'from-indigo-500 to-blue-500',
    },
  ], [t]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = tutorialSteps[currentStep];
  const Icon = step.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-gradient-to-br from-purple-500 to-pink-500 dark:from-gray-900 dark:to-purple-950/30 border-2 border-purple-200 dark:border-purple-500/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            {t('tutorial.modal.title')}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            {t('tutorial.modal.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Icon */}
              <div className="flex justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                  className={`w-20 h-20 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center shadow-lg`}
                >
                  <Icon className="w-10 h-10 text-white" />
                </motion.div>
              </div>

              {/* Title & Description */}
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {step.description}
                </p>
              </div>

              {/* Content */}
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 space-y-3">
                {step.content.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <span className="text-2xl flex-shrink-0">{item.split(' ')[0]}</span>
                    <p className="text-gray-700 dark:text-gray-300 pt-1">
                      {item.split(' ').slice(1).join(' ')}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Progress Dots */}
              <div className="flex justify-center gap-2">
                {tutorialSteps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentStep
                        ? 'w-8 bg-gradient-to-r from-purple-500 to-pink-500'
                        : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-3">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="border-purple-200 dark:border-purple-500/30"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {t('tutorial.previous')}
          </Button>
          <Button
            onClick={handleNext}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {currentStep === tutorialSteps.length - 1 ? t('tutorial.getStarted') : t('tutorial.next')}
            {currentStep < tutorialSteps.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2">
          {t('tutorial.step').replace('{current}', (currentStep + 1).toString()).replace('{total}', tutorialSteps.length.toString())}
        </p>
      </DialogContent>
    </Dialog>
  );
}