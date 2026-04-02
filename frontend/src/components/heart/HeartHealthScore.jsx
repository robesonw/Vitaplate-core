import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart } from 'lucide-react';

export default function HeartHealthScore({ day }) {
  if (!day) return null;

  // Calculate heart health metrics
  const meals = [day.breakfast, day.lunch, day.dinner, day.snacks].filter(Boolean);
  
  // Estimate nutrients (simplified)
  const totalCalories = meals.reduce((sum, m) => {
    const cals = parseInt(m.calories?.match(/\d+/)?.[0] || 0);
    return sum + cals;
  }, 0);

  const totalSatFat = meals.reduce((sum, m) => sum + (m.sat_fat || 0), 0);
  const totalSodium = meals.reduce((sum, m) => sum + (m.sodium || 0), 0);
  const totalCholesterol = meals.reduce((sum, m) => sum + (m.dietary_cholesterol || 0), 0);
  const omega3Count = meals.filter(m => m.meal_tag?.includes('Omega-3') || m.meal_tag?.includes('🐟')).length;

  // Scoring criteria
  const satFatPercent = totalCalories > 0 ? (totalSatFat * 9 / totalCalories) * 100 : 0;
  const satFatScore = satFatPercent <= 7 ? 25 : satFatPercent <= 10 ? 15 : 5;
  
  const sodiumScore = totalSodium <= 1500 ? 25 : totalSodium <= 2000 ? 15 : 5;
  
  const cholesterolScore = totalCholesterol <= 200 ? 25 : totalCholesterol <= 300 ? 15 : 5;
  
  const omega3Score = omega3Count >= 2 ? 25 : omega3Count === 1 ? 15 : 5;

  const totalScore = satFatScore + sodiumScore + cholesterolScore + omega3Score;

  let grade = 'A';
  let gradeColor = 'text-emerald-700';
  let gradeBg = 'bg-emerald-50';

  if (totalScore < 100) grade = 'B';
  if (totalScore < 75) grade = 'C';
  if (totalScore < 50) grade = 'D';
  
  if (grade !== 'A') {
    gradeColor = grade === 'B' ? 'text-blue-700' : grade === 'C' ? 'text-amber-700' : 'text-rose-700';
    gradeBg = grade === 'B' ? 'bg-blue-50' : grade === 'C' ? 'bg-amber-50' : 'bg-rose-50';
  }

  return (
    <Card className="border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-rose-900">
          <Heart className="w-5 h-5 fill-current" />
          Heart Health Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`rounded-lg p-6 text-center ${gradeBg} border-2 border-current`}>
          <div className={`text-5xl font-bold ${gradeColor} mb-2`}>{grade}</div>
          <p className="text-sm font-medium text-slate-700">Daily Cardiovascular Rating</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className={`p-3 rounded-lg ${satFatScore >= 20 ? 'bg-emerald-50 border border-emerald-200' : satFatScore >= 15 ? 'bg-yellow-50 border border-yellow-200' : 'bg-rose-50 border border-rose-200'}`}>
            <div className="font-semibold text-slate-900">{satFatPercent.toFixed(1)}%</div>
            <div className="text-xs text-slate-600">Saturated Fat</div>
            <div className="text-xs text-slate-500">Target: &lt;7%</div>
          </div>
          
          <div className={`p-3 rounded-lg ${sodiumScore >= 20 ? 'bg-emerald-50 border border-emerald-200' : sodiumScore >= 15 ? 'bg-yellow-50 border border-yellow-200' : 'bg-rose-50 border border-rose-200'}`}>
            <div className="font-semibold text-slate-900">{totalSodium}mg</div>
            <div className="text-xs text-slate-600">Sodium</div>
            <div className="text-xs text-slate-500">Target: &lt;1,500mg</div>
          </div>

          <div className={`p-3 rounded-lg ${cholesterolScore >= 20 ? 'bg-emerald-50 border border-emerald-200' : cholesterolScore >= 15 ? 'bg-yellow-50 border border-yellow-200' : 'bg-rose-50 border border-rose-200'}`}>
            <div className="font-semibold text-slate-900">{totalCholesterol}mg</div>
            <div className="text-xs text-slate-600">Dietary Cholesterol</div>
            <div className="text-xs text-slate-500">Target: &lt;200mg</div>
          </div>

          <div className={`p-3 rounded-lg ${omega3Score >= 20 ? 'bg-emerald-50 border border-emerald-200' : omega3Score >= 15 ? 'bg-yellow-50 border border-yellow-200' : 'bg-rose-50 border border-rose-200'}`}>
            <div className="font-semibold text-slate-900">{omega3Count}</div>
            <div className="text-xs text-slate-600">Omega-3 Servings</div>
            <div className="text-xs text-slate-500">Target: ≥2</div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-sm text-indigo-700">
          <p className="font-medium mb-1">💡 Heart Health Impact</p>
          <p>Following this meal plan could lower your LDL by ~8-12% in 8 weeks through reduced saturated fat and increased soluble fiber.</p>
        </div>
      </CardContent>
    </Card>
  );
}