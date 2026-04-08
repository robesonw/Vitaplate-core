import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FlaskConical, TrendingDown, TrendingUp, Heart } from 'lucide-react';

// Maps keywords in meal names/benefits to biomarkers they address
const FOOD_BIOMARKER_MAP = {
  // LDL / Heart health
  'salmon':      { marker: 'LDL', direction: 'down', color: '#ef4444', label: 'Lowers LDL' },
  'avocado':     { marker: 'LDL', direction: 'down', color: '#ef4444', label: 'Supports healthy LDL' },
  'olive oil':   { marker: 'LDL', direction: 'down', color: '#ef4444', label: 'Heart-healthy fats' },
  'oats':        { marker: 'LDL', direction: 'down', color: '#ef4444', label: 'Fiber lowers LDL' },
  'walnut':      { marker: 'LDL', direction: 'down', color: '#ef4444', label: 'Omega-3 for LDL' },
  // Blood sugar
  'quinoa':      { marker: 'Glucose', direction: 'down', color: '#f59e0b', label: 'Low glycemic' },
  'lentil':      { marker: 'HbA1c', direction: 'down', color: '#f59e0b', label: 'Stabilizes blood sugar' },
  'broccoli':    { marker: 'Glucose', direction: 'down', color: '#f59e0b', label: 'Low-glycemic fiber' },
  'sweet potato':{ marker: 'Glucose', direction: 'down', color: '#f59e0b', label: 'Complex carbs' },
  'cinnamon':    { marker: 'Glucose', direction: 'down', color: '#f59e0b', label: 'May lower glucose' },
  // Vitamin D
  'mushroom':    { marker: 'Vitamin D', direction: 'up', color: '#8b5cf6', label: 'Boosts Vitamin D' },
  'egg':         { marker: 'Vitamin D', direction: 'up', color: '#8b5cf6', label: 'Contains Vitamin D' },
  'tuna':        { marker: 'Vitamin D', direction: 'up', color: '#8b5cf6', label: 'Rich in Vitamin D' },
  // Inflammation / CRP
  'turmeric':    { marker: 'CRP', direction: 'down', color: '#f97316', label: 'Anti-inflammatory' },
  'ginger':      { marker: 'CRP', direction: 'down', color: '#f97316', label: 'Reduces inflammation' },
  'blueberr':    { marker: 'CRP', direction: 'down', color: '#f97316', label: 'Antioxidant, anti-inflammatory' },
  'spinach':     { marker: 'CRP', direction: 'down', color: '#f97316', label: 'Anti-inflammatory greens' },
  // Triglycerides
  'sardine':     { marker: 'Triglycerides', direction: 'down', color: '#06b6d4', label: 'Omega-3 lowers triglycerides' },
  'mackerel':    { marker: 'Triglycerides', direction: 'down', color: '#06b6d4', label: 'High EPA/DHA' },
  'chia':        { marker: 'Triglycerides', direction: 'down', color: '#06b6d4', label: 'Omega-3 source' },
  // Kidney
  'cauliflower': { marker: 'eGFR', direction: 'up', color: '#10b981', label: 'Kidney-friendly veggie' },
  'cabbage':     { marker: 'eGFR', direction: 'up', color: '#10b981', label: 'Low potassium option' },
  // Iron / B12
  'beef':        { marker: 'Iron', direction: 'up', color: '#dc2626', label: 'Heme iron source' },
  'liver':       { marker: 'Vitamin B12', direction: 'up', color: '#7c3aed', label: 'Highest B12 source' },
  'clam':        { marker: 'Vitamin B12', direction: 'up', color: '#7c3aed', label: 'Rich in B12' },
};

function detectBiomarkerConnections(mealName, healthBenefit, userBiomarkers = {}) {
  const text = `${mealName} ${healthBenefit || ''}`.toLowerCase();
  const found = [];
  const seen = new Set();

  for (const [keyword, info] of Object.entries(FOOD_BIOMARKER_MAP)) {
    if (text.includes(keyword) && !seen.has(info.marker)) {
      // Only show if user actually has this marker and it's abnormal
      const userMarker = userBiomarkers[info.marker];
      if (userMarker && userMarker.status !== 'normal') {
        found.push({ ...info, userValue: userMarker.value, userUnit: userMarker.unit, userStatus: userMarker.status });
        seen.add(info.marker);
      }
    }
  }

  return found.slice(0, 3); // Max 3 badges per meal
}

export default function BiomarkerMealBadge({ mealName, healthBenefit, userBiomarkers }) {
  const connections = detectBiomarkerConnections(mealName, healthBenefit, userBiomarkers);

  if (connections.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1 mt-2">
        <div className="flex items-center gap-1 text-xs text-slate-500 mr-1">
          <FlaskConical className="w-3 h-3" />
          <span>Targets:</span>
        </div>
        {connections.map((conn, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium cursor-help border"
                style={{
                  backgroundColor: `${conn.color}15`,
                  borderColor:     `${conn.color}40`,
                  color:           conn.color,
                }}
              >
                {conn.direction === 'down'
                  ? <TrendingDown className="w-2.5 h-2.5" />
                  : <TrendingUp className="w-2.5 h-2.5" />
                }
                {conn.marker}
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="text-xs space-y-1">
                <p className="font-semibold">{conn.label}</p>
                <p className="text-slate-400">
                  Your {conn.marker}: <strong>{conn.userValue} {conn.userUnit}</strong>
                  {' '}(<span className={conn.userStatus === 'high' ? 'text-red-400' : 'text-blue-400'}>{conn.userStatus}</span>)
                </p>
                <p className="text-slate-300">
                  This meal helps {conn.direction === 'down' ? 'lower' : 'raise'} your {conn.marker}.
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
