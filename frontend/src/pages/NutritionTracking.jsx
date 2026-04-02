import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Target, TrendingUp, Calendar as CalendarIcon, Plus, Flame, Activity, Award, Edit, Save, Camera, Upload, Loader2, ChefHat, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format, startOfWeek, endOfWeek, subDays, addDays } from 'date-fns';
import ShareProgressDialog from '../components/progress/ShareProgressDialog';
import FoodDatabaseSearch from '../components/nutrition/FoodDatabaseSearch';
import MicronutrientTargetSelector from '../components/nutrition/MicronutrientTargetSelector';
import MicronutrientProgressCard from '../components/nutrition/MicronutrientProgressCard';
import FoodPhotoLogger from '../components/meals/FoodPhotoLogger';
import FoodPhotoReview from '../components/meals/FoodPhotoReview';
import VoiceMealLogger from '../components/meals/VoiceMealLogger';
import VoiceTranscriptionReview from '../components/meals/VoiceTranscriptionReview';

export default function NutritionTracking() {
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [recipeBuilderOpen, setRecipeBuilderOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeRange, setTimeRange] = useState('week'); // 'week', 'month', 'custom'
  const [dateRange, setDateRange] = useState({ from: subDays(new Date(), 7), to: new Date() });
  const [editingGoal, setEditingGoal] = useState(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [logMethod, setLogMethod] = useState('manual'); // 'manual', 'photo', 'recipe'
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [dailyGoalTimeRange, setDailyGoalTimeRange] = useState('month'); // 'week', 'month', 'custom'
  const [dailyGoalDateRange, setDailyGoalDateRange] = useState({ from: subDays(new Date(), 30), to: new Date() });
  const [weeklyGoalTimeRange, setWeeklyGoalTimeRange] = useState('month'); // 'week', 'month', 'custom'
  const [weeklyGoalDateRange, setWeeklyGoalDateRange] = useState({ from: subDays(new Date(), 30), to: new Date() });
  const [photoReviewOpen, setPhotoReviewOpen] = useState(false);
  const [photoToReview, setPhotoToReview] = useState(null);
  const [voiceReviewOpen, setVoiceReviewOpen] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState(null);
  
  const [goalForm, setGoalForm] = useState({
    goal_type: 'daily',
    target_calories: 2000,
    target_protein: 150,
    target_carbs: 200,
    target_fat: 65,
    target_micronutrients: {}
  });

  const [logForm, setLogForm] = useState({
    recipe_name: '',
    meal_type: 'lunch',
    log_date: format(new Date(), 'yyyy-MM-dd'),
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    servings: 1,
    micronutrients: {},
    food_source: 'manual',
    food_id: null
  });

  const [recipeIngredients, setRecipeIngredients] = useState('');
  const [isGeneratingNutrition, setIsGeneratingNutrition] = useState(false);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['nutritionGoals', user?.email],
    queryFn: () => base44.entities.NutritionGoal.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const activeDailyGoal = goals.find(g => g.is_active && g.goal_type === 'daily');
  const activeWeeklyGoal = goals.find(g => g.is_active && g.goal_type === 'weekly');

  const { data: logs = [] } = useQuery({
    queryKey: ['nutritionLogs', user?.email],
    queryFn: () => base44.entities.NutritionLog.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const { data: favoriteMeals = [] } = useQuery({
    queryKey: ['favoriteMeals'],
    queryFn: () => base44.entities.FavoriteMeal.list(),
  });

  const { data: mealPlans = [] } = useQuery({
    queryKey: ['mealPlans'],
    queryFn: () => base44.entities.MealPlan.list('-created_date', 5),
  });

  const createGoalMutation = useMutation({
    mutationFn: (data) => base44.entities.NutritionGoal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutritionGoals'] });
      toast.success('Goal saved!');
      setGoalDialogOpen(false);
      setEditingGoal(null);
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.NutritionGoal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutritionGoals'] });
      toast.success('Goal updated!');
      setGoalDialogOpen(false);
      setEditingGoal(null);
    },
  });

  const createLogMutation = useMutation({
    mutationFn: (data) => base44.entities.NutritionLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutritionLogs'] });
      toast.success('Meal logged!');
      setLogDialogOpen(false);
      setLogForm({
        recipe_name: '',
        meal_type: 'lunch',
        log_date: format(new Date(), 'yyyy-MM-dd'),
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        servings: 1,
        micronutrients: {},
        food_source: 'manual',
        food_id: null
      });
    },
  });

  const activeGoal = activeDailyGoal;

  const handleSaveGoal = () => {
    if (editingGoal) {
      updateGoalMutation.mutate({ id: editingGoal.id, data: goalForm });
    } else {
      // Deactivate other goals of same type
      const otherGoals = goals.filter(g => g.goal_type === goalForm.goal_type && g.is_active);
      otherGoals.forEach(g => {
        base44.entities.NutritionGoal.update(g.id, { is_active: false });
      });
      createGoalMutation.mutate({ ...goalForm, is_active: true });
    }
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setGoalForm({
      goal_type: goal.goal_type,
      target_calories: goal.target_calories,
      target_protein: goal.target_protein,
      target_carbs: goal.target_carbs,
      target_fat: goal.target_fat,
      target_micronutrients: goal.target_micronutrients || {}
    });
    setGoalDialogOpen(true);
  };

  const handleSelectFoodFromDatabase = (food) => {
    setLogForm({
      ...logForm,
      recipe_name: food.name,
      calories: food.calories || 0,
      protein: food.protein || 0,
      carbs: food.carbs || 0,
      fat: food.fat || 0,
      micronutrients: food.micronutrients || {},
      food_source: food.source || 'usda',
      food_id: food.food_id || null
    });
    toast.success('Food loaded from database');
  };

  const handleSelectMeal = (mealId) => {
    const meal = favoriteMeals.find(m => m.id === mealId);
    if (meal) {
      const caloriesMatch = meal.calories?.match(/(\d+)/);
      setLogForm({
        ...logForm,
        recipe_name: meal.name,
        calories: caloriesMatch ? parseInt(caloriesMatch[1]) : 0,
        protein: meal.protein || 0,
        carbs: meal.carbs || 0,
        fat: meal.fat || 0,
        meal_type: meal.meal_type
      });
    }
  };

  const handlePhotoSelected = async (photoData) => {
    setIsAnalyzingPhoto(true);
    setPhotoToReview(photoData);
    setPhotoReviewOpen(true);
  };

  const handleVoiceTranscribed = (transcript) => {
    setVoiceTranscript(transcript);
    setVoiceReviewOpen(true);
  };

  const handleGenerateNutrition = async () => {
    if (!recipeIngredients.trim()) {
      toast.error('Please enter ingredients');
      return;
    }

    setIsGeneratingNutrition(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Given these ingredients: "${recipeIngredients}", calculate the total nutritional information. Provide a recipe name, total calories, protein (g), carbs (g), and fat (g) for the complete recipe.`,
        response_json_schema: {
          type: "object",
          properties: {
            recipe_name: { type: "string", description: "Suggested name for this recipe" },
            calories: { type: "number", description: "Total calories" },
            protein: { type: "number", description: "Total protein in grams" },
            carbs: { type: "number", description: "Total carbs in grams" },
            fat: { type: "number", description: "Total fat in grams" },
            servings: { type: "number", description: "Estimated number of servings" }
          }
        }
      });

      setLogForm({
        ...logForm,
        recipe_name: result.recipe_name,
        calories: Math.round(result.calories / (result.servings || 1)),
        protein: Math.round(result.protein / (result.servings || 1)),
        carbs: Math.round(result.carbs / (result.servings || 1)),
        fat: Math.round(result.fat / (result.servings || 1)),
        servings: 1
      });

      toast.success(`Recipe created: ${result.recipe_name} (per serving)`);
      setRecipeBuilderOpen(false);
      setLogDialogOpen(true);
    } catch (error) {
      toast.error('Failed to generate nutrition info');
    } finally {
      setIsGeneratingNutrition(false);
    }
  };

  const handleSelectFromMealPlan = (planId, day, mealType) => {
    const plan = mealPlans.find(p => p.id === planId);
    if (!plan) return;

    const dayData = plan.days?.find(d => d.day === day);
    if (!dayData) return;

    const meal = dayData[mealType];
    if (!meal) return;

    const caloriesMatch = meal.calories?.match(/(\d+)/);
    setLogForm({
      ...logForm,
      recipe_name: meal.name,
      calories: caloriesMatch ? parseInt(caloriesMatch[1]) : 0,
      protein: meal.protein || 0,
      carbs: meal.carbs || 0,
      fat: meal.fat || 0,
      meal_type: mealType
    });
    toast.success('Meal loaded from plan');
  };

  // Calculate today's totals
  const todayTotals = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayLogs = logs.filter(l => l.log_date === today);
    return {
      calories: todayLogs.reduce((sum, l) => sum + (l.calories * (l.servings || 1)), 0),
      protein: todayLogs.reduce((sum, l) => sum + (l.protein * (l.servings || 1)), 0),
      carbs: todayLogs.reduce((sum, l) => sum + (l.carbs * (l.servings || 1)), 0),
      fat: todayLogs.reduce((sum, l) => sum + (l.fat * (l.servings || 1)), 0),
      meals: todayLogs.length
    };
  }, [logs]);

  // Prepare chart data
  const chartData = useMemo(() => {
    let startDate, endDate;
    
    if (timeRange === 'custom') {
      startDate = dateRange.from;
      endDate = dateRange.to;
    } else {
      const days = timeRange === 'week' ? 7 : 30;
      startDate = subDays(new Date(), days - 1);
      endDate = new Date();
    }
    
    const data = [];
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    for (let i = 0; i < daysDiff; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dayLogs = logs.filter(l => l.log_date === dateStr);
      
      data.push({
        date: format(currentDate, 'MMM d'),
        calories: dayLogs.reduce((sum, l) => sum + (l.calories * (l.servings || 1)), 0),
        protein: dayLogs.reduce((sum, l) => sum + (l.protein * (l.servings || 1)), 0),
        carbs: dayLogs.reduce((sum, l) => sum + (l.carbs * (l.servings || 1)), 0),
        fat: dayLogs.reduce((sum, l) => sum + (l.fat * (l.servings || 1)), 0),
        target: activeGoal?.target_calories || 0
      });
    }
    
    return data;
  }, [logs, timeRange, dateRange, activeGoal]);

  const getProgressPercentage = (current, target) => {
    if (!target) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
  };

  const getProgressColor = (percentage) => {
    if (percentage < 80) return 'bg-amber-500';
    if (percentage > 110) return 'bg-rose-500';
    return 'bg-emerald-500';
  };

  // Calculate weekly totals
  const weeklyTotals = useMemo(() => {
    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());
    const weekLogs = logs.filter(l => {
      const logDate = new Date(l.log_date);
      return logDate >= weekStart && logDate <= weekEnd;
    });
    return {
      calories: weekLogs.reduce((sum, l) => sum + (l.calories * (l.servings || 1)), 0),
      protein: weekLogs.reduce((sum, l) => sum + (l.protein * (l.servings || 1)), 0),
      carbs: weekLogs.reduce((sum, l) => sum + (l.carbs * (l.servings || 1)), 0),
      fat: weekLogs.reduce((sum, l) => sum + (l.fat * (l.servings || 1)), 0),
    };
  }, [logs]);

  // Calculate goal achievement history for daily goals
  const dailyGoalHistory = useMemo(() => {
    if (!activeDailyGoal) return [];
    
    const history = [];
    let startDate, endDate;
    
    if (dailyGoalTimeRange === 'custom') {
      startDate = dailyGoalDateRange.from;
      endDate = dailyGoalDateRange.to;
    } else {
      const days = dailyGoalTimeRange === 'week' ? 7 : 30;
      startDate = subDays(new Date(), days - 1);
      endDate = new Date();
    }
    
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    for (let i = 0; i < daysDiff; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dayLogs = logs.filter(l => l.log_date === dateStr);
      
      const totals = {
        calories: dayLogs.reduce((sum, l) => sum + (l.calories * (l.servings || 1)), 0),
        protein: dayLogs.reduce((sum, l) => sum + (l.protein * (l.servings || 1)), 0),
        carbs: dayLogs.reduce((sum, l) => sum + (l.carbs * (l.servings || 1)), 0),
        fat: dayLogs.reduce((sum, l) => sum + (l.fat * (l.servings || 1)), 0),
      };
      
      const goalsMetCount = [
        totals.calories >= activeDailyGoal.target_calories * 0.9 && totals.calories <= activeDailyGoal.target_calories * 1.1,
        totals.protein >= activeDailyGoal.target_protein * 0.9,
        totals.carbs >= activeDailyGoal.target_carbs * 0.9 && totals.carbs <= activeDailyGoal.target_carbs * 1.1,
        totals.fat >= activeDailyGoal.target_fat * 0.9 && totals.fat <= activeDailyGoal.target_fat * 1.1,
      ].filter(Boolean).length;
      
      history.push({
        date: dateStr,
        displayDate: format(currentDate, 'MMM d'),
        totals,
        goalsMetCount,
        allGoalsMet: goalsMetCount === 4,
        hasLogs: dayLogs.length > 0
      });
    }
    
    return history;
  }, [logs, activeDailyGoal, dailyGoalTimeRange, dailyGoalDateRange]);

  // Calculate goal achievement history for weekly goals
  const weeklyGoalHistory = useMemo(() => {
    if (!activeWeeklyGoal) return [];
    
    let startDate, endDate;
    
    if (weeklyGoalTimeRange === 'custom') {
      // Ensure both from and to dates are selected
      if (!weeklyGoalDateRange.from || !weeklyGoalDateRange.to) {
        return [];
      }
      startDate = new Date(weeklyGoalDateRange.from);
      endDate = new Date(weeklyGoalDateRange.to);
      
      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return [];
      }
    } else {
      const days = weeklyGoalTimeRange === 'week' ? 7 : 28;
      startDate = subDays(new Date(), days - 1);
      endDate = new Date();
    }
    
    // Group by weeks (7-day periods)
    const weeks = [];
    let currentWeekStart = new Date(startDate);
    
    while (currentWeekStart <= endDate) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const actualWeekEnd = weekEnd > endDate ? endDate : weekEnd;
      
      const weekLogs = logs.filter(l => {
        const logDate = new Date(l.log_date);
        return logDate >= currentWeekStart && logDate <= actualWeekEnd;
      });
      
      const totals = {
        calories: weekLogs.reduce((sum, l) => sum + (l.calories * (l.servings || 1)), 0),
        protein: weekLogs.reduce((sum, l) => sum + (l.protein * (l.servings || 1)), 0),
        carbs: weekLogs.reduce((sum, l) => sum + (l.carbs * (l.servings || 1)), 0),
        fat: weekLogs.reduce((sum, l) => sum + (l.fat * (l.servings || 1)), 0),
      };
      
      const weekTarget = {
        calories: activeWeeklyGoal.target_calories * 7,
        protein: activeWeeklyGoal.target_protein * 7,
        carbs: activeWeeklyGoal.target_carbs * 7,
        fat: activeWeeklyGoal.target_fat * 7,
      };
      
      const goalsMetCount = [
        totals.calories >= weekTarget.calories * 0.9 && totals.calories <= weekTarget.calories * 1.1,
        totals.protein >= weekTarget.protein * 0.9,
        totals.carbs >= weekTarget.carbs * 0.9 && totals.carbs <= weekTarget.carbs * 1.1,
        totals.fat >= weekTarget.fat * 0.9 && totals.fat <= weekTarget.fat * 1.1,
      ].filter(Boolean).length;
      
      weeks.push({
        weekStart: format(currentWeekStart, 'yyyy-MM-dd'),
        weekEnd: format(actualWeekEnd, 'yyyy-MM-dd'),
        displayDate: `${format(currentWeekStart, 'MMM d')} - ${format(actualWeekEnd, 'MMM d')}`,
        totals,
        weekTarget,
        goalsMetCount,
        allGoalsMet: goalsMetCount === 4,
        hasLogs: weekLogs.length > 0
      });
      
      const nextWeekStart = new Date(actualWeekEnd);
      nextWeekStart.setDate(nextWeekStart.getDate() + 1);
      currentWeekStart = nextWeekStart;
    }
    
    return weeks;
  }, [logs, activeWeeklyGoal, weeklyGoalTimeRange, weeklyGoalDateRange]);

  // Calculate statistics for daily goals
  const dailyGoalStats = useMemo(() => {
    if (!activeDailyGoal || dailyGoalHistory.length === 0) return null;
    
    const daysWithLogs = dailyGoalHistory.filter(d => d.hasLogs);
    const daysAllGoalsMet = daysWithLogs.filter(d => d.allGoalsMet).length;
    const successRate = daysWithLogs.length > 0 ? Math.round((daysAllGoalsMet / daysWithLogs.length) * 100) : 0;
    
    // Calculate current streak
    let currentStreak = 0;
    for (let i = dailyGoalHistory.length - 1; i >= 0; i--) {
      if (dailyGoalHistory[i].allGoalsMet) {
        currentStreak++;
      } else if (dailyGoalHistory[i].hasLogs) {
        break;
      }
    }
    
    return {
      daysTracked: daysWithLogs.length,
      daysGoalsMet: daysAllGoalsMet,
      successRate,
      currentStreak
    };
  }, [dailyGoalHistory, activeDailyGoal]);

  // Calculate statistics for weekly goals
  const weeklyGoalStats = useMemo(() => {
    if (!activeWeeklyGoal || weeklyGoalHistory.length === 0) return null;
    
    const weeksWithLogs = weeklyGoalHistory.filter(w => w.hasLogs);
    const weeksAllGoalsMet = weeksWithLogs.filter(w => w.allGoalsMet).length;
    const successRate = weeksWithLogs.length > 0 ? Math.round((weeksAllGoalsMet / weeksWithLogs.length) * 100) : 0;
    
    // Calculate current streak
    let currentStreak = 0;
    for (let i = weeklyGoalHistory.length - 1; i >= 0; i--) {
      if (weeklyGoalHistory[i].allGoalsMet) {
        currentStreak++;
      } else if (weeklyGoalHistory[i].hasLogs) {
        break;
      }
    }
    
    return {
      weeksTracked: weeksWithLogs.length,
      weeksGoalsMet: weeksAllGoalsMet,
      successRate,
      currentStreak
    };
  }, [weeklyGoalHistory, activeWeeklyGoal]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Nutrition Tracking</h1>
          <p className="text-slate-600 mt-1">Monitor your nutrition and track progress toward your goals</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setGoalDialogOpen(true)}>
            <Target className="w-4 h-4 mr-2" />
            Set Goals
          </Button>
          <Button variant="outline" onClick={() => setRecipeBuilderOpen(true)}>
            <ChefHat className="w-4 h-4 mr-2" />
            Recipe Builder
          </Button>
          <FoodPhotoLogger 
            onPhotoSelected={handlePhotoSelected}
            isLoading={isAnalyzingPhoto}
          />
          <VoiceMealLogger 
            onTranscriptionComplete={handleVoiceTranscribed}
            isProcessing={voiceReviewOpen}
          />
          <Button variant="outline" onClick={() => setShareDialogOpen(true)}>
            <Share2 className="w-4 h-4 mr-2" />
            Share Progress
          </Button>
          <Button onClick={() => { setLogMethod('manual'); setLogDialogOpen(true); }} className="bg-gradient-to-r from-indigo-600 to-purple-600">
            <Plus className="w-4 h-4 mr-2" />
            Log Meal
          </Button>
        </div>
      </div>

      {/* Today's Progress */}
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            Today's Progress {activeGoal && '- Daily Goals'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!activeGoal ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 mb-4">Set your nutrition goals to track progress</p>
              <Button onClick={() => setGoalDialogOpen(true)} className="bg-gradient-to-r from-indigo-600 to-purple-600">
                <Target className="w-4 h-4 mr-2" />
                Set Goals
              </Button>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900">{Math.round(todayTotals.calories)}</div>
                  <div className="text-sm text-slate-600">/ {activeGoal.target_calories} kcal</div>
                  <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getProgressColor(getProgressPercentage(todayTotals.calories, activeGoal.target_calories))}`}
                      style={{ width: `${getProgressPercentage(todayTotals.calories, activeGoal.target_calories)}%` }}
                    />
                  </div>
                  <div className="text-xs mt-1 font-medium">
                    {getProgressPercentage(todayTotals.calories, activeGoal.target_calories) >= 100 ? (
                      <span className="text-emerald-600">✓ Goal Met</span>
                    ) : (
                      <span className="text-slate-500">{activeGoal.target_calories - Math.round(todayTotals.calories)} kcal left</span>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-700">{Math.round(todayTotals.protein)}g</div>
                  <div className="text-sm text-slate-600">/ {activeGoal.target_protein}g</div>
                  <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getProgressColor(getProgressPercentage(todayTotals.protein, activeGoal.target_protein))}`}
                      style={{ width: `${getProgressPercentage(todayTotals.protein, activeGoal.target_protein)}%` }}
                    />
                  </div>
                  <div className="text-xs mt-1 font-medium">
                    {getProgressPercentage(todayTotals.protein, activeGoal.target_protein) >= 100 ? (
                      <span className="text-emerald-600">✓ Goal Met</span>
                    ) : (
                      <span className="text-slate-500">{activeGoal.target_protein - Math.round(todayTotals.protein)}g left</span>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-700">{Math.round(todayTotals.carbs)}g</div>
                  <div className="text-sm text-slate-600">/ {activeGoal.target_carbs}g</div>
                  <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getProgressColor(getProgressPercentage(todayTotals.carbs, activeGoal.target_carbs))}`}
                      style={{ width: `${getProgressPercentage(todayTotals.carbs, activeGoal.target_carbs)}%` }}
                    />
                  </div>
                  <div className="text-xs mt-1 font-medium">
                    {getProgressPercentage(todayTotals.carbs, activeGoal.target_carbs) >= 100 ? (
                      <span className="text-emerald-600">✓ Goal Met</span>
                    ) : (
                      <span className="text-slate-500">{activeGoal.target_carbs - Math.round(todayTotals.carbs)}g left</span>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-rose-700">{Math.round(todayTotals.fat)}g</div>
                  <div className="text-sm text-slate-600">/ {activeGoal.target_fat}g</div>
                  <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getProgressColor(getProgressPercentage(todayTotals.fat, activeGoal.target_fat))}`}
                      style={{ width: `${getProgressPercentage(todayTotals.fat, activeGoal.target_fat)}%` }}
                    />
                  </div>
                  <div className="text-xs mt-1 font-medium">
                    {getProgressPercentage(todayTotals.fat, activeGoal.target_fat) >= 100 ? (
                      <span className="text-emerald-600">✓ Goal Met</span>
                    ) : (
                      <span className="text-slate-500">{activeGoal.target_fat - Math.round(todayTotals.fat)}g left</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-center text-sm text-slate-600">
                {todayTotals.meals} meals logged today
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Historical Data */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Nutrition History
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
              {timeRange === 'custom' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {dateRange.from && dateRange.to ? (
                        `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`
                      ) : (
                        'Select dates'
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <div className="p-3 space-y-3">
                      <div>
                        <Label className="text-xs">From</Label>
                        <Calendar
                          mode="single"
                          selected={dateRange.from}
                          onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                          disabled={(date) => date > new Date()}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">To</Label>
                        <Calendar
                          mode="single"
                          selected={dateRange.to}
                          onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                          disabled={(date) => date > new Date() || date < dateRange.from}
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="calories" className="space-y-4">
            <TabsList>
              <TabsTrigger value="calories">Calories</TabsTrigger>
              <TabsTrigger value="macros">Macros</TabsTrigger>
            </TabsList>

            <TabsContent value="calories">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="calories" stroke="#6366f1" strokeWidth={2} name="Calories" />
                  {activeGoal && (
                    <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeDasharray="5 5" name="Goal" />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="macros">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="protein" fill="#3b82f6" name="Protein (g)" />
                  <Bar dataKey="carbs" fill="#f59e0b" name="Carbs (g)" />
                  <Bar dataKey="fat" fill="#ef4444" name="Fat (g)" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Micronutrient Progress */}
      {activeDailyGoal && (
        <MicronutrientProgressCard logs={logs} activeGoal={activeDailyGoal} />
      )}

      {/* Weekly Progress (for weekly goals) */}
      {activeWeeklyGoal && (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-purple-600" />
              This Week's Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{Math.round(weeklyTotals.calories)}</div>
                <div className="text-sm text-slate-600">/ {activeWeeklyGoal.target_calories * 7} kcal</div>
                <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(getProgressPercentage(weeklyTotals.calories, activeWeeklyGoal.target_calories * 7))}`}
                    style={{ width: `${getProgressPercentage(weeklyTotals.calories, activeWeeklyGoal.target_calories * 7)}%` }}
                  />
                </div>
                <div className="text-xs mt-1 font-medium">
                  {getProgressPercentage(weeklyTotals.calories, activeWeeklyGoal.target_calories * 7) >= 100 ? (
                    <span className="text-emerald-600">✓ Goal Met</span>
                  ) : (
                    <span className="text-slate-500">{(activeWeeklyGoal.target_calories * 7) - Math.round(weeklyTotals.calories)} kcal left</span>
                  )}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700">{Math.round(weeklyTotals.protein)}g</div>
                <div className="text-sm text-slate-600">/ {activeWeeklyGoal.target_protein * 7}g</div>
                <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(getProgressPercentage(weeklyTotals.protein, activeWeeklyGoal.target_protein * 7))}`}
                    style={{ width: `${getProgressPercentage(weeklyTotals.protein, activeWeeklyGoal.target_protein * 7)}%` }}
                  />
                </div>
                <div className="text-xs mt-1 font-medium">
                  {getProgressPercentage(weeklyTotals.protein, activeWeeklyGoal.target_protein * 7) >= 100 ? (
                    <span className="text-emerald-600">✓ Goal Met</span>
                  ) : (
                    <span className="text-slate-500">{(activeWeeklyGoal.target_protein * 7) - Math.round(weeklyTotals.protein)}g left</span>
                  )}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-700">{Math.round(weeklyTotals.carbs)}g</div>
                <div className="text-sm text-slate-600">/ {activeWeeklyGoal.target_carbs * 7}g</div>
                <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(getProgressPercentage(weeklyTotals.carbs, activeWeeklyGoal.target_carbs * 7))}`}
                    style={{ width: `${getProgressPercentage(weeklyTotals.carbs, activeWeeklyGoal.target_carbs * 7)}%` }}
                  />
                </div>
                <div className="text-xs mt-1 font-medium">
                  {getProgressPercentage(weeklyTotals.carbs, activeWeeklyGoal.target_carbs * 7) >= 100 ? (
                    <span className="text-emerald-600">✓ Goal Met</span>
                  ) : (
                    <span className="text-slate-500">{(activeWeeklyGoal.target_carbs * 7) - Math.round(weeklyTotals.carbs)}g left</span>
                  )}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-rose-700">{Math.round(weeklyTotals.fat)}g</div>
                <div className="text-sm text-slate-600">/ {activeWeeklyGoal.target_fat * 7}g</div>
                <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(getProgressPercentage(weeklyTotals.fat, activeWeeklyGoal.target_fat * 7))}`}
                    style={{ width: `${getProgressPercentage(weeklyTotals.fat, activeWeeklyGoal.target_fat * 7)}%` }}
                  />
                </div>
                <div className="text-xs mt-1 font-medium">
                  {getProgressPercentage(weeklyTotals.fat, activeWeeklyGoal.target_fat * 7) >= 100 ? (
                    <span className="text-emerald-600">✓ Goal Met</span>
                  ) : (
                    <span className="text-slate-500">{(activeWeeklyGoal.target_fat * 7) - Math.round(weeklyTotals.fat)}g left</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Goal Achievement History */}
      {activeDailyGoal && dailyGoalStats && (
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                Daily Goal Achievement History
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={dailyGoalTimeRange} onValueChange={setDailyGoalTimeRange}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
                {dailyGoalTimeRange === 'custom' && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {dailyGoalDateRange.from && dailyGoalDateRange.to ? (
                          `${format(dailyGoalDateRange.from, 'MMM d')} - ${format(dailyGoalDateRange.to, 'MMM d')}`
                        ) : (
                          'Select dates'
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <div className="p-3 space-y-3">
                        <div>
                          <Label className="text-xs">From</Label>
                          <Calendar
                            mode="single"
                            selected={dailyGoalDateRange.from}
                            onSelect={(date) => setDailyGoalDateRange({ ...dailyGoalDateRange, from: date })}
                            disabled={(date) => date > new Date()}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">To</Label>
                          <Calendar
                            mode="single"
                            selected={dailyGoalDateRange.to}
                            onSelect={(date) => setDailyGoalDateRange({ ...dailyGoalDateRange, to: date })}
                            disabled={(date) => date > new Date() || date < dailyGoalDateRange.from}
                          />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <div className="text-3xl font-bold text-indigo-600">{dailyGoalStats.successRate}%</div>
                <div className="text-xs text-slate-600 mt-1">Success Rate</div>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <div className="text-3xl font-bold text-emerald-600">{dailyGoalStats.daysGoalsMet}</div>
                <div className="text-xs text-slate-600 mt-1">Days Goals Met</div>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <div className="text-3xl font-bold text-amber-600">{dailyGoalStats.daysTracked}</div>
                <div className="text-xs text-slate-600 mt-1">Days Tracked</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{dailyGoalStats.currentStreak}</div>
                <div className="text-xs text-slate-600 mt-1">Current Streak</div>
              </div>
            </div>

            {/* Calendar Heatmap */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Daily Achievement Calendar</h4>
              <div className="grid grid-cols-7 gap-2">
                {dailyGoalHistory.map((day, idx) => (
                  <div
                    key={idx}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative group cursor-pointer transition-all ${
                      !day.hasLogs
                        ? 'bg-slate-100 text-slate-400'
                        : day.allGoalsMet
                        ? 'bg-emerald-500 text-white'
                        : day.goalsMetCount >= 2
                        ? 'bg-amber-400 text-white'
                        : 'bg-rose-400 text-white'
                    }`}
                  >
                    <div className="font-semibold">{format(new Date(day.date), 'd')}</div>
                    {day.hasLogs && (
                      <div className="text-[8px]">{day.goalsMetCount}/4</div>
                    )}
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                      {day.displayDate}
                      {day.hasLogs ? (
                        <>
                          <br />
                          {day.allGoalsMet ? '✓ All goals met' : `${day.goalsMetCount}/4 goals met`}
                        </>
                      ) : (
                        <><br />No data</>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-600">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-slate-100" />
                  <span>No data</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-rose-400" />
                  <span>0-1 goals</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-amber-400" />
                  <span>2-3 goals</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-emerald-500" />
                  <span>All goals met</span>
                </div>
              </div>
            </div>

            {/* Recent Days Detail */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Recent Performance</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {dailyGoalHistory.slice(-7).reverse().map((day, idx) => {
                  if (!day.hasLogs) return null;
                  return (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-sm text-slate-900">{day.displayDate}</div>
                        <Badge variant={day.allGoalsMet ? 'default' : 'secondary'} className={day.allGoalsMet ? 'bg-emerald-500' : 'bg-amber-500'}>
                          {day.allGoalsMet ? '✓ All Goals Met' : `${day.goalsMetCount}/4 Goals`}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className={day.totals.calories >= activeDailyGoal.target_calories * 0.9 && day.totals.calories <= activeDailyGoal.target_calories * 1.1 ? 'text-emerald-600' : 'text-slate-500'}>
                          <div className="font-medium">{Math.round(day.totals.calories)}</div>
                          <div>/ {activeDailyGoal.target_calories} kcal</div>
                        </div>
                        <div className={day.totals.protein >= activeDailyGoal.target_protein * 0.9 ? 'text-emerald-600' : 'text-slate-500'}>
                          <div className="font-medium">{Math.round(day.totals.protein)}g</div>
                          <div>/ {activeDailyGoal.target_protein}g P</div>
                        </div>
                        <div className={day.totals.carbs >= activeDailyGoal.target_carbs * 0.9 && day.totals.carbs <= activeDailyGoal.target_carbs * 1.1 ? 'text-emerald-600' : 'text-slate-500'}>
                          <div className="font-medium">{Math.round(day.totals.carbs)}g</div>
                          <div>/ {activeDailyGoal.target_carbs}g C</div>
                        </div>
                        <div className={day.totals.fat >= activeDailyGoal.target_fat * 0.9 && day.totals.fat <= activeDailyGoal.target_fat * 1.1 ? 'text-emerald-600' : 'text-slate-500'}>
                          <div className="font-medium">{Math.round(day.totals.fat)}g</div>
                          <div>/ {activeDailyGoal.target_fat}g F</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Goal Achievement History */}
      {activeWeeklyGoal && weeklyGoalStats && (
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" />
                Weekly Goal Achievement History
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={weeklyGoalTimeRange} onValueChange={setWeeklyGoalTimeRange}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last 4 Weeks</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
                {weeklyGoalTimeRange === 'custom' && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {weeklyGoalDateRange.from && weeklyGoalDateRange.to ? (
                          `${format(weeklyGoalDateRange.from, 'MMM d')} - ${format(weeklyGoalDateRange.to, 'MMM d')}`
                        ) : (
                          'Select dates'
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <div className="p-3 space-y-3">
                        <div>
                          <Label className="text-xs">From</Label>
                          <Calendar
                            mode="single"
                            selected={weeklyGoalDateRange.from}
                            onSelect={(date) => setWeeklyGoalDateRange({ ...weeklyGoalDateRange, from: date })}
                            disabled={(date) => date > new Date()}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">To</Label>
                          <Calendar
                            mode="single"
                            selected={weeklyGoalDateRange.to}
                            onSelect={(date) => setWeeklyGoalDateRange({ ...weeklyGoalDateRange, to: date })}
                            disabled={(date) => date > new Date() || date < weeklyGoalDateRange.from}
                          />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{weeklyGoalStats.successRate}%</div>
                <div className="text-xs text-slate-600 mt-1">Success Rate</div>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <div className="text-3xl font-bold text-emerald-600">{weeklyGoalStats.weeksGoalsMet}</div>
                <div className="text-xs text-slate-600 mt-1">Weeks Goals Met</div>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <div className="text-3xl font-bold text-amber-600">{weeklyGoalStats.weeksTracked}</div>
                <div className="text-xs text-slate-600 mt-1">Weeks Tracked</div>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <div className="text-3xl font-bold text-indigo-600">{weeklyGoalStats.currentStreak}</div>
                <div className="text-xs text-slate-600 mt-1">Current Streak</div>
              </div>
            </div>

            {/* Weekly Performance */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Weekly Performance</h4>
              <div className="space-y-3">
                {weeklyGoalHistory.slice(-6).reverse().map((week, idx) => {
                  if (!week.hasLogs) return null;
                  return (
                    <div key={idx} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-medium text-sm text-slate-900">{week.displayDate}</div>
                        <Badge variant={week.allGoalsMet ? 'default' : 'secondary'} className={week.allGoalsMet ? 'bg-emerald-500' : 'bg-amber-500'}>
                          {week.allGoalsMet ? '✓ All Goals Met' : `${week.goalsMetCount}/4 Goals`}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        <div className={week.totals.calories >= week.weekTarget.calories * 0.9 && week.totals.calories <= week.weekTarget.calories * 1.1 ? 'text-emerald-600' : 'text-slate-500'}>
                          <div className="text-xs mb-1">Calories</div>
                          <div className="font-semibold">{Math.round(week.totals.calories)}</div>
                          <div className="text-xs">/ {week.weekTarget.calories}</div>
                        </div>
                        <div className={week.totals.protein >= week.weekTarget.protein * 0.9 ? 'text-emerald-600' : 'text-slate-500'}>
                          <div className="text-xs mb-1">Protein</div>
                          <div className="font-semibold">{Math.round(week.totals.protein)}g</div>
                          <div className="text-xs">/ {week.weekTarget.protein}g</div>
                        </div>
                        <div className={week.totals.carbs >= week.weekTarget.carbs * 0.9 && week.totals.carbs <= week.weekTarget.carbs * 1.1 ? 'text-emerald-600' : 'text-slate-500'}>
                          <div className="text-xs mb-1">Carbs</div>
                          <div className="font-semibold">{Math.round(week.totals.carbs)}g</div>
                          <div className="text-xs">/ {week.weekTarget.carbs}g</div>
                        </div>
                        <div className={week.totals.fat >= week.weekTarget.fat * 0.9 && week.totals.fat <= week.weekTarget.fat * 1.1 ? 'text-emerald-600' : 'text-slate-500'}>
                          <div className="text-xs mb-1">Fat</div>
                          <div className="font-semibold">{Math.round(week.totals.fat)}g</div>
                          <div className="text-xs">/ {week.weekTarget.fat}g</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Goals Display */}
      {(activeDailyGoal || activeWeeklyGoal) && (
        <div className="grid md:grid-cols-2 gap-4">
          {activeDailyGoal && (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-emerald-900">
                    <Target className="w-5 h-5" />
                    Active Daily Goal
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => handleEditGoal(activeDailyGoal)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <div className="text-xl font-bold text-emerald-900">{activeDailyGoal.target_calories}</div>
                    <div className="text-xs text-emerald-700">Calories</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-emerald-900">{activeDailyGoal.target_protein}g</div>
                    <div className="text-xs text-emerald-700">Protein</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-emerald-900">{activeDailyGoal.target_carbs}g</div>
                    <div className="text-xs text-emerald-700">Carbs</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-emerald-900">{activeDailyGoal.target_fat}g</div>
                    <div className="text-xs text-emerald-700">Fat</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeWeeklyGoal && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-purple-900">
                    <CalendarIcon className="w-5 h-5" />
                    Active Weekly Goal
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => handleEditGoal(activeWeeklyGoal)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <div className="text-xl font-bold text-purple-900">{activeWeeklyGoal.target_calories}</div>
                    <div className="text-xs text-purple-700">Calories/day</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-purple-900">{activeWeeklyGoal.target_protein}g</div>
                    <div className="text-xs text-purple-700">Protein/day</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-purple-900">{activeWeeklyGoal.target_carbs}g</div>
                    <div className="text-xs text-purple-700">Carbs/day</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-purple-900">{activeWeeklyGoal.target_fat}g</div>
                    <div className="text-xs text-purple-700">Fat/day</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Set Goal Dialog */}
      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Edit Goal' : 'Set Nutrition Goals'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Goal Type</Label>
              <Select value={goalForm.goal_type} onValueChange={(v) => setGoalForm({ ...goalForm, goal_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily Goal</SelectItem>
                  <SelectItem value="weekly">Weekly Goal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Calories</Label>
                <Input
                  type="number"
                  value={goalForm.target_calories}
                  onChange={(e) => setGoalForm({ ...goalForm, target_calories: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Protein (g)</Label>
                <Input
                  type="number"
                  value={goalForm.target_protein}
                  onChange={(e) => setGoalForm({ ...goalForm, target_protein: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Carbs (g)</Label>
                <Input
                  type="number"
                  value={goalForm.target_carbs}
                  onChange={(e) => setGoalForm({ ...goalForm, target_carbs: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Fat (g)</Label>
                <Input
                  type="number"
                  value={goalForm.target_fat}
                  onChange={(e) => setGoalForm({ ...goalForm, target_fat: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <MicronutrientTargetSelector
              targets={goalForm.target_micronutrients || {}}
              onChange={(newTargets) => setGoalForm({ ...goalForm, target_micronutrients: newTargets })}
            />
            <Button onClick={handleSaveGoal} className="w-full" disabled={createGoalMutation.isPending || updateGoalMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {editingGoal ? 'Update Goal' : 'Save Goal'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recipe Builder Dialog */}
      <Dialog open={recipeBuilderOpen} onOpenChange={setRecipeBuilderOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Recipe Builder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Enter Ingredients</Label>
              <textarea
                className="w-full min-h-[120px] p-3 border rounded-lg text-sm"
                placeholder="e.g.,&#10;2 chicken breasts&#10;1 cup rice&#10;2 tbsp olive oil&#10;1 cup broccoli&#10;Salt and pepper"
                value={recipeIngredients}
                onChange={(e) => setRecipeIngredients(e.target.value)}
              />
            </div>
            <Button
              onClick={handleGenerateNutrition}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
              disabled={isGeneratingNutrition}
            >
              {isGeneratingNutrition ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Calculating Nutrition...
                </>
              ) : (
                <>
                  <ChefHat className="w-4 h-4 mr-2" />
                  Generate Nutrition Info
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Log Meal Dialog */}
      <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Meal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Quick Add Options */}
            <Tabs value={logMethod} onValueChange={setLogMethod}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="manual">Manual</TabsTrigger>
                <TabsTrigger value="database">Database</TabsTrigger>
                <TabsTrigger value="photo">Photo</TabsTrigger>
                <TabsTrigger value="plan">From Plan</TabsTrigger>
              </TabsList>

              <TabsContent value="database" className="space-y-3">
                <FoodDatabaseSearch onSelectFood={handleSelectFoodFromDatabase} />
              </TabsContent>

              <TabsContent value="photo" className="space-y-3">
                <p className="text-sm text-slate-600 text-center py-4">
                  Use the Photo Log button above, or take a photo here to analyze your meal.
                </p>
              </TabsContent>

              <TabsContent value="plan" className="space-y-3">
                <div>
                  <Label>Select from Meal Plans</Label>
                  {mealPlans.length === 0 ? (
                    <p className="text-sm text-slate-500 mt-2">No meal plans found</p>
                  ) : (
                    mealPlans.map(plan => (
                      <div key={plan.id} className="mt-2 p-3 border rounded-lg">
                        <p className="font-medium text-sm mb-2">{plan.name}</p>
                        <div className="space-y-1">
                          {plan.days?.slice(0, 2).map(day => (
                            <div key={day.day} className="text-xs">
                              <p className="font-medium text-slate-700">{day.day}:</p>
                              <div className="grid grid-cols-2 gap-1 ml-2">
                                {['breakfast', 'lunch', 'dinner', 'snacks'].map(mealType => {
                                  const meal = day[mealType];
                                  if (!meal?.name) return null;
                                  return (
                                    <button
                                      key={mealType}
                                      onClick={() => handleSelectFromMealPlan(plan.id, day.day, mealType)}
                                      className="text-left text-slate-600 hover:text-indigo-600 hover:underline"
                                    >
                                      {meal.name}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div>
              <Label>Select from Favorites (Optional)</Label>
              <Select onValueChange={handleSelectMeal}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a saved meal..." />
                </SelectTrigger>
                <SelectContent>
                  {favoriteMeals.map(meal => (
                    <SelectItem key={meal.id} value={meal.id}>{meal.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Recipe/Meal Name *</Label>
              <Input
                placeholder="e.g., Chicken Salad"
                value={logForm.recipe_name}
                onChange={(e) => setLogForm({ ...logForm, recipe_name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Meal Type</Label>
                <Select value={logForm.meal_type} onValueChange={(v) => setLogForm({ ...logForm, meal_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={logForm.log_date}
                  onChange={(e) => setLogForm({ ...logForm, log_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Calories *</Label>
                <Input
                  type="number"
                  value={logForm.calories}
                  onChange={(e) => setLogForm({ ...logForm, calories: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Servings</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={logForm.servings}
                  onChange={(e) => setLogForm({ ...logForm, servings: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Protein (g)</Label>
                <Input
                  type="number"
                  value={logForm.protein}
                  onChange={(e) => setLogForm({ ...logForm, protein: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Carbs (g)</Label>
                <Input
                  type="number"
                  value={logForm.carbs}
                  onChange={(e) => setLogForm({ ...logForm, carbs: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Fat (g)</Label>
                <Input
                  type="number"
                  value={logForm.fat}
                  onChange={(e) => setLogForm({ ...logForm, fat: parseInt(e.target.value) })}
                />
              </div>
            </div>

            {/* Micronutrient Display */}
            {logForm.micronutrients && Object.keys(logForm.micronutrients).length > 0 && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <Label className="text-xs text-emerald-900 mb-2 block">Micronutrients Tracked</Label>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(logForm.micronutrients).map(([nutrient, data]) => (
                    <Badge key={nutrient} variant="secondary" className="text-xs">
                      {nutrient}: {data.value}{data.unit}
                    </Badge>
                  ))}
                </div>
                {logForm.food_source !== 'manual' && (
                  <p className="text-xs text-emerald-700 mt-2">
                    Data from {logForm.food_source === 'usda' ? 'USDA FoodData Central' : 'Open Food Facts'}
                  </p>
                )}
              </div>
            )}

            <Button
              onClick={() => createLogMutation.mutate(logForm)}
              className="w-full"
              disabled={!logForm.recipe_name || !logForm.calories || createLogMutation.isPending}
            >
              <Plus className="w-4 h-4 mr-2" />
              Log Meal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Progress Dialog */}
      <ShareProgressDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        logs={logs}
      />

      {/* Food Photo Review Dialog */}
      {photoReviewOpen && photoToReview && (
        <FoodPhotoReview
          photo={photoToReview}
          mealType={logForm.meal_type}
          logDate={logForm.log_date}
          onSuccess={() => {
            setPhotoReviewOpen(false);
            setPhotoToReview(null);
            queryClient.invalidateQueries({ queryKey: ['nutritionLogs'] });
            toast.success('Meal logged from photo!');
          }}
          onCancel={() => {
            setPhotoReviewOpen(false);
            setPhotoToReview(null);
            setIsAnalyzingPhoto(false);
          }}
        />
      )}

      {/* Voice Transcription Review Dialog */}
      {voiceReviewOpen && voiceTranscript && (
        <VoiceTranscriptionReview
          transcript={voiceTranscript}
          mealType={logForm.meal_type}
          logDate={logForm.log_date}
          onSuccess={() => {
            setVoiceReviewOpen(false);
            setVoiceTranscript(null);
            queryClient.invalidateQueries({ queryKey: ['nutritionLogs'] });
            toast.success('Meal logged from voice!');
          }}
          onCancel={() => {
            setVoiceReviewOpen(false);
            setVoiceTranscript(null);
          }}
        />
      )}
    </div>
  );
}