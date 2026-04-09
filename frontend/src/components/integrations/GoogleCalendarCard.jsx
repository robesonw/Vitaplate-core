import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConnectedIntegrationCard } from './IntegrationCard';
import { toast } from 'sonner';
import { supabase } from '@/api/base44Client';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function api(path, opts = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json', ...opts.headers },
  });
  return res.json();
}

export default function GoogleCalendarCard() {
  const queryClient = useQueryClient();

  const { data: status } = useQuery({
    queryKey: ['calendarStatus'],
    queryFn:  () => api('/api/calendar/status'),
  });

  // Handle OAuth return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('calendar') === 'connected') {
      toast.success('Google Calendar connected!');
      queryClient.invalidateQueries({ queryKey: ['calendarStatus'] });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('calendar') === 'error') {
      toast.error('Google Calendar connection failed. Please try again.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const connectMutation = useMutation({
    mutationFn: async () => {
      const { url } = await api('/api/calendar/auth-url');
      if (url) window.location.href = url;
      else throw new Error('Calendar not configured — add GOOGLE_CLIENT_ID to Railway variables');
    },
    onError: (err) => toast.error(err.message),
  });

  const disconnectMutation = useMutation({
    mutationFn: () => api('/api/calendar/disconnect', { method: 'DELETE' }),
    onSuccess:  () => {
      toast.success('Google Calendar disconnected');
      queryClient.invalidateQueries({ queryKey: ['calendarStatus'] });
    },
  });

  return (
    <ConnectedIntegrationCard
      logo="📅"
      name="Google Calendar"
      description="Sync your meal plan directly to your calendar as events"
      isConnected={status?.connected}
      onConnect={() => connectMutation.mutate()}
      onDisconnect={() => disconnectMutation.mutate()}
      isLoading={connectMutation.isPending || disconnectMutation.isPending}
      connectLabel="Connect Google Calendar"
      connectedBenefits={[
        'Meals added as events with prep time',
        '30-minute reminders before each meal',
        'Color-coded: breakfast, lunch, dinner',
        'Full prep instructions in event description',
      ]}
    />
  );
}
