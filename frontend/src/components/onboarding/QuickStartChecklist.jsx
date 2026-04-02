import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { CheckCircle2, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function QuickStartChecklist() {
  const [dismissed, setDismissed] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: preferences } = useQuery({
    queryKey: ['userPreferences', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const prefs = await base44.entities.UserPreferences.filter({ created_by: user.email });
      return prefs?.[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: mealPlans = [] } = useQuery({
    queryKey: ['mealPlans', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.MealPlan.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email,
  });

  const { data: favoriteMeals = [] } = useQuery({
    queryKey: ['favoriteMeals', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.FavoriteMeal.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email,
  });

  useEffect(() => {
    const dismissed = localStorage.getItem('vitaplate_checklist_dismissed');
    if (dismissed === 'true') {
      setDismissed(true);
    }

    const saved = localStorage.getItem('vitaplate_checklist_items');
    if (saved) {
      setCheckedItems(JSON.parse(saved));
    }
  }, []);

  const handleCheck = (id) => {
    const newChecked = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(newChecked);
    localStorage.setItem('vitaplate_checklist_items', JSON.stringify(newChecked));
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('vitaplate_checklist_dismissed', 'true');
  };

  const items = [
    {
      id: 'profile',
      label: 'Complete your profile preferences',
      link: 'Profile',
      completed: preferences && (preferences.health_goal || preferences.dietary_restrictions),
    },
    {
      id: 'meal_plan',
      label: 'Generate your first meal plan',
      link: 'HealthDietHub',
      completed: mealPlans.length > 0,
    },
    {
      id: 'recipe',
      label: 'Try the AI recipe generator',
      link: 'AIRecipeGenerator',
      completed: checkedItems.recipe,
    },
    {
      id: 'favorite',
      label: 'Save a favorite meal',
      link: 'SharedRecipes',
      completed: favoriteMeals.length > 0,
    },
    {
      id: 'community',
      label: 'Explore the community',
      link: 'Community',
      completed: checkedItems.community,
    },
  ];

  const completedCount = items.filter(item => item.completed || checkedItems[item.id]).length;
  const allCompleted = completedCount === items.length;

  if (dismissed || allCompleted) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Quick Start Guide</CardTitle>
                  <Badge variant="secondary" className="mt-1">
                    {completedCount} of {items.length} completed
                  </Badge>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item) => {
              const isCompleted = item.completed || checkedItems[item.id];
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={() => !item.completed && handleCheck(item.id)}
                      disabled={item.completed}
                    />
                    <span className={`text-sm ${isCompleted ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                      {item.label}
                    </span>
                    {isCompleted && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  {!isCompleted && (
                    <Button asChild size="sm" variant="outline">
                      <Link to={createPageUrl(item.link)}>Go</Link>
                    </Button>
                  )}
                </div>
              );
            })}

            <div className="pt-2 mt-4 border-t border-indigo-200">
              <p className="text-xs text-slate-600 text-center">
                💡 Need help? Check out our{' '}
                <Link to={createPageUrl('HelpCenter')} className="text-indigo-600 hover:underline font-medium">
                  Help Center
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}