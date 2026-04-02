import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronDown, Clock, ChefHat, Wrench, Heart, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const difficultyColors = {
  Easy: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200',
  Hard: 'bg-rose-100 text-rose-700 border-rose-200',
};

export default function MealCard({ meal, mealType, mealIcon, mealPlanId, mealPlanName }) {
  if (!meal) return null;

  const queryClient = useQueryClient();
  
  const { data: favoriteMeals = [] } = useQuery({
    queryKey: ['favoriteMeals'],
    queryFn: () => base44.entities.FavoriteMeal.list(),
  });

  const isFavorite = favoriteMeals.some(
    fav => fav.name === meal.name && fav.meal_type === mealType
  );

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      const existing = favoriteMeals.find(
        fav => fav.name === meal.name && fav.meal_type === mealType
      );
      if (existing) {
        await base44.entities.FavoriteMeal.delete(existing.id);
      } else {
        // Check if already exists to prevent duplicates
        const duplicate = favoriteMeals.find(
          fav => fav.name === meal.name && fav.meal_type === mealType
        );
        if (!duplicate) {
          await base44.entities.FavoriteMeal.create({
            name: meal.name,
            meal_type: mealType,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
            nutrients: meal.nutrients,
            prepTip: meal.prepTip,
            prepTime: meal.prepTime,
            prepSteps: meal.prepSteps,
            difficulty: meal.difficulty,
            equipment: meal.equipment,
            healthBenefit: meal.healthBenefit,
            imageUrl: meal.imageUrl,
            source_type: 'meal_plan',
            source_meal_plan_id: mealPlanId,
            source_meal_plan_name: mealPlanName,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoriteMeals'] });
      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
    },
  });

  const hasPrepDetails = meal.prepSteps?.length > 0 || meal.prepTime || meal.difficulty;

  return (
    <Card className="overflow-hidden border-slate-200 hover:shadow-md transition-shadow">
      {/* Meal Image */}
      {meal.imageUrl && (
        <div className="relative h-48 overflow-hidden">
          <img 
            src={meal.imageUrl} 
            alt={meal.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div className="absolute top-3 left-3">
            <Badge className="bg-white/90 backdrop-blur-sm text-slate-900 border-0">
              {mealIcon} {mealType}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm hover:bg-white"
            onClick={() => toggleFavoriteMutation.mutate()}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-600 text-rose-600' : 'text-slate-600'}`} />
          </Button>
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div>
          <h4 className="font-semibold text-lg text-slate-900">{meal.name}</h4>
          {meal.prepTip && (
            <p className="text-sm text-slate-600 mt-1">{meal.prepTip}</p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            🔥 {meal.calories}
          </Badge>
          {meal.prepTime && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {meal.prepTime}
            </Badge>
          )}
          {meal.difficulty && (
            <Badge className={`border ${difficultyColors[meal.difficulty] || 'bg-slate-100 text-slate-700'}`}>
              {meal.difficulty}
            </Badge>
          )}
        </div>

        {/* Macros */}
        {(meal.protein || meal.carbs || meal.fat) && (
          <div className="flex gap-3 text-xs">
            {meal.protein && <span className="text-blue-600 font-medium">P: {meal.protein}g</span>}
            {meal.carbs && <span className="text-amber-600 font-medium">C: {meal.carbs}g</span>}
            {meal.fat && <span className="text-rose-600 font-medium">F: {meal.fat}g</span>}
          </div>
        )}

        {/* Health Benefit */}
        {meal.healthBenefit && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="flex items-start gap-2">
              <Heart className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-emerald-900 mb-0.5">Why This Helps</p>
                <p className="text-xs text-emerald-700">{meal.healthBenefit}</p>
              </div>
            </div>
          </div>
        )}

        {/* Preparation Details */}
        {hasPrepDetails && (
          <Accordion type="single" collapsible className="border-t pt-2">
            <AccordionItem value="prep" className="border-0">
              <AccordionTrigger className="py-2 text-sm font-medium text-slate-700 hover:no-underline">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-4 h-4" />
                  Preparation Guide
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                {/* Equipment */}
                {meal.equipment?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-700 mb-1">
                      <Wrench className="w-3 h-3" />
                      Equipment Needed
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {meal.equipment.map((item, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prep Steps */}
                {meal.prepSteps?.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-slate-700 mb-2">Steps</div>
                    <ol className="space-y-1.5 text-sm text-slate-600">
                      {meal.prepSteps.map((step, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-medium">
                            {idx + 1}
                          </span>
                          <span className="flex-1">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}