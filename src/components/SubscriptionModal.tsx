import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Check, Sparkles, Crown, Zap, X, Star, Trophy, Gift, Flame, TrendingUp, Info, Coins, Heart, MessageCircle, Target } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { upgradeSubscription, buyCredits } from '../utils/api';
import { useLanguage } from './LanguageContext';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentTier?: string;
  currentCredits?: number;
  onSubscriptionUpdate?: () => void;
}

export function SubscriptionModal({ 
  isOpen, 
  onClose, 
  userId, 
  currentTier = 'free',
  currentCredits = 0,
  onSubscriptionUpdate 
}: SubscriptionModalProps) {
  const { t } = useLanguage();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isBuyingCredits, setIsBuyingCredits] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'subscription' | 'credits' | 'points'>('subscription');
  const [selectedPeriods, setSelectedPeriods] = useState<Record<string, string>>({
    premium: 'month',
    pro: 'month',
  });

  const TIERS = [
    {
      id: 'free',
      name: t('tier.free'),
      icon: Sparkles,
      price: '$0',
      period: t('period.forever'),
      color: 'from-gray-400 to-gray-600',
      features: [
        `3 ${t('feature.postsMonth')}`,
        t('feature.anonSharing'),
        t('feature.communitySupport'),
        t('feature.dailyCheckins'),
        t('feature.moodTracking'),
        t('feature.earnPointsPost'),
        t('feature.earnPointsReply'),
      ],
      limitations: [
        t('feature.cannotEdit'),
        t('feature.limitedPosts'),
      ],
      points: 0,
    },
    {
      id: 'premium',
      name: t('tier.premium'),
      icon: Crown,
      pricingOptions: [
        { period: 'day', price: '$0.99', label: t('period.daily') },
        { period: 'week', price: '$4.99', label: t('period.weekly') },
        { period: 'month', price: '$9.99', label: t('period.monthly') },
        { period: 'year', price: '$79.99', label: t('period.yearly'), save: '33%' },
      ],
      defaultPeriod: 'month',
      color: 'from-purple-600 to-fuchsia-600',
      popular: true,
      features: [
        `10 ${t('feature.postsMonth')}`,
        `10 ${t('feature.editCredits')}`,
        t('feature.editPosts'),
        t('feature.prioritySupport'),
        t('feature.allFree'),
        t('feature.premiumBadge'),
        t('feature.earnPointsPost2x'),
        t('feature.earnPointsReply2x'),
        `100 ${t('feature.bonusPointsSignup')}`,
      ],
      limitations: [],
      points: 100,
    },
    {
      id: 'pro',
      name: t('tier.pro'),
      icon: Zap,
      pricingOptions: [
        { period: 'day', price: '$1.99', label: t('period.daily') },
        { period: 'week', price: '$9.99', label: t('period.weekly') },
        { period: 'month', price: '$19.99', label: t('period.monthly') },
        { period: 'year', price: '$149.99', label: t('period.yearly'), save: '38%' },
        { period: 'lifetime', price: '$299.99', label: t('period.lifetime'), save: '50%', badge: t('subscription.bestValue') },
      ],
      defaultPeriod: 'month',
      color: 'from-amber-500 to-orange-600',
      features: [
        t('feature.unlimitedPosts'),
        t('feature.unlimitedEdits'),
        t('feature.prioritySupport'),
        t('feature.allPremium'),
        t('feature.earlyAccess'),
        t('feature.proBadge'),
        t('feature.earnPointsPost3x'),
        t('feature.earnPointsReply3x'),
        `500 ${t('feature.bonusPointsSignup')}`,
        t('feature.exclusiveCommunity'),
      ],
      limitations: [],
      points: 500,
    },
  ];

  const CREDIT_PACKS = [
    { amount: 5, price: '$1.99', bonus: 0, points: 25 },
    { amount: 15, price: '$4.99', bonus: 3, popular: true, points: 75 },
    { amount: 50, price: '$12.99', bonus: 15, points: 250 },
  ];

  const POINT_REWARDS = [
    { points: 100, reward: t('reward.freeEdit'), icon: Sparkles },
    { points: 500, reward: t('reward.premiumBadge'), icon: Crown },
    { points: 1000, reward: t('reward.freeEdits5'), icon: Gift },
    { points: 2500, reward: t('reward.customProfile'), icon: Star },
    { points: 5000, reward: t('reward.monthPremium'), icon: Trophy },
    { points: 10000, reward: t('reward.monthsPro'), icon: Flame },
  ];

  const handleUpgrade = async (tier: 'premium' | 'pro', period: string) => {
    if (!userId) {
      toast.error(t('subscription.error.signin'));
      return;
    }

    setIsUpgrading(true);
    try {
      // In production, integrate with payment provider (Stripe, PayPal, RevenueCat)
      // For demo, we'll just upgrade directly
      await upgradeSubscription(userId, tier);
      
      const tierData = TIERS.find(t => t.id === tier);
      const bonusPoints = tierData?.points || 0;
      
      toast.success(`${t('subscription.success.upgrade')} ${tier} ${period}!${bonusPoints > 0 ? ` +${bonusPoints} ${t('subscription.bonusPoints')}!` : ''}`);
      onSubscriptionUpdate?.();
      onClose();
    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error(t('subscription.error.upgrade'));
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleBuyCredits = async (amount: number, bonus: number, points: number) => {
    if (!userId) {
      toast.error(t('subscription.error.signin'));
      return;
    }

    setIsBuyingCredits(true);
    try {
      // In production, integrate with payment provider
      // For demo, we'll just add credits directly
      const totalCredits = amount + bonus;
      await buyCredits(userId, totalCredits);
      
      toast.success(`${t('subscription.success.credits')} ${totalCredits} ${t('subscription.editCredits')}! ✨ +${points} ${t('subscription.bonusPoints')}!`);
      onSubscriptionUpdate?.();
      onClose();
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error(t('subscription.error.purchase'));
    } finally {
      setIsBuyingCredits(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] bg-white dark:bg-gray-800 p-0">
        <div className="flex flex-col max-h-[90vh]">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-center text-2xl flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6 text-purple-600" />
              {t('subscription.title')}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t('subscription.subtitle')}
            </DialogDescription>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4 mx-6">
            <button
              onClick={() => setSelectedTab('subscription')}
              className={`flex-1 py-2 px-4 rounded-md transition-all text-sm ${
                selectedTab === 'subscription'
                  ? 'bg-white dark:bg-gray-600 shadow-sm font-medium'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Crown className="w-4 h-4 inline mr-2" />
              {t('subscription.tab.subscription')}
            </button>
            <button
              onClick={() => setSelectedTab('credits')}
              className={`flex-1 py-2 px-4 rounded-md transition-all text-sm ${
                selectedTab === 'credits'
                  ? 'bg-white dark:bg-gray-600 shadow-sm font-medium'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Sparkles className="w-4 h-4 inline mr-2" />
              {t('subscription.tab.credits')}
            </button>
            <button
              onClick={() => setSelectedTab('points')}
              className={`flex-1 py-2 px-4 rounded-md transition-all text-sm ${
                selectedTab === 'points'
                  ? 'bg-white dark:bg-gray-600 shadow-sm font-medium'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Star className="w-4 h-4 inline mr-2" />
              {t('subscription.tab.points')}
            </button>
          </div>

          {/* Current Status */}
          <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/30 rounded-2xl p-4 mb-4 border border-purple-200 dark:border-purple-500/30 mx-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('subscription.currentPlan')}</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
                  {t(`tier.${currentTier}`) || currentTier}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('subscription.editCredits')}</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{currentCredits}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('subscription.pointsBalance')}</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  0
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6" style={{ maxHeight: 'calc(90vh - 320px)' }}>
            <AnimatePresence mode="wait">
              {selectedTab === 'subscription' && (
                <motion.div
                  key="subscription"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid md:grid-cols-3 gap-6 pb-6"
                >
                  {TIERS.map((tier) => {
                    const Icon = tier.icon;
                    const isCurrent = tier.id === currentTier;
                    const selectedPeriod = selectedPeriods[tier.id] || tier.defaultPeriod;
                    const selectedPrice = tier.pricingOptions?.find(p => p.period === selectedPeriod);
                    
                    return (
                      <motion.div
                        key={tier.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`relative rounded-2xl border-2 p-6 ${
                          tier.popular 
                            ? 'border-purple-500 dark:border-purple-400' 
                            : 'border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        {tier.popular && (
                          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-fuchsia-600 border-0">
                            {t('subscription.mostPopular')}
                          </Badge>
                        )}
                        
                        {isCurrent && (
                          <Badge className="absolute -top-3 right-4 bg-green-500 border-0">
                            {t('subscription.current')}
                          </Badge>
                        )}

                        <div className="text-center mb-4">
                          <div className={`inline-flex p-3 rounded-full bg-gradient-to-r ${tier.color} mb-4`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                          
                          {tier.pricingOptions ? (
                            <>
                              <div className="flex items-baseline justify-center gap-1 mb-3">
                                <span className="text-3xl font-bold">{selectedPrice?.price}</span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">/{selectedPrice?.label}</span>
                              </div>
                              
                              {/* Period Selector */}
                              <div className="flex flex-wrap gap-1 justify-center mb-2">
                                {tier.pricingOptions.map((option) => (
                                  <button
                                    key={option.period}
                                    onClick={() => setSelectedPeriods(prev => ({ ...prev, [tier.id]: option.period }))}
                                    className={`px-2 py-1 text-xs rounded-lg transition-all ${
                                      selectedPeriod === option.period
                                        ? `bg-gradient-to-r ${tier.color} text-white`
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                  >
                                    {option.label}
                                    {option.save && (
                                      <span className="ml-1 font-semibold">
                                        {option.save}
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </div>
                              
                              {selectedPrice?.save && (
                                <Badge className="bg-green-500 border-0 text-xs">
                                  {t('subscription.save')} {selectedPrice.save}!
                                </Badge>
                              )}
                              {selectedPrice?.badge && (
                                <Badge className="bg-amber-500 border-0 text-xs ml-1">
                                  {selectedPrice.badge}
                                </Badge>
                              )}
                            </>
                          ) : (
                            <div className="flex items-baseline justify-center gap-1">
                              <span className="text-3xl font-bold">{tier.price}</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">/{tier.period}</span>
                            </div>
                          )}

                          {tier.points > 0 && (
                            <div className="mt-2 flex items-center justify-center gap-1 text-sm text-yellow-600 dark:text-yellow-400 font-semibold">
                              <Star className="w-4 h-4 fill-yellow-500" />
                              +{tier.points} {t('subscription.bonusPoints')}
                            </div>
                          )}
                        </div>

                        <div className="h-[240px] overflow-y-auto mb-4 pr-2">
                          <ul className="space-y-2">
                            {tier.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <span className="text-xs">{feature}</span>
                              </li>
                            ))}
                            {tier.limitations.map((limitation, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-gray-500">
                                <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span className="text-xs">{limitation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {tier.id !== 'free' && !isCurrent && (
                          <Button
                            onClick={() => handleUpgrade(tier.id as 'premium' | 'pro', selectedPeriod)}
                            disabled={isUpgrading}
                            className={`w-full bg-gradient-to-r ${tier.color} hover:opacity-90`}
                          >
                            {isUpgrading ? t('subscription.processing') : `${t('subscription.upgrade')} ${tier.name}`}
                          </Button>
                        )}
                        
                        {tier.id === 'free' && currentTier !== 'free' && (
                          <Button
                            variant="outline"
                            className="w-full"
                            disabled
                          >
                            {t('subscription.downgrade')}
                          </Button>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}

              {selectedTab === 'credits' && (
                <motion.div
                  key="credits"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid md:grid-cols-3 gap-6 pb-6"
                >
                  {CREDIT_PACKS.map((pack) => (
                    <motion.div
                      key={pack.amount}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`relative rounded-2xl border-2 p-6 ${
                        pack.popular 
                          ? 'border-purple-500 dark:border-purple-400' 
                          : 'border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      {pack.popular && (
                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-fuchsia-600 border-0">
                          {t('subscription.bestValue')}
                        </Badge>
                      )}

                      <div className="text-center mb-6">
                        <div className="inline-flex p-3 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 mb-4">
                          <Coins className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold mb-1">
                          {pack.amount} {pack.bonus > 0 && `+ ${pack.bonus}`}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {t('subscription.editCredits')}
                        </p>
                        <div className="text-3xl font-bold mb-2">{pack.price}</div>
                        {pack.bonus > 0 && (
                          <Badge className="bg-green-500 border-0 mb-2">
                            +{pack.bonus} {t('subscription.bonusPoints')}
                          </Badge>
                        )}
                        {pack.points > 0 && (
                          <div className="flex items-center justify-center gap-1 text-sm text-yellow-600 dark:text-yellow-400 font-semibold">
                            <Star className="w-4 h-4 fill-yellow-500" />
                            +{pack.points} {t('checkin.points')}
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => handleBuyCredits(pack.amount, pack.bonus, pack.points)}
                        disabled={isBuyingCredits}
                        className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:opacity-90"
                      >
                        {isBuyingCredits ? t('subscription.processing') : t('subscription.buyNow')}
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {selectedTab === 'points' && (
                <motion.div
                  key="points"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="pb-6 space-y-6"
                >
                  {/* Points System Explanation */}
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-500/30">
                    <div className="flex items-start gap-3">
                      <Info className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-lg font-bold mb-2 text-yellow-900 dark:text-yellow-100">
                          {t('subscription.points.title')}
                        </h3>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-4">
                          {t('subscription.points.desc')}
                        </p>
                        
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
                            <Heart className="w-5 h-5 text-purple-600 mb-2" />
                            <p className="text-xs font-semibold mb-1">{t('subscription.points.share')}</p>
                            <p className="text-2xl font-bold text-purple-600">10-30</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{t('subscription.points.perPost')}</p>
                          </div>
                          
                          <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
                            <MessageCircle className="w-5 h-5 text-blue-600 mb-2" />
                            <p className="text-xs font-semibold mb-1">{t('subscription.points.support')}</p>
                            <p className="text-2xl font-bold text-blue-600">5-15</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{t('subscription.points.perReply')}</p>
                          </div>
                          
                          <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
                            <Target className="w-5 h-5 text-green-600 mb-2" />
                            <p className="text-xs font-semibold mb-1">{t('subscription.points.checkin')}</p>
                            <p className="text-2xl font-bold text-green-600">25</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{t('subscription.points.daily')}</p>
                          </div>
                        </div>

                        <div className="mt-4 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <p className="text-xs text-purple-900 dark:text-purple-100">
                            <TrendingUp className="w-4 h-4 inline mr-1" />
                            <strong>{t('subscription.points.multipliers')}:</strong> {t('tier.free')} (1x) • {t('tier.premium')} (2x) • {t('tier.pro')} (3x)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rewards Tiers */}
                  <div>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      {t('subscription.rewards.title')}
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {POINT_REWARDS.map((reward, idx) => {
                        const Icon = reward.icon;
                        const canRedeem = false; // Would check against actual points
                        
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`relative rounded-xl border-2 p-4 ${
                              canRedeem 
                                ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                                : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600">
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-semibold text-sm">{reward.reward}</h4>
                                  {canRedeem && (
                                    <Badge className="bg-green-500 border-0 text-xs">
                                      {t('subscription.rewards.ready')}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                                  <Star className="w-4 h-4 fill-yellow-500" />
                                  <span className="text-sm font-bold">{reward.points}</span>
                                  <span className="text-xs text-gray-600 dark:text-gray-400">{t('checkin.points')}</span>
                                </div>
                              </div>
                            </div>
                            
                            <Button
                              size="sm"
                              disabled={!canRedeem}
                              className={`w-full mt-3 ${
                                canRedeem 
                                  ? 'bg-gradient-to-r from-green-600 to-emerald-600' 
                                  : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                            >
                              {canRedeem ? t('subscription.rewards.redeem') : t('subscription.rewards.locked')}
                            </Button>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Leaderboard Teaser */}
                  <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/30 rounded-2xl p-6 border border-purple-200 dark:border-purple-500/30 text-center">
                    <Flame className="w-12 h-12 mx-auto mb-3 text-orange-500" />
                    <h3 className="text-lg font-bold mb-2">{t('subscription.leaderboard.title')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {t('subscription.leaderboard.desc')}
                    </p>
                    <Badge className="bg-gradient-to-r from-orange-600 to-red-600 border-0">
                      {t('subscription.leaderboard.comingSoon')}
                    </Badge>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-6 pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-center text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
              <span><strong>{t('subscription.demo')}:</strong> {t('subscription.demoDesc')}</span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
