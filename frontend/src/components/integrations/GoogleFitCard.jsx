import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, RefreshCw, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

export default function GoogleFitCard() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  // Check if user is on Android
  const isAndroid = /android/i.test(navigator.userAgent);

  const { data: lastSync } = useQuery({
    queryKey: ['lastGoogleFitSync'],
    queryFn: async () => {
      try {
        const syncs = await base44.asServiceRole.entities.WearableSync.filter(
          { source: 'google_fit' },
          '-sync_date',
          1
        );
        return syncs?.[0];
      } catch {
        return null;
      }
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (tokens) => {
      const response = await base44.functions.invoke('syncGoogleFit', tokens);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lastGoogleFitSync'] });
      setError(null);
    },
    onError: (err) => {
      setError(err.message || 'Failed to sync data');
    },
  });

  const handleConnectGoogleFit = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Generate OAuth URL for Google Fit
      const clientId = 'YOUR_GOOGLE_CLIENT_ID'; // Set via environment variable
      const redirectUri = `${window.location.origin}/oauth/callback/google-fit`;
      const scope = [
        'https://www.googleapis.com/auth/fitness.activity.read',
        'https://www.googleapis.com/auth/fitness.sleep.read',
        'https://www.googleapis.com/auth/fitness.body.read',
        'https://www.googleapis.com/auth/fitness.heart_rate.read',
      ].join(' ');

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', scope);
      authUrl.searchParams.set('access_type', 'offline');

      // Open OAuth popup
      const popup = window.open(authUrl.toString(), 'GoogleFitAuth', 'width=500,height=600');

      if (!popup) {
        setError('Failed to open authorization window. Please check pop-up settings.');
        return;
      }

      // Poll for completion
      const checkInterval = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkInterval);
          setIsConnecting(false);
          // Try to sync after OAuth completes
          queryClient.invalidateQueries({ queryKey: ['lastGoogleFitSync'] });
        }
      }, 500);
    } catch (err) {
      setError(err.message);
      setIsConnecting(false);
    }
  };

  const handleManualSync = async () => {
    if (!lastSync) {
      setError('Please connect Google Fit first');
      return;
    }
    syncMutation.mutate({
      accessToken: localStorage.getItem('google_fit_access_token'),
    });
  };

  if (!isAndroid) {
    return (
      <Card className="opacity-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-blue-500" />
              <div>
                <CardTitle>Google Fit / Health Connect</CardTitle>
                <CardDescription>Android only</CardDescription>
              </div>
            </div>
            <Badge variant="outline">Not Available</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            Google Fit sync is only available on Android devices with Health Connect installed.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isSynced = !!lastSync;
  const lastSyncTime = lastSync
    ? formatDistanceToNow(new Date(lastSync.synced_at), { addSuffix: true })
    : null;

  const isSyncOutdated = lastSync
    ? new Date().getTime() - new Date(lastSync.synced_at).getTime() > 24 * 60 * 60 * 1000
    : false;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-blue-500" />
            <div>
              <CardTitle>Google Fit / Health Connect</CardTitle>
              <CardDescription>
                {isSynced ? `Last synced ${lastSyncTime}` : 'Not connected'}
              </CardDescription>
            </div>
          </div>
          <Badge variant={isSynced ? 'default' : 'outline'}>
            {isSynced ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isSyncOutdated && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-900">
              ⚠️ Data is more than 24 hours old. Consider syncing for latest activity data.
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-900">{error}</p>
          </div>
        )}

        <p className="text-sm text-slate-600">
          Sync steps, calories, sleep, and heart rate from Google Fit or Health Connect to adjust
          your meal plans and track activity.
        </p>

        {isSynced && lastSync && (
          <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Steps</span>
              <span className="font-semibold">{lastSync.steps?.toLocaleString() || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Active Calories</span>
              <span className="font-semibold">{lastSync.active_calories?.toLocaleString() || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Sleep Hours</span>
              <span className="font-semibold">{lastSync.sleep_hours || '—'}h</span>
            </div>
            {lastSync.resting_heart_rate && (
              <div className="flex justify-between">
                <span className="text-slate-600">Resting Heart Rate</span>
                <span className="font-semibold">{lastSync.resting_heart_rate} bpm</span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {isSynced ? (
            <>
              <Button
                size="sm"
                onClick={handleManualSync}
                disabled={syncMutation.isPending}
                className="flex-1"
              >
                {syncMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Sync Now
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={handleConnectGoogleFit}
              className="w-full"
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect'
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}