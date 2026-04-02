import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';

export function useSubscription() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const results = await base44.entities.UserSettings.list();
      return results[0] || {};
    },
  });

  // Support both camelCase (new API) and snake_case (legacy)
  const plan   = settings?.subscriptionPlan   || settings?.subscription_plan   || 'free';
  const status = settings?.subscriptionStatus || settings?.subscription_status || 'inactive';
  const isActive = status === 'active' || status === 'trialing';

  return {
    plan,
    status,
    isActive,
    isPro:     isActive && (plan === 'pro' || plan === 'premium'),
    isPremium: isActive && plan === 'premium',
    isFree:    plan === 'free' || !isActive,
    isLoading,
    settings,
    aiCreditsUsed:  settings?.aiCreditsUsed  ?? 0,
    aiCreditsLimit: settings?.aiCreditsLimit ?? 1,
    aiCreditsLeft:  (settings?.aiCreditsLimit ?? 1) - (settings?.aiCreditsUsed ?? 0),
  };
}

export function useRequiresPro() {
  const navigate = useNavigate();
  const sub = useSubscription();

  function requiresPro() {
    if (!sub.isLoading && sub.isFree) {
      navigate('/Pricing');
      return false;
    }
    return true;
  }

  return { ...sub, requiresPro };
}
