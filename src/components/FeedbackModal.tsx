import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Loader2, MessageSquare, Star, Lightbulb, MessageCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { callServer } from '../utils/supabase/client';
import { getSession } from '../utils/auth';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { useLanguage } from './LanguageContext';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FeedbackType = 'review' | 'feature' | 'feedback' | 'comment';

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { t } = useLanguage();
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPlayStorePrompt, setShowPlayStorePrompt] = useState(false);

  const feedbackTypes = [
    {
      type: 'review' as FeedbackType,
      icon: '⭐',
      label: t('feedback.type.review'),
      description: t('feedback.desc.review'),
      color: 'from-yellow-400 to-orange-500',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
    {
      type: 'feature' as FeedbackType,
      icon: '💡',
      label: t('feedback.type.feature'),
      description: t('feedback.desc.feature'),
      color: 'from-purple-400 to-pink-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      type: 'feedback' as FeedbackType,
      icon: '💬',
      label: t('feedback.type.feedback'),
      description: t('feedback.desc.feedback'),
      color: 'from-blue-400 to-cyan-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      type: 'comment' as FeedbackType,
      icon: '📝',
      label: t('feedback.type.comment'),
      description: t('feedback.desc.comment'),
      color: 'from-green-400 to-emerald-500',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
  ];

  const ratingReactions = [
    { stars: 1, emoji: '😔', message: t('feedback.rating.1.msg'), color: 'text-red-500', description: t('feedback.rating.1.desc') },
    { stars: 2, emoji: '😕', message: t('feedback.rating.2.msg'), color: 'text-orange-500', description: t('feedback.rating.2.desc') },
    { stars: 3, emoji: '👍', message: t('feedback.rating.3.msg'), color: 'text-yellow-500', description: t('feedback.rating.3.desc') },
    { stars: 4, emoji: '⭐', message: t('feedback.rating.4.msg'), color: 'text-blue-500', description: t('feedback.rating.4.desc') },
    { stars: 5, emoji: '🌟', message: t('feedback.rating.5.msg'), color: 'text-purple-500', description: t('feedback.rating.5.desc') },
  ];

  const triggerConfetti = () => {
    // Center burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'],
    });

    // Side bursts
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#a855f7', '#ec4899', '#f59e0b'],
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#a855f7'],
      });
    }, 200);

    // Stars burst
    setTimeout(() => {
      confetti({
        particleCount: 30,
        spread: 360,
        ticks: 100,
        gravity: 0.5,
        decay: 0.94,
        startVelocity: 30,
        shapes: ['star'],
        colors: ['#FFD700', '#FFA500', '#FF69B4'],
      });
    }, 400);
  };

  const handleRatingClick = (stars: number) => {
    setRating(stars);
    
    // Trigger confetti for all ratings
    if (stars === 5) {
      triggerConfetti();
      // Show Play Store prompt after animation
      setTimeout(() => setShowPlayStorePrompt(true), 1000);
    } else if (stars >= 3) {
      // Smaller confetti for 3-4 stars
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#ec4899', '#f59e0b'],
      });
    }
  };

  const handlePlayStoreRedirect = () => {
    // TODO: Replace with actual Play Store URL
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.betweenus.app';
    window.open(playStoreUrl, '_blank');
    
    // Award points
    const session = getSession();
    if (session?.user?.id) {
      callServer('/gamification/award-points', {
        method: 'POST',
        headers: session?.accessToken ? {
          'Authorization': `Bearer ${session.accessToken}`,
        } : {},
        body: JSON.stringify({
          userId: session.user.id,
          points: 50,
          reason: 'play_store_review',
        }),
      }).then((response) => {
        if (response.success) {
          toast.success(t('feedback.pointsEarned'));
        }
      }).catch(console.error);
    }
  };

  const handleSubmit = async () => {
    if (!feedbackType) {
      toast.error(t('feedback.selectType'));
      return;
    }

    if (feedbackType === 'review' && rating === 0) {
      toast.error(t('feedback.selectRating'));
      return;
    }

    if (!message.trim()) {
      toast.error(t('feedback.enterMessage'));
      return;
    }

    setIsSubmitting(true);
    try {
      const session = getSession();
      
      // Submit feedback to backend
      const response = await callServer('/feedback/submit', {
        method: 'POST',
        headers: session?.accessToken ? {
          'Authorization': `Bearer ${session.accessToken}`,
        } : {},
        body: JSON.stringify({
          type: feedbackType,
          rating: feedbackType === 'review' ? rating : null,
          title: title || null,
          message,
          userId: session?.user?.id || null,
        }),
      });

      if (response.success) {
        // If 5-star review, prompt for Play Store review
        if (feedbackType === 'review' && rating === 5) {
          toast.success(t('feedback.successReview'), {
            description: t('feedback.reviewBonus'),
            duration: 8000,
            action: {
              label: t('feedback.reviewButton'),
              onClick: handlePlayStoreRedirect,
            },
          });
        } else {
          toast.success(t('feedback.success'));
        }

        // Reset form
        setFeedbackType(null);
        setRating(0);
        setTitle('');
        setMessage('');
        onClose();
      } else {
        toast.error(response.error || t('feedback.error'));
      }
    } catch (error: any) {
      console.error('Feedback submission error:', error);
      toast.error(t('feedback.tryAgain'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setFeedbackType(null);
    setRating(0);
    setTitle('');
    setMessage('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950/30 border-2 border-purple-200 dark:border-purple-500/50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            {feedbackType ? t('feedback.shareThoughts') : t('feedback.title')}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            {feedbackType 
              ? t('feedback.subtitleValue')
              : t('feedback.subtitle')}
          </DialogDescription>
        </DialogHeader>

        {!feedbackType ? (
          <div className="space-y-3 py-2">
            {feedbackTypes.map((type, index) => (
              <motion.button
                key={type.type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setFeedbackType(type.type)}
                className="w-full p-4 rounded-xl border-2 border-purple-200 dark:border-purple-500/30 hover:border-purple-400 dark:hover:border-purple-400 bg-white dark:bg-gray-800/50 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg ${type.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <motion.span 
                      className="text-3xl"
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      {type.icon}
                    </motion.span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{type.label}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{type.description}</p>
                  </div>
                  <span className="text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">→</span>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Rating for reviews */}
            {feedbackType === 'review' && (
              <div className="space-y-4">
                <Label className="text-gray-700 dark:text-gray-300">{t('feedback.yourRating')}</Label>
                <div className="flex items-center justify-center gap-2 py-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      type="button"
                      onClick={() => handleRatingClick(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      className="transition-transform"
                    >
                      <motion.div
                        animate={
                          star === rating
                            ? {
                                scale: [1, 1.3, 1],
                                rotate: [0, 360],
                              }
                            : {}
                        }
                        transition={{
                          duration: 0.5,
                        }}
                      >
                        <Star
                          className={`w-10 h-10 transition-colors ${
                            star <= (hoveredRating || rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      </motion.div>
                    </motion.button>
                  ))}
                </div>
                
                {/* Rating Reaction */}
                <AnimatePresence mode="wait">
                  {rating > 0 && (
                    <motion.div
                      key={rating}
                      initial={{ opacity: 0, y: -20, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 20, scale: 0.8 }}
                      className="text-center space-y-2 bg-white dark:bg-gray-800/50 rounded-2xl p-4 border-2 border-purple-200 dark:border-purple-500/30"
                    >
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          rotate: rating === 5 ? [0, -10, 10, -10, 0] : [0],
                        }}
                        transition={{
                          duration: rating === 5 ? 0.5 : 0.3,
                          repeat: rating === 5 ? Infinity : 0,
                          repeatDelay: rating === 5 ? 2 : 0,
                        }}
                        className="text-5xl mb-2"
                      >
                        {ratingReactions[rating - 1].emoji}
                      </motion.div>
                      <p className={`font-semibold ${ratingReactions[rating - 1].color}`}>
                        {ratingReactions[rating - 1].message}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {ratingReactions[rating - 1].description}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Play Store Prompt for 5 stars */}
                <AnimatePresence>
                  {showPlayStorePrompt && rating === 5 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-4 text-white space-y-3">
                        <div className="text-center">
                          <motion.div
                            animate={{
                              rotate: [0, 360],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: 'linear',
                            }}
                            className="inline-block text-4xl mb-2"
                          >
                            🌟
                          </motion.div>
                          <h4 className="font-bold text-lg">{t('feedback.loveApp')}</h4>
                          <p className="text-sm text-white/90 mt-1" dangerouslySetInnerHTML={{ __html: t('feedback.sharePlayStore') }} />
                        </div>
                        <Button
                          onClick={handlePlayStoreRedirect}
                          className="w-full bg-white text-purple-600 hover:bg-white/90 font-semibold"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          {t('feedback.reviewButton')}
                        </Button>
                        <p className="text-xs text-white/70 text-center">
                          {t('feedback.submitFirst')}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Title for feature requests */}
            {feedbackType === 'feature' && (
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-700 dark:text-gray-300">
                  {t('feedback.featureTitle')} <span className="text-gray-400">{t('feedback.optional')}</span>
                </Label>
                <Input
                  id="title"
                  placeholder={t('feedback.featurePlaceholder')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-white/50 dark:bg-gray-800/50 border-purple-200 dark:border-purple-500/30"
                />
              </div>
            )}

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message" className="text-gray-700 dark:text-gray-300">
                {t('feedback.yourMessage')}
              </Label>
              <Textarea
                id="message"
                placeholder={
                  feedbackType === 'review' 
                    ? t('feedback.placeholder.review')
                    : feedbackType === 'feature'
                    ? t('feedback.placeholder.feature')
                    : feedbackType === 'feedback'
                    ? t('feedback.placeholder.feedback')
                    : t('feedback.placeholder.comment')
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="bg-white/50 dark:bg-gray-800/50 border-purple-200 dark:border-purple-500/30 resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('feedback.helpImprove')}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex-1 border-purple-200 dark:border-purple-500/30"
              >
                {t('feedback.back')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('feedback.sending')}
                  </>
                ) : (
                  t('feedback.submit')
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}