import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { format } from 'date-fns';

export default function MicronutrientProgressCard({ logs, activeGoal }) {
  const todayMicronutrients = useMemo(() => {
    if (!activeGoal?.target_micronutrients || Object.keys(activeGoal.target_micronutrients).length === 0) {
      return null;
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    const todayLogs = logs.filter(l => l.log_date === today);
    
    const totals = {};
    todayLogs.forEach(log => {
      if (log.micronutrients) {
        Object.entries(log.micronutrients).forEach(([nutrient, data]) => {
          if (!totals[nutrient]) {
            totals[nutrient] = { value: 0, unit: data.unit };
          }
          totals[nutrient].value += data.value * (log.servings || 1);
        });
      }
    });

    return totals;
  }, [logs, activeGoal]);

  if (!todayMicronutrients) return null;

  const getProgressPercentage = (current, target) => {
    if (!target) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
  };

  const getProgressColor = (percentage) => {
    if (percentage < 70) return 'bg-amber-500';
    if (percentage > 130) return 'bg-rose-500';
    return 'bg-emerald-500';
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Today's Micronutrient Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(activeGoal.target_micronutrients).map(([nutrient, targetData]) => {
            const current = todayMicronutrients[nutrient]?.value || 0;
            const progress = getProgressPercentage(current, targetData.value);

            return (
              <div key={nutrient} className="text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {Math.round(current * 10) / 10}
                  <span className="text-sm text-slate-600">{targetData.unit}</span>
                </div>
                <div className="text-sm text-slate-600">
                  / {targetData.value}{targetData.unit}
                </div>
                <div className="text-xs font-medium text-slate-700 mb-2">{nutrient}</div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(progress)}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-xs mt-1 font-medium">
                  {progress >= 100 ? (
                    <span className="text-emerald-600">✓ Goal Met</span>
                  ) : (
                    <span className="text-slate-500">
                      {Math.round((targetData.value - current) * 10) / 10}{targetData.unit} left
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {Object.keys(activeGoal.target_micronutrients).length === 0 && (
          <p className="text-center text-slate-500 text-sm py-4">
            No micronutrient targets set. Edit your goal to add vitamin and mineral targets.
          </p>
        )}
      </CardContent>
    </Card>
  );
}