import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const MEAL_TYPES = [
  { key: 'breakfast', label: 'Breakfast', defaultTime: '08:00' },
  { key: 'lunch',     label: 'Lunch',     defaultTime: '12:30' },
  { key: 'dinner',    label: 'Dinner',    defaultTime: '19:00' },
  { key: 'snacks',    label: 'Snack',     defaultTime: '15:30' },
];

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

export default function SyncToCalendarDialog({ open, onOpenChange, mealPlan, onSuccess }) {
  const [mealTimes, setMealTimes] = useState(
    MEAL_TYPES.reduce((acc, m) => ({ ...acc, [m.key]: m.defaultTime }), {})
  );
  const [syncing, setSyncing]   = useState(false);
  const [synced, setSynced]     = useState(false);
  const [error, setError]       = useState(null);

  const { data: calStatus } = useQuery({
    queryKey: ['calendarStatus'],
    queryFn:  async () => {
      const token = await getToken();
      const res = await fetch(`${API}/api/calendar/status`, { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
  });

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/calendar/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId: mealPlan.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sync failed');
      setSynced(true);
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleConnect = async () => {
    const token = await getToken();
    const res = await fetch(`${API}/api/calendar/auth-url`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setError(data.setup || 'Google Calendar not configured yet');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Sync to Google Calendar
          </DialogTitle>
          <DialogDescription>
            Add all 7 days of meals as calendar events with reminders and prep instructions.
          </DialogDescription>
        </DialogHeader>

        {synced ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
            <p className="font-semibold text-slate-800">Meals added to your calendar!</p>
            <p className="text-sm text-slate-500">Check your Google Calendar — 28 events have been created.</p>
            <Button onClick={() => onOpenChange(false)} className="w-full bg-indigo-600 text-white">Done</Button>
          </div>
        ) : !calStatus?.connected ? (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-800">Google Calendar not connected</p>
              <p className="text-xs text-amber-600 mt-1">Connect your Google account to sync meal plans as calendar events.</p>
            </div>
            <Button onClick={handleConnect} className="w-full bg-indigo-600 text-white">
              <ExternalLink className="w-4 h-4 mr-2" /> Connect Google Calendar
            </Button>
            {error && <p className="text-xs text-red-600 text-center">{error}</p>}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <p className="text-sm text-emerald-700 font-medium">Google Calendar connected ✅</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700 mb-3 block">Meal times (optional)</Label>
              <div className="grid grid-cols-2 gap-3">
                {MEAL_TYPES.map(m => (
                  <div key={m.key}>
                    <Label className="text-xs text-slate-500">{m.label}</Label>
                    <Input type="time" value={mealTimes[m.key]}
                      onChange={e => setMealTimes(prev => ({ ...prev, [m.key]: e.target.value }))}
                      className="mt-1 h-9 text-sm" />
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSync} disabled={syncing} className="flex-1 bg-indigo-600 text-white">
                {syncing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Syncing...</> : 'Sync to Calendar'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
