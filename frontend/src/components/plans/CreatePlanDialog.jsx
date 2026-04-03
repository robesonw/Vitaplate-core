import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Apple, Leaf, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const dietOptions = [
  { id: 'liver-centric', name: 'Liver-Centric', icon: Heart, color: 'rose' },
  { id: 'low-sugar', name: 'Low-Sugar', icon: Apple, color: 'amber' },
  { id: 'vegetarian', name: 'Vegetarian', icon: Leaf, color: 'emerald' },
  { id: 'custom', name: 'AI Custom', icon: Sparkles, color: 'purple' },
];

// Default meal plans data
const defaultPlans = {
  'liver-centric': [
    { day: 'Monday', breakfast: { name: 'Beef liver with scrambled eggs', calories: '450-500 kcal', nutrients: 'High in iron, vitamin A, and B-vitamins', prepTip: 'Soak liver in milk for 30 mins before cooking' }, lunch: { name: 'Chicken liver pate with vegetables', calories: '350-400 kcal', nutrients: 'Rich in folate and choline', prepTip: 'Blend cooked liver with herbs' }, dinner: { name: 'Grilled salmon with liver-friendly greens', calories: '500-550 kcal', nutrients: 'Omega-3 fatty acids support liver health', prepTip: 'Grill salmon 4-6 mins per side' } },
    { day: 'Tuesday', breakfast: { name: 'Liver and onions with toast', calories: '400-450 kcal', nutrients: 'High protein and vitamin B12', prepTip: 'Caramelize onions first' }, lunch: { name: 'Grilled chicken with detox vegetables', calories: '380-430 kcal', nutrients: 'Lean protein with fiber', prepTip: 'Season with turmeric' }, dinner: { name: 'Turkey meatballs with Brussels sprouts', calories: '450-500 kcal', nutrients: 'Lean protein with fiber', prepTip: 'Bake at 400°F for 20 mins' } },
    { day: 'Wednesday', breakfast: { name: 'Chicken liver omelet', calories: '380-420 kcal', nutrients: 'Complete amino acids', prepTip: 'Sauté liver first' }, lunch: { name: 'Quinoa bowl with vegetables', calories: '400-450 kcal', nutrients: 'Complete protein and fiber', prepTip: 'Roast vegetables at 425°F' }, dinner: { name: 'Baked cod with artichokes', calories: '350-400 kcal', nutrients: 'Low fat protein', prepTip: 'Bake at 375°F for 12-15 mins' } },
    { day: 'Thursday', breakfast: { name: 'Liver pate on whole grain', calories: '320-370 kcal', nutrients: 'Complex carbs', prepTip: 'Toast bread first' }, lunch: { name: 'Grilled chicken salad', calories: '400-450 kcal', nutrients: 'Lean protein', prepTip: 'Grill 6-8 mins per side' }, dinner: { name: 'Herb-crusted lamb with asparagus', calories: '520-570 kcal', nutrients: 'Iron and B-vitamins', prepTip: 'Roast at 400°F' } },
    { day: 'Friday', breakfast: { name: 'Liver and mushroom scramble', calories: '420-470 kcal', nutrients: 'Selenium supports liver', prepTip: 'Sauté mushrooms first' }, lunch: { name: 'Liver curry with brown rice', calories: '450-500 kcal', nutrients: 'Turmeric enhances liver function', prepTip: 'Simmer 20 mins' }, dinner: { name: 'Grilled mackerel with broccoli', calories: '480-530 kcal', nutrients: 'Omega-3s', prepTip: 'Grill 3-4 mins per side' } },
    { day: 'Saturday', breakfast: { name: 'Beef liver hash', calories: '460-510 kcal', nutrients: 'High protein', prepTip: 'Dice and fry until crispy' }, lunch: { name: 'Chicken liver salad', calories: '350-400 kcal', nutrients: 'Fresh greens', prepTip: 'Serve warm' }, dinner: { name: 'Baked salmon with quinoa', calories: '500-550 kcal', nutrients: 'Omega-3s', prepTip: 'Bake at 400°F' } },
    { day: 'Sunday', breakfast: { name: 'Liver pancakes with berries', calories: '390-440 kcal', nutrients: 'Antioxidants', prepTip: 'Blend liver into batter' }, lunch: { name: 'Liver soup', calories: '320-370 kcal', nutrients: 'Easy to digest', prepTip: 'Simmer 30 mins' }, dinner: { name: 'Grilled trout with vegetables', calories: '450-500 kcal', nutrients: 'Complete proteins', prepTip: 'Grill 4-5 mins per side' } }
  ],
  'low-sugar': [
    { day: 'Monday', breakfast: { name: 'Greek yogurt with nuts', calories: '280-320 kcal', nutrients: 'High protein', prepTip: 'Use plain yogurt' }, lunch: { name: 'Grilled chicken salad', calories: '350-400 kcal', nutrients: 'Lean protein', prepTip: 'Season with herbs' }, dinner: { name: 'Baked salmon with vegetables', calories: '450-500 kcal', nutrients: 'Omega-3s', prepTip: 'Bake at 400°F' } },
    { day: 'Tuesday', breakfast: { name: 'Scrambled eggs with spinach', calories: '320-370 kcal', nutrients: 'Complete protein', prepTip: 'Wilt spinach' }, lunch: { name: 'Turkey lettuce wraps', calories: '380-430 kcal', nutrients: 'Healthy fats', prepTip: 'Use large lettuce leaves' }, dinner: { name: 'Beef stir-fry with broccoli', calories: '420-470 kcal', nutrients: 'Iron and fiber', prepTip: 'High heat stir-fry' } },
    { day: 'Wednesday', breakfast: { name: 'Cottage cheese with cucumber', calories: '200-250 kcal', nutrients: 'Casein protein', prepTip: 'Add herbs' }, lunch: { name: 'Tuna salad', calories: '320-370 kcal', nutrients: 'Omega-3s', prepTip: 'Use olive oil' }, dinner: { name: 'Grilled pork chops', calories: '450-500 kcal', nutrients: 'Lean protein', prepTip: 'Grill 5-6 mins' } },
    { day: 'Thursday', breakfast: { name: 'Omelet with vegetables', calories: '350-400 kcal', nutrients: 'Protein', prepTip: 'Use bell peppers' }, lunch: { name: 'Grilled shrimp with zucchini', calories: '300-350 kcal', nutrients: 'Low carb', prepTip: 'Spiralize zucchini' }, dinner: { name: 'Baked chicken thighs', calories: '480-530 kcal', nutrients: 'Protein', prepTip: 'Roast cauliflower' } },
    { day: 'Friday', breakfast: { name: 'Smoked salmon', calories: '300-350 kcal', nutrients: 'Omega-3s', prepTip: 'Serve on cucumber' }, lunch: { name: 'Chicken caesar salad', calories: '380-430 kcal', nutrients: 'Protein-rich', prepTip: 'No croutons' }, dinner: { name: 'Grilled lamb chops', calories: '500-550 kcal', nutrients: 'Iron', prepTip: 'Grill 4-5 mins' } },
    { day: 'Saturday', breakfast: { name: 'Bacon and eggs', calories: '450-500 kcal', nutrients: 'High protein', prepTip: 'Use nitrate-free' }, lunch: { name: 'Stuffed bell peppers', calories: '400-450 kcal', nutrients: 'Lean protein', prepTip: 'Bake 25 mins' }, dinner: { name: 'Grilled steak', calories: '520-570 kcal', nutrients: 'Iron', prepTip: 'Grill to taste' } },
    { day: 'Sunday', breakfast: { name: 'Protein smoothie', calories: '280-330 kcal', nutrients: 'Protein', prepTip: 'Add nut butter' }, lunch: { name: 'Cobb salad', calories: '420-470 kcal', nutrients: 'Complete nutrition', prepTip: 'Include eggs and bacon' }, dinner: { name: 'Baked cod', calories: '380-430 kcal', nutrients: 'Lean protein', prepTip: 'Bake 15 mins' } }
  ],
  'vegetarian': [
    { day: 'Monday', breakfast: { name: 'Overnight oats with berries', calories: '350-400 kcal', nutrients: 'Complex carbs', prepTip: 'Prepare night before' }, lunch: { name: 'Quinoa Buddha bowl', calories: '450-500 kcal', nutrients: 'Complete protein', prepTip: 'Roast chickpeas' }, dinner: { name: 'Lentil curry', calories: '480-530 kcal', nutrients: 'High fiber', prepTip: 'Simmer with coconut milk' } },
    { day: 'Tuesday', breakfast: { name: 'Avocado toast', calories: '380-430 kcal', nutrients: 'Healthy fats', prepTip: 'Use whole grain' }, lunch: { name: 'Greek salad', calories: '320-370 kcal', nutrients: 'Mediterranean nutrition', prepTip: 'Extra virgin olive oil' }, dinner: { name: 'Vegetable stir-fry with tofu', calories: '400-450 kcal', nutrients: 'Plant protein', prepTip: 'Press tofu first' } },
    { day: 'Wednesday', breakfast: { name: 'Smoothie bowl', calories: '400-450 kcal', nutrients: 'Vitamins', prepTip: 'Blend frozen fruits' }, lunch: { name: 'Caprese sandwich', calories: '420-470 kcal', nutrients: 'Calcium', prepTip: 'Fresh mozzarella' }, dinner: { name: 'Black bean tacos', calories: '480-530 kcal', nutrients: 'Fiber', prepTip: 'Season with cumin' } },
    { day: 'Thursday', breakfast: { name: 'Chia pudding', calories: '300-350 kcal', nutrients: 'Omega-3s', prepTip: 'Prepare overnight' }, lunch: { name: 'Hummus wrap', calories: '400-450 kcal', nutrients: 'Plant protein', prepTip: 'Roast vegetables' }, dinner: { name: 'Mushroom risotto', calories: '500-550 kcal', nutrients: 'Complex carbs', prepTip: 'Stir frequently' } },
    { day: 'Friday', breakfast: { name: 'Banana pancakes', calories: '420-470 kcal', nutrients: 'Natural sugars', prepTip: 'Mash bananas' }, lunch: { name: 'Mediterranean mezze', calories: '450-500 kcal', nutrients: 'Variety of nutrients', prepTip: 'Include falafel' }, dinner: { name: 'Eggplant parmesan', calories: '480-530 kcal', nutrients: 'Fiber', prepTip: 'Bake instead of fry' } },
    { day: 'Saturday', breakfast: { name: 'Shakshuka', calories: '400-450 kcal', nutrients: 'Protein', prepTip: 'Simmer in tomato sauce' }, lunch: { name: 'Grilled halloumi salad', calories: '380-430 kcal', nutrients: 'Calcium', prepTip: 'Grill until golden' }, dinner: { name: 'Vegetable pad thai', calories: '500-550 kcal', nutrients: 'Complex carbs', prepTip: 'Use rice noodles' } },
    { day: 'Sunday', breakfast: { name: 'French toast', calories: '450-500 kcal', nutrients: 'Protein', prepTip: 'Use thick bread' }, lunch: { name: 'Spinach stuffed shells', calories: '480-530 kcal', nutrients: 'Calcium', prepTip: 'Bake with marinara' }, dinner: { name: 'Chickpea coconut curry', calories: '450-500 kcal', nutrients: 'Plant protein', prepTip: 'Serve with rice' } }
  ]
};

