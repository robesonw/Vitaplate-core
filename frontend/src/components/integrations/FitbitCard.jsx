import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConnectedIntegrationCard } from './IntegrationCard';
import { toast } from 'sonner';
import { supabase } from '@/api/base44Client';

const API      = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const PROVIDER = 'fitbit';

async function api(path, opts = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json', ...opts.headers },
  });
  return res.json();
}

export default function FitbitCard() {
  const queryClient = useQueryClient();

  const { data: allStatus } = useQuery({
    queryKey: ['wearableStatus'],
    queryFn:  () => api('/api/wearables/status'),
  });

  const status = allStatus?.[PROVIDER];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get(PROVIDER) === 'connected') {
      toast.success('Fitbit connected! Syncing data...');
      queryClient.invalidateQueries({ queryKey: ['wearableStatus'] });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get(PROVIDER) === 'error') {
      toast.error('Fitbit connection failed. Ensure credentials are set in Railway.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const connectMutation = useMutation({
    mutationFn: async () => {
      const data = await api(`/api/wearables/auth-url/${PROVIDER}`);
      if (data.url) window.location.href = data.url;
      else throw new Error(data.setup || data.error || 'Fitbit not configured');
    },
    onError: (err) => toast.error(err.message),
  });

  const disconnectMutation = useMutation({
    mutationFn: () => api(`/api/wearables/disconnect/${PROVIDER}`, { method: 'DELETE' }),
    onSuccess:  () => {
      toast.success('Fitbit disconnected');
      queryClient.invalidateQueries({ queryKey: ['wearableStatus'] });
    },
  });

  return (
    <ConnectedIntegrationCard
      logo="⌚"
      name="Fitbit"
      description="Sync activity, sleep, and heart rate from your Fitbit"
      isConnected={status?.connected}
      lastSync={status?.lastSync}
      onConnect={() => connectMutation.mutate()}
      onDisconnect={() => disconnectMutation.mutate()}
      isLoading={connectMutation.isPending || disconnectMutation.isPending}
      connectLabel="Connect Fitbit"
      connectedBenefits={['Steps and calories auto-synced daily', 'Sleep score linked to morning meal recs', 'Heart rate zones inform nutrition targets']}
    />
  );
}
