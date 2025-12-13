/**
 * usePaywall Hook
 * 
 * React hook for easily showing RevenueCat paywalls throughout the app
 */

import { useState, useCallback } from 'react';
import { presentPaywall, getCurrentOffering, hasBetweenUSPro, syncSubscriptionWithBackend } from '../utils/revenuecat';
import { getSession } from '../utils/auth';
import { toast } from 'sonner';
import { isNativeMobile } from '../utils/platform';

export interface PaywallOptions {
  /** Show toast message if paywall is dismissed */
  showDismissedToast?: boolean;
  /** Callback when purchase is successful */
  onPurchaseSuccess?: () => void;
  /** Callback when paywall is dismissed */
  onDismissed?: () => void;
  /** Message to show if not on mobile */
  webMessage?: string;
}

export function usePaywall() {
  const [isPresenting, setIsPresenting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  /**
   * Show the RevenueCat Paywall
   */
  const showPaywall = useCallback(async (options: PaywallOptions = {}) => {
    const {
      showDismissedToast = false,
      onPurchaseSuccess,
      onDismissed,
      webMessage = 'Subscriptions are only available on mobile devices',
    } = options;

    if (!isNativeMobile()) {
      toast.info(webMessage);
      onDismissed?.();
      return;
    }

    setIsPresenting(true);
    try {
      const offering = await getCurrentOffering();
      const result = await presentPaywall(offering || undefined);

      if (!result.dismissed && result.customerInfo) {
        // Purchase completed successfully
        const session = getSession();
        if (session?.user?.id) {
          await syncSubscriptionWithBackend(session.user.id);
        }
        
        toast.success('Subscription activated! 🎉');
        onPurchaseSuccess?.();
      } else if (result.dismissed && showDismissedToast) {
        toast.info('Subscription purchase cancelled');
        onDismissed?.();
      } else {
        onDismissed?.();
      }
    } catch (error: any) {
      console.error('Error showing paywall:', error);
      toast.error('Error opening subscription options');
      onDismissed?.();
    } finally {
      setIsPresenting(false);
    }
  }, []);

  /**
   * Check if user has BetweenUS Pro and show paywall if not
   * @returns true if user has pro, false if paywall was shown
   */
  const checkAndShowPaywall = useCallback(async (options: PaywallOptions = {}): Promise<boolean> => {
    setIsChecking(true);
    try {
      const hasPro = await hasBetweenUSPro();
      
      if (!hasPro) {
        await showPaywall(options);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [showPaywall]);

  /**
   * Show paywall with a specific reason/context
   */
  const showPaywallForFeature = useCallback(async (
    featureName: string,
    options: PaywallOptions = {}
  ) => {
    const session = getSession();
    
    // Check if user already has pro
    const hasPro = await hasBetweenUSPro();
    if (hasPro) {
      return true;
    }

    // Show paywall with feature context
    await showPaywall({
      ...options,
      webMessage: `${featureName} is only available with BetweenUS Pro. Please upgrade on mobile.`,
    });

    return false;
  }, [showPaywall]);

  return {
    showPaywall,
    checkAndShowPaywall,
    showPaywallForFeature,
    isPresenting,
    isChecking,
  };
}
