import React from 'react';
import { Flame } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function calculateStreak(nutritionLogs) {
  if (!nutritionLogs || nutritionLogs.length === 0) return 0;

  // Get unique dates logged, sorted descending
  const loggedDates = [...new Set(nutritionLogs.map(l => l.log_date))].sort((a, b) => b.localeCompare(a));

  if (loggedDates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Streak must start from today or yesterday
  if (loggedDates[0] !== todayStr && loggedDates[0] !== yesterdayStr) return 0;

  let streak = 0;
  let checkDate = new Date(loggedDates[0]);

  for (const dateStr of loggedDates) {
    const d = new Date(dateStr);
    const diff = Math.round((checkDate - d) / (1000 * 60 * 60 * 24));
    if (diff === 0 || diff === 1) {
      streak++;
      checkDate = d;
    } else {
      break;
    }
  }

  return streak;
}

export default function StreakCard({ nutritionLogs = [] }) {
  const streak = calculateStreak(nutritionLogs);

  const getMessage = () => {
    if (streak === 0) return 'Log a meal today to start your streak!';
    if (streak === 1) return 'Great start! Keep it up tomorrow.';
    if (streak < 7) return `${streak} days strong — keep going!`;
    if (streak < 30) return `Amazing! ${streak}-day streak 🔥`;
    return `Legendary! ${streak}-day streak! 🏆`;
  };

  const flameColor = streak === 0 ? 'text-slate-300' : streak >= 7 ? 'text-orange-500' : 'text-amber-500';

  return (
    <Card className="border-slate-200 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600">Logging Streak</p>
            <div className="flex items-end gap-2 mt-2">
              <p className="text-3xl font-bold text-slate-900">{streak}</p>
              <p className="text-sm text-slate-500 mb-1">days</p>
            </div>
            <p className="text-xs text-slate-500 mt-1">{getMessage()}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center`}>
            <Flame className={`w-6 h-6 ${flameColor}`} />
          </div>
        </div>
        {streak > 0 && (
          <div className="mt-3 flex gap-1">
            {Array.from({ length: Math.min(streak, 7) }).map((_, i) => (
              <div key={i} className="h-1.5 flex-1 rounded-full bg-orange-400" />
            ))}
            {Array.from({ length: Math.max(0, 7 - streak) }).map((_, i) => (
              <div key={i} className="h-1.5 flex-1 rounded-full bg-slate-100" />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}