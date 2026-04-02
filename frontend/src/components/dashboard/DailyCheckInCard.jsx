import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { Heart, Loader2, CheckCircle2, Droplet, Moon, Zap } from 'lucide-react';
import { toast } from 'sonner';

const energyEmojis = ['😴', '😕', '😐', '🙂', '⚡'];
const moodEmojis = ['😢', '😕', '😐', '🙂', '😄'];

export default function DailyCheckInCard({ onCheckInComplete = () => {} }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [weightUnit, setWeightUnit] = useState('kg');
  
  const [formData, setFormData] = useState({
    weight: '',
    energy_level: 3,
    sleep_hours: 7,
    water_glasses: 8,
    systolic_bp: '',
    diastolic_bp: '',
    mood: 3,
    notes: ''
  });

  // Check if user has already checked in today
  useEffect(() => {
    const checkTodayCheckIn = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const results = await base44.entities.DailyCheckIn.filter({ check_in_date: today }, '', 1);
        if (results.length > 0) {
          setHasCheckedInToday(true);
        }
      } catch (error) {
        console.error('Error checking daily check-in:', error);
      }
    };
    checkTodayCheckIn();
  }, []);

  const handleSubmit = async () => {
    if (!formData.weight) {
      toast.error('Please enter your weight');
      return;
    }

    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const checkInData = {
        check_in_date: today,
        weight: parseFloat(formData.weight),
        weight_unit: weightUnit,
        energy_level: formData.energy_level,
        sleep_hours: formData.sleep_hours,
        water_glasses: parseInt(formData.water_glasses),
        systolic_bp: formData.systolic_bp ? parseInt(formData.systolic_bp) : null,
        diastolic_bp: formData.diastolic_bp ? parseInt(formData.diastolic_bp) : null,
        mood: formData.mood,
        notes: formData.notes || null
      };

      await base44.entities.DailyCheckIn.create(checkInData);
      
      toast.success('Daily check-in saved! Your meal plan has been personalized.');
      setHasCheckedInToday(true);
      setIsExpanded(false);
      onCheckInComplete();
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error('Failed to save check-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasCheckedInToday) {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-emerald-900">✅ You're all checked in!</p>
              <p className="text-xs text-emerald-700">Your meal plan has been personalized based on today's biometrics.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-slate-900 flex items-center gap-2">
          <Heart className="w-5 h-5 text-blue-600" />
          How are you feeling today?
        </CardTitle>
        <p className="text-xs text-slate-600 mt-1">Quick check-in to personalize your meal plan</p>
      </CardHeader>
      <CardContent>
        {!isExpanded ? (
          <Button 
            onClick={() => setIsExpanded(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Start Daily Check-In
          </Button>
        ) : (
          <div className="space-y-4">
            {/* Weight */}
            <div>
              <Label className="text-sm">Weight</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g., 75.5"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="flex-1"
                />
                <select
                  value={weightUnit}
                  onChange={(e) => setWeightUnit(e.target.value)}
                  className="px-3 py-2 text-sm border rounded-lg bg-white"
                >
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                </select>
              </div>
            </div>

            {/* Energy Level */}
            <div>
              <Label className="text-sm mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Energy Level: {energyEmojis[formData.energy_level - 1]}
              </Label>
              <input
                type="range"
                min="1"
                max="5"
                value={formData.energy_level}
                onChange={(e) => setFormData({ ...formData, energy_level: parseInt(e.target.value) })}
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>Very Low</span>
                <span>Very High</span>
              </div>
            </div>

            {/* Sleep */}
            <div>
              <Label className="text-sm mb-2 flex items-center gap-2">
                <Moon className="w-4 h-4" />
                Sleep Last Night: {formData.sleep_hours}h
              </Label>
              <input
                type="range"
                min="0"
                max="12"
                step="0.5"
                value={formData.sleep_hours}
                onChange={(e) => setFormData({ ...formData, sleep_hours: parseFloat(e.target.value) })}
                className="w-full cursor-pointer"
              />
            </div>

            {/* Water Intake */}
            <div>
              <Label className="text-sm mb-2 flex items-center gap-2">
                <Droplet className="w-4 h-4" />
                Water Intake: {formData.water_glasses} glasses
              </Label>
              <input
                type="range"
                min="0"
                max="12"
                value={formData.water_glasses}
                onChange={(e) => setFormData({ ...formData, water_glasses: parseInt(e.target.value) })}
                className="w-full cursor-pointer"
              />
              <p className="text-xs text-slate-600 mt-1">{formData.water_glasses * 8} oz</p>
            </div>

            {/* Mood */}
            <div>
              <Label className="text-sm mb-2">
                Mood: {moodEmojis[formData.mood - 1]}
              </Label>
              <input
                type="range"
                min="1"
                max="5"
                value={formData.mood}
                onChange={(e) => setFormData({ ...formData, mood: parseInt(e.target.value) })}
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>Very Low</span>
                <span>Very High</span>
              </div>
            </div>

            {/* Blood Pressure (Optional) */}
            <div className="p-3 rounded-lg bg-white/50 border border-slate-200">
              <Label className="text-xs font-semibold text-slate-700 mb-2 block">Blood Pressure (Optional)</Label>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs text-slate-600">Systolic</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 120"
                    value={formData.systolic_bp}
                    onChange={(e) => setFormData({ ...formData, systolic_bp: e.target.value })}
                    className="mt-1 text-sm"
                  />
                </div>
                <span className="text-slate-600">/</span>
                <div className="flex-1">
                  <Label className="text-xs text-slate-600">Diastolic</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 80"
                    value={formData.diastolic_bp}
                    onChange={(e) => setFormData({ ...formData, diastolic_bp: e.target.value })}
                    className="mt-1 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea
                placeholder="Any notes about today? e.g., 'Felt sluggish in the morning', 'Great workout'"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1 min-h-12 text-sm"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.weight}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Complete Check-In
                  </>
                )}
              </Button>
              <Button
                onClick={() => setIsExpanded(false)}
                variant="outline"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}