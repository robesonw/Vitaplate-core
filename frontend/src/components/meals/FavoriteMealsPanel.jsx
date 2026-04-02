import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Trash2, Plus, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import FavoriteMealDetailDialog from './FavoriteMealDetailDialog';

const mealIcons = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snacks: '🍎'
};

export default function FavoriteMealsPanel({ onAddToPlan }) {
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: rawFavoriteMeals = [], isLoading } = useQuery({
    queryKey: ['favoriteMeals'],
    queryFn: () => base44.entities.FavoriteMeal.list('-created_date'),
  });

  // Filter out duplicates based on name and meal_type
  const favoriteMeals = rawFavoriteMeals.reduce((unique, meal) => {
    const exists = unique.find(
      m => m.name === meal.name && m.meal_type === meal.meal_type
    );
    if (!exists) {
      unique.push(meal);
    }
    return unique;
  }, []);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FavoriteMeal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoriteMeals'] });
      toast.success('Removed from favorites');
    },
  });

  if (isLoading) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-6 text-center text-slate-500">
          Loading favorites...
        </CardContent>
      </Card>
    );
  }

  if (favoriteMeals.length === 0) {
    return (
      <Card className="border-slate-200 border-dashed">
        <CardContent className="p-8 text-center">
          <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 text-sm">
            No favorite meals yet. Save meals from your plans to quickly add them later!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500" />
          Favorite Meals ({favoriteMeals.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {favoriteMeals.map((meal, index) => (
          <motion.div
            key={meal.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{mealIcons[meal.meal_type]}</span>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {meal.meal_type}
                  </Badge>
                </div>
                <h4 className="text-sm font-medium text-slate-900 mb-1">
                  {meal.name}
                </h4>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  {meal.calories && <span>{meal.calories}</span>}
                  {meal.protein && <span className="text-blue-600">P: {meal.protein}g</span>}
                  {meal.carbs && <span className="text-amber-600">C: {meal.carbs}g</span>}
                  {meal.fat && <span className="text-rose-600">F: {meal.fat}g</span>}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => {
                    setSelectedMeal(meal);
                    setDetailDialogOpen(true);
                  }}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  View
                </Button>
                {onAddToPlan && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => onAddToPlan(meal)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700"
                  onClick={() => deleteMutation.mutate(meal.id)}
                >
                  <Heart className="w-3 h-3 fill-rose-600" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </CardContent>

      <FavoriteMealDetailDialog
        meal={selectedMeal}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </Card>
  );
}