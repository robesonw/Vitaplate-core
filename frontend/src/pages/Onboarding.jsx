import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44, supabase } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, Check, Loader2, FlaskConical, ChefHat, Target } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const STEPS = ['Health Goal', 'Conditions', 'Diet & Allergens', 'Budget', 'Generate'];

const healthGoals = [
  { value: 'liver_health',       label: 'Liver Health',     emoji: '🫀', desc: 'Support liver detox & enzymes' },
  { value: 'weight_loss',        label: 'Weight Loss',      emoji: '⚖️', desc: 'Reduce calories, boost metabolism' },
  { value: 'blood_sugar_control',label: 'Blood Sugar',      emoji: '🩸', desc: 'Low-glycemic, steady energy' },
  { value: 'muscle_gain',        label: 'Muscle Gain',      emoji: '💪', desc: 'High protein, strength focus' },
  { value: 'heart_health',       label: 'Heart Health',     emoji: '❤️', desc: 'Omega-3s, low sodium' },
  { value: 'kidney_health',      label: 'Kidney Health',    emoji: '🫘', desc: 'Low potassium, phosphorus' },
  { value: 'anti_inflammatory',  label: 'Anti-Inflammatory',emoji: '🌿', desc: 'Reduce CRP, omega-3 focus' },
  { value: 'general_wellness',   label: 'General Wellness', emoji: '✨', desc: 'Balanced, nutrient-rich' },
];

const conditions = [
  { field: 'diabetesType',    label: 'Diabetes / Prediabetes', options: [{ v: 'pre_diabetes', l: 'Prediabetes' }, { v: 'type2', l: 'Type 2 Diabetes' }, { v: 'type1', l: 'Type 1 Diabetes' }] },
  { field: 'heartCondition',  label: 'Heart Condition',        options: [{ v: 'high_cholesterol', l: 'High Cholesterol' }, { v: 'hypertension', l: 'Hypertension' }, { v: 'heart_disease', l: 'Heart Disease' }] },
  { field: 'kidneyStage',     label: 'Kidney Disease',         options: [{ v: 'stage_1', l: 'Stage 1' }, { v: 'stage_2', l: 'Stage 2' }, { v: 'stage_3', l: 'Stage 3' }] },
  { field: 'thyroidCondition',label: 'Thyroid Condition',      options: [{ v: 'hypothyroid', l: 'Hypothyroidism' }, { v: 'hyperthyroid', l: 'Hyperthyroidism' }, { v: 'hashimotos', l: "Hashimoto's" }] },
];

const dietTypes = [
  { value: 'liver-centric', label: 'Liver-Centric',       emoji: '🥦', desc: 'Cruciferous veg, antioxidants' },
  { value: 'low-sugar',     label: 'Low Sugar',            emoji: '🚫', desc: 'Minimal refined carbs' },
  { value: 'vegetarian',    label: 'Vegetarian',           emoji: '🌱', desc: 'Plant-based, no meat' },
  { value: 'custom',        label: 'No Restriction',       emoji: '🍽️', desc: 'Balanced mixed diet' },
];

const allergenList = ['nuts', 'dairy', 'gluten', 'shellfish', 'eggs', 'soy', 'fish', 'sesame', 'peanuts', 'wheat'];

