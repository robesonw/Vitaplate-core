import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, Star } from 'lucide-react';

export default function SharedPlanDetailDialog({ plan, open, onOpenChange }) {
  if (!plan) return null;

  const mealIcons = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snacks: '🍎'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{plan.title}</DialogTitle>
          <p className="text-sm text-slate-600 mt-1">{plan.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="capitalize">
              {plan.diet_type?.replace(/-/g, ' ')}
            </Badge>
            {plan.cultural_style && plan.cultural_style !== 'none' && (
              <Badge variant="secondary" className="capitalize">
                {plan.cultural_style?.replace(/_/g, ' ')}
              </Badge>
            )}
            <span className="text-xs text-slate-500">by {plan.author_name}</span>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {plan.plan_data?.days?.map((day, dayIndex) => (
            <Card key={dayIndex} className="border-slate-200">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">{day.day}</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {['breakfast', 'lunch', 'dinner', 'snacks'].map(mealType => {
                    const meal = day[mealType];
                    if (!meal) return null;

                    return (
                      <div key={mealType} className="p-3 rounded-lg border border-slate-200 bg-white">
                        {meal.imageUrl && (
                          <img
                            src={meal.imageUrl}
                            alt={meal.name}
                            className="w-full h-32 object-cover rounded-lg mb-2"
                          />
                        )}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{mealIcons[mealType]}</span>
                          <span className="text-xs font-medium text-slate-500 uppercase">{mealType}</span>
                          <Badge variant="outline" className="text-xs ml-auto">
                            <Flame className="w-3 h-3 mr-1 text-orange-500" />
                            {meal.calories}
                          </Badge>
                        </div>
                        <p className="font-medium text-sm text-slate-900">{meal.name}</p>
                        {meal.prepTip && (
                          <p className="text-xs text-slate-600 mt-1">{meal.prepTip}</p>
                        )}
                        {(meal.protein || meal.carbs || meal.fat) && (
                          <div className="flex gap-2 mt-2 text-xs">
                            {meal.protein && <span className="text-blue-600">P:{meal.protein}g</span>}
                            {meal.carbs && <span className="text-amber-600">C:{meal.carbs}g</span>}
                            {meal.fat && <span className="text-rose-600">F:{meal.fat}g</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}