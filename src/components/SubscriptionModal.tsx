import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Check, Sparkles, Crown, Zap, X, Star, Trophy, Gift, Flame, TrendingUp, Info, Coins, Heart, MessageCircle, Target, RefreshCw, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from './LanguageContext';
import { isNativeMobile } from '../utils/platform';
import {
  initializeRevenueCat,
  hasBetweenUSPro,
  getCurrentOffering,
  purchasePackage,
  restorePurchases,
  presentPaywall,
  presentCustomerCenter,
  isCustomerCenterAvailable,
  getSubscriptionStatus,
  syncSubscriptionWithBackend,
  getMonthlyPackage,
  getYearlyPackage,
  getLifetimePackage,
  formatPrice,
  type Package,
  type Offering,
  ENTITLEMENT_IDENTIFIER,
} from '../utils/revenuecat';
import { getSession } from '../utils/auth';

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
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'subscription' | 'credits' | 'points'>('subscription');
  const [offering, setOffering] = useState<Offering | null>(null);
  const [hasPro, setHasPro] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [canUseCustomerCenter, setCanUseCustomerCenter] = useState(false);

  // Load offerings and subscription status when modal opens
  useEffect(() => {
    if (isOpen && isNativeMobile()) {
      loadOfferings();
      checkSubscriptionStatus();
      checkCustomerCenterAvailability();
    }
  }, [isOpen, userId]);

  const loadOfferings = async () => {
    try {
      const currentOffering = await getCurrentOffering();
      setOffering(currentOffering);
    } catch (error) {
      console.error('Error loading offerings:', error);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const status = await getSubscriptionStatus();
      setHasPro(status.hasPro);
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const checkCustomerCenterAvailability = async () => {
    const available = await isCustomerCenterAvailable();
    setCanUseCustomerCenter(available);
  };

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

  // Handle purchase using RevenueCat
  const handlePurchasePackage = async (pkg: Package) => {
    if (!userId) {
      toast.error(t('subscription.error.signin'));
      return;
    }

    setIsUpgrading(true);
    try {
      const result = await purchasePackage(pkg);

      if (result.success && result.customerInfo) {
        // Sync with backend
        await syncSubscriptionWithBackend(userId);

        toast.success(`${t('subscription.success.upgrade')}! 🎉`);
        await checkSubscriptionStatus();
        onSubscriptionUpdate?.();
        onClose();
      } else {
        // Handle specific error cases
        if (result.errorCode === 'PURCHASE_CANCELLED' || result.errorCode === 'USER_CANCELLED') {
          // User cancelled - no need to show error
          return;
        }
        toast.error(result.error || t('subscription.error.upgrade'));
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error(error.message || t('subscription.error.upgrade'));
    } finally {
      setIsUpgrading(false);
    }
  };

  // Handle upgrade with period selection
  const handleUpgrade = async (tier: 'premium' | 'pro', period: string) => {
    if (!isNativeMobile()) {
      toast.error('Subscriptions are only available on mobile devices');
      return;
    }

    if (!offering) {
      toast.error('Loading subscription options...');
      await loadOfferings();
      return;
    }

    let pkg: Package | null = null;

    // Try to find the package based on period
    if (period === 'month' || period === 'monthly') {
      pkg = tier === 'pro' ? getMonthlyPackage(offering) : getMonthlyPackage(offering);
    } else if (period === 'year' || period === 'yearly') {
      pkg = getYearlyPackage(offering);
    } else if (period === 'lifetime') {
      pkg = getLifetimePackage(offering);
    }

    // Fallback: use first available package for the tier
    if (!pkg && offering.availablePackages.length > 0) {
      pkg = offering.availablePackages[0];
    }

    if (!pkg) {
      toast.error('No subscription package available');
      return;
    }

    await handlePurchasePackage(pkg);
  };

  // Handle RevenueCat Paywall UI
  const handlePresentPaywall = async () => {
    try {
      const result = await presentPaywall(offering || undefined);

      if (!result.dismissed && result.customerInfo) {
        // Purchase completed
        await syncSubscriptionWithBackend(userId);
        await checkSubscriptionStatus();
        onSubscriptionUpdate?.();
        onClose();
        toast.success(t('subscription.success.upgrade') + '! 🎉');
      }
    } catch (error: any) {
      console.error('Error presenting paywall:', error);
      toast.error('Error opening subscription options');
    }
  };

  // Handle restore purchases
  const handleRestorePurchases = async () => {
    if (!isNativeMobile()) {
      toast.error('Restore purchases is only available on mobile devices');
      return;
    }

    setIsRestoring(true);
    try {
      const customerInfo = await restorePurchases();

      if (customerInfo) {
        // Check if they have active entitlements
        const hasActivePro = await hasBetweenUSPro();
        
        if (hasActivePro) {
          await syncSubscriptionWithBackend(userId);
          await checkSubscriptionStatus();
          onSubscriptionUpdate?.();
          toast.success('Purchases restored successfully! 🎉');
        } else {
          toast.info('No active subscriptions found');
        }
      } else {
        toast.error('Failed to restore purchases');
      }
    } catch (error: any) {
      console.error('Restore error:', error);
      toast.error('Error restoring purchases');
    } finally {
      setIsRestoring(false);
    }
  };

  // Handle Customer Center
  const handleOpenCustomerCenter = async () => {
    try {
      await presentCustomerCenter();
      // Refresh status after customer center closes
      await checkSubscriptionStatus();
      onSubscriptionUpdate?.();
    } catch (error: any) {
      console.error('Error opening customer center:', error);
      toast.error('Error opening customer center');
    }
  };

  const handleBuyCredits = async (amount: number, bonus: number, points: number) => {
    if (!userId) {
      toast.error(t('subscription.error.signin'));
      return;
    }

    if (!isNativeMobile()) {
      toast.error('In-app purchases are only available on mobile devices');
      return;
    }

    setIsBuyingCredits(true);
    try {
      // For consumables, you would use RevenueCat's purchaseProduct method
      // For now, this is a placeholder that would need to be implemented
      toast.info('Credit purchases coming soon!');
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error(t('subscription.error.purchase'));
    } finally {
      setIsBuyingCredits(false);
    }
  };

  // Get package price from offering
  const getPackagePrice = (period: string): string | null => {
    if (!offering) return null;

    let pkg: Package | null = null;
    if (period === 'month' || period === 'monthly') {
      pkg = getMonthlyPackage(offering);
    } else if (period === 'year' || period === 'yearly') {
      pkg = getYearlyPackage(offering);
    } else if (period === 'lifetime') {
      pkg = getLifetimePackage(offering);
    }

    return pkg ? formatPrice(pkg.product) : null;
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

          {/* Current Status */}
          <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/30 rounded-2xl p-4 mb-4 border border-purple-200 dark:border-purple-500/30 mx-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('subscription.currentPlan')}</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white capitalize flex items-center gap-2">
                  {hasPro ? (
                    <>
                      <Zap className="w-5 h-5 text-amber-500" />
                      BetweenUS Pro
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {t(`tier.${currentTier}`) || currentTier}
                    </>
                  )}
                </p>
                {subscriptionStatus?.expirationDate && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Expires: {new Date(subscriptionStatus.expirationDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('subscription.editCredits')}</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{currentCredits}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              {isNativeMobile() && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRestorePurchases}
                    disabled={isRestoring}
                    className="flex-1"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRestoring ? 'animate-spin' : ''}`} />
                    Restore Purchases
                  </Button>
                  {canUseCustomerCenter && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenCustomerCenter}
                      className="flex-1"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Subscription
                    </Button>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handlePresentPaywall}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    View All Plans
                  </Button>
                </>
              )}
            </div>
          </div>

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

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6">
            <AnimatePresence mode="wait">
              {selectedTab === 'subscription' && (
                <motion.div
                  key="subscription"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="pb-6"
                >
                  {!isNativeMobile() && (
                    <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ⚠️ Subscriptions are only available on mobile devices. Please use the app on iOS or Android to purchase.
                      </p>
                    </div>
                  )}

                  {/* Show packages from RevenueCat offering if available */}
                  {offering && offering.availablePackages.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      {offering.availablePackages.map((pkg, idx) => {
                        const isPopular = pkg.packageType === 'ANNUAL' || pkg.identifier.includes('yearly');
                        const Icon = idx === 0 ? Crown : Zap;

                        return (
                          <motion.div
                            key={pkg.identifier}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`relative rounded-2xl border-2 p-6 ${
                              isPopular
                                ? 'border-purple-500 dark:border-purple-400 bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/30'
                                : 'border-gray-200 dark:border-gray-600'
                            }`}
                          >
                            {isPopular && (
                              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-fuchsia-600 border-0">
                                {t('subscription.bestValue')}
                              </Badge>
                            )}

                            <div className="text-center mb-6">
                              <div className={`inline-flex p-3 rounded-full bg-gradient-to-r ${pkg.packageType === 'ANNUAL' ? 'from-purple-600 to-fuchsia-600' : 'from-amber-500 to-orange-600'} mb-4`}>
                                <Icon className="w-6 h-6 text-white" />
                              </div>
                              <h3 className="text-2xl font-bold mb-2">{pkg.product.title}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{pkg.product.description}</p>
                              <div className="text-4xl font-bold mb-2">{formatPrice(pkg.product)}</div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                {pkg.packageType === 'MONTHLY' ? 'Per Month' : 
                                 pkg.packageType === 'ANNUAL' ? 'Per Year' :
                                 pkg.packageType === 'LIFETIME' ? 'One Time' : 
                                 pkg.packageType.toLowerCase().replace('_', ' ')}
                              </p>
                            </div>

                            <Button
                              onClick={() => handlePurchasePackage(pkg)}
                              disabled={isUpgrading || hasPro}
                              className={`w-full ${
                                isPopular
                                  ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600'
                                  : 'bg-gradient-to-r from-amber-500 to-orange-600'
                              }`}
                            >
                              {hasPro ? 'Already Active' : isUpgrading ? 'Processing...' : `Subscribe to ${pkg.product.title}`}
                            </Button>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    // Fallback to static tier display if no offering
                    <div className="grid md:grid-cols-3 gap-6">
                      {TIERS.filter(tier => tier.id !== 'free').map((tier, idx) => {
                        const Icon = tier.icon;
                        const isCurrentTier = tier.id === currentTier;
                        const selectedPeriod = 'month';

                        return (
                          <motion.div
                            key={tier.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`relative rounded-2xl border-2 p-6 ${
                              tier.popular
                                ? 'border-purple-500 dark:border-purple-400 bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/30'
                                : 'border-gray-200 dark:border-gray-600'
                            }`}
                          >
                            {tier.popular && (
                              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-fuchsia-600 border-0">
                                {t('subscription.bestValue')}
                              </Badge>
                            )}

                            <div className="text-center mb-6">
                              <div className={`inline-flex p-3 rounded-full bg-gradient-to-r ${tier.color} mb-4`}>
                                <Icon className="w-6 h-6 text-white" />
                              </div>
                              <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                              <div className="text-4xl font-bold mb-2">
                                {getPackagePrice(selectedPeriod) || tier.pricingOptions?.find(p => p.period === selectedPeriod)?.price || tier.price}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {tier.pricingOptions?.find(p => p.period === selectedPeriod)?.label || tier.period}
                              </p>
                            </div>

                            <ul className="space-y-2 mb-6 text-sm">
                              {tier.features.map((feature, fIdx) => (
                                <li key={fIdx} className="flex items-start gap-2">
                                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                                </li>
                              ))}
                            </ul>

                            <Button
                              onClick={() => handleUpgrade(tier.id as 'premium' | 'pro', selectedPeriod)}
                              disabled={isUpgrading || isCurrentTier || hasPro}
                              className={`w-full bg-gradient-to-r ${tier.color}`}
                            >
                              {isCurrentTier || hasPro ? 'Current Plan' : isUpgrading ? 'Processing...' : `Upgrade to ${tier.name}`}
                            </Button>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
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
                        const canRedeem = false;
                        
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
                                </div>
                                <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                                  <Star className="w-4 h-4 fill-yellow-500" />
                                  <span className="text-sm font-bold">{reward.points}</span>
                                  <span className="text-xs text-gray-600 dark:text-gray-400">{t('checkin.points')}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-6 pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-center text-gray-600 dark:text-gray-400">
              {isNativeMobile() 
                ? 'Subscriptions are managed through your App Store or Google Play account.'
                : '💡 Subscriptions are only available on mobile devices. Please use the app on iOS or Android to purchase.'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
