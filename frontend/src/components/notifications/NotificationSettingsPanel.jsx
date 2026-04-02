import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Save, Loader2, Clock, Bell, AlertCircle, Mail, Flame, Pill, Activity, Target, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const timezones = [
  'America/Chicago',
  'America/New_York',
  'America/Los_Angeles',
  'America/Denver',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney',
  'UTC',
];

export default function NotificationSettingsPanel() {
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: settings } = useQuery({
    queryKey: ['notificationSettings', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const result = await base44.entities.NotificationSettings.filter({ created_by: user.email });
      return result?.[0] || null;
    },
    enabled: !!user?.email,
  });

  const [formData, setFormData] = useState({
    meal_reminders: true,
    weekly_plan_reminder: true,
    streak_alerts: true,
    supplement_reminders: false,
    lab_reminders: true,
    weekly_digest: true,
    goal_checkin: true,
    quiet_hours_enabled: true,
    timezone: 'America/Chicago',
    breakfast_reminder_time: '09:30',
    lunch_reminder_time: '14:00',
    dinner_reminder_time: '20:00',
    streak_alert_time: '21:00',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        meal_reminders: settings.meal_reminders ?? true,
        weekly_plan_reminder: settings.weekly_plan_reminder ?? true,
        streak_alerts: settings.streak_alerts ?? true,
        supplement_reminders: settings.supplement_reminders ?? false,
        lab_reminders: settings.lab_reminders ?? true,
        weekly_digest: settings.weekly_digest ?? true,
        goal_checkin: settings.goal_checkin ?? true,
        quiet_hours_enabled: settings.quiet_hours_enabled ?? true,
        timezone: settings.timezone || 'America/Chicago',
        breakfast_reminder_time: settings.breakfast_reminder_time || '09:30',
        lunch_reminder_time: settings.lunch_reminder_time || '14:00',
        dinner_reminder_time: settings.dinner_reminder_time || '20:00',
        streak_alert_time: settings.streak_alert_time || '21:00',
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (settings?.id) {
        await base44.entities.NotificationSettings.update(settings.id, formData);
      } else {
        await base44.entities.NotificationSettings.create(formData);
      }
      queryClient.invalidateQueries({ queryKey: ['notificationSettings'] });
      toast.success('Notification settings saved!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save notification settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Timezone & Quiet Hours
          </CardTitle>
          <CardDescription>Set your timezone and notification quiet hours</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Your Timezone</Label>
              <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map(tz => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">All notification times are based on this timezone</p>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="mb-2 block">Quiet Hours</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="quiet-hours"
                    checked={formData.quiet_hours_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, quiet_hours_enabled: checked })}
                  />
                  <Label htmlFor="quiet-hours" className="cursor-pointer">
                    Enable (10 PM - 7 AM)
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-600" />
            Meal Logging Reminders
          </CardTitle>
          <CardDescription>Get reminded to log your meals</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="meal-reminders">Enable Meal Logging Reminders</Label>
              <p className="text-xs text-slate-500 mt-1">Reminders if you haven't logged breakfast, lunch, or dinner</p>
            </div>
            <Checkbox
              id="meal-reminders"
              checked={formData.meal_reminders}
              onCheckedChange={(checked) => setFormData({ ...formData, meal_reminders: checked })}
            />
          </div>

          {formData.meal_reminders && (
            <>
              <Separator />
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label className="mb-2 block">🥞 Breakfast Reminder (if not logged by)</Label>
                  <Input
                    type="time"
                    value={formData.breakfast_reminder_time}
                    onChange={(e) => setFormData({ ...formData, breakfast_reminder_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="mb-2 block">🍽️ Lunch Reminder (if not logged by)</Label>
                  <Input
                    type="time"
                    value={formData.lunch_reminder_time}
                    onChange={(e) => setFormData({ ...formData, lunch_reminder_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="mb-2 block">🍷 Dinner Reminder (if not logged by)</Label>
                  <Input
                    type="time"
                    value={formData.dinner_reminder_time}
                    onChange={(e) => setFormData({ ...formData, dinner_reminder_time: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-600" />
            Streak Alerts
          </CardTitle>
          <CardDescription>Get notified when your streak is at risk</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="streak-alerts">Enable Streak Risk Alerts</Label>
              <p className="text-xs text-slate-500 mt-1">Alert when you have a 3+ day streak and haven't logged meals today</p>
            </div>
            <Checkbox
              id="streak-alerts"
              checked={formData.streak_alerts}
              onCheckedChange={(checked) => setFormData({ ...formData, streak_alerts: checked })}
            />
          </div>

          {formData.streak_alerts && (
            <>
              <Separator />
              <div>
                <Label className="mb-2 block">⏰ Streak Alert Time</Label>
                <Input
                  type="time"
                  value={formData.streak_alert_time}
                  onChange={(e) => setFormData({ ...formData, streak_alert_time: e.target.value })}
                />
                <p className="text-xs text-slate-500 mt-1">We'll remind you to log meals to protect your streak</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Weekly Reminders
          </CardTitle>
          <CardDescription>Notifications to keep you on track</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="weekly-plan">📅 Weekly Plan Reminder</Label>
              <p className="text-xs text-slate-500">Sunday 7 PM: "Your plan for next week is ready"</p>
            </div>
            <Checkbox
              id="weekly-plan"
              checked={formData.weekly_plan_reminder}
              onCheckedChange={(checked) => setFormData({ ...formData, weekly_plan_reminder: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="weekly-digest">📊 Weekly Health Digest</Label>
              <p className="text-xs text-slate-500">Monday 8 AM: Email summary of your nutrition and progress</p>
            </div>
            <Checkbox
              id="weekly-digest"
              checked={formData.weekly_digest}
              onCheckedChange={(checked) => setFormData({ ...formData, weekly_digest: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="goal-checkin">🎯 Goal Check-In</Label>
              <p className="text-xs text-slate-500">Weekly progress nudge to review your goals</p>
            </div>
            <Checkbox
              id="goal-checkin"
              checked={formData.goal_checkin}
              onCheckedChange={(checked) => setFormData({ ...formData, goal_checkin: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-indigo-600" />
            Other Reminders
          </CardTitle>
          <CardDescription>Health-related notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="supplement">💊 Supplement Reminders</Label>
              <p className="text-xs text-slate-500">Morning reminders to take your supplements</p>
            </div>
            <Checkbox
              id="supplement"
              checked={formData.supplement_reminders}
              onCheckedChange={(checked) => setFormData({ ...formData, supplement_reminders: checked })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="lab-reminder">🧬 Lab Result Reminder</Label>
              <p className="text-xs text-slate-500">Reminder when it's been 90 days since your last lab upload</p>
            </div>
            <Checkbox
              id="lab-reminder"
              checked={formData.lab_reminders}
              onCheckedChange={(checked) => setFormData({ ...formData, lab_reminders: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-6 z-10">
        <Card className="border-2 border-indigo-600 shadow-lg">
          <CardContent className="p-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="lg"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Notification Settings
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}