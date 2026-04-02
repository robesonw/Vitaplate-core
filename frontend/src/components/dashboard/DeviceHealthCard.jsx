import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function DeviceHealthCard() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: connections = [] } = useQuery({
    queryKey: ['wearableConnections'],
    queryFn: async () => {
      if (!user?.email) return [];
      const conns = await base44.entities.WearableConnection.filter({
        user_email: user.email,
        sync_status: 'active',
      });
      return conns || [];
    },
    enabled: !!user?.email,
  });

  const { data: lastSyncs = [] } = useQuery({
    queryKey: ['latestWearableSyncs'],
    queryFn: async () => {
      if (!user?.email) return [];
      const syncs = await base44.entities.WearableSync.filter(
        { created_by: user.email },
        '-sync_date',
        2 // Get last 2 syncs
      );
      return syncs || [];
    },
    enabled: !!user?.email,
  });

  if (connections.length === 0) {
    return null;
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="w-5 h-5 text-indigo-600" />
          Connected Devices
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {connections.map((conn) => {
          const lastSync = lastSyncs.find(s => s.source === conn.device_type);
          const lastSyncTime = lastSync?.synced_at
            ? new Date(lastSync.synced_at).toLocaleDateString()
            : 'Never';

          const icon = conn.device_type === 'fitbit' ? '📱' : '⚡';
          const name = conn.device_type === 'fitbit' ? 'Fitbit' : 'Garmin';

          return (
            <div key={conn.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{name}</p>
                    <p className="text-xs text-slate-500">{conn.device_name || 'Connected'}</p>
                  </div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 text-xs">Active</Badge>
              </div>

              {lastSync ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {lastSync.steps && (
                    <div>
                      <p className="text-slate-500">Steps</p>
                      <p className="font-semibold text-slate-900">
                        {lastSync.steps.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {lastSync.active_calories && (
                    <div>
                      <p className="text-slate-500">Calories</p>
                      <p className="font-semibold text-slate-900">
                        {lastSync.active_calories.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {conn.device_type === 'garmin' && lastSync.body_battery !== undefined && (
                    <div>
                      <p className="text-slate-500">Body Battery</p>
                      <p className="font-semibold text-slate-900">
                        {lastSync.body_battery}%
                      </p>
                    </div>
                  )}
                  {lastSync.sleep_hours && (
                    <div>
                      <p className="text-slate-500">Sleep</p>
                      <p className="font-semibold text-slate-900">
                        {lastSync.sleep_hours.toFixed(1)}h
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Waiting for first sync...</p>
              )}

              <p className="text-[10px] text-slate-500 mt-2">
                Last synced: {lastSyncTime}
              </p>

              {conn.sync_status === 'error' && (
                <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded flex gap-2 text-xs">
                  <AlertCircle className="w-3 h-3 text-rose-600 flex-shrink-0 mt-0.5" />
                  <p className="text-rose-800">{conn.sync_error || 'Sync error'}</p>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}