import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Breakfast', defaultTime: '08:00' },
  { key: 'lunch', label: 'Lunch', defaultTime: '12:30' },
  { key: 'dinner', label: 'Dinner', defaultTime: '19:00' },
  { key: 'snacks', label: 'Snacks', defaultTime: '15:30' },
];

export default function SyncToCalendarDialog({ open, onOpenChange, mealPlan, onSuccess }) {
  const [mealTimes, setMealTimes] = useState(
    MEAL_TYPES.reduce((acc, meal) => ({
      ...acc,
      [meal.key]: meal.defaultTime,
    }), {})
  );
  const [error, setError] = useState(null);

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('syncMealPlanToCalendar', {
        meal_plan_id: mealPlan.id,
        meal_times: mealTimes,
      });
      return response.data;
    },
    onSuccess: () => {
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err) => {
      setError(err.message || 'Failed to sync meal plan to calendar');
    },
  });

  const handleTimeChange = (mealKey, time) => {
    setMealTimes(prev => ({ ...prev, [mealKey]: time }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sync to Google Calendar</DialogTitle>
          <DialogDescription>
            Schedule your meal plan as calendar events
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700">Set meal times:</p>
            {MEAL_TYPES.map(meal => (
              <div key={meal.key} className="flex items-center gap-3">
                <Label className="w-20 text-sm">{meal.label}</Label>
                <Input
                  type="time"
                  value={mealTimes[meal.key]}
                  onChange={(e) => handleTimeChange(meal.key, e.target.value)}
                  className="flex-1"
                />
              </div>
            ))}
          </div>

          <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600 space-y-1">
            <p><strong>What happens:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Each meal becomes a 30-45 min calendar event</li>
              <li>Events include ingredients &amp; prep instructions</li>
              <li>15-minute reminders for each meal</li>
              <li>Sunday meal prep reminder at 4:00 PM</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="flex-1"
            >
              {syncMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                'Sync to Calendar'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}