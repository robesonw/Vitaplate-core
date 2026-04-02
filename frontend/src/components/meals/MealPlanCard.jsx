import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Calendar } from 'lucide-react';
import MealItem from './MealItem';

const dayGradients = {
  'Monday': 'from-blue-500 to-indigo-500',
  'Tuesday': 'from-violet-500 to-purple-500',
  'Wednesday': 'from-emerald-500 to-teal-500',
  'Thursday': 'from-amber-500 to-orange-500',
  'Friday': 'from-rose-500 to-pink-500',
  'Saturday': 'from-cyan-500 to-sky-500',
  'Sunday': 'from-fuchsia-500 to-rose-500',
};

export default function MealPlanCard({ dayPlan, searchTerm, defaultExpanded = false }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showDetails, setShowDetails] = useState(false);

  const gradient = dayGradients[dayPlan.day] || 'from-slate-500 to-slate-600';
  
  const hasMealMatch = (meal) => {
    if (!searchTerm || !meal) return false;
    return meal.name?.toLowerCase().includes(searchTerm.toLowerCase());
  };
  
  const hasAnyMatch = hasMealMatch(dayPlan.breakfast) || 
                      hasMealMatch(dayPlan.lunch) || 
                      hasMealMatch(dayPlan.dinner) ||
                      hasMealMatch(dayPlan.snacks);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        bg-white rounded-2xl overflow-hidden shadow-sm border transition-all duration-300
        ${hasAnyMatch && searchTerm ? 'ring-2 ring-amber-400 border-amber-200' : 'border-slate-100'}
        ${isExpanded ? 'shadow-lg' : 'hover:shadow-md'}
      `}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-800 text-lg">{dayPlan.day}</h3>
            <p className="text-sm text-slate-500">
              {dayPlan.breakfast?.name?.split(' ').slice(0, 3).join(' ')}...
            </p>
          </div>
        </div>
        
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
        >
          <ChevronDown className="w-5 h-5 text-slate-500" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-3">
              <div className="flex items-center justify-end mb-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetails(!showDetails);
                  }}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  {showDetails ? 'Hide details' : 'Show details'}
                </button>
              </div>
              
              <MealItem 
                meal={dayPlan.breakfast} 
                mealType="breakfast" 
                searchTerm={searchTerm}
                isExpanded={showDetails}
              />
              <MealItem 
                meal={dayPlan.lunch} 
                mealType="lunch" 
                searchTerm={searchTerm}
                isExpanded={showDetails}
              />
              <MealItem 
                meal={dayPlan.dinner} 
                mealType="dinner" 
                searchTerm={searchTerm}
                isExpanded={showDetails}
              />
              {dayPlan.snacks && (
                <MealItem 
                  meal={dayPlan.snacks} 
                  mealType="snacks" 
                  searchTerm={searchTerm}
                  isExpanded={showDetails}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}