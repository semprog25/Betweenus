/**
 * PaywallGate Component
 * 
 * A component that shows a paywall when users try to access premium features
 * Use this to gate premium features throughout your app
 */

import { ReactNode, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Crown, Zap, X } from 'lucide-react';
import { Button } from './ui/button';
import { usePaywall } from '../hooks/usePaywall';
import { hasBetweenUSPro } from '../utils/revenuecat';
import { useLanguage } from './LanguageContext';

interface PaywallGateProps {
  /** Children to show if user has access */
  children: ReactNode;
  /** Content to show in the paywall prompt */
  featureName?: string;
  /** Description of the feature */
  description?: string;
  /** Custom paywall trigger button */
  trigger?: ReactNode;
  /** Show inline paywall (true) or show button (false) */
  inline?: boolean;
  /** Callback when access is granted */
  onAccessGranted?: () => void;
}

export function PaywallGate({
  children,
  featureName = 'This feature',
  description,
  trigger,
  inline = false,
  onAccessGranted,
}: PaywallGateProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const { showPaywall, isPresenting } = usePaywall();
  const { t } = useLanguage();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    setIsChecking(true);
    try {
      const hasPro = await hasBetweenUSPro();
      setHasAccess(hasPro);
      
      if (hasPro && onAccessGranted) {
        onAccessGranted();
      }
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleUpgrade = async () => {
    const purchased = await showPaywall({
      showDismissedToast: false,
      onPurchaseSuccess: async () => {
        await checkAccess();
        if (onAccessGranted) {
          onAccessGranted();
        }
      },
    });

    if (purchased) {
      await checkAccess();
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (inline) {
    return (
      <div className="relative">
        {/* Blurred content preview */}
        <div className="blur-sm pointer-events-none opacity-50">
          {children}
        </div>

        {/* Paywall overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md mx-4 text-center border-2 border-purple-500 shadow-2xl"
          >
            <div className="inline-flex p-4 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>

            <h3 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
              <Crown className="w-6 h-6 text-amber-500" />
              {featureName} Requires BetweenUS Pro
            </h3>

            {description && (
              <p className="text-gray-600 dark:text-gray-400 mb-6">{description}</p>
            )}

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-left">
                <Zap className="w-5 h-5 text-purple-600" />
                <span className="text-sm">Unlock all premium features</span>
              </div>
              <div className="flex items-center gap-2 text-left">
                <Crown className="w-5 h-5 text-amber-500" />
                <span className="text-sm">Support the development</span>
              </div>
            </div>

            <Button
              onClick={handleUpgrade}
              disabled={isPresenting}
              className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:opacity-90"
              size="lg"
            >
              {isPresenting ? 'Loading...' : 'Upgrade to BetweenUS Pro'}
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show trigger button
  if (trigger) {
    return (
      <div onClick={handleUpgrade} className="cursor-pointer">
        {trigger}
      </div>
    );
  }

  // Default button
  return (
    <Button
      onClick={handleUpgrade}
      disabled={isPresenting}
      className="bg-gradient-to-r from-purple-600 to-fuchsia-600"
    >
      <Crown className="w-4 h-4 mr-2" />
      {isPresenting ? 'Loading...' : `Unlock ${featureName}`}
    </Button>
  );
}
