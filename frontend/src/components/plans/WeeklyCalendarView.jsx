import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MEAL_ICONS = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snacks: '🍎'
};

export default function WeeklyCalendarView({ plan, onDaySelect, onWeekChange }) {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  // Calculate week start date based on offset
  const getWeekDates = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const firstDay = new Date(now);
    firstDay.setDate(now.getDate() - dayOfWeek + (currentWeekOffset * 7));
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(firstDay);
      date.setDate(firstDay.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const today = new Date().toISOString().split('T')[0];

  const getMacroPercentages = (meal) => {
    if (!meal.protein || !meal.carbs || !meal.fat) return null;
    const total = meal.protein + meal.carbs + meal.fat;
    return {
      protein: (meal.protein / total) * 100,
      carbs: (meal.carbs / total) * 100,
      fat: (meal.fat / total) * 100,
    };
  };

  const handlePrevWeek = () => {
    setCurrentWeekOffset(prev => prev - 1);
    onWeekChange?.(currentWeekOffset - 1);
  };

  const handleNextWeek = () => {
    setCurrentWeekOffset(prev => prev + 1);
    onWeekChange?.(currentWeekOffset + 1);
  };

  const handleToday = () => {
    setCurrentWeekOffset(0);
    onWeekChange?.(0);
  };

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevWeek}
            className="h-9 w-9 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="text-xs"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextWeek}
            className="h-9 w-9 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="text-center">
          <p className="text-sm font-semibold text-slate-900">
            {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="w-20" /> {/* Spacer for alignment */}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((date, dayIndex) => {
          const dateStr = date.toISOString().split('T')[0];
          const isToday = dateStr === today;
          const isPast = dateStr < today && currentWeekOffset === 0;
          const dayData = plan.days?.[dayIndex];

          const dayCalories = dayData
            ? ['breakfast', 'lunch', 'dinner', 'snacks'].reduce((total, mealType) => {
                const meal = dayData[mealType];
                const match = meal?.calories?.match(/(\d+)/);
                return total + (match ? parseInt(match[1]) : 0);
              }, 0)
            : 0;

          return (
            <motion.div
              key={dayIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dayIndex * 0.05 }}
            >
              <Card
                onClick={() => onDaySelect?.(dayIndex)}
                className={`cursor-pointer transition-all h-full ${
                  isToday
                    ? 'border-2 border-indigo-600 bg-indigo-50 shadow-lg'
                    : isPast
                    ? 'opacity-60 border-slate-200 bg-slate-50'
                    : 'border-slate-200 hover:shadow-md hover:border-indigo-300'
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="text-center">
                    <p className={`text-xs font-semibold ${isToday ? 'text-indigo-700' : 'text-slate-600'}`}>
                      {DAYS_OF_WEEK[date.getDay()]}
                    </p>
                    <p className={`text-lg font-bold ${isToday ? 'text-indigo-700' : 'text-slate-900'}`}>
                      {date.getDate()}
                    </p>
                    {isToday && (
                      <Badge className="bg-indigo-600 text-white text-[10px] mt-1 w-full justify-center">
                        Today
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pb-3 space-y-1">
                  {dayData ? (
                    <>
                      {/* Meal Icons */}
                      <div className="flex gap-1 justify-center flex-wrap">
                        {['breakfast', 'lunch', 'dinner', 'snacks'].map(mealType => 
                          dayData[mealType] ? (
                            <span key={mealType} className="text-sm" title={mealType}>
                              {MEAL_ICONS[mealType]}
                            </span>
                          ) : null
                        )}
                      </div>

                      {/* Meal Names */}
                      <div className="space-y-0.5 text-[10px]">
                        {['breakfast', 'lunch', 'dinner'].map(mealType => 
                          dayData[mealType] ? (
                            <div key={mealType} className="text-slate-700 truncate">
                              <span className="text-slate-500 uppercase">{mealType.slice(0, 1)}: </span>
                              <span className="font-medium">{dayData[mealType].name?.split(' ').slice(0, 2).join(' ')}</span>
                            </div>
                          ) : null
                        )}
                      </div>

                      {/* Macro Bar */}
                      {(dayData.breakfast || dayData.lunch || dayData.dinner) && (
                        <div className="mt-2 pt-2 border-t border-slate-200">
                          <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-slate-100">
                            {(() => {
                              let proteinPct = 0, carbsPct = 0, fatPct = 0;
                              let count = 0;

                              ['breakfast', 'lunch', 'dinner'].forEach(mt => {
                                const meal = dayData[mt];
                                if (meal?.protein || meal?.carbs || meal?.fat) {
                                  const macros = getMacroPercentages(meal);
                                  if (macros) {
                                    proteinPct += macros.protein;
                                    carbsPct += macros.carbs;
                                    fatPct += macros.fat;
                                    count++;
                                  }
                                }
                              });

                              if (count > 0) {
                                proteinPct /= count;
                                carbsPct /= count;
                                fatPct /= count;
                              }

                              return (
                                <>
                                  {proteinPct > 0 && <div style={{ width: `${proteinPct}%` }} className="bg-blue-500" />}
                                  {carbsPct > 0 && <div style={{ width: `${carbsPct}%` }} className="bg-amber-500" />}
                                  {fatPct > 0 && <div style={{ width: `${fatPct}%` }} className="bg-rose-500" />}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Calories Badge */}
                      <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-slate-600">
                        <Flame className="w-3 h-3 text-orange-500" />
                        {dayCalories} kcal
                      </div>
                    </>
                  ) : (
                    <p className="text-[10px] text-slate-400 text-center py-2">No meals</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 justify-center text-xs text-slate-600 px-4 py-2 bg-slate-50 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Protein</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Carbs</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500" />
          <span>Fat</span>
        </div>
      </div>
    </div>
  );
}