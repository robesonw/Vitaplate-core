import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, Check, Loader2, ChefHat } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Map quiz concern values → healthGoal values
const CONCERN_TO_GOAL = {
  cholesterol:  'heart_health',
  blood_sugar:  'blood_sugar_control',
  energy:       'general_wellness',
  inflammation: 'anti_inflammatory',
  weight:       'weight_loss',
  thyroid:      'general_wellness',
  kidney:       'kidney_health',
  general:      'general_wellness',
};

const DIET_MAP = {
  none:        'custom',
  vegetarian:  'vegetarian',
  vegan:       'vegetarian',
  gluten_free: 'custom',
  low_carb:    'low-sugar',
  halal:       'custom',
};

const healthGoals = [
  { value: 'heart_health',       label: 'Heart Health',      emoji: '❤️',  desc: 'Omega-3s, low sodium' },
  { value: 'blood_sugar_control',label: 'Blood Sugar',       emoji: '🩸',  desc: 'Low-glycemic, steady energy' },
  { value: 'weight_loss',        label: 'Weight Loss',       emoji: '⚖️',  desc: 'Reduce calories, boost metabolism' },
  { value: 'muscle_gain',        label: 'Muscle Gain',       emoji: '💪',  desc: 'High protein, strength focus' },
  { value: 'anti_inflammatory',  label: 'Anti-Inflammatory', emoji: '🌿',  desc: 'Reduce CRP, omega-3 focus' },
  { value: 'kidney_health',      label: 'Kidney Health',     emoji: '🫘',  desc: 'Low potassium, phosphorus' },
  { value: 'liver_health',       label: 'Liver Health',      emoji: '🫀',  desc: 'Support liver detox & enzymes' },
  { value: 'general_wellness',   label: 'General Wellness',  emoji: '✨',  desc: 'Balanced, nutrient-rich' },
];

const conditions = [
  { field: 'diabetesType',    label: 'Diabetes / Prediabetes',
    options: [{ v: 'pre_diabetes', l: 'Prediabetes' }, { v: 'type2', l: 'Type 2' }, { v: 'type1', l: 'Type 1' }] },
  { field: 'heartCondition',  label: 'Heart Condition',
    options: [{ v: 'high_cholesterol', l: 'High Cholesterol' }, { v: 'hypertension', l: 'Hypertension' }, { v: 'heart_disease', l: 'Heart Disease' }] },
  { field: 'kidneyStage',     label: 'Kidney Disease',
    options: [{ v: 'stage_1', l: 'Stage 1' }, { v: 'stage_2', l: 'Stage 2' }, { v: 'stage_3', l: 'Stage 3' }] },
  { field: 'thyroidCondition',label: 'Thyroid Condition',
    options: [{ v: 'hypothyroid', l: 'Hypothyroidism' }, { v: 'hyperthyroid', l: 'Hyperthyroidism' }, { v: 'hashimotos', l: "Hashimoto's" }] },
];

const allergenList = ['nuts', 'dairy', 'gluten', 'shellfish', 'eggs', 'soy', 'fish', 'sesame'];

// 3 steps only: Conditions → Allergens → Budget
// Health goal pre-filled from quiz; diet pre-filled from quiz
const STEPS = ['Conditions', 'Allergens & Budget', 'All Set'];