export default function CreatePlanDialog({ open, onOpenChange }) {
  const [step, setStep] = useState(1);
  const [selectedDiet, setSelectedDiet] = useState('');
  const [planName, setPlanName] = useState('');
  const [preferences, setPreferences] = useState({
    foodsLiked: '',
    foodsAvoided: '',
    duration: 'week',
    dietaryNotes: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (planData) => base44.entities.MealPlan.create(planData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      toast.success('Meal plan created successfully!');
      onOpenChange(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setStep(1);
    setSelectedDiet('');
    setPlanName('');
    setPreferences({ foodsLiked: '', foodsAvoided: '', duration: 'week', dietaryNotes: '' });
  };

  const handleCreatePlan = async () => {
    if (selectedDiet === 'custom') {
      setIsGenerating(true);

      const daysCount = preferences.duration === 'day' ? 1 : preferences.duration === '3days' ? 3 : 7;
      const generatedPlanName = planName || `Custom AI Plan - ${new Date().toLocaleDateString()}`;

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/meal-plans/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            days: daysCount,
            planName: generatedPlanName,
            preferences: {
              foods_liked: preferences.foodsLiked,
              foods_avoided: preferences.foodsAvoided,
              dietary_restrictions: preferences.dietaryNotes,
            },
            labResults: null,
          }),
        });

        if (!res.ok) throw new Error(`Server responded with ${res.status}`);

        const data = await res.json();
        const mealPlan = data.meal_plan || data;

        if (mealPlan?.days) {
          createMutation.mutate({
            name: generatedPlanName,
            diet_type: 'custom',
            days: mealPlan.days.slice(0, daysCount),
            preferences,
          });
        } else {
          toast.error('Unexpected response from meal plan service');
        }
      } catch (error) {
        toast.error('Failed to generate plan');
      } finally {
        setIsGenerating(false);
      }
    } else {
      createMutation.mutate({
        name: planName || `${selectedDiet} Plan - ${new Date().toLocaleDateString()}`,
        diet_type: selectedDiet,
        days: defaultPlans[selectedDiet] || [],
        preferences: {}
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Meal Plan</DialogTitle>
          <DialogDescription>
            {step === 1 ? 'Choose your diet type' : step === 2 ? 'Name your plan' : 'Customize your preferences'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              {dietOptions.map(diet => {
                const Icon = diet.icon;
                const selected = selectedDiet === diet.id;
                
                return (
                  <button
                    key={diet.id}
                    onClick={() => setSelectedDiet(diet.id)}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${
                      selected 
                        ? `border-${diet.color}-500 bg-${diet.color}-50` 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg bg-${diet.color}-100 flex items-center justify-center mb-3`}>
                      <Icon className={`w-6 h-6 text-${diet.color}-600`} />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">{diet.name}</h3>
                    <p className="text-sm text-slate-600">
                      {diet.id === 'custom' ? 'AI-powered personalization' : `Pre-built ${diet.name} plan`}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label>Plan Name</Label>
                <Input
                  placeholder={`${selectedDiet.replace(/-/g, ' ')} Plan`}
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          )}

          {step === 3 && selectedDiet === 'custom' && (
            <div className="space-y-4">
              <div>
                <Label>Foods You Like</Label>
                <Textarea
                  placeholder="e.g., chicken, salmon, quinoa, berries..."
                  value={preferences.foodsLiked}
                  onChange={(e) => setPreferences({...preferences, foodsLiked: e.target.value})}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label>Foods to Avoid</Label>
                <Textarea
                  placeholder="e.g., dairy, shellfish, gluten..."
                  value={preferences.foodsAvoided}
                  onChange={(e) => setPreferences({...preferences, foodsAvoided: e.target.value})}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label>Duration</Label>
                <Select
                  value={preferences.duration}
                  onValueChange={(value) => setPreferences({...preferences, duration: value})}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">1 Day</SelectItem>
                    <SelectItem value="3days">3 Days</SelectItem>
                    <SelectItem value="week">7 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Additional Notes</Label>
                <Textarea
                  placeholder="Any dietary restrictions, health goals..."
                  value={preferences.dietaryNotes}
                  onChange={(e) => setPreferences({...preferences, dietaryNotes: e.target.value})}
                  className="mt-2"
                />
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            
            <div className="ml-auto">
              {step < (selectedDiet === 'custom' ? 3 : 2) ? (
                <Button 
                  onClick={() => setStep(step + 1)}
                  disabled={!selectedDiet}
                >
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={handleCreatePlan}
                  disabled={isGenerating || createMutation.isPending}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600"
                >
                  {(isGenerating || createMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Create Plan
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}