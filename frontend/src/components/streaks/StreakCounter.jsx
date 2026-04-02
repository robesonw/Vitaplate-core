import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Shield } from 'lucide-react';

export default function StreakCounter({ streakData = {} }) {
  const {
    meal_log_streak = 0,
    checkin_streak = 0,
    plan_follow_streak = 0,
    shields_remaining = 0,
    total_days_logged = 0
  } = streakData;

  const streaks = [
    { label: 'Meal Log', value: meal_log_streak, icon: '🍽️' },
    { label: 'Check-In', value: checkin_streak, icon: '✅' },
    { label: 'Plan Follow', value: plan_follow_streak, icon: '📋' }
  ];

  const maxStreak = Math.max(meal_log_streak, checkin_streak, plan_follow_streak);

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-slate-900">Your Streaks</h3>
          </div>
          {shields_remaining > 0 && (
            <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {shields_remaining} Shield{shields_remaining !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {streaks.map((streak) => (
            <div
              key={streak.label}
              className={`text-center p-2.5 rounded-lg transition-all ${
                streak.value > 0
                  ? 'bg-white border-2 border-orange-300 shadow-sm'
                  : 'bg-slate-100 border border-slate-300'
              }`}
            >
              <div className="text-2xl mb-1">{streak.icon}</div>
              <div className="text-2xl font-bold text-orange-600">
                {streak.value}
              </div>
              <div className="text-[10px] text-slate-600 font-medium">
                {streak.label}
              </div>
            </div>
          ))}
        </div>

        {total_days_logged > 0 && (
          <div className="mt-3 pt-3 border-t border-orange-200">
            <p className="text-xs text-slate-600 text-center">
              🎯 {total_days_logged} total days logged
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}