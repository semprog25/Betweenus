import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Check, Sparkles, Crown, Zap, X, Star, Trophy, Gift, Flame, TrendingUp, Info, Coins, Heart, MessageCircle, Target } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import {
  createBillingPortalSession,
  createCheckoutSession,
  getSubscription,
} from '../utils/api'
import { useLanguage } from './LanguageContext'
import { isNativeMobile, isWeb } from '../utils/platform'
import {
  getStripePriceId,
  isStripeCheckoutConfigured,
  type PlanId,
} from '../config/subscription-catalog'
import {
  identifyUser,
  initializeRevenueCat,
  isRevenueCatConfigured,
  purchasePlan,
  refreshBackendSubscription,
  restorePurchases,
} from '../utils/revenuecat'

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  currentTier?: string
  currentCredits?: number
  onSubscriptionUpdate?: () => void
}

function planIdForTierPeriod(tier: 'premium' | 'pro', period: string): PlanId {
  const billing = period === 'year' ? 'yearly' : 'monthly'
  return `${tier}_${billing}` as PlanId
}

export function SubscriptionModal({
  isOpen,
  onClose,
  userId,
  currentTier = 'free',
  currentCredits = 0,
  onSubscriptionUpdate,
}: SubscriptionModalProps) {
  const { t } = useLanguage()
  const isBrowser = isWeb()
  const isNative = isNativeMobile()
  const stripeReady = isStripeCheckoutConfigured()
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [isOpeningPortal, setIsOpeningPortal] = useState(false)
  const [serverStripeReady, setServerStripeReady] = useState<boolean | null>(null)
  const [selectedTab, setSelectedTab] = useState<'subscription' | 'credits' | 'points'>('subscription')
  const [selectedPeriods, setSelectedPeriods] = useState<Record<string, string>>({
    premium: 'month',
    pro: 'month',
  })

  useEffect(() => {
    if (!isOpen || !userId || !isBrowser) return
    let cancelled = false
    getSubscription()
      .then((res) => {
        if (cancelled) return
        if (typeof res?.payments?.stripeConfigured === 'boolean') {
          setServerStripeReady(res.payments.stripeConfigured)
        }
      })
      .catch(() => {
        if (!cancelled) setServerStripeReady(null)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, userId, isBrowser])

  useEffect(() => {
    if (!isOpen || !userId || !isNative) return
    void initializeRevenueCat(userId).then(() => identifyUser(userId))
  }, [isOpen, userId, isNative])

  const checkoutReady = isBrowser
    ? (serverStripeReady ?? stripeReady)
    : isRevenueCatConfigured()

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
        { period: 'month', price: '$19.99', label: t('period.monthly') },
        { period: 'year', price: '$149.99', label: t('period.yearly'), save: '38%' },
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
  ]

  const CREDIT_PACKS = [
    { amount: 5, price: '$1.99', bonus: 0, points: 25 },
    { amount: 15, price: '$4.99', bonus: 3, popular: true, points: 75 },
    { amount: 50, price: '$12.99', bonus: 15, points: 250 },
  ]

  const POINT_REWARDS = [
    { points: 100, reward: t('reward.freeEdit'), icon: Sparkles },
    { points: 500, reward: t('reward.premiumBadge'), icon: Crown },
    { points: 1000, reward: t('reward.freeEdits5'), icon: Gift },
    { points: 2500, reward: t('reward.customProfile'), icon: Star },
    { points: 5000, reward: t('reward.monthPremium'), icon: Trophy },
    { points: 10000, reward: t('reward.monthsPro'), icon: Flame },
  ]

  const handleUpgrade = async (tier: 'premium' | 'pro', period: string) => {
    if (!userId) {
      toast.error(t('subscription.error.signin'))
      return
    }

    const planId = planIdForTierPeriod(tier, period)

    if (isBrowser) {
      if (!checkoutReady) {
        toast.message(t('subscription.checkoutNotConfigured'), {
          description: t('subscription.checkoutNotConfiguredDesc'),
        })
        return
      }

      // Prefer server price config; client price IDs are optional display helpers
      if (stripeReady && !getStripePriceId(planId) && serverStripeReady === false) {
        toast.message(t('subscription.checkoutNotConfigured'), {
          description: t('subscription.checkoutNotConfiguredDesc'),
        })
        return
      }

      setIsUpgrading(true)
      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://betweenus.fun'
        const result = await createCheckoutSession({
          planId,
          successUrl: `${origin}/?checkout=success&plan=${planId}`,
          cancelUrl: `${origin}/?checkout=cancel`,
        })
        if (!result?.success || !result?.url) {
          const code = result?.code
          if (code === 'STRIPE_NOT_CONFIGURED' || code === 'STRIPE_PRICE_MISSING') {
            toast.message(t('subscription.checkoutNotConfigured'), {
              description: t('subscription.checkoutNotConfiguredDesc'),
            })
            return
          }
          throw new Error(result?.error || 'No checkout URL')
        }
        window.location.assign(result.url)
      } catch (error: any) {
        console.error('Checkout error:', error)
        toast.error(t('subscription.error.upgrade'))
      } finally {
        setIsUpgrading(false)
      }
      return
    }

    if (!isNative) {
      toast.error(t('subscription.error.upgrade'))
      return
    }

    if (!isRevenueCatConfigured()) {
      toast.message(t('subscription.storeNotConfigured'), {
        description: t('subscription.storeNotConfiguredDesc'),
      })
      return
    }

    setIsUpgrading(true)
    try {
      await initializeRevenueCat(userId)
      await identifyUser(userId)
      const purchase = await purchasePlan(planId)
      if (purchase.cancelled) {
        toast.message(t('subscription.cancelled'))
        return
      }
      if (!purchase.success) {
        throw new Error(purchase.error || 'Purchase failed')
      }
      await refreshBackendSubscription()
      toast.success(`${t('subscription.success.upgrade')} ${tier}!`)
      onSubscriptionUpdate?.()
      onClose()
    } catch (error) {
      console.error('Upgrade error:', error)
      toast.error(t('subscription.error.upgrade'))
    } finally {
      setIsUpgrading(false)
    }
  }

  const handleRestore = async () => {
    if (!userId || !isNative) return
    setIsRestoring(true)
    try {
      await initializeRevenueCat(userId)
      await identifyUser(userId)
      const restored = await restorePurchases()
      if (!restored.success) {
        throw new Error(restored.error || 'Restore failed')
      }
      await refreshBackendSubscription()
      toast.success(t('subscription.restoreSuccess'))
      onSubscriptionUpdate?.()
    } catch (error) {
      console.error('Restore error:', error)
      toast.error(t('subscription.restoreError'))
    } finally {
      setIsRestoring(false)
    }
  }

  const handleManageSubscription = async () => {
    if (!userId || !isBrowser) return
    setIsOpeningPortal(true)
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://betweenus.fun'
      const result = await createBillingPortalSession({ returnUrl: origin })
      if (!result?.success || !result?.url) throw new Error(result?.error || 'No portal URL')
      window.location.assign(result.url)
    } catch (error) {
      console.error('Portal error:', error)
      toast.message(t('subscription.manageUnavailable'), {
        description: t('subscription.manageUnavailableDesc'),
      })
    } finally {
      setIsOpeningPortal(false)
    }
  }

  const paymentsNotice = isBrowser
    ? (checkoutReady ? t('subscription.paymentsNoticeStripe') : t('subscription.checkoutNotConfiguredDesc'))
    : (isRevenueCatConfigured() ? t('subscription.paymentsNoticeNative') : t('subscription.storeNotConfiguredDesc'))

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="flex max-h-[min(92vh,920px)] w-[min(96vw,72rem)] max-w-6xl flex-col gap-0 overflow-hidden bg-white p-0 dark:bg-gray-800">
        <div className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="shrink-0 space-y-1.5 p-5 pb-3 sm:p-6 sm:pb-4">
            <DialogTitle className="flex items-center justify-center gap-2 text-center text-xl sm:text-2xl">
              <Trophy className="h-6 w-6 text-purple-600" aria-hidden="true" />
              {t('subscription.title')}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t('subscription.subtitle')}
            </DialogDescription>
          </DialogHeader>

          <div className="mx-5 mb-3 flex shrink-0 gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-700 sm:mx-6 sm:mb-4 sm:gap-2">
            <button
              type="button"
              onClick={() => setSelectedTab('subscription')}
              className={`flex-1 rounded-md px-2 py-2 text-xs transition-all sm:px-4 sm:text-sm ${
                selectedTab === 'subscription'
                  ? 'bg-white font-medium shadow-sm dark:bg-gray-600'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Crown className="mr-1 inline h-4 w-4 sm:mr-2" aria-hidden="true" />
              {t('subscription.tab.subscription')}
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('credits')}
              className={`flex-1 rounded-md px-2 py-2 text-xs transition-all sm:px-4 sm:text-sm ${
                selectedTab === 'credits'
                  ? 'bg-white font-medium shadow-sm dark:bg-gray-600'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Sparkles className="mr-1 inline h-4 w-4 sm:mr-2" aria-hidden="true" />
              {t('subscription.tab.credits')}
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('points')}
              className={`flex-1 rounded-md px-2 py-2 text-xs transition-all sm:px-4 sm:text-sm ${
                selectedTab === 'points'
                  ? 'bg-white font-medium shadow-sm dark:bg-gray-600'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Star className="mr-1 inline h-4 w-4 sm:mr-2" aria-hidden="true" />
              {t('subscription.tab.points')}
            </button>
          </div>

          <div className="mx-5 mb-3 shrink-0 rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 to-fuchsia-50 p-3 dark:border-purple-500/30 dark:from-purple-950/30 dark:to-fuchsia-950/30 sm:mx-6 sm:mb-4 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('subscription.currentPlan')}</p>
                <p className="text-lg font-semibold capitalize text-gray-900 dark:text-white sm:text-xl">
                  {t(`tier.${currentTier}`) || currentTier}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('subscription.editCredits')}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">{currentCredits}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {isBrowser && currentTier !== 'free' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isOpeningPortal}
                    onClick={() => void handleManageSubscription()}
                  >
                    {isOpeningPortal ? t('subscription.processing') : t('subscription.manage')}
                  </Button>
                )}
                {isNative && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isRestoring || !isRevenueCatConfigured()}
                    onClick={() => void handleRestore()}
                  >
                    {isRestoring ? t('subscription.processing') : t('subscription.restore')}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 sm:px-6">
            <AnimatePresence mode="wait">
              {selectedTab === 'subscription' && (
                <motion.div
                  key="subscription"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid gap-4 pb-6 md:grid-cols-3 md:gap-5 md:items-stretch"
                >
                  {TIERS.map((tier) => {
                    const Icon = tier.icon
                    const isCurrent = tier.id === currentTier
                    const selectedPeriod = selectedPeriods[tier.id] || tier.defaultPeriod
                    const selectedPrice = tier.pricingOptions?.find((p) => p.period === selectedPeriod)

                    return (
                      <motion.div
                        key={tier.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`relative flex h-full flex-col rounded-2xl border-2 p-5 ${
                          tier.popular
                            ? 'border-purple-500 dark:border-purple-400'
                            : 'border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        {tier.popular && (
                          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 border-0 bg-gradient-to-r from-purple-600 to-fuchsia-600">
                            {t('subscription.mostPopular')}
                          </Badge>
                        )}

                        {isCurrent && (
                          <Badge className="absolute -top-3 right-4 border-0 bg-green-500">
                            {t('subscription.current')}
                          </Badge>
                        )}

                        <div className="mb-4 text-center">
                          <div className={`mb-3 inline-flex rounded-full bg-gradient-to-r p-3 ${tier.color}`}>
                            <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                          </div>
                          <h3 className="mb-2 text-xl font-bold">{tier.name}</h3>

                          {tier.pricingOptions ? (
                            <>
                              <div className="mb-3 flex items-baseline justify-center gap-1">
                                <span className="text-3xl font-bold">{selectedPrice?.price}</span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">/{selectedPrice?.label}</span>
                              </div>

                              <div className="mb-2 flex flex-wrap justify-center gap-1">
                                {tier.pricingOptions.map((option) => (
                                  <button
                                    key={option.period}
                                    type="button"
                                    onClick={() => setSelectedPeriods((prev) => ({ ...prev, [tier.id]: option.period }))}
                                    className={`rounded-lg px-2 py-1 text-xs transition-all ${
                                      selectedPeriod === option.period
                                        ? `bg-gradient-to-r ${tier.color} text-white`
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                                    }`}
                                  >
                                    {option.label}
                                    {option.save && (
                                      <span className="ml-1 font-semibold">{option.save}</span>
                                    )}
                                  </button>
                                ))}
                              </div>

                              {selectedPrice?.save && (
                                <Badge className="border-0 bg-green-500 text-xs">
                                  {t('subscription.save')} {selectedPrice.save}!
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
                            <div className="mt-2 flex items-center justify-center gap-1 text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                              <Star className="h-4 w-4 fill-yellow-500" aria-hidden="true" />
                              +{tier.points} {t('subscription.bonusPoints')}
                            </div>
                          )}
                        </div>

                        <ul className="mb-4 flex-1 space-y-2">
                          {tier.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" aria-hidden="true" />
                              <span className="text-xs leading-snug sm:text-sm">{feature}</span>
                            </li>
                          ))}
                          {tier.limitations.map((limitation, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-500">
                              <X className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                              <span className="text-xs leading-snug sm:text-sm">{limitation}</span>
                            </li>
                          ))}
                        </ul>

                        {tier.id !== 'free' && !isCurrent && (
                          <Button
                            type="button"
                            onClick={() => handleUpgrade(tier.id as 'premium' | 'pro', selectedPeriod || 'month')}
                            disabled={isUpgrading || !checkoutReady}
                            className={`mt-auto w-full bg-gradient-to-r ${tier.color} hover:opacity-90 disabled:opacity-60`}
                            aria-label={`${t('subscription.subscribeSecurely')} ${tier.name}`}
                          >
                            {isUpgrading
                              ? t('subscription.processing')
                              : checkoutReady
                                ? t('subscription.subscribeSecurely')
                                : t('subscription.checkoutNotConfigured')}
                          </Button>
                        )}

                        {tier.id === 'free' && currentTier !== 'free' && (
                          <Button type="button" variant="outline" className="mt-auto w-full" disabled>
                            {t('subscription.downgrade')}
                          </Button>
                        )}
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}

              {selectedTab === 'credits' && (
                <motion.div
                  key="credits"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid gap-6 pb-6 md:grid-cols-3"
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
                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 border-0 bg-gradient-to-r from-purple-600 to-fuchsia-600">
                          {t('subscription.bestValue')}
                        </Badge>
                      )}

                      <div className="mb-6 text-center">
                        <div className="mb-4 inline-flex rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 p-3">
                          <Coins className="h-6 w-6 text-white" aria-hidden="true" />
                        </div>
                        <h3 className="mb-1 text-2xl font-bold">
                          {pack.amount} {pack.bonus > 0 && `+ ${pack.bonus}`}
                        </h3>
                        <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                          {t('subscription.editCredits')}
                        </p>
                        <div className="mb-2 text-3xl font-bold">{pack.price}</div>
                      </div>

                      <Button
                        type="button"
                        disabled
                        className="w-full"
                        onClick={() => {
                          toast.message(t('subscription.creditsComingSoon'), {
                            description: t('subscription.creditsComingSoonDesc'),
                          })
                        }}
                      >
                        {t('subscription.creditsComingSoon')}
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
                  className="space-y-6 pb-6"
                >
                  <div className="rounded-2xl border border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50 p-6 dark:border-yellow-500/30 dark:from-yellow-950/30 dark:to-amber-950/30">
                    <div className="flex items-start gap-3">
                      <Info className="mt-1 h-6 w-6 flex-shrink-0 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
                      <div>
                        <h3 className="mb-2 text-lg font-bold text-yellow-900 dark:text-yellow-100">
                          {t('subscription.points.title')}
                        </h3>
                        <p className="mb-4 text-sm text-yellow-800 dark:text-yellow-200">
                          {t('subscription.points.desc')}
                        </p>

                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="rounded-xl bg-white p-4 dark:bg-gray-800">
                            <Heart className="mb-2 h-5 w-5 text-purple-600" aria-hidden="true" />
                            <p className="mb-1 text-xs font-semibold">{t('subscription.points.share')}</p>
                            <p className="text-2xl font-bold text-purple-600">10-30</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{t('subscription.points.perPost')}</p>
                          </div>

                          <div className="rounded-xl bg-white p-4 dark:bg-gray-800">
                            <MessageCircle className="mb-2 h-5 w-5 text-blue-600" aria-hidden="true" />
                            <p className="mb-1 text-xs font-semibold">{t('subscription.points.support')}</p>
                            <p className="text-2xl font-bold text-blue-600">5-15</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{t('subscription.points.perReply')}</p>
                          </div>

                          <div className="rounded-xl bg-white p-4 dark:bg-gray-800">
                            <Target className="mb-2 h-5 w-5 text-green-600" aria-hidden="true" />
                            <p className="mb-1 text-xs font-semibold">{t('subscription.points.checkin')}</p>
                            <p className="text-2xl font-bold text-green-600">25</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{t('subscription.points.daily')}</p>
                          </div>
                        </div>

                        <div className="mt-4 rounded-lg bg-purple-100 p-3 dark:bg-purple-900/30">
                          <p className="text-xs text-purple-900 dark:text-purple-100">
                            <TrendingUp className="mr-1 inline h-4 w-4" aria-hidden="true" />
                            <strong>{t('subscription.points.multipliers')}:</strong> {t('tier.free')} (1x) • {t('tier.premium')} (2x) • {t('tier.pro')} (3x)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
                      <Trophy className="h-5 w-5 text-yellow-500" aria-hidden="true" />
                      {t('subscription.rewards.title')}
                    </h3>

                    <div className="grid gap-4 md:grid-cols-2">
                      {POINT_REWARDS.map((reward, idx) => {
                        const Icon = reward.icon
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="relative rounded-xl border-2 border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800/50"
                          >
                            <div className="flex items-start gap-3">
                              <div className="rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 p-2">
                                <Icon className="h-5 w-5 text-white" aria-hidden="true" />
                              </div>
                              <div className="flex-1">
                                <h4 className="mb-1 text-sm font-semibold">{reward.reward}</h4>
                                <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                                  <Star className="h-4 w-4 fill-yellow-500" aria-hidden="true" />
                                  <span className="text-sm font-bold">{reward.points}</span>
                                </div>
                              </div>
                            </div>
                            <Button size="sm" disabled className="mt-3 w-full bg-gray-300 dark:bg-gray-600">
                              {t('subscription.rewards.locked')}
                            </Button>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 to-fuchsia-50 p-6 text-center dark:border-purple-500/30 dark:from-purple-950/30 dark:to-fuchsia-950/30">
                    <Flame className="mx-auto mb-3 h-12 w-12 text-orange-500" aria-hidden="true" />
                    <h3 className="mb-2 text-lg font-bold">{t('subscription.leaderboard.title')}</h3>
                    <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                      {t('subscription.leaderboard.desc')}
                    </p>
                    <Badge className="border-0 bg-gradient-to-r from-orange-600 to-red-600">
                      {t('subscription.leaderboard.comingSoon')}
                    </Badge>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="shrink-0 border-t border-gray-200 p-4 dark:border-gray-700 sm:p-5">
            <p className="flex items-start justify-center gap-2 text-center text-xs leading-relaxed text-gray-600 dark:text-gray-400 sm:items-center">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 sm:mt-0" strokeWidth={2} aria-hidden="true" />
              <span>
                <strong>{t('subscription.paymentsNotice')}:</strong>{' '}
                {paymentsNotice}
              </span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
