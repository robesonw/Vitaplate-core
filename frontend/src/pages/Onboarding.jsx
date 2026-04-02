import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Heart, Flame, Sparkles, Salad, ArrowRight, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const STEPS = ['Health Goal', 'Diet Type', 'Allergies', 'Budget', 'Generate Plan'];

const healthGoals = [
  { value: 'liver_health', label: 'Liver Health', emoji: '🫀', desc: 'Support liver detox & enzymes' },
  { value: 'weight_loss', label: 'Weight Loss', emoji: '⚖️', desc: 'Reduce calories, boost metabolism' },
  { value: 'blood_sugar_control', label: 'Blood Sugar', emoji: '🩸', desc: 'Low-glycemic, steady energy' },
  { value: 'muscle_gain', label: 'Muscle Gain', emoji: '💪', desc: 'High protein, strength focus' },
  { value: 'heart_health', label: 'Heart Health', emoji: '❤️', desc: 'Omega-3s, low sodium' },
  { value: 'general_wellness', label: 'General Wellness', emoji: '✨', desc: 'Balanced, nutrient-rich' },
];

const dietTypes = [
  { value: 'liver-centric', label: 'Liver-Centric', emoji: '🥦', desc: 'Cruciferous veg, antioxidants' },
  { value: 'low-sugar', label: 'Low Sugar', emoji: '🚫🍬', desc: 'Minimal refined carbs' },
  { value: 'vegetarian', label: 'Vegetarian', emoji: '🌱', desc: 'Plant-based, no meat' },
  { value: 'custom', label: 'Custom / No Restriction', emoji: '🍽️', desc: 'Balanced mixed diet' },
];

