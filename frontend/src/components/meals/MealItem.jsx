import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Pill, ChefHat } from 'lucide-react';

const mealIcons = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snacks: '🍎'
};

const mealLabels = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks'
};

export default function MealItem({ meal, mealType, searchTerm, isExpanded }) {
  if (!meal) return null;

  const highlightText = (text) => {
    if (!searchTerm || !text) return text;
    
    try {
      const regex = new RegExp(`(${searchTerm})`, 'gi');
      const parts = text.split(regex);
      
      return parts.map((part, i) => 
        part.toLowerCase() === searchTerm.toLowerCase() 
          ? <mark key={i} className="bg-amber-200 text-amber-900 px-1 rounded">{part}</mark>
          : part
      );
    } catch {
      return text;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-4 rounded-xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{mealIcons[mealType]}</span>
          <span className="font-medium text-slate-700">{mealLabels[mealType]}</span>
        </div>
        <span className="flex items-center gap-1 text-sm text-slate-500 bg-slate-50 px-2 py-1 rounded-full">
          <Flame className="w-3.5 h-3.5 text-orange-500" />
          {meal.calories}
        </span>
      </div>
      
      <h4 className="font-semibold text-slate-800 mb-3 leading-snug">
        {highlightText(meal.name)}
      </h4>
      
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-3 pt-3 border-t border-slate-100"
        >
          <div className="flex gap-2">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Pill className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">Nutrients</p>
              <p className="text-sm text-slate-600 leading-relaxed">{meal.nutrients}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">Prep Tip</p>
              <p className="text-sm text-slate-600 leading-relaxed">{meal.prepTip}</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}