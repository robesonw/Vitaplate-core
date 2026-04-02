import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, Activity, Heart, Moon, Loader2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function FitbitCard() {
  const [showAuthGuide, setShowAuthGuide] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: connection } = useQuery({
    queryKey: ['fitbitConnection'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const conns = await base44.entities.WearableConnection.filter({
        device_type: 'fitbit',
        user_email: user.email,
      });
      return conns?.[0] || null;
    },
  });

  const { data: lastSync } = useQuery({
    queryKey: ['fitbitLastSync'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const syncs = await base44.entities.WearableSync.filter(
        { source: 'fitbit', created_by: user.email },
        '-sync_date',
        1
      );
      return syncs?.[0] || null;
    },
    enabled: !!connection,
  });

  const disconnectMutation = useMutation({
    mutationFn: async (connectionId) => {
      await base44.entities.WearableConnection.update(connectionId, {
        sync_status: 'disconnected',
      });
    },
    onSuccess: () => {
      toast.success('Fitbit disconnected');
    },
  });

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // In production, this would redirect to Fitbit OAuth
      // For now, show the setup guide
      setShowAuthGuide(true);
      toast.info('Fitbit integration setup guide opened');
    } finally {
      setIsConnecting(false);
    }
  };

  const isConnected = connection?.sync_status === 'active';
  const lastSyncTime = lastSync?.synced_at
    ? new Date(lastSync.synced_at).toLocaleDateString()
    : null;

  return (
    <>
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <CardTitle className="text-base">Fitbit</CardTitle>
                <p className="text-xs text-slate-500">Steps, heart rate, sleep</p>
              </div>
            </div>
            {isConnected && <Badge className="bg-emerald-100 text-emerald-700">Connected</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Connect your Fitbit device to sync daily steps, heart rate, sleep duration, and calories burned.
          </p>

          {isConnected && lastSync && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
              <p className="text-xs text-emerald-900 font-medium">Today's Sync</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-emerald-700">🚶 Steps</span>
                  <p className="font-bold text-emerald-900">{lastSync.steps?.toLocaleString() || '—'}</p>
                </div>
                <div>
                  <span className="text-emerald-700">❤️ HR</span>
                  <p className="font-bold text-emerald-900">{lastSync.resting_heart_rate || '—'} bpm</p>
                </div>
                <div>
                  <span className="text-emerald-700">😴 Sleep</span>
                  <p className="font-bold text-emerald-900">{lastSync.sleep_hours?.toFixed(1) || '—'}h</p>
                </div>
                <div>
                  <span className="text-emerald-700">🔥 Calories</span>
                  <p className="font-bold text-emerald-900">{lastSync.active_calories?.toLocaleString() || '—'}</p>
                </div>
              </div>
              <p className="text-[10px] text-emerald-600 mt-2">
                Last synced: {lastSyncTime}
              </p>
            </div>
          )}

          {connection?.sync_status === 'error' && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-rose-800">
                <p className="font-medium">Sync Error</p>
                <p className="mt-1">{connection.sync_error || 'Your token may have expired.'}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {!isConnected ? (
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full bg-rose-600 hover:bg-rose-700"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  '🔗 Connect Fitbit Account'
                )}
              </Button>
            ) : (
              <Button
                onClick={() => disconnectMutation.mutate(connection.id)}
                variant="outline"
                className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                Disconnect Fitbit
              </Button>
            )}
          </div>

          <p className="text-xs text-slate-500">
            ℹ️ Data syncs daily. You can view all synced data in your Dashboard activity cards.
          </p>
        </CardContent>
      </Card>

      {/* Setup Guide Dialog */}
      <Dialog open={showAuthGuide} onOpenChange={setShowAuthGuide}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Your Fitbit Device</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-600">
              Follow these steps to connect your Fitbit account to VitaPlate:
            </p>

            <div className="space-y-3">
              {[
                { step: 1, title: 'Sign In', desc: 'You\'ll be redirected to Fitbit to sign in' },
                { step: 2, title: 'Authorize Access', desc: 'Grant VitaPlate permission to access activity data' },
                { step: 3, title: 'Confirm', desc: 'Return to VitaPlate and your device will be connected' },
              ].map((item) => (
                <div key={item.step} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900">
                <strong>Tip:</strong> Make sure you have the Fitbit mobile app installed or account at fitbit.com.
              </p>
            </div>

            <Button onClick={() => setShowAuthGuide(false)} className="w-full">
              Got It
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}