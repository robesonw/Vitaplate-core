import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, Zap, Loader2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function GarminCard() {
  const [showAuthGuide, setShowAuthGuide] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: connection } = useQuery({
    queryKey: ['garminConnection'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const conns = await base44.entities.WearableConnection.filter({
        device_type: 'garmin',
        user_email: user.email,
      });
      return conns?.[0] || null;
    },
  });

  const { data: lastSync } = useQuery({
    queryKey: ['garminLastSync'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const syncs = await base44.entities.WearableSync.filter(
        { source: 'garmin', created_by: user.email },
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
      toast.success('Garmin disconnected');
    },
  });

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      setShowAuthGuide(true);
      toast.info('Garmin integration setup guide opened');
    } finally {
      setIsConnecting(false);
    }
  };

  const isConnected = connection?.sync_status === 'active';
  const lastSyncTime = lastSync?.synced_at
    ? new Date(lastSync.synced_at).toLocaleDateString()
    : null;

  const bodyBatteryColor = lastSync?.body_battery
    ? lastSync.body_battery > 75
      ? 'text-emerald-600'
      : lastSync.body_battery > 50
      ? 'text-amber-600'
      : lastSync.body_battery > 25
      ? 'text-orange-600'
      : 'text-rose-600'
    : 'text-slate-600';

  return (
    <>
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Zap className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-base">Garmin Connect</CardTitle>
                <p className="text-xs text-slate-500">Body Battery, stress, training</p>
              </div>
            </div>
            {isConnected && <Badge className="bg-emerald-100 text-emerald-700">Connected</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Connect your Garmin device to sync Body Battery, stress levels, training status, and fitness data.
          </p>

          {isConnected && lastSync && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg space-y-2">
              <p className="text-xs text-indigo-900 font-medium">Today's Metrics</p>

              {/* Body Battery */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-indigo-700">🔋 Body Battery</span>
                  <span className={`text-lg font-bold ${bodyBatteryColor}`}>
                    {lastSync.body_battery || '—'}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      lastSync.body_battery > 75
                        ? 'bg-emerald-500'
                        : lastSync.body_battery > 50
                        ? 'bg-amber-500'
                        : lastSync.body_battery > 25
                        ? 'bg-orange-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${lastSync.body_battery || 0}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-indigo-700">😓 Stress</span>
                  <p className="font-bold text-indigo-900">{lastSync.stress_level || '—'}</p>
                </div>
                <div>
                  <span className="text-indigo-700">🚶 Steps</span>
                  <p className="font-bold text-indigo-900">{lastSync.steps?.toLocaleString() || '—'}</p>
                </div>
              </div>

              <p className="text-[10px] text-indigo-600 mt-2">
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
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  '🔗 Connect Garmin Account'
                )}
              </Button>
            ) : (
              <Button
                onClick={() => disconnectMutation.mutate(connection.id)}
                variant="outline"
                className="w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
              >
                Disconnect Garmin
              </Button>
            )}
          </div>

          <p className="text-xs text-slate-500">
            ℹ️ Garmin Body Battery syncs daily and adjusts your meal recommendations automatically.
          </p>
        </CardContent>
      </Card>

      {/* Setup Guide Dialog */}
      <Dialog open={showAuthGuide} onOpenChange={setShowAuthGuide}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Your Garmin Device</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-600">
              Connect your Garmin account to VitaPlate and sync Body Battery and fitness metrics:
            </p>

            <div className="space-y-3">
              {[
                { step: 1, title: 'Go to Garmin Connect', desc: 'Visit connect.garmin.com and sign in' },
                { step: 2, title: 'Authorize VitaPlate', desc: 'Grant permission to access health data' },
                { step: 3, title: 'Sync is Active', desc: 'Your data will sync automatically each day' },
              ].map((item) => (
                <div key={item.step} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <p className="text-xs font-medium text-indigo-900">Body Battery Levels:</p>
              <div className="text-xs text-indigo-800 space-y-1">
                <p>🟢 <strong>&gt;75:</strong> Full energy — performance fuel</p>
                <p>🟡 <strong>50-75:</strong> Good energy — normal meals</p>
                <p>🟠 <strong>25-50:</strong> Moderate energy — balanced plan</p>
                <p>🔴 <strong>&lt;25:</strong> Low energy — recovery meals</p>
              </div>
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