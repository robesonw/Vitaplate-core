import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, FlaskConical, CheckCircle, ChevronDown, Sparkles, TrendingDown, Star } from 'lucide-react';

// ─── Animated number counter ──────────────────────────────────────────────────
function Counter({ to, suffix = '', duration = 2 }) {
  const [count, setCount] = React.useState(0);
  const ref = useRef();
  const inView = useInView(ref, { once: true });
  React.useEffect(() => {
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

// ─── Floating biomarker card ───────────────────────────────────────────────────
function BiomarkerCard({ name, value, unit, status, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-xl"
    >
      <div className="flex items-center justify-between gap-6">
        <div>
          <p className="text-xs text-slate-400">{name}</p>
          <p className="text-lg font-bold text-white">{value} <span className="text-xs font-normal text-slate-500">{unit}</span></p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: `${color}20`, color }}>
          {status}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Testimonial card ──────────────────────────────────────────────────────────
function TestimonialCard({ quote, result, name, condition, delay }) {
  const ref = useRef();
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5 }}
      className="p-6 rounded-2xl border border-white/8 bg-white/3 space-y-4"
    >
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
      </div>
      <p className="text-slate-300 text-sm leading-relaxed">"{quote}"</p>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-semibold text-sm">{name}</p>
          <p className="text-slate-500 text-xs">{condition}</p>
        </div>
        <div className="text-right">
          <p className="text-emerald-400 font-bold text-sm">{result}</p>
          <p className="text-slate-600 text-xs">in 8 weeks</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Index() {
  return (
    <div className="min-h-screen bg-[#070a12] text-white overflow-x-hidden">

      {/* ── Navbar ────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5"
        style={{ background: 'rgba(7,10,18,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <span className="text-white font-black text-sm">V</span>
            </div>
            <span className="font-black text-white text-lg tracking-tight">VitaPlate</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/Pricing" className="text-slate-400 hover:text-white text-sm transition-colors hidden sm:block">Pricing</Link>
            <Link to="/Dashboard" className="text-slate-400 hover:text-white text-sm transition-colors hidden sm:block">Sign In</Link>
            <Link to="/Quiz"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold hover:from-indigo-500 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/25">
              Take the Quiz
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 px-4">
        {/* Ambient background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(ellipse, #4f46e5 0%, transparent 70%)' }} />
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.04) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }} />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/8 text-indigo-300 text-xs font-semibold tracking-widest uppercase mb-8">
              <FlaskConical className="w-3 h-3" />
              The only meal plan built from your blood work
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.02] tracking-tight mb-6"
          >
            Find out which of your<br />
            <span style={{ background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 40%, #34d399 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              biomarkers to fix first.
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
            className="text-slate-400 text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed"
          >
            Answer 4 quick questions. Get a personalized insight into which biomarkers are likely affecting your health — and exactly what to eat to fix them.
          </motion.p>

          {/* Single CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-col items-center gap-4"
          >
            <Link to="/Quiz"
              className="group inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-lg hover:from-indigo-500 hover:to-violet-500 transition-all shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1">
              Take the 60-second quiz
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-slate-600 text-sm">No account needed · See your results instantly</p>
          </motion.div>

          {/* Floating biomarker cards */}
          <div className="mt-16 relative">
            {/* Central result */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mx-auto max-w-sm p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5"
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wide">After 8 weeks on VitaPlate</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'LDL',      from: '145',  to: '108',  unit: 'mg/dL', good: true  },
                  { label: 'HbA1c',    from: '6.2',  to: '5.7',  unit: '%',     good: true  },
                  { label: 'Vitamin D',from: '18',   to: '42',   unit: 'ng/mL', good: true  },
                  { label: 'CRP',      from: '3.8',  to: '1.1',  unit: 'mg/L',  good: true  },
                ].map(({ label, from, to, unit, good }) => (
                  <div key={label} className="text-left">
                    <p className="text-xs text-slate-500">{label}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-slate-600 text-sm line-through">{from}</span>
                      <TrendingDown className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-bold text-sm">{to}</span>
                      <span className="text-xs text-slate-600">{unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-3 text-center">Real results from following a VitaPlate biomarker plan</p>
            </motion.div>
          </div>

          {/* Scroll cue */}
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}
            className="mt-12 flex justify-center">
            <ChevronDown className="w-5 h-5 text-slate-700" />
          </motion.div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-indigo-400 font-semibold tracking-widest uppercase mb-3">The process</p>
            <h2 className="text-3xl sm:text-4xl font-black">From blood panel to meal plan in 3 steps</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-[calc(33%+2rem)] right-[calc(33%+2rem)] h-px bg-gradient-to-r from-indigo-500/30 via-violet-500/30 to-emerald-500/30" />

            {[
              {
                n: '01', color: '#6366f1',
                icon: '🔬',
                title: 'Take the quiz',
                desc: 'Answer 4 questions about your health concerns. No account needed. See your biomarker insights in 60 seconds.',
              },
              {
                n: '02', color: '#8b5cf6',
                icon: '📋',
                title: 'Upload your labs',
                desc: 'Drag in any PDF from Quest, LabCorp, or your doctor. AI extracts every biomarker value automatically.',
              },
              {
                n: '03', color: '#10b981',
                icon: '🥗',
                title: 'Get your plan',
                desc: 'A 7-day meal plan where every single meal was chosen to improve your specific out-of-range markers.',
              },
            ].map(({ n, color, icon, title, desc }, i) => {
              const ref = useRef();
              const inView = useInView(ref, { once: true, margin: '-60px' });
              return (
                <motion.div key={n} ref={ref}
                  initial={{ opacity: 0, y: 24 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="text-center relative"
                >
                  <div className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center text-4xl shadow-xl"
                    style={{ background: `linear-gradient(135deg, ${color}20, ${color}08)`, border: `1px solid ${color}25` }}>
                    {icon}
                  </div>
                  <div className="text-xs font-black tracking-widest uppercase mb-2" style={{ color }}>{n}</div>
                  <h3 className="font-bold text-white text-xl mb-2">{title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── What VitaPlate actually does ───────────────────────────────────────── */}
      <section className="py-24 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-indigo-400 font-semibold tracking-widest uppercase mb-3">The science</p>
            <h2 className="text-3xl sm:text-4xl font-black">Every meal has a reason</h2>
            <p className="text-slate-400 mt-3 max-w-lg mx-auto text-sm">
              Generic nutrition apps give everyone the same advice. VitaPlate reads your blood work and tells each meal what job it has to do.
            </p>
          </div>

          {/* Interactive biomarker cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { marker: 'High LDL Cholesterol', value: '145 mg/dL', foods: ['Salmon', 'Oats', 'Walnuts'], result: '↓ 25% in 8 weeks', color: '#ef4444' },
              { marker: 'Prediabetic HbA1c', value: '6.1%', foods: ['Lentils', 'Quinoa', 'Broccoli'], result: '↓ 0.8% in 10 weeks', color: '#f59e0b' },
              { marker: 'Low Vitamin D', value: '18 ng/mL', foods: ['Eggs', 'Mushrooms', 'Fatty fish'], result: '↑ to optimal in 6 weeks', color: '#8b5cf6' },
              { marker: 'Elevated CRP', value: '3.2 mg/L', foods: ['Turmeric', 'Berries', 'Ginger'], result: '↓ 35% in 6 weeks', color: '#f97316' },
              { marker: 'High Triglycerides', value: '210 mg/dL', foods: ['Olive oil', 'Fish', 'Nuts'], result: '↓ 45 mg/dL in 4 weeks', color: '#10b981' },
              { marker: 'High TSH (thyroid)', value: '4.8 mIU/L', foods: ['Brazil nuts', 'Seaweed', 'Eggs'], result: 'Optimized thyroid support', color: '#06b6d4' },
            ].map(({ marker, value, foods, result, color }, i) => {
              const ref = useRef();
              const inView = useInView(ref, { once: true, margin: '-40px' });
              return (
                <motion.div key={marker} ref={ref}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="p-5 rounded-2xl border border-white/6 bg-white/2 hover:border-white/12 hover:bg-white/4 transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: `${color}15`, color }}>
                      {value}
                    </span>
                    <span className="text-xs text-emerald-400 font-semibold">{result}</span>
                  </div>
                  <p className="font-semibold text-white text-sm mb-3">{marker}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {foods.map(f => (
                      <span key={f} className="text-xs px-2 py-1 rounded-full bg-white/4 border border-white/6 text-slate-400">
                        {f}
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Comparison ────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black">No other app does this</h2>
          </div>
          <div className="rounded-2xl border border-white/8 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/6" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <th className="text-left px-5 py-4 text-slate-400 font-medium text-xs uppercase tracking-wider">Feature</th>
                  <th className="px-5 py-4 text-indigo-400 font-bold">VitaPlate</th>
                  <th className="px-5 py-4 text-slate-500 font-medium text-xs">MyFitnessPal</th>
                  <th className="px-5 py-4 text-slate-500 font-medium text-xs">Noom</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Reads your actual blood work',      true,  false, false],
                  ['Meal plan from biomarker values',    true,  false, false],
                  ['Tracks your lab trends over time',   true,  false, false],
                  ['Predictive health alerts',           true,  false, false],
                  ['Lab-specific supplement recs',       true,  false, false],
                  ['AI nutrition coaching',              true,  false, true ],
                  ['Nutrition tracking',                 true,  true,  true ],
                  ['Free to start',                      true,  true,  false],
                ].map(([feature, vp, mfp, noom], i) => (
                  <tr key={i} className={`border-b border-white/4 ${i % 2 === 0 ? '' : 'bg-white/1'}`}>
                    <td className="px-5 py-3.5 text-slate-300 text-sm">{feature}</td>
                    <td className="px-5 py-3.5 text-center">{vp  ? <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto" /> : <span className="text-slate-700 text-lg">—</span>}</td>
                    <td className="px-5 py-3.5 text-center">{mfp ? <CheckCircle className="w-4 h-4 text-slate-600 mx-auto" />   : <span className="text-slate-700 text-lg">—</span>}</td>
                    <td className="px-5 py-3.5 text-center">{noom? <CheckCircle className="w-4 h-4 text-slate-600 mx-auto" />   : <span className="text-slate-700 text-lg">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-3xl overflow-hidden p-12 text-center"
            style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #2e1065 50%, #0f172a 100%)' }}
          >
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(99,102,241,0.12) 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }} />
            <div className="relative">
              <span className="text-5xl block mb-4">🧬</span>
              <h2 className="text-3xl font-black mb-3">Know your biomarkers.<br />Eat accordingly.</h2>
              <p className="text-slate-400 mb-8 max-w-sm mx-auto">
                Start with the 60-second quiz. No account needed. See your personalized biomarker insights instantly.
              </p>
              <Link to="/Quiz"
                className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold text-base hover:from-indigo-400 hover:to-violet-400 transition-all shadow-2xl shadow-indigo-500/40 hover:-translate-y-0.5">
                Take the Free Quiz
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-slate-600 text-xs mt-4">60 seconds · No credit card · Free plan available</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-600 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <span className="text-white font-black text-xs">V</span>
            </div>
            <span>VitaPlate © 2026 · AI Biomarker Nutrition</span>
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
