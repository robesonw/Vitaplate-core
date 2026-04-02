import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, Zap } from 'lucide-react';

export default function RecoveryMealRecommendation({ recoveryScore = null }) {
  if (!recoveryScore) return null;

  let icon, bgColor, borderColor, title, description, mealType, foods;

  if (recoveryScore >= 67) {
    // High recovery - performance mode
    icon = '⚡';
    bgColor = 'bg-emerald-50';
    borderColor = 'border-emerald-200';
    title = 'High Recovery Day - Peak Performance Mode';
    description = 'Your body is well-recovered. Fuel for peak performance with strategic carbs and protein timing.';
    mealType = 'Pre-Workout + Intra-Day Snack';
    foods = [
      'Pre-workout (1-2h before): Quick carbs + protein (banana with almond butter, oats with honey)',
      'Intra-workout (if >60 min): Electrolytes + simple carbs (sports drink, fruit)',
      'Post-workout: High protein + carbs (chicken with rice, Greek yogurt with granola)'
    ];
  } else if (recoveryScore >= 34) {
    // Moderate recovery - standard plan
    icon = '🟡';
    bgColor = 'bg-amber-50';
    borderColor = 'border-amber-200';
    title = 'Moderate Recovery - Balanced Approach';
    description = 'Standard meal plan with focus on balanced macros and anti-inflammatory ingredients.';
    mealType = 'Balanced Meals';
    foods = [
      'Include lean protein at each meal (chicken, fish, eggs)',
      'Add colorful vegetables for micronutrients & antioxidants',
      'Include healthy fats (olive oil, nuts, avocado)',
      'Prioritize whole grains over refined carbs'
    ];
  } else {
    // Low recovery - recovery mode
    icon = '🔴';
    bgColor = 'bg-rose-50';
    borderColor = 'border-rose-200';
    title = 'Low Recovery Day - Focus on Repair';
    description = 'Your body needs support. Prioritize easy digestion, anti-inflammatory foods, and extra protein for muscle repair.';
    mealType = 'Recovery & Repair';
    foods = [
      'Easy-to-digest proteins (bone broth, salmon, eggs, turkey)',
      'Anti-inflammatory foods (turmeric, ginger, berries, leafy greens)',
      'Avoid: heavy fried foods, excess fiber, spicy foods',
      'Hydrate well & include electrolytes'
    ];
  }

  return (
    <Card className={`border-2 ${borderColor} ${bgColor}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-700">{description}</p>

        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
              {recoveryScore >= 67 && <Zap className="w-4 h-4 text-emerald-600" />}
              {recoveryScore < 67 && recoveryScore >= 34 && <TrendingUp className="w-4 h-4 text-amber-600" />}
              {recoveryScore < 34 && <AlertTriangle className="w-4 h-4 text-rose-600" />}
              Meal Focus: {mealType}
            </h4>
            <ul className="space-y-1">
              {foods.map((food, idx) => (
                <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span>{food}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {recoveryScore < 34 && (
          <div className="p-3 rounded-lg bg-rose-100 border border-rose-300">
            <p className="text-xs font-medium text-rose-900 mb-1">⚠️ Extra Recovery Tips</p>
            <ul className="text-xs text-rose-800 space-y-0.5 ml-3">
              <li>• Consider ice bath or contrast therapy if available</li>
              <li>• Prioritize sleep (7-9 hours) for faster recovery</li>
              <li>• Keep caffeine intake moderate (post-3pm cutoff)</li>
              <li>• Consider light walking or mobility work instead of intense training</li>
            </ul>
          </div>
        )}

        {recoveryScore >= 67 && (
          <div className="p-3 rounded-lg bg-emerald-100 border border-emerald-300">
            <p className="text-xs font-medium text-emerald-900 mb-1">⚡ Performance Tips</p>
            <ul className="text-xs text-emerald-800 space-y-0.5 ml-3">
              <li>• Time your carbs around workouts for max performance</li>
              <li>• You can handle higher training intensity today</li>
              <li>• Include caffeine strategically (1-3 hours pre-workout)</li>
              <li>• This is an ideal day for a challenging workout</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}