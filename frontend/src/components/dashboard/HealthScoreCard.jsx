import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Lock, FileText, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// ─── Score calculation helpers ───────────────────────────────────────────────

const MARKERS = [
  {
    key: 'Total Cholesterol',
    aliases: ['Cholesterol', 'Total Cholesterol'],
    label: 'Total Cholesterol',
    unit: 'mg/dL',
    description: 'Optimal: 150–199 mg/dL. High LDL cholesterol raises heart-disease risk.',
    score: (v) => {
      if (v >= 150 && v <= 199) return 10;
      if (v >= 200 && v <= 239) return 6;
      if (v < 150) return 7;
      return 3; // ≥240
    },
  },
  {
    key: 'LDL',
    aliases: ['LDL', 'LDL Cholesterol', 'LDL-C'],
    label: 'LDL Cholesterol',
    unit: 'mg/dL',
    description: 'Optimal: under 100 mg/dL. "Bad" cholesterol that builds up in arteries.',
    score: (v) => {
      if (v < 100) return 10;
      if (v < 130) return 7;
      if (v < 160) return 5;
      return 2;
    },
  },
  {
    key: 'HDL',
    aliases: ['HDL', 'HDL Cholesterol', 'HDL-C'],
    label: 'HDL Cholesterol',
    unit: 'mg/dL',
    description: 'Optimal: above 60 mg/dL. "Good" cholesterol that removes harmful LDL.',
    score: (v) => {
      if (v > 60) return 10;
      if (v >= 40) return 6;
      return 2;
    },
  },
  {
    key: 'Triglycerides',
    aliases: ['Triglycerides', 'Triglyceride'],
    label: 'Triglycerides',
    unit: 'mg/dL',
    description: 'Optimal: under 150 mg/dL. High levels linked to metabolic syndrome.',
    score: (v) => {
      if (v < 150) return 10;
      if (v < 200) return 6;
      if (v < 500) return 3;
      return 1;
    },
  },
  {
    key: 'Glucose',
    aliases: ['Glucose', 'Fasting Glucose', 'Blood Glucose'],
    label: 'Fasting Glucose',
    unit: 'mg/dL',
    description: 'Optimal: 70–99 mg/dL. Elevated fasting glucose signals pre-diabetes risk.',
    score: (v) => {
      if (v >= 70 && v <= 99) return 10;
      if (v >= 100 && v <= 125) return 5;
      if (v < 70) return 6;
      return 2;
    },
  },
  {
    key: 'HbA1c',
    aliases: ['HbA1c', 'Hemoglobin A1c', 'A1c', 'Glycated Hemoglobin'],
    label: 'HbA1c',
    unit: '%',
    description: 'Optimal: under 5.7%. Measures average blood sugar over 3 months.',
    score: (v) => {
      if (v < 5.7) return 10;
      if (v < 6.5) return 5;
      return 2;
    },
  },
  {
    key: 'Vitamin D',
    aliases: ['Vitamin D', '25-OH Vitamin D', 'Vitamin D, 25-Hydroxy', '25(OH)D'],
    label: 'Vitamin D',
    unit: 'ng/mL',
    description: 'Optimal: 40–80 ng/mL. Essential for bone health, immunity, and mood.',
    score: (v) => {
      if (v >= 40 && v <= 80) return 10;
      if (v >= 30 && v < 40) return 7;
      if (v > 80) return 8;
      if (v >= 20) return 4;
      return 1;
    },
  },
  {
    key: 'Ferritin',
    aliases: ['Ferritin', 'Iron', 'Serum Iron'],
    label: 'Ferritin / Iron',
    unit: 'ng/mL',
    description: 'Optimal: 12–150 ng/mL. Low ferritin causes fatigue; high levels may indicate inflammation.',
    score: (v) => {
      if (v >= 12 && v <= 150) return 10;
      if (v > 150 && v <= 300) return 6;
      if (v < 12) return 4;
      return 2;
    },
  },
  {
    key: 'CRP',
    aliases: ['CRP', 'C-Reactive Protein', 'hs-CRP', 'hsCRP'],
    label: 'CRP (Inflammation)',
    unit: 'mg/L',
    description: 'Optimal: under 1.0 mg/L. Elevated CRP signals systemic inflammation.',
    score: (v) => {
      if (v < 1.0) return 10;
      if (v < 3.0) return 6;
      if (v < 10) return 3;
      return 1;
    },
  },
  {
    key: 'TSH',
    aliases: ['TSH', 'Thyroid Stimulating Hormone', 'Thyroid-Stimulating Hormone'],
    label: 'TSH (Thyroid)',
    unit: 'mIU/L',
    description: 'Optimal: 0.4–4.0 mIU/L. TSH outside range can signal thyroid dysfunction.',
    score: (v) => {
      if (v >= 0.4 && v <= 4.0) return 10;
      if (v > 4.0 && v <= 6.0) return 6;
      if (v < 0.4) return 5;
      return 2;
    },
  },
];

