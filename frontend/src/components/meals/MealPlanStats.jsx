import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Utensils, Calendar, Sparkles } from 'lucide-react';

export default function MealPlanStats({ mealPlan }) {
  const stats = useMemo(() => {
    if (!mealPlan?.days) return null;

    let totalMeals = 0;
    let avgCaloriesLow = 0;
    let avgCaloriesHigh = 0;

    mealPlan.days.forEach(day => {
      ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealType => {
        const meal = day[mealType];
        if (meal) {
          totalMeals++;
          // Parse calories like "400-450 kcal"
          const match = meal.calories?.match(/(\d+)-(\d+)/);
          if (match) {
            avgCaloriesLow += parseInt(match[1]);
            avgCaloriesHigh += parseInt(match[2]);
          }
        }
      });
    });

    return {
      totalDays: mealPlan.days.length,
      totalMeals,
      avgDailyCalories: totalMeals > 0 
        ? `${Math.round(avgCaloriesLow / mealPlan.days.length)}-${Math.round(avgCaloriesHigh / mealPlan.days.length)}`
        : 'N/A'
    };
  }, [mealPlan]);

  if (!stats) return null;

  const statItems = [
    { icon: Calendar, label: 'Days', value: stats.totalDays, color: 'from-blue-500 to-indigo-500' },
    { icon: Utensils, label: 'Total Meals', value: stats.totalMeals, color: 'from-emerald-500 to-teal-500' },
    { icon: Flame, label: 'Daily Calories', value: stats.avgDailyCalories, color: 'from-orange-500 to-amber-500' },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {statItems.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-xl p-4 border border-slate-100 hover:shadow-md transition-shadow"
        >
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
            <stat.icon className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
          <p className="text-sm text-slate-500">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}