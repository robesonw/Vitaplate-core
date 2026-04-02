import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingDown, Flame } from 'lucide-react';

export default function InflammationScoreTracker({ day }) {
  if (!day) return null;

  const meals = [day.breakfast, day.lunch, day.dinner, day.snacks].filter(Boolean);
  
  // Calculate inflammation load from meal tags and ingredients
  const getInflammationLoad = (meal) => {
    if (!meal) return 0;
    
    let score = 0;
    const mealName = (meal.name || '').toLowerCase();
    const description = (meal.description || '').toLowerCase();
    const fullText = mealName + ' ' + description;

    // Anti-inflammatory ingredients (+points = less inflammatory)
    const antiInflamm = ['omega-3', 'salmon', 'sardine', 'mackerel', 'turmeric', 'ginger', 'berries', 'blueberry', 'spinach', 'kale', 'broccoli', 'olive oil', 'green tea', 'walnut', 'almond'];
    antiInflamm.forEach(ing => {
      if (fullText.includes(ing)) score += 3;
    });

    // Pro-inflammatory ingredients (-points = more inflammatory)
    const proInflamm = ['processed', 'fried', 'refined', 'white flour', 'added sugar', 'corn oil', 'soybean oil', 'canola oil', 'trans fat', 'deli meat', 'sausage'];
    proInflamm.forEach(ing => {
      if (fullText.includes(ing)) score -= 3;
    });

    return Math.max(-10, Math.min(10, score));
  };

  const mealScores = meals.map(getInflammationLoad);
  const avgScore = mealScores.length > 0 ? Math.round(mealScores.reduce((a, b) => a + b, 0) / mealScores.length) : 0;

  const getScoreColor = (score) => {
    if (score >= 5) return { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800', label: 'LOW', icon: '🟢' };
    if (score >= 0) return { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800', label: 'MEDIUM', icon: '🟡' };
    return { bg: 'bg-rose-50', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-800', label: 'HIGH', icon: '🔴' };
  };

  const scoreColor = getScoreColor(avgScore);

  return (
    <Card className={`border-2 ${scoreColor.border} ${scoreColor.bg}`}>
      <CardHeader>
        <CardTitle className="text-slate-900">🫙 Daily Inflammation Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-700 mb-1">Overall Inflammation Load</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{avgScore}</span>
              <Badge className={scoreColor.badge}>{scoreColor.icon} {scoreColor.label}</Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-600 mb-1">Range: -10 to +10</p>
            <p className="text-xs text-slate-600">Higher = less inflammatory</p>
          </div>
        </div>

        {/* Meal Breakdown */}
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <p className="text-xs font-semibold text-slate-700">Meal Breakdown:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { type: 'breakfast', emoji: '🌅', score: mealScores[0] || 0 },
              { type: 'lunch', emoji: '☀️', score: mealScores[1] || 0 },
              { type: 'dinner', emoji: '🌙', score: mealScores[2] || 0 },
              { type: 'snacks', emoji: '🍎', score: mealScores[3] || 0 },
            ].map((meal, idx) => {
              if (!meals[idx]) return null;
              const color = getScoreColor(meal.score);
              return (
                <div key={meal.type} className={`p-2 rounded border ${color.border} ${color.bg}`}>
                  <span className="text-lg">{meal.emoji}</span>
                  <div className="font-medium text-slate-900">{meal.score > 0 ? '+' : ''}{meal.score}</div>
                  <div className="text-slate-700 capitalize">{meal.type}</div>
                </div>
              );
            })}
          </div>
        </div>

        {avgScore < 0 && (
          <div className="p-3 rounded-lg bg-rose-100 border border-rose-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-rose-700">
              <p className="font-medium mb-1">🔴 High Inflammation Load</p>
              <p>Consider adding more omega-3 sources (fatty fish), turmeric, and colorful vegetables to reduce inflammatory markers.</p>
            </div>
          </div>
        )}

        <div className="p-3 rounded-lg bg-slate-100 border border-slate-300 text-xs text-slate-700">
          <p className="font-medium mb-1">💡 Tip</p>
          <p>This score is based on anti-inflammatory ingredient density. Actual CRP impact depends on overall consistency and individual response.</p>
        </div>
      </CardContent>
    </Card>
  );
}