function findMarkerValue(biomarkers, markerDef) {
  if (!biomarkers) return null;
  for (const alias of markerDef.aliases) {
    // exact match first
    if (biomarkers[alias]?.value != null) return biomarkers[alias].value;
    // case-insensitive match
    const key = Object.keys(biomarkers).find(k => k.toLowerCase() === alias.toLowerCase());
    if (key && biomarkers[key]?.value != null) return biomarkers[key].value;
  }
  return null;
}

function calculateHealthScore(biomarkers) {
  const results = [];
  for (const marker of MARKERS) {
    const value = findMarkerValue(biomarkers, marker);
    if (value == null) continue;
    const points = marker.score(value);
    results.push({ marker, value, points });
  }
  if (results.length === 0) return { score: null, breakdown: [] };
  const avg = results.reduce((sum, r) => sum + r.points, 0) / results.length;
  const score = Math.round(avg * 10); // 0–100
  return { score, breakdown: results };
}

function getScoreConfig(score) {
  if (score === null) return { label: '—', color: 'text-slate-400', ring: '#94a3b8', bg: 'bg-slate-50' };
  if (score >= 90) return { label: 'Optimal', color: 'text-purple-700', ring: '#9333ea', bg: 'bg-purple-50' };
  if (score >= 75) return { label: 'Excellent', color: 'text-emerald-700', ring: '#10b981', bg: 'bg-emerald-50' };
  if (score >= 50) return { label: 'Good', color: 'text-amber-700', ring: '#f59e0b', bg: 'bg-amber-50' };
  return { label: 'Needs Attention', color: 'text-rose-700', ring: '#ef4444', bg: 'bg-rose-50' };
}