export default function Onboarding() {
  const navigate     = useNavigate();
  const queryClient  = useQueryClient();
  const [step, setStep]     = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Pre-fill from quiz sessionStorage
  const quizData = (() => {
    try { return JSON.parse(sessionStorage.getItem('vp_quiz') || '{}'); }
    catch { return {}; }
  })();

  const [healthGoal, setHealthGoal] = useState(
    CONCERN_TO_GOAL[quizData.concern] || ''
  );
  const [dietType, setDietType] = useState(
    DIET_MAP[quizData.diet] || 'custom'
  );
  const [selectedConditions, setSelectedConditions] = useState({});
  const [autoCompleting, setAutoCompleting] = useState(false);

  // If user came from quiz — they already answered the key questions.
  // Skip all onboarding steps and go directly to Dashboard.
  useEffect(() => {
    if (!quizData.concern) return; // No quiz data — show normal onboarding

    const autoComplete = async () => {
      setAutoCompleting(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) { navigate('/Dashboard?welcome=1'); return; }

        const prefs = {
          healthGoal:          CONCERN_TO_GOAL[quizData.concern] || 'general_wellness',
          dietaryRestrictions: DIET_MAP[quizData.diet] || '',
          allergens:           [],
          numPeople:           1,
          weeklyBudget:        100,
          cookingTime:         'any',
          skillLevel:          'intermediate',
        };

        // Save prefs + mark complete in parallel — fire and forget
        Promise.all([
          fetch(`${API}/api/user/preferences`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(prefs),
          }),
          fetch(`${API}/api/user/onboarding/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          }),
        ]).catch(e => console.warn('Auto-complete save failed (non-fatal):', e.message));

        sessionStorage.removeItem('vp_quiz');
        navigate('/Dashboard?welcome=1');
      } catch (err) {
        console.warn('Auto-complete failed, showing onboarding:', err.message);
        setAutoCompleting(false);
      }
    };

    autoComplete();
  }, []); // run once on mount
  const [allergens, setAllergens]   = useState([]);
  const [weeklyBudget, setWeeklyBudget] = useState(100);
  const [numPeople, setNumPeople]   = useState(1);

  // If no health goal from quiz, ask on step -1 (prepend a goal step)
  const needsGoalStep = !healthGoal;
  const [goalStep, setGoalStep] = useState(needsGoalStep);

  const toggleAllergen = (a) =>
    setAllergens(p => p.includes(a) ? p.filter(x => x !== a) : [...p, a]);
  const toggleCondition = (field, value) =>
    setSelectedConditions(p => ({ ...p, [field]: p[field] === value ? '' : value }));

  // ─── Save and navigate ──────────────────────────────────────────────────────
  const handleFinish = async () => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        // Not logged in — send to sign in first, then come back
        sessionStorage.setItem('vp_onboarding_pending', '1');
        navigate('/Dashboard');
        return;
      }

      const prefs = {
        healthGoal:          healthGoal || 'general_wellness',
        dietaryRestrictions: dietType !== 'custom' ? dietType : '',
        allergens,
        numPeople,
        weeklyBudget,
        cookingTime:         'any',
        skillLevel:          'intermediate',
        diabetesType:        selectedConditions.diabetesType    || null,
        heartCondition:      selectedConditions.heartCondition  || null,
        kidneyStage:         selectedConditions.kidneyStage     || null,
        thyroidCondition:    selectedConditions.thyroidCondition || null,
      };

      // Save preferences (non-blocking — navigate regardless)
      const prefsPromise = fetch(`${API}/api/user/preferences`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify(prefs),
      }).catch(e => console.warn('Prefs save failed:', e.message));

      // Mark onboarding complete (non-blocking)
      const completePromise = fetch(`${API}/api/user/onboarding/complete`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      }).catch(e => console.warn('Onboarding complete failed:', e.message));

      // Navigate immediately — don't wait for saves
      sessionStorage.removeItem('vp_quiz');
      navigate('/Dashboard?welcome=1');

      // Let saves finish in background
      await Promise.all([prefsPromise, completePromise]);
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });

    } catch (err) {
      console.warn('Onboarding error (navigating anyway):', err.message);
      navigate('/Dashboard?welcome=1');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Step dots ──────────────────────────────────────────────────────────────
  const allSteps = goalStep ? ['Your Goal', ...STEPS] : STEPS;
  const currentStepIndex = goalStep ? step : step; // step 0 = goal if goalStep

  const StepDots = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {allSteps.map((s, i) => {
        const isDone   = i < step;
        const isActive = i === step;
        return (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center justify-center rounded-full font-semibold text-xs transition-all ${
              isDone   ? 'w-6 h-6 bg-emerald-500 text-white' :
              isActive ? 'w-8 h-8 bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' :
                         'w-6 h-6 bg-slate-700 text-slate-500'
            }`}>
              {isDone ? <Check className="w-3 h-3" /> : i + 1}
            </div>
            {i < allSteps.length - 1 && (
              <div className={`w-8 h-0.5 rounded-full ${isDone ? 'bg-emerald-400' : 'bg-slate-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  // Show a brief loading screen while auto-completing for quiz users
  if (autoCompleting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/30">
            <span className="text-white font-black text-2xl">V</span>
          </div>
          <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-indigo-300 font-medium">Setting up your profile…</p>
          <p className="text-slate-500 text-sm">Taking you to your dashboard</p>
        </div>
      </div>
    );
  }

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
          <p className="text-slate-400 text-sm">
            {quizData.concern
              ? "Almost there — a few details to personalize your plan"
              : "Let's build your biomarker-optimized nutrition plan"}
          </p>
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

            {/* ── Goal step (only shown if not pre-filled from quiz) ─────────── */}
            {goalStep && step === 0 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-1">What's your primary health goal?</h2>
                  <p className="text-slate-400 text-sm">This shapes every meal recommendation</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {healthGoals.map(g => (
                    <button key={g.value} onClick={() => { setHealthGoal(g.value); setStep(1); }}
                      className="p-4 rounded-xl border-2 border-slate-700 bg-slate-800/50 hover:border-indigo-500 hover:bg-indigo-500/10 text-left transition-all">
                      <span className="text-2xl mb-2 block">{g.emoji}</span>
                      <p className="font-semibold text-white text-sm">{g.label}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{g.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Step: Conditions ─────────────────────────────────────────────── */}
            {step === (goalStep ? 1 : 0) && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-1">Any health conditions?</h2>
                  <p className="text-slate-400 text-sm">Optional — skip if none apply</p>
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
              </div>
            )}

            {/* ── Step: Allergens + Budget ─────────────────────────────────────── */}
            {step === (goalStep ? 2 : 1) && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-1">Final details</h2>
                  <p className="text-slate-400 text-sm">Allergens and budget — then you're in</p>
                </div>

                {/* Allergens */}
                <div>
                  <p className="text-slate-300 text-sm font-medium mb-3">Foods to avoid</p>
                  <div className="flex flex-wrap gap-2">
                    {allergenList.map(a => (
                      <button key={a} onClick={() => toggleAllergen(a)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                          allergens.includes(a)
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-500'
                        }`}>
                        {allergens.includes(a) ? '✗ ' : ''}{a}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-5 space-y-4">
                  <div>
                    <p className="text-slate-300 text-sm font-medium mb-2">Weekly grocery budget</p>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-white w-20">${weeklyBudget}</span>
                      <input type="range" min="40" max="400" step="10"
                        value={weeklyBudget} onChange={e => setWeeklyBudget(+e.target.value)}
                        className="flex-1 accent-indigo-500" />
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-300 text-sm font-medium mb-2">Cooking for</p>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} onClick={() => setNumPeople(n)}
                          className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                            numPeople === n ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}>{n}</button>
                      ))}
                      <span className="text-slate-400 text-sm self-center ml-1">
                        {numPeople === 1 ? 'person' : 'people'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Final step: Summary + CTA ─────────────────────────────────────── */}
            {step === (goalStep ? 3 : 2) && (
              <div className="space-y-5">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/30">
                    <ChefHat className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-1">You're all set!</h2>
                  <p className="text-slate-400 text-sm">Your profile is saved. Your meal plan will start building the moment you enter.</p>
                </div>

                {/* Summary */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 space-y-2.5">
                  {[
                    { label: 'Goal',    value: healthGoals.find(g => g.value === healthGoal)?.label },
                    { label: 'Budget',  value: `$${weeklyBudget}/week · ${numPeople} ${numPeople === 1 ? 'person' : 'people'}` },
                    allergens.length > 0 && { label: 'Avoids', value: allergens.join(', ') },
                    Object.values(selectedConditions).filter(Boolean).length > 0 && {
                      label: 'Conditions',
                      value: Object.values(selectedConditions).filter(Boolean).map(v => v.replace(/_/g, ' ')).join(', '),
                    },
                  ].filter(Boolean).map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">{label}</span>
                      <span className="text-white font-medium capitalize">{value}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleFinish}
                  disabled={isSaving}
                  className="w-full h-14 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-base shadow-xl shadow-indigo-500/30 disabled:opacity-60"
                >
                  {isSaving
                    ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving your profile...</>
                    : <>Enter VitaPlate <ArrowRight className="w-5 h-5 ml-2" /></>
                  }
                </Button>
                <p className="text-center text-slate-600 text-xs">Your meal plan builds automatically in the background</p>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Nav — only show Continue/Back when NOT on the final step and NOT on goal-select step */}
        {!(goalStep && step === 0) && step !== (goalStep ? 3 : 2) && (
          <div className="flex gap-3 mt-8">
            {step > (goalStep ? 1 : 0) && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 bg-transparent">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            )}
            <Button onClick={() => setStep(s => s + 1)}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
