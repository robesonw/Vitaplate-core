import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, CheckCircle, FlaskConical, Sparkles, TrendingDown } from 'lucide-react';

// ─── Quiz data ─────────────────────────────────────────────────────────────────
const QUIZ = [
  {
    id: 'concern',
    headline: "What's your biggest health concern right now?",
    sub: "We'll show you which biomarkers to watch and what to eat.",
    type: 'single',
    options: [
      { value: 'cholesterol',   label: 'High cholesterol',    emoji: '🫀', marker: 'LDL Cholesterol' },
      { value: 'blood_sugar',   label: 'Blood sugar / diabetes', emoji: '🩸', marker: 'HbA1c' },
      { value: 'energy',        label: 'Low energy & fatigue',  emoji: '⚡', marker: 'Vitamin D / B12' },
      { value: 'inflammation',  label: 'Inflammation / pain',   emoji: '🔥', marker: 'CRP' },
      { value: 'weight',        label: 'Weight management',     emoji: '⚖️', marker: 'Triglycerides' },
      { value: 'thyroid',       label: 'Thyroid issues',        emoji: '🦋', marker: 'TSH' },
      { value: 'kidney',        label: 'Kidney health',         emoji: '🫘', marker: 'eGFR / Creatinine' },
      { value: 'general',       label: 'General wellness',      emoji: '✨', marker: 'Full Panel' },
    ],
  },
  {
    id: 'labs',
    headline: "Have you had blood work done in the last 2 years?",
    sub: "This helps us show you exactly how VitaPlate works for you.",
    type: 'single',
    options: [
      { value: 'yes_recent',  label: 'Yes — I have recent labs',       emoji: '📋', desc: "We'll extract your exact values" },
      { value: 'yes_old',     label: 'Yes — but they\'re old',          emoji: '📁', desc: "Still useful for personalization" },
      { value: 'no_upcoming', label: 'No — but I have an upcoming test', emoji: '🗓️', desc: "We'll build a plan for your goals" },
      { value: 'no',          label: 'No labs yet',                     emoji: '🚀', desc: "Start with goals — upload later" },
    ],
  },
  {
    id: 'diet',
    headline: "Any dietary preferences or restrictions?",
    sub: "Your meals will never include foods that don't work for you.",
    type: 'single',
    options: [
      { value: 'none',        label: 'No restrictions',     emoji: '🍽️', desc: 'Balanced mixed diet' },
      { value: 'vegetarian',  label: 'Vegetarian',          emoji: '🌱', desc: 'No meat' },
      { value: 'vegan',       label: 'Vegan',               emoji: '🥦', desc: 'No animal products' },
      { value: 'gluten_free', label: 'Gluten-free',         emoji: '🌾', desc: 'No wheat/gluten' },
      { value: 'low_carb',    label: 'Low carb / keto',     emoji: '🥑', desc: 'Minimal refined carbs' },
      { value: 'halal',       label: 'Halal',               emoji: '☪️', desc: 'Halal certified foods' },
    ],
  },
  {
    id: 'goal',
    headline: "What does success look like for you?",
    sub: "In 3 months of following your VitaPlate plan, what would make you thrilled?",
    type: 'single',
    options: [
      { value: 'numbers',     label: 'Better lab numbers',         emoji: '📊', desc: 'Lower LDL, better HbA1c' },
      { value: 'energy',      label: 'More energy every day',      emoji: '☀️', desc: 'Wake up feeling great' },
      { value: 'weight',      label: 'Healthy weight',             emoji: '⚖️', desc: 'Sustainable loss/gain' },
      { value: 'habits',      label: 'Healthier eating habits',    emoji: '🥗', desc: 'Know what to eat and why' },
    ],
  },
];

