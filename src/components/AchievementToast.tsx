import { motion, AnimatePresence } from 'motion/react';
import { Award, Trophy, Star, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from './LanguageContext';
import { BadgeIcon } from './badge-icons';

interface AchievementToastProps {
  achievement?: {
    id?: string;
    icon: string;
    name: string;
    description: string;
  };
  level?: {
    level: number;
    title: string;
  };
  show: boolean;
  onClose: () => void;
}

export function AchievementToast({ achievement, level, show, onClose }: AchievementToastProps) {
  const [visible, setVisible] = useState(show);
  const { t } = useLanguage();

  useEffect(() => {
    setVisible(show);
    if (show) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="fixed z-[9999] pointer-events-none left-1/2 -translate-x-1/2"
          style={{ top: 'max(calc(var(--safe-area-inset-top) + 16px), 16px)' }}
        >
          <div className="relative">
            {/* Celebration particles */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 1, scale: 0 }}
                  animate={{
                    opacity: [1, 0],
                    scale: [0, 1],
                    x: Math.cos((i / 12) * Math.PI * 2) * 60,
                    y: Math.sin((i / 12) * Math.PI * 2) * 60,
                  }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="absolute left-1/2 top-1/2 w-2 h-2 bg-yellow-400 rounded-full"
                />
              ))}
            </div>

            {/* Toast content */}
            <div className="bg-gradient-to-br from-purple-600 via-fuchsia-600 to-purple-700 rounded-2xl px-6 py-4 shadow-2xl min-w-[320px] max-w-md pointer-events-auto">
              <div className="flex items-center gap-4">
                {/* Icon */}
                <motion.div
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="flex-shrink-0"
                >
                  {achievement ? (
                    <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <BadgeIcon badgeId={achievement.id} serverIcon={achievement.icon} className="w-8 h-8 text-white" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                  )}
                </motion.div>

                {/* Text */}
                <div className="flex-1">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <p className="font-bold text-white text-sm">
                        {achievement ? t('achievement.unlocked') : t('achievement.levelUp')}
                      </p>
                    </div>
                    <h4 className="text-white font-bold mb-1">
                      {achievement ? achievement.name : `Level ${level?.level}: ${level?.title}`}
                    </h4>
                    <p className="text-purple-100 text-xs">
                      {achievement ? achievement.description : t('achievement.keepItUp')}
                    </p>
                  </motion.div>
                </div>

                {/* Close button */}
                <button
                  onClick={() => {
                    setVisible(false);
                    setTimeout(onClose, 300);
                  }}
                  className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Shimmer effect */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                style={{ transform: 'skewX(-20deg)' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
