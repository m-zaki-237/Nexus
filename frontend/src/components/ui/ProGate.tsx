import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../hooks/useSubscription';
import { Button } from './Button';
import { Lock, Sparkles } from 'lucide-react';

interface ProGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  title?: string;
  description?: string;
}

export const ProGate: React.FC<ProGateProps> = ({
  children,
  fallback,
  title = 'Pro Feature Locked',
  description = 'Upgrade to Nexus Pro to gain access to premium networking tools, investor analytics, and direct messaging features.',
}) => {
  const { isPro, isLoading } = useSubscription();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-50 rounded-xl border border-gray-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isPro) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/50 p-8 shadow-sm text-center my-6">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-4 shadow-inner">
        <Lock className="h-7 w-7" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 mb-3 uppercase tracking-wider">
        <Sparkles className="h-3.5 w-3.5" />
        Nexus Pro
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 max-w-md mx-auto mb-6 leading-relaxed">
        {description}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button
          variant="primary"
          size="lg"
          leftIcon={<Sparkles className="h-4 w-4 text-amber-300" />}
          onClick={() => navigate('/pricing')}
          className="shadow-md bg-gradient-to-r from-amber-600 to-primary-600 hover:from-amber-700 hover:to-primary-700 border-none text-white font-semibold"
        >
          Upgrade to Pro ($29/mo)
        </Button>
      </div>
    </div>
  );
};

export default ProGate;