const allergenList = [
  { value: 'nuts', label: 'Nuts' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'gluten', label: 'Gluten' },
  { value: 'shellfish', label: 'Shellfish' },
  { value: 'eggs', label: 'Eggs' },
  { value: 'soy', label: 'Soy' },
  { value: 'fish', label: 'Fish' },
  { value: 'sesame', label: 'Sesame' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [healthGoal, setHealthGoal] = useState('');
  const [dietType, setDietType] = useState('');
  const [allergens, setAllergens] = useState([]);
  const [weeklyBudget, setWeeklyBudget] = useState(100);
  const [numPeople, setNumPeople] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFinish = async () => {
    setIsGenerating(true);
    try {
      // Save ALL user preferences — upsert (update if exists, create if not)
      const allPrefs = {
        health_goal: healthGoal,
        dietary_restrictions: dietType !== 'custom' ? dietType : '',
        allergens,
        num_people: numPeople,
        weekly_budget: weeklyBudget,
        // These fields aren't collected in this flow but set sensible defaults
        cooking_time: 'any',
        skill_level: 'intermediate',
      };
      const existingPrefs = await base44.entities.UserPreferences.list();
      if (existingPrefs.length > 0) {
        await base44.entities.UserPreferences.update(existingPrefs[0].id, allPrefs);
      } else {
        await base44.entities.UserPreferences.create(allPrefs);
      }
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });

      // Generate first meal plan
      const goalLabel = healthGoals.find(g => g.value === healthGoal)?.label || 'General Wellness';
      const allergenText = allergens.length > 0 ? `STRICT ALLERGEN RESTRICTIONS (never include): ${allergens.join(', ')}` : '';

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a 7-day personalized meal plan for someone with a ${goalLabel} goal, ${dietType} diet.
${allergenText}
Budget: $${weeklyBudget} for ${numPeople} ${numPeople === 1 ? 'person' : 'people'}.
For each day provide breakfast, lunch, dinner, snacks with name, calories (as string), protein, carbs, fat (numbers), and healthBenefit.`,
        response_json_schema: {
          type: "object",
          properties: {
            health_notes: { type: "string" },
            estimated_weekly_cost: { type: "number" },
            average_daily_macros: {
              type: "object",
              properties: {
                protein: { type: "number" },
                carbs: { type: "number" },
                fat: { type: "number" }
              }
            },
            days: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "string" },
                  breakfast: { type: "object", properties: { name: { type: "string" }, calories: { type: "string" }, protein: { type: "number" }, carbs: { type: "number" }, fat: { type: "number" }, healthBenefit: { type: "string" } } },
                  lunch: { type: "object", properties: { name: { type: "string" }, calories: { type: "string" }, protein: { type: "number" }, carbs: { type: "number" }, fat: { type: "number" }, healthBenefit: { type: "string" } } },
                  dinner: { type: "object", properties: { name: { type: "string" }, calories: { type: "string" }, protein: { type: "number" }, carbs: { type: "number" }, fat: { type: "number" }, healthBenefit: { type: "string" } } },
                  snacks: { type: "object", properties: { name: { type: "string" }, calories: { type: "string" }, protein: { type: "number" }, carbs: { type: "number" }, fat: { type: "number" }, healthBenefit: { type: "string" } } }
                }
              }
            }
          }
        }
      });

      if (response?.days) {
        // Map to real calendar dates starting from today (Monday)
        const today = new Date();
        const dayOfWeek = today.getDay();
        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(today);
        monday.setDate(today.getDate() + daysToMonday);

        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        const mappedDays = response.days.slice(0, 7).map((day, i) => {
          const date = new Date(monday);
          date.setDate(monday.getDate() + i);
          const label = `${dayNames[i]} (${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
          return {
            ...day,
            day: label,
            breakfast: { name: day.breakfast?.name || 'Breakfast', calories: day.breakfast?.calories || '400 kcal', protein: day.breakfast?.protein, carbs: day.breakfast?.carbs, fat: day.breakfast?.fat, healthBenefit: day.breakfast?.healthBenefit || '', nutrients: day.breakfast?.healthBenefit || '', prepTip: '', prepSteps: [], prepTime: '', difficulty: '', equipment: [], imageUrl: '' },
            lunch: { name: day.lunch?.name || 'Lunch', calories: day.lunch?.calories || '500 kcal', protein: day.lunch?.protein, carbs: day.lunch?.carbs, fat: day.lunch?.fat, healthBenefit: day.lunch?.healthBenefit || '', nutrients: day.lunch?.healthBenefit || '', prepTip: '', prepSteps: [], prepTime: '', difficulty: '', equipment: [], imageUrl: '' },
            dinner: { name: day.dinner?.name || 'Dinner', calories: day.dinner?.calories || '600 kcal', protein: day.dinner?.protein, carbs: day.dinner?.carbs, fat: day.dinner?.fat, healthBenefit: day.dinner?.healthBenefit || '', nutrients: day.dinner?.healthBenefit || '', prepTip: '', prepSteps: [], prepTime: '', difficulty: '', equipment: [], imageUrl: '' },
            snacks: { name: day.snacks?.name || 'Snack', calories: day.snacks?.calories || '200 kcal', protein: day.snacks?.protein, carbs: day.snacks?.carbs, fat: day.snacks?.fat, healthBenefit: day.snacks?.healthBenefit || '', nutrients: day.snacks?.healthBenefit || 'Healthy fats', prepTip: '', prepSteps: [], prepTime: '', difficulty: '', equipment: [], imageUrl: '' },
          };
        });

        await base44.entities.MealPlan.create({
          name: `My First ${goalLabel} Plan`,
          diet_type: dietType || 'custom',
          days: mappedDays,
          macros: response.average_daily_macros,
          estimated_cost: response.estimated_weekly_cost,
          preferences: { health_goal: healthGoal, allergens, num_people: numPeople, weekly_budget: weeklyBudget }
        });
        queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      }

      toast.success('Your first meal plan is ready! Welcome to VitaPlate 🎉');
      navigate('/Dashboard');
    } catch (err) {
      console.error('Onboarding error:', err);
      const msg = err?.message || 'Unknown error';
      toast.error(`Setup failed: ${msg}. Please try again.`, { duration: 6000 });
    } finally {
      setIsGenerating(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return !!healthGoal;
    if (step === 1) return !!dietType;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Welcome to VitaPlate 🥗</h1>
          <p className="text-slate-500 mt-2">Let's set up your personalized nutrition plan in 5 steps</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i < step ? 'bg-indigo-600 text-white' :
                i === step ? 'bg-indigo-600 text-white ring-4 ring-indigo-200' :
                'bg-slate-200 text-slate-500'
              }`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-8 md:w-16 lg:w-24 mx-1 transition-all ${i < step ? 'bg-indigo-600' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="shadow-lg border-0">
              <CardContent className="p-8">
                {/* Step 0: Health Goal */}
                {step === 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">What's your primary health goal?</h2>
                    <p className="text-slate-500 text-sm mb-6">We'll tailor every meal to support this goal</p>
                    <div className="grid grid-cols-2 gap-3">
                      {healthGoals.map(g => (
                        <button
                          key={g.value}
                          onClick={() => setHealthGoal(g.value)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            healthGoal === g.value
                              ? 'border-indigo-600 bg-indigo-50'
                              : 'border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          <div className="text-2xl mb-2">{g.emoji}</div>
                          <div className="font-semibold text-sm text-slate-900">{g.label}</div>
                          <div className="text-xs text-slate-500 mt-1">{g.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 1: Diet Type */}
                {step === 1 && (
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">What diet type fits you best?</h2>
                    <p className="text-slate-500 text-sm mb-6">This helps us structure your meals</p>
                    <div className="grid grid-cols-2 gap-3">
                      {dietTypes.map(d => (
                        <button
                          key={d.value}
                          onClick={() => setDietType(d.value)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            dietType === d.value
                              ? 'border-indigo-600 bg-indigo-50'
                              : 'border-slate-200 hover:border-indigo-300'
                          }`}
                        >
                          <div className="text-2xl mb-2">{d.emoji}</div>
                          <div className="font-semibold text-sm text-slate-900">{d.label}</div>
                          <div className="text-xs text-slate-500 mt-1">{d.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Allergies */}
                {step === 2 && (
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Any food allergies or restrictions?</h2>
                    <p className="text-slate-500 text-sm mb-6">We'll strictly exclude these from all meal suggestions</p>
                    <div className="grid grid-cols-2 gap-3">
                      {allergenList.map(a => (
                        <label
                          key={a.value}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            allergens.includes(a.value)
                              ? 'border-rose-400 bg-rose-50'
                              : 'border-slate-200 hover:border-rose-200'
                          }`}
                        >
                          <Checkbox
                            checked={allergens.includes(a.value)}
                            onCheckedChange={(checked) => {
                              setAllergens(checked
                                ? [...allergens, a.value]
                                : allergens.filter(x => x !== a.value)
                              );
                            }}
                          />
                          <span className="font-medium text-sm">{a.label}</span>
                        </label>
                      ))}
                    </div>
                    {allergens.length === 0 && (
                      <p className="text-xs text-slate-400 mt-4 text-center">No allergies? Great! Just click Next.</p>
                    )}
                  </div>
                )}

                {/* Step 3: Budget */}
                {step === 3 && (
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">What's your weekly grocery budget?</h2>
                    <p className="text-slate-500 text-sm mb-6">We'll optimize your plan to stay within budget</p>
                    <div className="space-y-6">
                      <div>
                        <Label className="text-sm font-medium">Number of people</Label>
                        <div className="flex gap-2 mt-2">
                          {[1, 2, 3, 4, 5, 6].map(n => (
                            <button
                              key={n}
                              onClick={() => setNumPeople(n)}
                              className={`w-12 h-12 rounded-xl border-2 font-bold transition-all ${
                                numPeople === n
                                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                  : 'border-slate-200 text-slate-600 hover:border-indigo-300'
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Weekly budget: <span className="text-indigo-600 text-lg font-bold">${weeklyBudget}</span>
                        </Label>
                        <input
                          type="range"
                          min="30"
                          max="500"
                          step="10"
                          value={weeklyBudget}
                          onChange={(e) => setWeeklyBudget(Number(e.target.value))}
                          className="w-full mt-3 accent-indigo-600"
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                          <span>$30</span>
                          <span>$500</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[50, 100, 150, 200, 300, 400].map(preset => (
                          <button
                            key={preset}
                            onClick={() => setWeeklyBudget(preset)}
                            className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                              weeklyBudget === preset
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                : 'border-slate-200 text-slate-600 hover:border-indigo-300'
                            }`}
                          >
                            ${preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Generate */}
                {step === 4 && (
                  <div className="text-center py-4">
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">You're all set!</h2>
                    <p className="text-slate-500 mb-6">Here's a summary of your preferences:</p>
                    <div className="space-y-2 text-left bg-slate-50 rounded-xl p-4 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Health Goal</span>
                        <span className="font-medium">{healthGoals.find(g => g.value === healthGoal)?.label}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Diet Type</span>
                        <span className="font-medium">{dietTypes.find(d => d.value === dietType)?.label}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Allergies</span>
                        <span className="font-medium">{allergens.length > 0 ? allergens.join(', ') : 'None'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Budget</span>
                        <span className="font-medium">${weeklyBudget}/week for {numPeople} {numPeople === 1 ? 'person' : 'people'}</span>
                      </div>
                    </div>
                    <Button
                      onClick={handleFinish}
                      disabled={isGenerating}
                      size="lg"
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Generating your first plan...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Generate My First Meal Plan
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Nav buttons */}
        {step < 4 && (
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => step > 0 ? setStep(step - 1) : navigate('/')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {step === 0 ? 'Back to Home' : 'Back'}
            </Button>
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}