export default function Onboarding() {
  const navigate  = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep]               = useState(0);
  const [healthGoal, setHealthGoal]   = useState('');
  const [selectedConditions, setSelectedConditions] = useState({});
  const [dietType, setDietType]       = useState('custom');
  const [allergens, setAllergens]     = useState([]);
  const [weeklyBudget, setWeeklyBudget] = useState(100);
  const [numPeople, setNumPeople]     = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');

  const toggleAllergen = (a) => setAllergens(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  const toggleCondition = (field, value) => {
    setSelectedConditions(prev => ({ ...prev, [field]: prev[field] === value ? '' : value }));
  };

  const canNext = () => {
    if (step === 0) return !!healthGoal;
    return true;
  };

  const handleFinish = async () => {
    setIsGenerating(true);
    try {
      // 1. Save preferences
      setGenerationStep('Saving your health profile...');
      const prefs = {
        healthGoal,
        dietType,
        allergens,
        numPeople,
        weeklyBudget,
        cookingTime: 'any',
        skillLevel: 'intermediate',
        diabetesType:     selectedConditions.diabetesType    || null,
        heartCondition:   selectedConditions.heartCondition  || null,
        kidneyStage:      selectedConditions.kidneyStage     || null,
        thyroidCondition: selectedConditions.thyroidCondition|| null,
      };
      await base44.entities.UserPreferences.create(prefs);

      // 2. Generate first meal plan via real backend
      setGenerationStep('Generating your personalized meal plan...');
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`${API}/api/meal-plans/generate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name:        `My ${healthGoals.find(g => g.value === healthGoal)?.label || 'Personalized'} Plan`,
          preferences: prefs,
          biomarkers:  {},
        }),
      });

      const plan = await res.json();
      if (!res.ok) throw new Error(plan.error || 'Plan generation failed');

      setGenerationStep('Marking setup complete...');

      // 3. Mark onboarding complete
      await fetch(`${API}/api/user/onboarding/complete`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });

      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });

      toast.success('Your meal plan is ready! 🎉');
      navigate('/Dashboard');
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const StepDots = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`flex items-center justify-center rounded-full font-semibold text-xs transition-all
            ${i < step ? 'w-6 h-6 bg-emerald-500 text-white' :
              i === step ? 'w-8 h-8 bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' :
              'w-6 h-6 bg-slate-200 text-slate-400'}`}>
            {i < step ? <Check className="w-3 h-3" /> : i + 1}
          </div>
          {i < STEPS.length - 1 && <div className={`w-8 h-0.5 rounded-full ${i < step ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-lg">V</span>
            </div>
            <span className="text-white font-bold text-xl">VitaPlate</span>
          </div>
          <p className="text-slate-400 text-sm">Let's build your biomarker-optimized nutrition plan</p>
        </div>

        <StepDots />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Step 0 — Health Goal */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-1">What's your primary health goal?</h2>
                  <p className="text-slate-400 text-sm">This shapes every meal recommendation</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {healthGoals.map(g => (
                    <button key={g.value} onClick={() => setHealthGoal(g.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        healthGoal === g.value
                          ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}>
                      <span className="text-2xl mb-2 block">{g.emoji}</span>
                      <p className="font-semibold text-white text-sm">{g.label}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{g.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1 — Conditions */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-1">Any health conditions?</h2>
                  <p className="text-slate-400 text-sm">Optional — but dramatically improves personalization</p>
                </div>
                <div className="space-y-3">
                  {conditions.map(c => (
                    <div key={c.field} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                      <p className="text-white font-medium text-sm mb-3">{c.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {c.options.map(opt => (
                          <button key={opt.v} onClick={() => toggleCondition(c.field, opt.v)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              selectedConditions[c.field] === opt.v
                                ? 'bg-indigo-500 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}>
                            {opt.l}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                  <div className="flex items-center gap-2 text-indigo-300 text-xs">
                    <FlaskConical className="w-4 h-4 flex-shrink-0" />
                    <span>You can also upload lab results later — your meal plan will automatically adapt to your exact biomarker values.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 — Diet & Allergens */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-2">
                  <h2 className="text-2xl font-bold text-white mb-1">Diet preferences & allergens</h2>
                  <p className="text-slate-400 text-sm">We'll never include foods that don't work for you</p>
                </div>
                <div>
                  <p className="text-slate-300 text-sm font-medium mb-3">Diet style</p>
                  <div className="grid grid-cols-2 gap-3">
                    {dietTypes.map(d => (
                      <button key={d.value} onClick={() => setDietType(d.value)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          dietType === d.value
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                        }`}>
                        <span className="text-xl block mb-1">{d.emoji}</span>
                        <p className="font-semibold text-white text-sm">{d.label}</p>
                        <p className="text-slate-400 text-xs">{d.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-slate-300 text-sm font-medium mb-3">Allergens to avoid</p>
                  <div className="flex flex-wrap gap-2">
                    {allergenList.map(a => (
                      <button key={a} onClick={() => toggleAllergen(a)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                          allergens.includes(a)
                            ? 'bg-red-500 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}>
                        {allergens.includes(a) ? '✗ ' : ''}{a}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 — Budget */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-2">
                  <h2 className="text-2xl font-bold text-white mb-1">Budget & serving size</h2>
                  <p className="text-slate-400 text-sm">So your grocery list stays realistic</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 space-y-6">
                  <div>
                    <Label className="text-slate-300 text-sm mb-3 block">Weekly grocery budget</Label>
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-bold text-white">${weeklyBudget}</span>
                      <div className="flex-1">
                        <input type="range" min="40" max="400" step="10"
                          value={weeklyBudget} onChange={e => setWeeklyBudget(+e.target.value)}
                          className="w-full accent-indigo-500" />
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                          <span>$40</span><span>$400</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm mb-3 block">Number of people</Label>
                    <div className="flex items-center gap-3">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} onClick={() => setNumPeople(n)}
                          className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                            numPeople === n ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}>{n}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <p className="text-slate-300 text-sm font-medium mb-2">Your plan summary</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2 bg-slate-700/50 rounded-lg">
                      <p className="text-indigo-400 font-bold">{healthGoals.find(g => g.value === healthGoal)?.emoji}</p>
                      <p className="text-xs text-slate-400 mt-1">{healthGoals.find(g => g.value === healthGoal)?.label}</p>
                    </div>
                    <div className="p-2 bg-slate-700/50 rounded-lg">
                      <p className="text-emerald-400 font-bold text-sm">{dietTypes.find(d => d.value === dietType)?.emoji}</p>
                      <p className="text-xs text-slate-400 mt-1">{dietTypes.find(d => d.value === dietType)?.label}</p>
                    </div>
                    <div className="p-2 bg-slate-700/50 rounded-lg">
                      <p className="text-amber-400 font-bold">${weeklyBudget}</p>
                      <p className="text-xs text-slate-400 mt-1">for {numPeople} {numPeople === 1 ? 'person' : 'people'}</p>
                    </div>
                  </div>
                  {Object.values(selectedConditions).filter(Boolean).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {Object.values(selectedConditions).filter(Boolean).map(v => (
                        <Badge key={v} className="text-xs bg-indigo-500/20 text-indigo-300">{v.replace(/_/g,' ')}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4 — Generate */}
            {step === 4 && (
              <div className="text-center space-y-6">
                <div>
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/30">
                    <ChefHat className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Ready to generate your plan!</h2>
                  <p className="text-slate-400">Our AI will create a 7-day personalized meal plan optimized for your health goals{Object.values(selectedConditions).filter(Boolean).length > 0 ? ' and conditions' : ''}.</p>
                </div>

                {isGenerating ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                      <p className="text-indigo-300 font-medium">{generationStep}</p>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                    </div>
                    <p className="text-slate-500 text-sm">This takes about 20 seconds — we're building something personalized just for you.</p>
                  </div>
                ) : (
                  <Button onClick={handleFinish}
                    className="w-full h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-base shadow-xl shadow-indigo-500/30">
                    Generate My Meal Plan
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                )}

                <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
                  <Target className="w-3 h-3" />
                  <span>You can refine everything in your settings anytime</span>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Nav buttons */}
        {step < 4 && (
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 bg-transparent">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            )}
            <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40">
              {step === 3 ? 'Review & Generate' : 'Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
