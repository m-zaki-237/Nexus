import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { Subscription } from '../types';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export interface UseSubscriptionReturn {
  isPro: boolean;
  subscription: Subscription | null;
  isLoading: boolean;
  startCheckout: (priceId?: string) => Promise<void>;
  openBillingPortal: () => Promise<void>;
  cancelSubscription: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const { user, refreshProfile } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.get('/payments/subscription');
      setSubscription(res.data);
    } catch (error: any) {
      // Fallback to user object fields if request fails or is pending
      if (user) {
        setSubscription({
          plan: user.plan || 'free',
          status: user.status || 'inactive',
          currentPeriodEnd: user.currentPeriodEnd || null,
          cancelAtPeriodEnd: user.cancelAtPeriodEnd || false,
          stripeCustomerId: user.stripeCustomerId || null,
          stripeSubscriptionId: user.stripeSubscriptionId || null,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const refreshSubscription = async () => {
    if (refreshProfile) {
      await refreshProfile();
    }
    await fetchSubscription();
  };

  const startCheckout = async (priceId?: string): Promise<void> => {
    try {
      const res = await api.post('/payments/create-checkout-session', { priceId });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        toast.error('Failed to create checkout session URL.');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error redirecting to Stripe Checkout');
      throw error;
    }
  };

  const openBillingPortal = async (): Promise<void> => {
    try {
      const res = await api.post('/payments/create-portal-session');
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        toast.error('Failed to create billing portal URL.');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error redirecting to Customer Portal');
      throw error;
    }
  };

  const cancelSubscription = async (): Promise<void> => {
    try {
      await api.post('/payments/cancel-demo-subscription');
      await refreshSubscription();
      toast.success('Subscription canceled successfully.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error canceling subscription');
      throw error;
    }
  };

  const isPro =
    (subscription?.plan === 'pro' &&
      (subscription?.status === 'active' || subscription?.status === 'trialing')) ||
    (user?.plan === 'pro' && (user?.status === 'active' || user?.status === 'trialing'));

  return {
    isPro: Boolean(isPro),
    subscription,
    isLoading,
    startCheckout,
    openBillingPortal,
    cancelSubscription,
    refreshSubscription,
  };
};

export default useSubscription;
