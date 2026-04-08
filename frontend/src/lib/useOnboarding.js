import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function apiPost(path, body, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body:    JSON.stringify(body),
  });
  return res.json();
}

export function useOnboarding() {
  const { user }      = useAuth();
  const queryClient   = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['userSettings'],
    enabled:  !!user,
  });

  const isComplete = !!settings?.onboardingCompletedAt;

  const completeOnboarding = useMutation({
    mutationFn: async () => {
      const { supabase } = await import('@/api/base44Client');
      const { data: { session } } = await supabase.auth.getSession();
      return apiPost('/api/user/onboarding/complete', {}, session?.access_token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
    },
  });

  const updateStep = useMutation({
    mutationFn: async (step) => {
      const { supabase } = await import('@/api/base44Client');
      const { data: { session } } = await supabase.auth.getSession();
      return apiPost('/api/user/onboarding/step', { step }, session?.access_token);
    },
  });

  return {
    isComplete,
    currentStep:        settings?.onboardingStep,
    completeOnboarding: completeOnboarding.mutate,
    updateStep:         updateStep.mutate,
  };
}
