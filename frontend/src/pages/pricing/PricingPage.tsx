import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSubscription } from '../../hooks/useSubscription';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Check, Sparkles, Shield, Zap, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

export const PricingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isPro, subscription, startCheckout, openBillingPortal, cancelSubscription, refreshSubscription } = useSubscription();
  const { user } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const hasHandledParams = useRef(false);

  useEffect(() => {
    if (hasHandledParams.current) return;

    if (searchParams.get('success') === 'true') {
      hasHandledParams.current = true;
      toast.success('Subscription completed successfully! Welcome to Nexus Pro.');
      refreshSubscription();
      setSearchParams({}, { replace: true });
    } else if (searchParams.get('canceled') === 'true') {
      hasHandledParams.current = true;
      toast.error('Checkout was canceled. Feel free to upgrade whenever you are ready!');
      setSearchParams({}, { replace: true });
    } else if (searchParams.get('demo_portal') === 'true') {
      hasHandledParams.current = true;
      toast('Stripe Customer Portal Demo: With live Stripe keys, this opens Stripe\'s Billing Portal to manage invoices and cancel subscriptions.', {
        icon: '💳',
        duration: 5000,
      });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, refreshSubscription]);

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    try {
      await startCheckout();
    } catch (err) {
      // Error handled by hook toast
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManagePortal = async () => {
    setPortalLoading(true);
    try {
      await openBillingPortal();
    } catch (err) {
      // Error handled by hook toast
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCancelDemo = async () => {
    setCancelLoading(true);
    try {
      await cancelSubscription();
    } catch (err) {
      // Error handled by hook toast
    } finally {
      setCancelLoading(false);
    }
  };

  const freeFeatures = [
    'Create public user profile',
    'Browse entrepreneurs & investors',
    'Basic messaging capabilities',
    'Standard document sharing',
    'Community support',
  ];

  const proFeatures = [
    'Everything in Free Plan',
    'Unlimited direct messages',
    'Priority placement in investor directory',
    'Verified Pro Member badge',
    'Advanced analytics & startup insights',
    'Priority deal flow & instant notifications',
    '24/7 Dedicated support',
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-800 mb-4">
            <Sparkles className="h-4 w-4 text-primary-600" />
            Simple & Transparent Pricing
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl tracking-tight">
            Accelerate your business with <span className="text-primary-600">Nexus Pro</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Choose the plan that best fits your goals. Unlock premium tools to scale your startup or investment portfolio.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Free Plan</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Basic
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Essential tools to get started on the Nexus platform.
              </p>

              <div className="mb-6">
                <span className="text-4xl font-extrabold text-gray-900">$0</span>
                <span className="text-base font-medium text-gray-500">/month</span>
              </div>

              <ul className="space-y-4 mb-8">
                {freeFeatures.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 shrink-0 mr-3 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              {!isPro ? (
                <Button
                  variant="outline"
                  fullWidth
                  disabled
                  className="bg-gray-100 text-gray-500 border-gray-200 cursor-default"
                >
                  Current Plan
                </Button>
              ) : (
                <Button variant="outline" fullWidth disabled className="text-gray-400">
                  Included
                </Button>
              )}
            </div>
          </div>

          {/* Pro Plan */}
          <div className="relative bg-white rounded-2xl shadow-xl border-2 border-primary-500 p-8 flex flex-col justify-between transform hover:-translate-y-1 transition-all">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-600 to-amber-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full shadow-md flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 fill-current" />
              Most Popular
            </div>

            <div>
              <div className="flex items-center justify-between mb-4 mt-2">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  Pro Plan
                  <Sparkles className="h-5 w-5 text-amber-500" />
                </h3>
                {isPro && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 capitalize">
                    {subscription?.status || 'Active'}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Unlimited connectivity and priority exposure for serious founders and investors.
              </p>

              <div className="mb-6">
                <span className="text-4xl font-extrabold text-gray-900">$29</span>
                <span className="text-base font-medium text-gray-500">/month</span>
              </div>

              <ul className="space-y-4 mb-8">
                {proFeatures.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <Check className="h-5 w-5 text-primary-600 shrink-0 mr-3 mt-0.5" />
                    <span className="text-sm font-medium text-gray-800">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              {isPro ? (
                <div className="space-y-3">
                  <Button
                    variant="primary"
                    fullWidth
                    isLoading={portalLoading}
                    onClick={handleManagePortal}
                    leftIcon={<CreditCard className="h-4 w-4" />}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-semibold"
                  >
                    Manage Subscription
                  </Button>
                  <Button
                    variant="ghost"
                    fullWidth
                    isLoading={cancelLoading}
                    onClick={handleCancelDemo}
                    className="text-xs text-gray-500 hover:text-red-600 underline"
                  >
                    Cancel Subscription (Demo)
                  </Button>
                </div>
              ) : (
                <Button
                  variant="primary"
                  fullWidth
                  isLoading={checkoutLoading}
                  onClick={handleUpgrade}
                  leftIcon={<Sparkles className="h-4 w-4 text-amber-300" />}
                  className="bg-gradient-to-r from-primary-600 to-amber-600 hover:from-primary-700 hover:to-amber-700 text-white font-bold shadow-lg"
                >
                  Upgrade to Pro ($29/mo)
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-16 text-center text-xs text-gray-500 flex items-center justify-center gap-6">
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-gray-400" />
            Secure payment processing via Stripe
          </div>
          <div>•</div>
          <div>Cancel anytime with 1-click in your portal</div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;