// ─── Biomarker insight map ──────────────────────────────────────────────────────
const CONCERN_INSIGHTS = {
  cholesterol: {
    headline: 'Your LDL is the key number to watch',
    insight: 'High LDL responds dramatically to dietary changes — omega-3s, soluble fiber, and plant sterols can reduce it by 15-25% in 8 weeks.',
    foods: ['Salmon', 'Oats', 'Avocado', 'Walnuts', 'Olive oil'],
    marker: 'LDL Cholesterol',
    color: '#ef4444',
    improvement: '↓ 15-25% in 8 weeks',
  },
  blood_sugar: {
    headline: 'HbA1c and fasting glucose respond to every meal',
    insight: 'The glycemic load of what you eat directly impacts your A1c reading. Low-glycemic meal plans can reduce HbA1c by 0.5-1.5% within 12 weeks.',
    foods: ['Lentils', 'Quinoa', 'Broccoli', 'Chia seeds', 'Cinnamon'],
    marker: 'HbA1c',
    color: '#f59e0b',
    improvement: '↓ 0.5-1.5% HbA1c in 12 weeks',
  },
  energy: {
    headline: 'Vitamin D and B12 deficiency is more common than you think',
    insight: 'Over 40% of adults are Vitamin D deficient. A deficiency in D or B12 causes the chronic fatigue most people mistake for "just being tired".',
    foods: ['Eggs', 'Mushrooms', 'Fatty fish', 'Fortified foods', 'Beef liver'],
    marker: 'Vitamin D',
    color: '#8b5cf6',
    improvement: '↑ energy within 4-6 weeks',
  },
  inflammation: {
    headline: 'CRP (C-Reactive Protein) is your inflammation biomarker',
    insight: 'Chronic low-grade inflammation shows up in your CRP reading. Turmeric, omega-3s, and antioxidant-rich foods can cut CRP by 30%+ in 6 weeks.',
    foods: ['Turmeric', 'Fatty fish', 'Blueberries', 'Ginger', 'Dark leafy greens'],
    marker: 'hsCRP',
    color: '#f97316',
    improvement: '↓ CRP 30%+ in 6 weeks',
  },
  weight: {
    headline: 'Triglycerides drop fastest with the right macros',
    insight: 'High triglycerides are more responsive to diet than almost any other marker — reducing refined carbs and increasing omega-3s can drop them 20-50mg/dL in a month.',
    foods: ['Fish', 'Olive oil', 'Nuts', 'Legumes', 'Low-sugar fruits'],
    marker: 'Triglycerides',
    color: '#10b981',
    improvement: '↓ 20-50 mg/dL in 4 weeks',
  },
  thyroid: {
    headline: 'TSH and thyroid function are sensitive to selenium and iodine',
    insight: 'Your diet directly impacts thyroid hormone production. Certain foods suppress thyroid function (goitrogens) while others support it — your plan avoids the former.',
    foods: ['Brazil nuts', 'Seaweed', 'Eggs', 'Dairy', 'Seafood'],
    marker: 'TSH',
    color: '#06b6d4',
    improvement: 'Optimized thyroid support',
  },
  kidney: {
    headline: 'eGFR and creatinine need very specific dietary control',
    insight: 'Kidney health requires precise potassium, phosphorus, and protein management — a standard meal plan can actually make things worse. Yours will be exactly calibrated.',
    foods: ['Cauliflower', 'Cabbage', 'Garlic', 'Olive oil', 'Egg whites'],
    marker: 'eGFR',
    color: '#84cc16',
    improvement: 'Kidney-protective every meal',
  },
  general: {
    headline: 'A full panel gives VitaPlate the most to work with',
    insight: 'Even when all markers look "normal," there are optimization opportunities — the difference between normal and optimal can mean 20+ years of better health.',
    foods: ['Mediterranean staples', 'Lean proteins', 'Colorful produce', 'Healthy fats', 'Legumes'],
    marker: 'Full Panel',
    color: '#6366f1',
    improvement: 'Optimized across all markers',
  },
};

