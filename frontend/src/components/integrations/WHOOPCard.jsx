import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConnectedIntegrationCard } from './IntegrationCard';
import { toast } from 'sonner';
import { supabase } from '@/api/base44Client';

const API      = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const PROVIDER = 'whoop';

async function api(path, opts = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json', ...opts.headers },
  });
  return res.json();
}

export default function WHOOPCard() {
  const queryClient = useQueryClient();

  const { data: allStatus } = useQuery({
    queryKey: ['wearableStatus'],
    queryFn:  () => api('/api/wearables/status'),
  });

  const status = allStatus?.[PROVIDER];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get(PROVIDER) === 'connected') {
      toast.success('WHOOP connected! Syncing data...');
      queryClient.invalidateQueries({ queryKey: ['wearableStatus'] });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get(PROVIDER) === 'error') {
      toast.error('WHOOP connection failed. Ensure credentials are set in Railway.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const connectMutation = useMutation({
    mutationFn: async () => {
      const data = await api(`/api/wearables/auth-url/${PROVIDER}`);
      if (data.url) window.location.href = data.url;
      else throw new Error(data.setup || data.error || 'WHOOP not configured');
    },
    onError: (err) => toast.error(err.message),
  });

  const disconnectMutation = useMutation({
    mutationFn: () => api(`/api/wearables/disconnect/${PROVIDER}`, { method: 'DELETE' }),
    onSuccess:  () => {
      toast.success('WHOOP disconnected');
      queryClient.invalidateQueries({ queryKey: ['wearableStatus'] });
    },
  });

  return (
    <ConnectedIntegrationCard
      logo="⚡"
      name="WHOOP"
      description="Strain and recovery metrics linked to your nutrition"
      isConnected={status?.connected}
      lastSync={status?.lastSync}
      onConnect={() => connectMutation.mutate()}
      onDisconnect={() => disconnectMutation.mutate()}
      isLoading={connectMutation.isPending || disconnectMutation.isPending}
      connectLabel="Connect WHOOP"
      connectedBenefits={['Strain score drives protein and carb recs', 'Recovery percentage adjusts meal complexity', 'Sleep performance linked to energy goals']}
    />
  );
}
