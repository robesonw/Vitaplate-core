import { } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, Moon, Heart } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

export default function ActivitySummaryCard() {
  const today = new Date().toISOString().split('T')[0];

  const { data: todaySync } = useQuery({
    queryKey: ['todayActivitySync'],
    queryFn: async () => {
      try {
        const syncs = await base44.asServiceRole.entities.WearableSync.filter({
          sync_date: today,
        });
        return syncs?.[0];
      } catch {
        return null;
      }
    },
    refetchInterval: 60000, // Refetch every minute
  });

  if (!todaySync) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Today's Activity
          </CardTitle>
          <CardDescription>No activity data synced yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            Connect Apple Health or Google Fit in your Integrations settings to see activity data.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getActivityBadge = (steps) => {
    if (steps >= 15000) return { label: 'Extremely Active 🔥', color: 'bg-red-100 text-red-900' };
    if (steps >= 10000) return { label: 'Very Active ⭐', color: 'bg-orange-100 text-orange-900' };
    if (steps >= 7500) return { label: 'Active 💪', color: 'bg-blue-100 text-blue-900' };
    if (steps >= 5000) return { label: 'Lightly Active 👟', color: 'bg-green-100 text-green-900' };
    return { label: 'Sedentary 🚶', color: 'bg-slate-100 text-slate-900' };
  };

  const activityBadge = getActivityBadge(todaySync.steps || 0);
  const lastSyncTime = formatDistanceToNow(new Date(todaySync.synced_at), { addSuffix: true });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Today's Activity
          </CardTitle>
          <Badge className={`${activityBadge.color} border-0`}>{activityBadge.label}</Badge>
        </div>
        <CardDescription>Synced {lastSyncTime}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Steps */}
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mx-auto mb-2">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-slate-600">Steps</p>
            <p className="text-2xl font-bold text-slate-900">
              {todaySync.steps?.toLocaleString() || '0'}
            </p>
          </div>

          {/* Active Calories */}
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-full mx-auto mb-2">
              <Zap className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-sm text-slate-600">Active Cal</p>
            <p className="text-2xl font-bold text-slate-900">
              {todaySync.active_calories?.toLocaleString() || '0'}
            </p>
          </div>

          {/* Sleep */}
          {todaySync.sleep_hours !== undefined && (
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full mx-auto mb-2">
                <Moon className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-sm text-slate-600">Sleep</p>
              <p className="text-2xl font-bold text-slate-900">{todaySync.sleep_hours}h</p>
            </div>
          )}

          {/* Heart Rate */}
          {todaySync.resting_heart_rate && (
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full mx-auto mb-2">
                <Heart className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-sm text-slate-600">Heart Rate</p>
              <p className="text-2xl font-bold text-slate-900">{todaySync.resting_heart_rate} bpm</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}