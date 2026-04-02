import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

export default function CarbBudgetTracker({ days, hba1c = null }) {
  // Determine carb target based on HbA1c
  let targetCarbsPerMeal = 45;
  let targetCarbsPerDay = 180;
  let diabetesNote = '';

  if (hba1c) {
    if (hba1c > 8) {
      targetCarbsPerMeal = 35;
      targetCarbsPerDay = 140;
      diabetesNote = 'HbA1c >8%: Stricter carb control recommended';
    } else if (hba1c >= 6.5 && hba1c <= 8) {
      targetCarbsPerMeal = 50;
      targetCarbsPerDay = 200;
      diabetesNote = 'HbA1c 6.5-8%: Moderate carb consistency';
    } else if (hba1c >= 5.7 && hba1c < 6.5) {
      targetCarbsPerMeal = 50;
      targetCarbsPerDay = 200;
      diabetesNote = 'Pre-diabetes: Focus on low GI foods';
    }
  }

  // Calculate daily totals from meal plan
  const dailyBreakdown = days?.map(day => {
    const meals = [day.breakfast, day.lunch, day.dinner, day.snacks].filter(Boolean);
    const totalCarbs = meals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
    const mealCarbs = meals.map(meal => meal.carbs || 0);
    const isConsistent = mealCarbs.length > 0 && Math.max(...mealCarbs) - Math.min(...mealCarbs) <= 15;
    
    return {
      day: day.day,
      totalCarbs: Math.round(totalCarbs),
      meals: meals.length,
      isConsistent
    };
  }) || [];

  const avgDailyCarbs = dailyBreakdown.length > 0
    ? Math.round(dailyBreakdown.reduce((sum, d) => sum + d.totalCarbs, 0) / dailyBreakdown.length)
    : 0;

  const consistentDays = dailyBreakdown.filter(d => d.isConsistent).length;

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💉 Carb Budget Tracker
          {hba1c && (
            <Badge variant="outline" className="text-xs">
              Target: {targetCarbsPerMeal}g per meal
            </Badge>
          )}
        </CardTitle>
        {diabetesNote && (
          <p className="text-xs text-slate-500 mt-1">{diabetesNote}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-blue-50 text-center">
            <div className="text-2xl font-bold text-blue-700">{avgDailyCarbs}g</div>
            <div className="text-xs text-slate-600">Avg Daily</div>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 text-center">
            <div className="text-2xl font-bold text-emerald-700">{consistentDays}/{dailyBreakdown.length}</div>
            <div className="text-xs text-slate-600">Carb Consistent</div>
          </div>
          <div className="p-3 rounded-lg bg-violet-50 text-center">
            <div className="text-2xl font-bold text-violet-700">{targetCarbsPerDay}g</div>
            <div className="text-xs text-slate-600">Target/Day</div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-900">Daily Breakdown:</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {dailyBreakdown.map((dayData, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-50 text-sm">
                <span className="text-slate-700">{dayData.day}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{dayData.totalCarbs}g</span>
                  {dayData.isConsistent ? (
                    <span className="text-xs text-emerald-600 font-medium">✓ Consistent</span>
                  ) : (
                    <span className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Varies
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-sm text-indigo-700">
          <p className="font-medium mb-1">💡 Carb Consistency Tip</p>
          <p>Eating similar carbs at each meal helps stabilize blood sugar. Your plan targets ~{targetCarbsPerMeal}g per meal.</p>
        </div>
      </CardContent>
    </Card>
  );
}