// ─── Results screen ─────────────────────────────────────────────────────────────
function ResultsScreen({ answers }) {
  const insight = CONCERN_INSIGHTS[answers.concern] || CONCERN_INSIGHTS.general;
  const hasLabs = answers.labs === 'yes_recent' || answers.labs === 'yes_old';
  const navigate = useNavigate();

  const handleGetPlan = () => {
    // Store quiz answers in sessionStorage so Onboarding can pre-fill
    sessionStorage.setItem('vp_quiz', JSON.stringify(answers));
    navigate('/Onboarding');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Analysis complete badge */}
      <div className="flex items-center gap-2 justify-center">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center"
        >
          <CheckCircle className="w-6 h-6 text-emerald-400" />
        </motion.div>
        <span className="text-emerald-400 font-semibold text-sm tracking-wide uppercase">Profile Complete</span>
      </div>

      {/* Main insight card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-white/10 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)' }}
      >
        {/* Header bar */}
        <div className="p-5 border-b border-white/5"
          style={{ background: `linear-gradient(135deg, ${insight.color}15, ${insight.color}05)` }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4" style={{ color: insight.color }} />
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: insight.color }}>
                Key Biomarker
              </span>
            </div>
            <span className="text-xs px-3 py-1 rounded-full font-semibold"
              style={{ background: `${insight.color}20`, color: insight.color }}>
              {insight.improvement}
            </span>
          </div>
          <h3 className="text-white font-bold text-lg leading-tight">{insight.headline}</h3>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-slate-400 text-sm leading-relaxed">{insight.insight}</p>

          {/* Foods preview */}
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Foods your plan will include</p>
            <div className="flex flex-wrap gap-2">
              {insight.foods.map(f => (
                <span key={f} className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* What VitaPlate will do */}
          <div className="p-3 rounded-xl bg-indigo-500/8 border border-indigo-500/20">
            <p className="text-xs text-indigo-300 font-semibold mb-1">
              {hasLabs ? "When you upload your labs, VitaPlate will:" : "Your personalized plan will:"}
            </p>
            <ul className="space-y-1">
              {[
                `Extract your exact ${insight.marker} value and flag it against optimal ranges`,
                'Build a 7-day meal plan where every meal addresses this specific marker',
                'Track improvement as you upload new labs over time',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-indigo-200/80">
                  <span className="text-indigo-400 mt-0.5 flex-shrink-0">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Sample plan preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="rounded-2xl border border-white/8 p-5"
        style={{ background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <p className="text-sm font-semibold text-white">Preview: Day 1 of your plan</p>
          <span className="ml-auto text-xs text-slate-500">Blurred until account created</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { meal: 'Breakfast', name: insight.foods[0] + ' Bowl', blur: false },
            { meal: 'Lunch',     name: 'Optimized for ' + insight.marker, blur: true },
            { meal: 'Dinner',    name: 'Personalized recipe', blur: true },
            { meal: 'Snack',     name: 'Biomarker-targeted', blur: true },
          ].map(({ meal, name, blur }) => (
            <div key={meal}
              className={`p-3 rounded-xl border border-white/5 bg-white/3 ${blur ? 'filter blur-sm select-none' : ''}`}>
              <p className="text-xs text-slate-500">{meal}</p>
              <p className="text-sm text-slate-200 font-medium mt-0.5">{name}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-3"
      >
        <button onClick={handleGetPlan}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-base hover:from-indigo-500 hover:to-violet-500 transition-all shadow-2xl shadow-indigo-500/30 hover:-translate-y-0.5 flex items-center justify-center gap-2 group">
          Unlock My Full Meal Plan — Free
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
        <p className="text-center text-slate-600 text-xs">
          No credit card · Free plan always available · 2-minute setup
        </p>
      </motion.div>
    </motion.div>
  );
}

// ─── Loading interstitial (builds investment) ───────────────────────────────────
function AnalyzingScreen() {
  const [step, setStep] = useState(0);
  const steps = [
    'Analyzing your health profile...',
    'Identifying key biomarkers to watch...',
    'Mapping foods to your specific needs...',
    'Preparing your personalized insights...',
  ];

  useEffect(() => {
    const timers = steps.map((_, i) =>
      setTimeout(() => setStep(i), i * 700)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-[400px] space-y-8"
    >
      {/* Animated rings */}
      <div className="relative w-24 h-24">
        {[0, 1, 2].map(i => (
          <motion.div key={i}
            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, delay: i * 0.5, repeat: Infinity }}
            className="absolute inset-0 rounded-full border border-indigo-500"
          />
        ))}
        <div className="absolute inset-0 flex items-center justify-center">
          <FlaskConical className="w-10 h-10 text-indigo-400" />
        </div>
      </div>

      <div className="space-y-3 text-center">
        {steps.map((s, i) => (
          <motion.div key={s}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: i <= step ? 1 : 0.2, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3"
          >
            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${i <= step ? 'bg-emerald-500' : 'bg-white/10'}`}>
              {i <= step && <CheckCircle className="w-3 h-3 text-white" />}
            </div>
            <span className={`text-sm ${i <= step ? 'text-white' : 'text-slate-600'}`}>{s}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main quiz component ────────────────────────────────────────────────────────
export default function Quiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [analyzing, setAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const current = QUIZ[step];
  const totalSteps = QUIZ.length;
  const progress = ((step) / totalSteps) * 100;

  const handleSelect = (value) => {
    const newAnswers = { ...answers, [current.id]: value };
    setAnswers(newAnswers);

    if (step < totalSteps - 1) {
      setTimeout(() => setStep(s => s + 1), 300);
    } else {
      // Last question — show analyzing screen then results
      setTimeout(() => {
        setAnalyzing(true);
        setTimeout(() => {
          setAnalyzing(false);
          setShowResults(true);
        }, 3500);
      }, 300);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b14] text-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <span className="text-white font-black text-xs">V</span>
          </div>
          <span className="font-bold text-white">VitaPlate</span>
        </Link>
        {!showResults && !analyzing && (
          <span className="text-xs text-slate-500">{step + 1} of {totalSteps}</span>
        )}
      </nav>

      {/* Progress bar */}
      {!showResults && (
        <div className="h-0.5 bg-white/5">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
            initial={{ width: '0%' }}
            animate={{ width: `${analyzing ? 100 : progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {analyzing ? (
              <AnalyzingScreen key="analyzing" />
            ) : showResults ? (
              <ResultsScreen key="results" answers={answers} />
            ) : (
              <motion.div key={step}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="space-y-8"
              >
                {/* Question */}
                <div className="text-center space-y-2">
                  <p className="text-xs text-indigo-400 font-semibold tracking-widest uppercase">
                    Question {step + 1}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                    {current.headline}
                  </h2>
                  <p className="text-slate-400 text-sm">{current.sub}</p>
                </div>

                {/* Options grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {current.options.map((opt) => {
                    const selected = answers[current.id] === opt.value;
                    return (
                      <motion.button
                        key={opt.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelect(opt.value)}
                        className={`relative flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                          selected
                            ? 'border-indigo-500 bg-indigo-500/10'
                            : 'border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/5'
                        }`}
                      >
                        <span className="text-2xl flex-shrink-0">{opt.emoji}</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-white text-sm">{opt.label}</p>
                          {(opt.desc || opt.marker) && (
                            <p className="text-xs text-slate-500 mt-0.5">{opt.desc || opt.marker}</p>
                          )}
                        </div>
                        {selected && (
                          <CheckCircle className="w-4 h-4 text-indigo-400 absolute right-4 top-1/2 -translate-y-1/2" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Back button */}
                {step > 0 && (
                  <button onClick={() => setStep(s => s - 1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-white text-sm transition-colors mx-auto">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
