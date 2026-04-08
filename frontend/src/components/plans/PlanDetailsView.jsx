import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Flame, Pill, ChefHat, Download, Share2, ShoppingCart, DollarSign, Plus, Loader2, ArrowLeftRight, TrendingUp, Heart, RefreshCw, Sparkles, Clock, Wrench, Utensils, X, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import MealCard from '../meals/MealCard';
import SharePlanDialog from '../share/SharePlanDialog';
import ShareMealDialog from '../share/ShareMealDialog';
import WeeklyCalendarView from './WeeklyCalendarView';

const mealIcons = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snacks: '🍎'
};

const groceryCategories = ['Proteins', 'Vegetables', 'Fruits', 'Grains', 'Dairy/Alternatives', 'Other'];

export default function PlanDetailsView({ plan, open, onOpenChange, mealKitOffer }) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [groceryList, setGroceryList] = useState(null);
  const [editingPrice, setEditingPrice] = useState(null);
  const [addingItem, setAddingItem] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'detailed'
  const [localDays, setLocalDays] = useState(null);
  const [regeneratingMeal, setRegeneratingMeal] = useState(null);
  const [regeneratingDay, setRegeneratingDay] = useState(null);
  const [regeneratingImage, setRegeneratingImage] = useState(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareMealDialogOpen, setShareMealDialogOpen] = useState(false);
  const [mealToShare, setMealToShare] = useState(null);
  const [mealTypeToShare, setMealTypeToShare] = useState(null);
  const [showAddRecipeDialog, setShowAddRecipeDialog] = useState(false);
  const [addRecipeTarget, setAddRecipeTarget] = useState(null);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState('');
  const [adjustmentDetails, setAdjustmentDetails] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [showCalendarView, setShowCalendarView] = useState(true);

  const queryClient = useQueryClient();

  // Load user's latest biomarkers to show meal-biomarker connections
  const { data: latestLab } = useQuery({
    queryKey: ['latestLab'],
    queryFn:  async () => {
      const labs = await base44.entities.LabResult.list();
      return labs?.[0] || null;
    },
    retry: false,
  });
  const userBiomarkers = latestLab?.biomarkers || {};


  const { data: favoriteMeals = [] } = useQuery({
    queryKey: ['favoriteMeals'],
    queryFn: () => base44.entities.FavoriteMeal.list('-created_date'),
  });

  const { data: sharedRecipes = [] } = useQuery({
    queryKey: ['sharedRecipes'],
    queryFn: () => base44.entities.SharedRecipe.list('-created_date'),
  });

  React.useEffect(() => {
    if (plan?.days) {
      // Ensure we only show the correct number of days (max 7 for a week)
      setLocalDays(plan.days.slice(0, 7));
    }
  }, [plan]);

  React.useEffect(() => {
    if (plan?.grocery_list) {
      setGroceryList(plan.grocery_list);
    } else if (plan?.days) {
      // Generate from meals if not saved
      const items = new Set();
      plan.days.forEach(day => {
        ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(meal => {
          if (day[meal]?.name) {
            const words = day[meal].name.split(/[\s,]+/);
            words.forEach(word => {
              const cleaned = word.toLowerCase();
              if (cleaned.length > 3 && !['with', 'and', 'the'].includes(cleaned)) {
                items.add(word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
              }
            });
          }
        });
      });

      const categorized = {};
      groceryCategories.forEach(cat => categorized[cat] = []);
      
      const proteinKeywords = ['chicken', 'beef', 'salmon', 'fish', 'liver', 'turkey', 'pork', 'lamb', 'egg', 'tofu', 'cod', 'trout', 'mackerel', 'tuna', 'shrimp'];
      const vegKeywords = ['spinach', 'broccoli', 'carrot', 'asparagus', 'onion', 'garlic', 'pepper', 'tomato', 'lettuce', 'kale', 'cabbage', 'zucchini', 'mushroom', 'artichoke', 'brussels'];
      const grainKeywords = ['rice', 'quinoa', 'oat', 'bread', 'pasta', 'tortilla', 'barley'];
      const dairyKeywords = ['yogurt', 'cheese', 'milk', 'cream', 'butter'];
      const fruitKeywords = ['berry', 'berries', 'apple', 'banana', 'orange', 'lemon', 'avocado'];

      // Group items by category and deduplicate
      const itemsByCategory = {};
      items.forEach(item => {
        const lowerItem = item.toLowerCase();
        let targetCategory = 'Other';
        
        if (proteinKeywords.some(k => lowerItem.includes(k))) targetCategory = 'Proteins';
        else if (vegKeywords.some(k => lowerItem.includes(k))) targetCategory = 'Vegetables';
        else if (fruitKeywords.some(k => lowerItem.includes(k))) targetCategory = 'Fruits';
        else if (grainKeywords.some(k => lowerItem.includes(k))) targetCategory = 'Grains';
        else if (dairyKeywords.some(k => lowerItem.includes(k))) targetCategory = 'Dairy/Alternatives';
        
        if (!itemsByCategory[targetCategory]) {
          itemsByCategory[targetCategory] = {};
        }
        
        // Deduplicate by item name
        if (itemsByCategory[targetCategory][item]) {
          itemsByCategory[targetCategory][item].quantity += 1;
        } else {
          itemsByCategory[targetCategory][item] = { name: item, price: null, quantity: 1 };
        }
      });

      // Convert to array format
      Object.keys(categorized).forEach(category => {
        if (itemsByCategory[category]) {
          categorized[category] = Object.values(itemsByCategory[category]);
        }
      });

      setGroceryList(categorized);
    }
  }, [plan]);

  const updatePlanMutation = useMutation({
    mutationFn: (data) => base44.entities.MealPlan.update(plan.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      toast.success('Grocery list updated');
    },
  });

  const saveGroceryList = () => {
    if (!groceryList) return;
    
    const currentTotal = Object.values(groceryList)
      .flat()
      .reduce((sum, item) => sum + (item.price || 0), 0);

    updatePlanMutation.mutate({
      grocery_list: groceryList,
      current_total_cost: currentTotal
    });
  };

  const fetchItemPrice = async (itemName, category) => {
    setIsFetchingPrice(true);
    try {
      const priceData = await base44.integrations.Core.InvokeLLM({
        prompt: `Get current average grocery price in USD for: ${itemName}. Return approximate cost per typical package/unit from major US grocery stores.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            price: { type: "number" },
            unit: { type: "string" }
          }
        }
      });

      if (priceData?.price) {
        setGroceryList(prev => ({
          ...prev,
          [category]: prev[category].map(item => 
            item.name === itemName 
              ? { ...item, price: priceData.price, unit: priceData.unit }
              : item
          )
        }));
        saveGroceryList();
      }
    } catch (error) {
      toast.error('Failed to fetch price');
    } finally {
      setIsFetchingPrice(false);
    }
  };

  const addCustomItem = (category) => {
    if (!newItemName.trim()) return;
    
    setGroceryList(prev => ({
      ...prev,
      [category]: [...(prev[category] || []), { name: newItemName, price: null, unit: '', quantity: 1 }]
    }));
    setNewItemName('');
    setAddingItem(null);
    saveGroceryList();
  };

  const removeGroceryItem = (category, idx) => {
    setGroceryList(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== idx)
    }));
    saveGroceryList();
  };

  const handleAddRecipe = async (recipeId, source) => {
    if (!addRecipeTarget) return;
    
    const { dayIndex, mealType } = addRecipeTarget;
    
    let recipeData;
    if (source === 'favorite') {
      const recipe = favoriteMeals.find(r => r.id === recipeId);
      if (!recipe) return;
      
      recipeData = {
        name: recipe.name,
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
        nutrients: recipe.nutrients,
        prepTip: recipe.prepTip,
        prepSteps: recipe.prepSteps,
        prepTime: recipe.prepTime,
        difficulty: recipe.difficulty,
        equipment: recipe.equipment,
        healthBenefit: recipe.healthBenefit,
        imageUrl: recipe.imageUrl
      };
    } else {
      const recipe = sharedRecipes.find(r => r.id === recipeId);
      if (!recipe) return;
      
      recipeData = {
        name: recipe.name,
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
        nutrients: recipe.meal_data?.nutrients || '',
        prepTip: recipe.description,
        prepSteps: recipe.prep_steps || [],
        prepTime: recipe.prep_time,
        difficulty: recipe.difficulty,
        equipment: recipe.meal_data?.equipment || [],
        healthBenefit: recipe.meal_data?.health_benefits || '',
        imageUrl: recipe.image_url
      };
    }
    
    const updatedDays = [...localDays];
    updatedDays[dayIndex][mealType] = recipeData;
    
    try {
      await base44.entities.MealPlan.update(plan.id, { days: updatedDays });
      setLocalDays(updatedDays);
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      toast.success('Recipe added to meal plan!');
      setShowAddRecipeDialog(false);
      setAddRecipeTarget(null);
    } catch (error) {
      toast.error('Failed to add recipe');
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination || !localDays) return;

    const { source, destination } = result;
    
    // Parse the droppableId format: "day-{dayIndex}-{mealType}"
    const sourceDay = parseInt(source.droppableId.split('-')[1]);
    const sourceMeal = source.droppableId.split('-')[2];
    const destDay = parseInt(destination.droppableId.split('-')[1]);
    const destMeal = destination.droppableId.split('-')[2];

    const newDays = [...localDays];
    const sourceMealData = { ...newDays[sourceDay][sourceMeal] };
    const destMealData = { ...newDays[destDay][destMeal] };

    // Swap meals
    newDays[sourceDay][sourceMeal] = destMealData;
    newDays[destDay][destMeal] = sourceMealData;

    setLocalDays(newDays);
    
    // Save to backend
    updatePlanMutation.mutate({ days: newDays });
    toast.success('Meals swapped successfully');
  };

  const calculateTotalNutrition = () => {
    if (!localDays) return null;
    
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let mealCount = 0;

    localDays.forEach(day => {
      ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealType => {
        const meal = day[mealType];
        if (meal) {
          // Parse calories from string like "400 kcal"
          const caloriesMatch = meal.calories?.match(/(\d+)/);
          if (caloriesMatch) {
            totalCalories += parseInt(caloriesMatch[1]);
            mealCount++;
          }
          if (meal.protein) totalProtein += meal.protein;
          if (meal.carbs) totalCarbs += meal.carbs;
          if (meal.fat) totalFat += meal.fat;
        }
      });
    });

    return {
      totalCalories,
      avgCalories: mealCount > 0 ? Math.round(totalCalories / localDays.length) : 0,
      totalProtein: Math.round(totalProtein),
      totalCarbs: Math.round(totalCarbs),
      totalFat: Math.round(totalFat),
      avgProtein: localDays.length > 0 ? Math.round(totalProtein / localDays.length) : 0,
      avgCarbs: localDays.length > 0 ? Math.round(totalCarbs / localDays.length) : 0,
      avgFat: localDays.length > 0 ? Math.round(totalFat / localDays.length) : 0,
    };
  };

  const nutritionStats = calculateTotalNutrition();

  const isMealFavorited = (meal, mealType) => {
    return favoriteMeals.some(fav => 
      fav.name === meal.name && fav.meal_type === mealType
    );
  };

  const toggleMealFavorite = async (meal, mealType) => {
    const existingFavorite = favoriteMeals.find(fav => 
      fav.name === meal.name && fav.meal_type === mealType
    );

    try {
      if (existingFavorite) {
        // Remove from favorites
        await base44.entities.FavoriteMeal.delete(existingFavorite.id);
        queryClient.invalidateQueries({ queryKey: ['favoriteMeals'] });
        toast.success('Removed from favorites');
      } else {
        // Add to favorites
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
          prepSteps: meal.prepSteps || [],
          difficulty: meal.difficulty,
          equipment: meal.equipment || [],
          healthBenefit: meal.healthBenefit,
          imageUrl: meal.imageUrl,
          source_type: 'meal_plan',
          source_meal_plan_id: plan.id,
          source_meal_plan_name: plan.name,
        });
        queryClient.invalidateQueries({ queryKey: ['favoriteMeals'] });
        toast.success('Saved to favorites!');
      }
    } catch (error) {
      toast.error('Failed to update favorites');
    }
  };

  const handleShareMeal = (meal, mealType) => {
    setMealToShare(meal);
    setMealTypeToShare(mealType);
    setShareMealDialogOpen(true);
  };

  const regenerateMeal = async (dayIndex, mealType) => {
    setRegeneratingMeal(`${dayIndex}-${mealType}`);
    try {
      const currentMeal = localDays[dayIndex][mealType];
      const prompt = `Generate a single ${mealType} meal that is different from "${currentMeal?.name}". 
      It should be healthy, nutritious, and include calorie count, macros (protein, carbs, fat in grams), 
      health benefits, and preparation tips. Make it suitable for the same diet type.`;

      const newMeal = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            calories: { type: "string" },
            protein: { type: "number" },
            carbs: { type: "number" },
            fat: { type: "number" },
            nutrients: { type: "string" },
            prepTip: { type: "string" }
          }
        }
      });

      const newDays = [...localDays];
      newDays[dayIndex][mealType] = newMeal;
      setLocalDays(newDays);
      updatePlanMutation.mutate({ days: newDays });
      toast.success('Meal regenerated!');
    } catch (error) {
      toast.error('Failed to regenerate meal');
    } finally {
      setRegeneratingMeal(null);
    }
  };

  const regenerateMealImage = async (dayIndex, mealType) => {
    const meal = localDays[dayIndex][mealType];
    if (!meal?.name) return;
    
    setRegeneratingImage(`${dayIndex}-${mealType}`);
    
    try {
      const culturalContext = plan.cultural_style && plan.cultural_style !== 'none' ? `${plan.cultural_style} style ` : '';
      const result = await base44.integrations.Core.GenerateImage({
        prompt: `Professional food photography of ${culturalContext}${meal.name}, appetizing presentation, natural lighting, high quality, restaurant style plating`
      });
      
      if (result?.url) {
        const newDays = [...localDays];
        newDays[dayIndex][mealType].imageUrl = result.url;
        newDays[dayIndex][mealType].imageError = false;
        setLocalDays(newDays);
        updatePlanMutation.mutate({ days: newDays });
        toast.success('Image regenerated');
      }
    } catch (error) {
      toast.error('Failed to generate image');
      const newDays = [...localDays];
      newDays[dayIndex][mealType].imageError = true;
      setLocalDays(newDays);
    } finally {
      setRegeneratingImage(null);
    }
  };

  const handleAdjustPlan = async () => {
    if (!adjustmentDetails.trim()) {
      toast.error('Please provide adjustment details');
      return;
    }

    setIsAdjusting(true);
    try {
      let prompt = '';
      const currentPlanContext = JSON.stringify({
        name: plan.name,
        days: localDays,
        macros: plan.macros,
        budget: plan.estimated_cost,
        preferences: plan.preferences
      });

      switch (adjustmentType) {
        case 'nutrients':
          prompt = `Adjust this meal plan to optimize for specific nutrients: ${adjustmentDetails}
          Current plan: ${currentPlanContext}
          
          Modify the existing meals or suggest new ones to better meet the nutrient targets while maintaining similar calorie counts and variety.
          Return the full adjusted meal plan with all ${localDays.length} days.`;
          break;

        case 'budget':
          prompt = `Adjust this meal plan to fit the budget constraint: ${adjustmentDetails}
          Current plan: ${currentPlanContext}
          
          Suggest cost-effective substitutions and adjustments to reduce the total cost while maintaining nutritional quality.
          Return the full adjusted meal plan with all ${localDays.length} days.`;
          break;

        case 'substitutions':
          prompt = `Make substitutions in this meal plan based on: ${adjustmentDetails}
          Current plan: ${currentPlanContext}
          
          Replace the specified meals or ingredients with suitable alternatives that match the dietary requirements and preferences.
          Return the full adjusted meal plan with all ${localDays.length} days.`;
          break;

        case 'feedback':
          prompt = `Adjust this meal plan based on user feedback: ${adjustmentDetails}
          Current plan: ${currentPlanContext}
          
          Make appropriate modifications to address the feedback while maintaining the plan's overall structure and nutritional goals.
          Return the full adjusted meal plan with all ${localDays.length} days.`;
          break;

        default:
          toast.error('Invalid adjustment type');
          return;
      }

      const adjustedPlan = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            days: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "string" },
                  breakfast: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      calories: { type: "string" },
                      protein: { type: "number" },
                      carbs: { type: "number" },
                      fat: { type: "number" },
                      nutrients: { type: "string" },
                      prepTip: { type: "string" },
                      prepSteps: { type: "array", items: { type: "string" } },
                      prepTime: { type: "string" },
                      difficulty: { type: "string" },
                      equipment: { type: "array", items: { type: "string" } },
                      healthBenefit: { type: "string" }
                    }
                  },
                  lunch: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      calories: { type: "string" },
                      protein: { type: "number" },
                      carbs: { type: "number" },
                      fat: { type: "number" },
                      nutrients: { type: "string" },
                      prepTip: { type: "string" },
                      prepSteps: { type: "array", items: { type: "string" } },
                      prepTime: { type: "string" },
                      difficulty: { type: "string" },
                      equipment: { type: "array", items: { type: "string" } },
                      healthBenefit: { type: "string" }
                    }
                  },
                  dinner: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      calories: { type: "string" },
                      protein: { type: "number" },
                      carbs: { type: "number" },
                      fat: { type: "number" },
                      nutrients: { type: "string" },
                      prepTip: { type: "string" },
                      prepSteps: { type: "array", items: { type: "string" } },
                      prepTime: { type: "string" },
                      difficulty: { type: "string" },
                      equipment: { type: "array", items: { type: "string" } },
                      healthBenefit: { type: "string" }
                    }
                  },
                  snacks: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      calories: { type: "string" },
                      protein: { type: "number" },
                      carbs: { type: "number" },
                      fat: { type: "number" },
                      nutrients: { type: "string" },
                      prepTip: { type: "string" },
                      prepSteps: { type: "array", items: { type: "string" } },
                      prepTime: { type: "string" },
                      difficulty: { type: "string" },
                      equipment: { type: "array", items: { type: "string" } },
                      healthBenefit: { type: "string" }
                    }
                  }
                }
              }
            },
            adjustment_summary: { type: "string" }
          }
        }
      });

      if (adjustedPlan?.days) {
        setLocalDays(adjustedPlan.days);
        await updatePlanMutation.mutateAsync({ days: adjustedPlan.days });
        toast.success(adjustedPlan.adjustment_summary || 'Plan adjusted successfully!');
        setShowAdjustDialog(false);
        setAdjustmentDetails('');
      }
    } catch (error) {
      toast.error('Failed to adjust plan');
      console.error(error);
    } finally {
      setIsAdjusting(false);
    }
  };

  const regenerateDay = async (dayIndex) => {
    setRegeneratingDay(dayIndex);
    try {
      const prompt = `Generate a full day of meals (breakfast, lunch, dinner, snacks) that are healthy and nutritious. 
      Each meal should include: name, calories (as string like "400 kcal"), protein/carbs/fat in grams, 
      health benefits (nutrients field), and preparation tips (prepTip field).`;

      const newDay = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            breakfast: {
              type: "object",
              properties: {
                name: { type: "string" },
                calories: { type: "string" },
                protein: { type: "number" },
                carbs: { type: "number" },
                fat: { type: "number" },
                nutrients: { type: "string" },
                prepTip: { type: "string" }
              }
            },
            lunch: {
              type: "object",
              properties: {
                name: { type: "string" },
                calories: { type: "string" },
                protein: { type: "number" },
                carbs: { type: "number" },
                fat: { type: "number" },
                nutrients: { type: "string" },
                prepTip: { type: "string" }
              }
            },
            dinner: {
              type: "object",
              properties: {
                name: { type: "string" },
                calories: { type: "string" },
                protein: { type: "number" },
                carbs: { type: "number" },
                fat: { type: "number" },
                nutrients: { type: "string" },
                prepTip: { type: "string" }
              }
            },
            snacks: {
              type: "object",
              properties: {
                name: { type: "string" },
                calories: { type: "string" },
                protein: { type: "number" },
                carbs: { type: "number" },
                fat: { type: "number" },
                nutrients: { type: "string" },
                prepTip: { type: "string" }
              }
            }
          }
        }
      });

      const newDays = [...localDays];
      newDays[dayIndex] = {
        day: newDays[dayIndex].day,
        ...newDay
      };
      setLocalDays(newDays);
      updatePlanMutation.mutate({ days: newDays });
      toast.success('Day regenerated!');
    } catch (error) {
      toast.error('Failed to regenerate day');
    } finally {
      setRegeneratingDay(null);
    }
  };

  if (!plan) return null;

  const dietColors = {
    'liver-centric': 'bg-rose-100 text-rose-700 border-rose-200',
    'low-sugar': 'bg-amber-100 text-amber-700 border-amber-200',
    'vegetarian': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'custom': 'bg-purple-100 text-purple-700 border-purple-200',
  };

  const culturalEmojis = {
    mediterranean: '🫒',
    asian: '🍜',
    indian: '🍛',
    latin_american: '🌮',
    african: '🥘',
    middle_eastern: '🧆',
    european: '🥖',
    fusion: '✨',
    none: '🌍'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl mb-2">{plan.name}</DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className={`${dietColors[plan.diet_type]} border capitalize`}>
                  {plan.diet_type?.replace(/-/g, ' ')}
                </Badge>
                {plan.cultural_style && plan.cultural_style !== 'none' && (
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 border-indigo-200 capitalize">
                    {culturalEmojis[plan.cultural_style]} {plan.cultural_style?.replace(/_/g, ' ')}
                  </Badge>
                )}
                {plan.life_stage && plan.life_stage !== 'general' && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200 capitalize">
                    {plan.life_stage}
                  </Badge>
                )}
                <span className="text-sm text-slate-500">
                  {plan.days?.length || 0} days
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="default" 
                size="sm" 
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                onClick={() => setShowAdjustDialog(true)}
              >
                <Wand2 className="w-4 h-4 mr-2" />
                AI Adjust
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShareDialogOpen(true)}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="meals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="meals">Meal Plan</TabsTrigger>
            <TabsTrigger value="grocery">Grocery List</TabsTrigger>
          </TabsList>

          <TabsContent value="meals" className="space-y-6">
            {/* Nutrition Summary */}
            {nutritionStats && (
              <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-semibold text-indigo-900">Plan Nutrition Overview</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white/80 rounded-lg p-3 text-center">
                      <div className="text-xs text-slate-600 mb-1">Total Calories</div>
                      <div className="text-xl font-bold text-slate-900">{nutritionStats.totalCalories}</div>
                      <div className="text-[10px] text-slate-500">~{nutritionStats.avgCalories}/day</div>
                    </div>
                    <div className="bg-white/80 rounded-lg p-3 text-center">
                      <div className="text-xs text-blue-600 mb-1">Protein</div>
                      <div className="text-xl font-bold text-blue-700">{nutritionStats.totalProtein}g</div>
                      <div className="text-[10px] text-slate-500">~{nutritionStats.avgProtein}g/day</div>
                    </div>
                    <div className="bg-white/80 rounded-lg p-3 text-center">
                      <div className="text-xs text-amber-600 mb-1">Carbs</div>
                      <div className="text-xl font-bold text-amber-700">{nutritionStats.totalCarbs}g</div>
                      <div className="text-[10px] text-slate-500">~{nutritionStats.avgCarbs}g/day</div>
                    </div>
                    <div className="bg-white/80 rounded-lg p-3 text-center">
                      <div className="text-xs text-rose-600 mb-1">Fat</div>
                      <div className="text-xl font-bold text-rose-700">{nutritionStats.totalFat}g</div>
                      <div className="text-[10px] text-slate-500">~{nutritionStats.avgFat}g/day</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* View Mode Toggle */}
             <div className="flex justify-between items-center">
               <div className="flex gap-2">
                 <Button
                   variant={showCalendarView ? 'default' : 'outline'}
                   size="sm"
                   onClick={() => setShowCalendarView(true)}
                 >
                   <Calendar className="w-4 h-4 mr-2" />
                   Weekly Calendar
                 </Button>
                 <Button
                   variant={viewMode === 'calendar' ? 'default' : 'outline'}
                   size="sm"
                   onClick={() => {
                     setShowCalendarView(false);
                     setViewMode('calendar');
                   }}
                 >
                   <Calendar className="w-4 h-4 mr-2" />
                   Grid View
                 </Button>
                 <Button
                   variant={viewMode === 'detailed' ? 'default' : 'outline'}
                   size="sm"
                   onClick={() => {
                     setShowCalendarView(false);
                     setViewMode('detailed');
                   }}
                 >
                   <ChefHat className="w-4 h-4 mr-2" />
                   Detailed View
                 </Button>
               </div>
               <Badge variant="secondary" className="flex items-center gap-1">
                 <ArrowLeftRight className="w-3 h-3" />
                 Drag to swap meals
               </Badge>
             </div>

            <DragDropContext onDragEnd={handleDragEnd}>
               {showCalendarView ? (
                 /* Weekly Calendar View */
                 <WeeklyCalendarView 
                   plan={plan} 
                   onDaySelect={(dayIndex) => {
                     setSelectedDay(dayIndex);
                     setShowCalendarView(false);
                     setViewMode('detailed');
                   }}
                 />
               ) : viewMode === 'calendar' ? (
                /* Calendar/Weekly Overview */
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {localDays?.map((day, dayIndex) => (
                    <Card key={dayIndex} className="border-slate-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span>{day.day}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {['breakfast', 'lunch', 'dinner', 'snacks'].reduce((total, mealType) => {
                                const meal = day[mealType];
                                const match = meal?.calories?.match(/(\d+)/);
                                return total + (match ? parseInt(match[1]) : 0);
                              }, 0)} kcal
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => regenerateDay(dayIndex)}
                              disabled={regeneratingDay === dayIndex}
                            >
                              {regeneratingDay === dayIndex ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {['breakfast', 'lunch', 'dinner', 'snacks'].map(mealType => {
                          const meal = day[mealType];
                          if (!meal) return null;

                          return (
                            <Droppable key={`${dayIndex}-${mealType}`} droppableId={`day-${dayIndex}-${mealType}`}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className={`rounded-lg transition-colors ${
                                    snapshot.isDraggingOver ? 'bg-indigo-50 border-2 border-indigo-300' : ''
                                  }`}
                                >
                                  <Draggable draggableId={`meal-${dayIndex}-${mealType}`} index={0}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`p-2 rounded-lg border bg-white cursor-move hover:shadow-md transition-all ${
                                          snapshot.isDragging ? 'shadow-lg border-indigo-400 bg-indigo-50' : 'border-slate-200'
                                        }`}
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1 min-w-0">
                                            <div className="text-[10px] text-slate-500 uppercase font-medium mb-1">
                                              {mealIcons[mealType]} {mealType}
                                            </div>
                                            <div className="text-xs font-medium text-slate-800 truncate">
                                              {meal.name}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 w-6 p-0"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleMealFavorite(meal, mealType);
                                              }}
                                            >
                                              <Heart className={`w-3 h-3 ${isMealFavorited(meal, mealType) ? 'fill-rose-500 text-rose-500' : ''}`} />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 w-6 p-0"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                regenerateMeal(dayIndex, mealType);
                                              }}
                                              disabled={regeneratingMeal === `${dayIndex}-${mealType}`}
                                            >
                                              {regeneratingMeal === `${dayIndex}-${mealType}` ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                              ) : (
                                                <RefreshCw className="w-3 h-3" />
                                              )}
                                            </Button>
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 whitespace-nowrap">
                                              {meal.calories}
                                            </Badge>
                                          </div>
                                        </div>
                                        {(meal.protein || meal.carbs || meal.fat) && (
                                          <div className="flex gap-2 mt-1.5 text-[10px]">
                                            {meal.protein && <span className="text-blue-600">P:{meal.protein}g</span>}
                                            {meal.carbs && <span className="text-amber-600">C:{meal.carbs}g</span>}
                                            {meal.fat && <span className="text-rose-600">F:{meal.fat}g</span>}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </Draggable>
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          );
                        })}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                /* Detailed View */
                <>
                  {/* Day Selector */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {localDays?.map((day, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedDay(index)}
                          className={`
                            px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all
                            ${selectedDay === index 
                              ? 'bg-indigo-600 text-white shadow-md' 
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }
                          `}
                        >
                          Day {index + 1}
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => regenerateDay(index)}
                          disabled={regeneratingDay === index}
                        >
                          {regeneratingDay === index ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Selected Day Details */}
                  {localDays?.[selectedDay] && (
            <motion.div
              key={selectedDay}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {['breakfast', 'lunch', 'dinner', 'snacks'].map((mealType) => {
                const meal = localDays[selectedDay][mealType];
                if (!meal) return null;

                return (
                  <Droppable key={`${selectedDay}-${mealType}`} droppableId={`day-${selectedDay}-${mealType}`}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        <Draggable draggableId={`meal-${selectedDay}-${mealType}`} index={0}>
                          {(provided, snapshot) => (
                            <Card 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`border-slate-200 transition-all ${
                                snapshot.isDragging ? 'shadow-2xl border-indigo-400 bg-indigo-50' : ''
                              }`}
                              >
                              <CardContent className="p-6">
                                {/* Meal Image */}
                                {(meal.imageUrl || meal.imageError !== undefined) && (
                                  <div className="relative mb-4 rounded-lg overflow-hidden bg-slate-100 group">
                                    {meal.imageUrl && !meal.imageError ? (
                                      <>
                                        <img
                                          src={meal.imageUrl}
                                          alt={meal.name}
                                          loading="lazy"
                                          className="w-full h-64 object-cover"
                                          onError={(e) => {
                                            const newDays = [...localDays];
                                            newDays[selectedDay][mealType].imageError = true;
                                            setLocalDays(newDays);
                                          }}
                                        />
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() => regenerateMealImage(selectedDay, mealType)}
                                          disabled={regeneratingImage === `${selectedDay}-${mealType}`}
                                        >
                                          {regeneratingImage === `${selectedDay}-${mealType}` ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                          ) : (
                                            <RefreshCw className="w-3 h-3" />
                                          )}
                                        </Button>
                                      </>
                                    ) : (
                                      <div className="w-full h-64 flex flex-col items-center justify-center">
                                        <Utensils className="w-16 h-16 text-slate-300 mb-2" />
                                        <p className="text-xs text-slate-400 mb-3">Image unavailable</p>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => regenerateMealImage(selectedDay, mealType)}
                                          disabled={regeneratingImage === `${selectedDay}-${mealType}`}
                                        >
                                          {regeneratingImage === `${selectedDay}-${mealType}` ? (
                                            <>
                                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                              Generating...
                                            </>
                                          ) : (
                                            <>
                                              <Sparkles className="w-3 h-3 mr-1" />
                                              Generate Image
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="flex items-start gap-4">
                                  <div 
                                    {...provided.dragHandleProps}
                                    className="text-3xl cursor-move hover:scale-110 transition-transform"
                                  >
                                    {mealIcons[mealType]}
                                  </div>

                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                      <h3 className="font-semibold text-lg text-slate-900 capitalize">
                                        {mealType}
                                      </h3>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => toggleMealFavorite(meal, mealType)}
                                        >
                                          <Heart className={`w-4 h-4 mr-1 ${isMealFavorited(meal, mealType) ? 'fill-rose-500 text-rose-500' : ''}`} />
                                          {isMealFavorited(meal, mealType) ? 'Favorited' : 'Favorite'}
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleShareMeal(meal, mealType)}
                                        >
                                          <Share2 className="w-4 h-4 mr-1" />
                                          Share
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => regenerateMeal(selectedDay, mealType)}
                                          disabled={regeneratingMeal === `${selectedDay}-${mealType}`}
                                        >
                                          {regeneratingMeal === `${selectedDay}-${mealType}` ? (
                                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                          ) : (
                                            <RefreshCw className="w-4 h-4 mr-1" />
                                          )}
                                          Regenerate
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setAddRecipeTarget({ dayIndex: selectedDay, mealType });
                                            setShowAddRecipeDialog(true);
                                          }}
                                        >
                                          <Plus className="w-4 h-4 mr-1" />
                                          Add Recipe
                                        </Button>
                                        <Badge variant="outline" className="flex items-center gap-1">
                                          <Flame className="w-3 h-3 text-orange-500" />
                                          {meal.calories}
                                        </Badge>
                                        <Badge variant="secondary" className="text-xs">
                                          <ArrowLeftRight className="w-3 h-3 mr-1" />
                                          Drag
                                        </Badge>
                                      </div>
                                    </div>
                          
                          <h4 className="text-slate-800 font-medium mb-3">
                                            {meal.name}
                                          </h4>

                                          {/* Macro Display */}
                                          {(meal.protein || meal.carbs || meal.fat) && (
                                            <div className="flex gap-2 mb-4 flex-wrap">
                                              {meal.protein && (
                                                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                                  Protein: {meal.protein}g
                                                </Badge>
                                              )}
                                              {meal.carbs && (
                                                <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                                                  Carbs: {meal.carbs}g
                                                </Badge>
                                              )}
                                              {meal.fat && (
                                                <Badge className="bg-rose-100 text-rose-700 border-rose-200">
                                                  Fat: {meal.fat}g
                                                </Badge>
                                              )}
                                            </div>
                                          )}

                                          <div className="space-y-4">
                                            {/* Health Benefit */}
                                            {meal.healthBenefit && (
                                              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                                                <div className="flex items-start gap-2">
                                                  <Heart className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                                  <div>
                                                    <p className="text-xs font-medium text-emerald-900 mb-0.5">Why This Helps</p>
                                                    <p className="text-sm text-emerald-700">{meal.healthBenefit}</p>
                                                  </div>
                                                </div>
                                              </div>
                                            )}

                                            {/* Prep Info */}
                                            <div className="grid grid-cols-3 gap-2 text-xs">
                                              {meal.prepTime && (
                                                <div className="flex items-center gap-1 text-slate-600">
                                                  <Clock className="w-3 h-3" />
                                                  {meal.prepTime}
                                                </div>
                                              )}
                                              {meal.difficulty && (
                                                <div className="flex items-center gap-1 text-slate-600">
                                                  <ChefHat className="w-3 h-3" />
                                                  {meal.difficulty}
                                                </div>
                                              )}
                                              {meal.equipment?.length > 0 && (
                                                <div className="flex items-center gap-1 text-slate-600">
                                                  <Wrench className="w-3 h-3" />
                                                  {meal.equipment.length} tools
                                                </div>
                                              )}
                                            </div>

                                            {/* Prep Steps */}
                                            {meal.prepSteps?.length > 0 && (
                                              <div>
                                                <p className="text-xs font-medium text-slate-700 mb-2">Preparation Steps</p>
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

                                            {/* Equipment */}
                                            {meal.equipment?.length > 0 && (
                                              <div>
                                                <p className="text-xs font-medium text-slate-700 mb-1">Equipment Needed</p>
                                                <div className="flex flex-wrap gap-1">
                                                  {meal.equipment.map((item, idx) => (
                                                    <Badge key={idx} variant="secondary" className="text-xs">
                                                      {item}
                                                    </Badge>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}
                              </Draggable>
                              {provided.placeholder}
                            </div>
                          )}
                          </Droppable>
                          );
                          })}
                          </motion.div>
                          )}
                          </>
                          )}
                          </DragDropContext>

                          {/* Preferences (if custom plan) */}
                          {plan.diet_type === 'custom' && plan.preferences && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900">Preferences</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  {plan.preferences.foodsLiked && (
                    <div>
                      <p className="font-medium text-slate-700 mb-1">Foods Liked</p>
                      <p className="text-slate-600">{plan.preferences.foodsLiked}</p>
                    </div>
                  )}
                  {plan.preferences.foodsAvoided && (
                    <div>
                      <p className="font-medium text-slate-700 mb-1">Foods Avoided</p>
                      <p className="text-slate-600">{plan.preferences.foodsAvoided}</p>
                    </div>
                  )}
                  {plan.preferences.dietaryNotes && (
                    <div className="md:col-span-2">
                      <p className="font-medium text-slate-700 mb-1">Notes</p>
                      <p className="text-slate-600">{plan.preferences.dietaryNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          </TabsContent>

          <TabsContent value="grocery">
            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-indigo-600" />
                    <CardTitle>Grocery List</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const items = Object.entries(groceryList || {})
                          .map(([cat, items]) => {
                            const itemsList = items.map(i => {
                              const qty = i.quantity && i.quantity !== 1 ? ` (${i.quantity}${i.unit ? ' ' + i.unit : ''})` : '';
                              const price = i.price ? ` - $${(i.price * (i.quantity || 1)).toFixed(2)}` : '';
                              const notes = i.notes ? ` [${i.notes}]` : '';
                              return `  • ${i.name}${qty}${price}${notes}`;
                            }).join('\n');
                            return `${cat}:\n${itemsList}`;
                          })
                          .join('\n\n');
                        const total = Object.values(groceryList || {}).flat().reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
                        navigator.clipboard.writeText(`${items}\n\n--- Total: $${total.toFixed(2)} ---`);
                        toast.success('Copied to clipboard');
                      }}
                    >
                      Copy List
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const content = Object.entries(groceryList || {})
                          .map(([cat, items]) => `${cat}:\n${items.map(i => `  • ${i.name}`).join('\n')}`)
                          .join('\n\n');
                        const subject = encodeURIComponent(`Grocery List - ${plan.name}`);
                        const body = encodeURIComponent(content);
                        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                      }}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>

                {/* Cost Summary */}
                {(plan?.estimated_cost || plan?.current_total_cost) && (
                  <div className="mt-4 p-3 rounded-lg bg-slate-50 space-y-2">
                    {plan.estimated_cost && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Initial Estimate:</span>
                        <span className="font-semibold">${plan.estimated_cost.toFixed(2)}</span>
                      </div>
                    )}
                    {groceryList && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Current Total:</span>
                        <span className="font-bold text-indigo-600">
                          ${Object.values(groceryList).flat().reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {plan.estimated_cost && groceryList && (
                      <div className="flex justify-between text-xs text-slate-500 pt-1 border-t">
                        <span>Difference:</span>
                        <span className={
                          Object.values(groceryList).flat().reduce((sum, item) => sum + (item.price || 0), 0) <= plan.estimated_cost
                            ? 'text-emerald-600' : 'text-amber-600'
                        }>
                          ${(Object.values(groceryList).flat().reduce((sum, item) => sum + (item.price || 0), 0) - plan.estimated_cost).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {groceryList && (
                  <div className="grid md:grid-cols-2 gap-6">
                    {groceryCategories.map(category => {
                      const items = groceryList[category] || [];

                      return (
                        <div key={category}>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-slate-900">{category}</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setAddingItem(category)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="space-y-2">
                            {items.map((item, idx) => {
                              const itemName = typeof item === 'string' ? item : item.name;
                              const itemPrice = typeof item === 'object' ? item.price : null;
                              const itemUnit = typeof item === 'object' ? item.unit : null;
                              const itemQuantity = typeof item === 'object' ? (item.quantity || 1) : 1;
                              const totalPrice = (itemPrice || 0) * itemQuantity;

                              return (
                                <div key={idx} className="flex items-center gap-2">
                                  <Checkbox
                                    checked={checkedItems.has(itemName)}
                                    onCheckedChange={(checked) => {
                                      const newSet = new Set(checkedItems);
                                      if (checked) newSet.add(itemName);
                                      else newSet.delete(itemName);
                                      setCheckedItems(newSet);
                                    }}
                                  />
                                  <span className={`text-sm flex-1 ${checkedItems.has(itemName) ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                    {itemName}
                                  </span>

                                  {/* Remove Item */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => removeGroceryItem(category, idx)}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>

                                  {/* Quantity Input */}
                                  <Input
                                    type="number"
                                    step="0.5"
                                    min="0.1"
                                    value={itemQuantity}
                                    onChange={(e) => {
                                      const newQty = parseFloat(e.target.value);
                                      if (!isNaN(newQty) && newQty > 0) {
                                        setGroceryList(prev => ({
                                          ...prev,
                                          [category]: prev[category].map((it, i) => 
                                            i === idx ? { ...it, quantity: newQty } : it
                                          )
                                        }));
                                        saveGroceryList();
                                      }
                                    }}
                                    className="w-14 h-7 text-xs text-center"
                                  />

                                  {editingPrice === `${category}-${idx}` ? (
                                    <Input
                                      type="number"
                                      step="0.01"
                                      defaultValue={itemPrice || ''}
                                      placeholder="$"
                                      className="w-20 h-7 text-xs"
                                      onBlur={(e) => {
                                        const newPrice = parseFloat(e.target.value);
                                        if (!isNaN(newPrice)) {
                                          setGroceryList(prev => ({
                                            ...prev,
                                            [category]: prev[category].map((it, i) => 
                                              i === idx ? { ...it, price: newPrice } : it
                                            )
                                          }));
                                          saveGroceryList();
                                        }
                                        setEditingPrice(null);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') e.target.blur();
                                      }}
                                      autoFocus
                                    />
                                  ) : (
                                    <button
                                      onClick={() => setEditingPrice(`${category}-${idx}`)}
                                      className="text-xs text-slate-500 hover:text-indigo-600 min-w-[90px] text-right"
                                    >
                                      {itemPrice ? (
                                        <div className="flex flex-col items-end">
                                          <span className="text-[10px] text-slate-400">
                                            ${itemPrice.toFixed(2)}{itemUnit ? `/${itemUnit}` : ''}
                                          </span>
                                          <span className="font-semibold text-slate-700">
                                            ${totalPrice.toFixed(2)}
                                          </span>
                                        </div>
                                      ) : (
                                        <span
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            fetchItemPrice(itemName, category);
                                          }}
                                          className="text-indigo-600 hover:underline"
                                        >
                                          Get price
                                        </span>
                                      )}
                                    </button>
                                  )}
                                </div>
                              );
                            })}

                            {addingItem === category && (
                              <div className="flex gap-2 mt-2">
                                <Input
                                  placeholder="Item name..."
                                  value={newItemName}
                                  onChange={(e) => setNewItemName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') addCustomItem(category);
                                    if (e.key === 'Escape') setAddingItem(null);
                                  }}
                                  className="h-8 text-sm"
                                  autoFocus
                                />
                                <Button size="sm" onClick={() => addCustomItem(category)}>
                                  Add
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <Separator className="my-4" />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">
                    {checkedItems.size} of {groceryList ? Object.values(groceryList).flat().length : 0} items checked
                  </span>
                  {isFetchingPrice && (
                    <span className="flex items-center gap-2 text-indigo-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Fetching price...
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>

      <SharePlanDialog
        plan={plan}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
      />

      <ShareMealDialog
        meal={mealToShare}
        mealType={mealTypeToShare}
        open={shareMealDialogOpen}
        onOpenChange={setShareMealDialogOpen}
      />

      {/* AI Adjust Plan Dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-600" />
              AI Plan Adjustment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Adjustment Type</Label>
              <Select value={adjustmentType} onValueChange={setAdjustmentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select adjustment type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nutrients">Optimize for Nutrients</SelectItem>
                  <SelectItem value="budget">Adjust for Budget</SelectItem>
                  <SelectItem value="substitutions">Substitute Meals/Ingredients</SelectItem>
                  <SelectItem value="feedback">Apply User Feedback</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Details</Label>
              {adjustmentType === 'nutrients' && (
                <Input
                  placeholder="e.g., increase protein to 150g/day, reduce carbs"
                  value={adjustmentDetails}
                  onChange={(e) => setAdjustmentDetails(e.target.value)}
                />
              )}
              {adjustmentType === 'budget' && (
                <Input
                  placeholder="e.g., reduce to $75/week, use cheaper proteins"
                  value={adjustmentDetails}
                  onChange={(e) => setAdjustmentDetails(e.target.value)}
                />
              )}
              {adjustmentType === 'substitutions' && (
                <Input
                  placeholder="e.g., replace all chicken with fish, no dairy"
                  value={adjustmentDetails}
                  onChange={(e) => setAdjustmentDetails(e.target.value)}
                />
              )}
              {adjustmentType === 'feedback' && (
                <Input
                  placeholder="e.g., Day 3 dinner is too spicy, need quicker breakfast options"
                  value={adjustmentDetails}
                  onChange={(e) => setAdjustmentDetails(e.target.value)}
                />
              )}
              <p className="text-xs text-slate-500 mt-2">
                {adjustmentType === 'nutrients' && 'Specify target macros or micronutrients (e.g., high protein, low sodium)'}
                {adjustmentType === 'budget' && 'Provide budget constraints or cost-saving preferences'}
                {adjustmentType === 'substitutions' && 'List specific foods to replace or avoid'}
                {adjustmentType === 'feedback' && 'Describe issues or preferences for specific meals or days'}
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowAdjustDialog(false)} disabled={isAdjusting}>
                Cancel
              </Button>
              <Button 
                onClick={handleAdjustPlan} 
                disabled={isAdjusting || !adjustmentType || !adjustmentDetails.trim()}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                {isAdjusting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adjusting Plan...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Apply Adjustment
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Recipe to Plan Dialog */}
      <Dialog open={showAddRecipeDialog} onOpenChange={setShowAddRecipeDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Recipe to {addRecipeTarget?.mealType}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="favorites">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="favorites">My Favorites</TabsTrigger>
              <TabsTrigger value="community">Community Recipes</TabsTrigger>
            </TabsList>
            <TabsContent value="favorites" className="space-y-3 mt-4">
              {favoriteMeals.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No favorite meals yet</p>
              ) : (
                favoriteMeals.map(recipe => (
                  <div key={recipe.id} className="p-3 border border-slate-200 rounded-lg flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      {recipe.imageUrl && (
                        <img src={recipe.imageUrl} alt={recipe.name} className="w-12 h-12 object-cover rounded" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{recipe.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{recipe.meal_type}</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleAddRecipe(recipe.id, 'favorite')}>
                      Add
                    </Button>
                  </div>
                ))
              )}
            </TabsContent>
            <TabsContent value="community" className="space-y-3 mt-4">
              {sharedRecipes.filter(r => r.status === 'approved').length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No community recipes available</p>
              ) : (
                sharedRecipes.filter(r => r.status === 'approved').map(recipe => (
                  <div key={recipe.id} className="p-3 border border-slate-200 rounded-lg flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      {recipe.image_url && (
                        <img src={recipe.image_url} alt={recipe.name} className="w-12 h-12 object-cover rounded" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{recipe.name}</p>
                        <p className="text-xs text-slate-500">by {recipe.author_name}</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleAddRecipe(recipe.id, 'shared')}>
                      Add
                    </Button>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}