// ─── SVG Ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score, color }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const pct = score != null ? score / 100 : 0;
  const offset = circumference * (1 - pct);

  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="12" />
      <circle
        cx="70" cy="70" r={radius}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 70 70)"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      <text x="70" y="65" textAnchor="middle" dominantBaseline="middle" className="font-bold" style={{ fontSize: 26, fontWeight: 700, fill: '#0f172a' }}>
        {score ?? '—'}
      </text>
      <text x="70" y="88" textAnchor="middle" style={{ fontSize: 12, fill: '#64748b' }}>/ 100</text>
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HealthScoreCard({ labResults = [], isPro = false }) {
  const [expanded, setExpanded] = useState(false);

  const mostRecent = labResults[0];

  const { score, breakdown } = useMemo(() => {
    if (!mostRecent?.biomarkers) return { score: null, breakdown: [] };
    return calculateHealthScore(mostRecent.biomarkers);
  }, [mostRecent]);

  const cfg = getScoreConfig(score);

  // Score trend across all uploads
  const trendData = useMemo(() => {
    return [...labResults]
      .reverse()
      .map(r => {
        const { score: s } = calculateHealthScore(r.biomarkers || {});
        if (s == null) return null;
        return {
          date: new Date(r.upload_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          score: s,
        };
      })
      .filter(Boolean);
  }, [labResults]);

  // Low-scoring markers for "dragging you down" section
  const weakMarkers = breakdown.filter(r => r.points < 7).sort((a, b) => a.points - b.points);

  // ── No labs uploaded ──────────────────────────────────────────────────────
  if (labResults.length === 0) {
    return (
      <Card className="border-slate-200 relative overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">🧬</span> VitaPlate Health Score
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center text-center py-6 gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-700">Upload your lab results to unlock your Health Score</p>
            <p className="text-sm text-slate-500 mt-1">We'll calculate your personalised score from your biomarkers</p>
          </div>
          <Button asChild className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <Link to={createPageUrl('LabResults')}>Upload Lab Results</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Locked for free users ─────────────────────────────────────────────────
  if (!isPro) {
    return (
      <Card className="border-slate-200 relative overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-lg">🧬</span> VitaPlate Health Score
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          {/* Blurred preview */}
          <div className="blur-sm pointer-events-none select-none flex flex-col items-center gap-3 py-4">
            <ScoreRing score={72} color="#f59e0b" />
            <Badge className="bg-amber-50 text-amber-700 border-amber-200">Good</Badge>
          </div>
          {/* Lock overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[2px] rounded-b-lg gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <Lock className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="font-semibold text-slate-800">Pro Feature</p>
            <p className="text-sm text-slate-500 text-center max-w-[200px]">Upgrade to Pro to unlock your personalised Health Score</p>
            <Button asChild size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <Link to={createPageUrl('Pricing')}>Upgrade to Pro</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Full score card ───────────────────────────────────────────────────────
  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="text-lg">🧬</span> VitaPlate Health Score
          <Badge className={`ml-auto text-xs border ${cfg.bg} ${cfg.color}`}>{cfg.label}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Ring + breakdown */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <ScoreRing score={score} color={cfg.ring} />

          <div className="flex-1 w-full space-y-2">
            {breakdown.slice(0, 5).map(({ marker, value, points }) => (
              <div key={marker.key} className="flex items-center gap-2">
                <span className="text-xs text-slate-600 w-32 truncate">{marker.label}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${points * 10}%`,
                      backgroundColor: points >= 8 ? '#10b981' : points >= 5 ? '#f59e0b' : '#ef4444',
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-700 w-10 text-right">{value} {marker.unit.split('/')[0]}</span>
              </div>
            ))}
            {breakdown.length > 5 && (
              <p className="text-xs text-slate-400">{breakdown.length - 5} more markers analysed</p>
            )}
            {breakdown.length === 0 && (
              <p className="text-sm text-slate-500">No scoreable biomarkers found in your latest labs.</p>
            )}
          </div>
        </div>

        {/* Weak markers */}
        {weakMarkers.length > 0 && (
          <div className="rounded-lg bg-rose-50 border border-rose-100 p-3">
            <p className="text-xs font-semibold text-rose-700 mb-2">⚠️ Markers dragging your score down</p>
            <div className="flex flex-wrap gap-2">
              {weakMarkers.map(({ marker, value }) => (
                <Badge key={marker.key} variant="outline" className="text-xs border-rose-200 text-rose-700 bg-white">
                  {marker.label}: {value} {marker.unit}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Score trend */}
        {trendData.length > 1 && (
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Score Over Time
            </p>
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={trendData}>
                <XAxis dataKey="date" style={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis domain={[0, 100]} hide />
                <Tooltip
                  formatter={(v) => [`${v}/100`, 'Health Score']}
                  contentStyle={{ fontSize: 12 }}
                />
                <Line type="monotone" dataKey="score" stroke={cfg.ring} strokeWidth={2} dot={{ r: 3, fill: cfg.ring }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Expandable explanation */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          What affects my score?
        </button>

        {expanded && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
            {MARKERS.map(m => (
              <div key={m.key} className="flex gap-2 text-xs">
                <span className="font-semibold text-slate-700 w-36 shrink-0">{m.label}</span>
                <span className="text-slate-500">{m.description}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}