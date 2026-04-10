import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useAnimation } from 'framer-motion';
import { ArrowRight, FlaskConical, ChefHat, TrendingDown, Sparkles, CheckCircle, Star, ChevronDown } from 'lucide-react';

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ to, suffix = '', duration = 2 }) {
  const [count, setCount] = useState(0);
  const ref = useRef();
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = to / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= to) { setCount(to); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, to, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Animated biomarker → meal visual ─────────────────────────────────────────
function HeroVisual() {
  const markers = [
    { name: 'LDL Cholesterol', value: 145, unit: 'mg/dL', status: 'high',   color: '#ef4444' },
    { name: 'Vitamin D',       value: 18,  unit: 'ng/mL', status: 'low',    color: '#3b82f6' },
    { name: 'HbA1c',           value: 6.1, unit: '%',     status: 'border', color: '#f59e0b' },
    { name: 'CRP',             value: 3.2, unit: 'mg/L',  status: 'high',   color: '#ef4444' },
    { name: 'HDL',             value: 62,  unit: 'mg/dL', status: 'normal', color: '#10b981' },
  ];

  const meals = [
    { name: 'Salmon & Quinoa Bowl',    why: 'Lowers LDL via Omega-3',      emoji: '🐟', color: '#4f46e5' },
    { name: 'Mushroom Omelette',       why: 'Boosts Vitamin D',             emoji: '🍳', color: '#059669' },
    { name: 'Lentil & Veggie Stew',    why: 'Stabilizes blood sugar',       emoji: '🥘', color: '#d97706' },
    { name: 'Turmeric Cauliflower',    why: 'Anti-inflammatory for CRP',    emoji: '🥦', color: '#7c3aed' },
  ];

  return (
    <div className="relative w-full max-w-4xl mx-auto h-[480px] select-none">
      {/* Glow effects */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />
      </div>

      {/* Lab panel — left */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.7 }}
        className="absolute left-0 top-1/2 -translate-y-1/2 w-64 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 bg-indigo-500/20 rounded-lg flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <p className="text-white text-xs font-semibold">Your Lab Results</p>
            <p className="text-slate-500 text-xs">Quest Diagnostics · Jan 2026</p>
          </div>
        </div>
        <div className="space-y-2">
          {markers.map((m, i) => (
            <motion.div key={m.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white/5"
            >
              <div>
                <p className="text-xs text-slate-300 font-medium leading-tight">{m.name}</p>
                <p className="text-xs text-slate-500">{m.value} {m.unit}</p>
              </div>
              <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                style={{ backgroundColor: m.color + '20', color: m.color }}>
                {m.status === 'border' ? 'borderline' : m.status}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Arrow + AI label — center */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/40"
        >
          <Sparkles className="w-7 h-7 text-white" />
        </motion.div>
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-xs text-indigo-400 font-semibold tracking-widest uppercase"
        >
          AI Analysis
        </motion.div>
        {/* Animated flow lines */}
        <svg className="absolute -z-10" width="200" height="4" viewBox="0 0 200 4">
          <motion.line x1="0" y1="2" x2="200" y2="2" stroke="url(#flowGrad)"
            strokeWidth="2" strokeDasharray="8 4"
            animate={{ strokeDashoffset: [0, -24] }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} />
          <defs>
            <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Meal plan — right */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6, duration: 0.7 }}
        className="absolute right-0 top-1/2 -translate-y-1/2 w-64 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 bg-emerald-500/20 rounded-lg flex items-center justify-center">
            <ChefHat className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-white text-xs font-semibold">Your Meal Plan</p>
            <p className="text-slate-500 text-xs">Optimized for your biomarkers</p>
          </div>
        </div>
        <div className="space-y-2">
          {meals.map((m, i) => (
            <motion.div key={m.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              className="flex items-start gap-2 py-1.5 px-2 rounded-lg bg-white/5"
            >
              <span className="text-lg flex-shrink-0">{m.emoji}</span>
              <div>
                <p className="text-xs text-slate-200 font-medium leading-tight">{m.name}</p>
                <p className="text-xs leading-tight" style={{ color: m.color }}>{m.why}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mt-3 flex items-center gap-1.5 px-2 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg"
        >
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <p className="text-xs text-emerald-400 font-medium">Addresses 4 of your abnormal markers</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, description, accent, delay }) {
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5 }}
      className="group relative p-6 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-white/10 transition-all hover:-translate-y-1"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{ backgroundColor: accent + '20' }}>
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
      <h3 className="font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function Index() {
  return (
    <div className="min-h-screen bg-[#080b14] text-white overflow-x-hidden">

      {/* Nav bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#080b14]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <span className="text-white font-black text-sm">V</span>
            </div>
            <span className="font-bold text-white text-lg">VitaPlate</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/Pricing" className="text-slate-400 hover:text-white text-sm transition-colors hidden sm:block">Pricing</Link>
            <Link to="/Onboarding"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:from-indigo-500 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/20">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4">
        {/* Background mesh */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.06) 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold tracking-wide uppercase mb-6">
              <FlaskConical className="w-3 h-3" />
              Biomarker-Driven Nutrition — The First of Its Kind
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
            className="text-5xl sm:text-6xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Your blood work<br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
              becomes your meal plan.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
            className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Upload any lab report. AI extracts your biomarkers — LDL, glucose, Vitamin D, CRP — and builds a 7-day meal plan specifically designed to fix what's off.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-6"
          >
            <Link to="/Onboarding"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-base hover:from-indigo-500 hover:to-violet-500 transition-all shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5">
              Get My Personalized Plan Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/LabResults"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-white/10 text-slate-300 font-semibold text-base hover:bg-white/5 hover:border-white/20 transition-all">
              <FlaskConical className="w-4 h-4" />
              Upload Lab Results
            </Link>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-slate-600 text-sm">
            No credit card required · Free forever plan available
          </motion.p>
        </div>

        {/* Hero visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-16"
        >
          <HeroVisual />
        </motion.div>

        {/* Scroll cue */}
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}
          className="flex justify-center mt-12">
          <ChevronDown className="w-5 h-5 text-slate-600" />
        </motion.div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">How it works</h2>
            <p className="text-slate-400 max-w-lg mx-auto">Three steps. No guesswork. No generic advice.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-8 left-1/3 right-1/3 h-px bg-gradient-to-r from-indigo-500/50 via-violet-500/50 to-emerald-500/50" />

            {[
              { step: '01', icon: FlaskConical, color: '#6366f1', title: 'Upload your labs',       desc: 'Drag and drop any PDF from Quest, LabCorp, or your doctor. AI reads all 30+ markers in 15 seconds.' },
              { step: '02', icon: Sparkles,     color: '#8b5cf6', title: 'AI analyzes your data',  desc: 'We identify which of your values are outside optimal range and what foods will help most.' },
              { step: '03', icon: ChefHat,      color: '#10b981', title: 'Get your meal plan',     desc: '7 days of meals, each one chosen specifically to address your biomarkers. Grocery list included.' },
            ].map(({ step, icon: Icon, color, title, desc }, i) => {
              const ref = useRef();
              const inView = useInView(ref, { once: true });
              return (
                <motion.div key={step} ref={ref}
                  initial={{ opacity: 0, y: 30 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="text-center relative"
                >
                  <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center shadow-xl"
                    style={{ backgroundColor: color + '20', border: `1px solid ${color}30` }}>
                    <Icon className="w-8 h-8" style={{ color }} />
                  </div>
                  <div className="text-xs font-black tracking-widest uppercase mb-2" style={{ color }}>{step}</div>
                  <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">Everything your health needs</h2>
            <p className="text-slate-400 max-w-lg mx-auto">Built around your actual biology, not generic nutrition guidelines.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: FlaskConical, accent: '#6366f1', title: 'Biomarker Extraction', description: 'Upload any blood panel PDF. AI extracts LDL, glucose, Vitamin D, CRP, thyroid markers, and 25+ more in seconds.' },
              { icon: ChefHat,      accent: '#10b981', title: 'Personalized Meal Plans', description: 'Every meal is chosen to address your specific out-of-range markers. Not a template — your plan.' },
              { icon: TrendingDown, accent: '#ef4444', title: 'Lab Trend Tracking', description: 'Upload a second set of labs and see: "Your LDL dropped 19% since following your plan." That\'s the proof.' },
              { icon: Sparkles,     accent: '#8b5cf6', title: 'Supplement Recommendations', description: 'Based on your exact lab values. Low B12? Here\'s the right form, dose, and why it works for your level.' },
              { icon: Star,         accent: '#f59e0b', title: 'Nova AI Coach', description: 'Ask anything about your labs or meals. Nova knows your biomarker history and gives advice specific to your data.' },
              { icon: CheckCircle,  accent: '#06b6d4', title: 'Health Alerts Engine', description: 'Detects patterns in your eating that may worsen your lab values — before your next blood test.' },
            ].map((f, i) => (
              <FeatureCard key={f.title} {...f} delay={i * 0.08} />
            ))}
          </div>
        </div>
      </section>

      {/* Differentiation — vs others */}
      <section className="py-24 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">Why VitaPlate is different</h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="text-left px-6 py-4 text-slate-400 font-medium">Feature</th>
                  <th className="px-6 py-4 text-indigo-400 font-bold">VitaPlate</th>
                  <th className="px-6 py-4 text-slate-500 font-medium">MyFitnessPal</th>
                  <th className="px-6 py-4 text-slate-500 font-medium">Noom</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Reads your actual lab results',    true,  false, false],
                  ['Meal plans from biomarkers',        true,  false, false],
                  ['Predictive health alerts',          true,  false, false],
                  ['Lab trend tracking',                true,  false, false],
                  ['Supplement recommendations',        true,  false, false],
                  ['Nutrition tracking',                true,  true,  true ],
                  ['AI coaching',                       true,  false, true ],
                  ['Wearable integration',              true,  true,  false],
                ].map(([feature, vp, mfp, noom], i) => (
                  <tr key={feature} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/2' : ''}`}>
                    <td className="px-6 py-3.5 text-slate-300">{feature}</td>
                    <td className="px-6 py-3.5 text-center">{vp  ? <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto" /> : <span className="text-slate-700">—</span>}</td>
                    <td className="px-6 py-3.5 text-center">{mfp ? <CheckCircle className="w-4 h-4 text-slate-500 mx-auto" />   : <span className="text-slate-700">—</span>}</td>
                    <td className="px-6 py-3.5 text-center">{noom? <CheckCircle className="w-4 h-4 text-slate-500 mx-auto" />   : <span className="text-slate-700">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative p-12 rounded-3xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #2e1065 50%, #0f172a 100%)' }}
          >
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(99,102,241,0.15) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }} />
            <div className="relative">
              <div className="text-4xl mb-4">🧬</div>
              <h2 className="text-3xl font-black mb-3">Ready to eat for your biology?</h2>
              <p className="text-slate-400 mb-8">Upload your first lab report in under 2 minutes. Get a meal plan that actually responds to your blood work.</p>
              <Link to="/Onboarding"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold text-base hover:from-indigo-400 hover:to-violet-400 transition-all shadow-2xl shadow-indigo-500/40 hover:-translate-y-0.5">
                Start Free — No Credit Card
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <span className="text-white font-black text-xs">V</span>
            </div>
            <span>VitaPlate © 2026</span>
          </div>
          <div className="flex gap-6">
            <Link to="/Pricing" className="hover:text-white transition-colors">Pricing</Link>
            <a href="mailto:support@vitaplate.ai" className="hover:text-white transition-colors">Support</a>
            <a href="mailto:founder@vitaplate.ai" className="hover:text-white transition-colors">Founder</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
