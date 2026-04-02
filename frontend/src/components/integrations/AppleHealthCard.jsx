import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

export default function AppleHealthCard() {
  const [isConnecting, setIsConnecting] = useState(false);
  const queryClient = useQueryClient();

  // Check if user is on iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  const { data: lastSync } = useQuery({
    queryKey: ['lastAppleHealthSync'],
    queryFn: async () => {
      try {
        const syncs = await base44.asServiceRole.entities.WearableSync.filter(
          { source: 'apple_health' },
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
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('syncAppleHealth', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lastAppleHealthSync'] });
    },
  });

  const handleManualSync = async () => {
    // In a real app, this would prompt user to select data from Health app
    // For now, show instructions
    alert(
      'To sync Apple Health data:\n\n' +
      '1. Open Health app on your iPhone/iPad\n' +
      '2. Tap on your profile\n' +
      '3. Go to Data Access & Devices\n' +
      '4. Select VitaPlate\n' +
      '5. Toggle on the data types you want to share\n\n' +
      'Data will sync automatically from there.'
    );
  };

  if (!isIOS) {
    return (
      <Card className="opacity-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-red-500" />
              <div>
                <CardTitle>Apple Health</CardTitle>
                <CardDescription>iOS only</CardDescription>
              </div>
            </div>
            <Badge variant="outline">Not Available</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            Apple Health sync is only available on iOS devices (iPhone, iPad).
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
            <Heart className="w-5 h-5 text-red-500" />
            <div>
              <CardTitle>Apple Health</CardTitle>
              <CardDescription>
                {isSynced
                  ? `Last synced ${lastSyncTime}`
                  : 'Not connected'}
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

        <p className="text-sm text-slate-600">
          Sync steps, calories, sleep, heart rate, and weight from Apple Health to adjust your
          meal plans and track activity.
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
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Now
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={handleManualSync}
              className="w-full"
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}