import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

export default function KidneyMetricsTracker({ day, ckdStage = 3 }) {
  if (!day) return null;

  // Determine limits based on CKD stage
  const getLimits = (stage) => {
    if (stage <= 2) {
      return { potassium: 2500, phosphorus: 1000, sodium: 2000 };
    } else {
      return { potassium: 2000, phosphorus: 800, sodium: 1500 };
    }
  };

  const limits = getLimits(ckdStage);

  // Calculate totals (simplified from meal data)
  const meals = [day.breakfast, day.lunch, day.dinner, day.snacks].filter(Boolean);
  const totalPotassium = meals.reduce((sum, m) => sum + (m.potassium || 0), 0);
  const totalPhosphorus = meals.reduce((sum, m) => sum + (m.phosphorus || 0), 0);
  const totalSodium = meals.reduce((sum, m) => sum + (m.sodium || 0), 0);

  // Calculate percentages
  const kPercent = (totalPotassium / limits.potassium) * 100;
  const pPercent = (totalPhosphorus / limits.phosphorus) * 100;
  const naPercent = (totalSodium / limits.sodium) * 100;

  const getMetricColor = (percent) => {
    if (percent <= 80) return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', bar: 'bg-emerald-500' };
    if (percent <= 100) return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', bar: 'bg-amber-500' };
    return { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', bar: 'bg-rose-500' };
  };

  const kColor = getMetricColor(kPercent);
  const pColor = getMetricColor(pPercent);
  const naColor = getMetricColor(naPercent);

  const stageLabels = {
    1: 'Stage 1 (GFR ≥90)',
    2: 'Stage 2 (GFR 60-89)',
    3: 'Stage 3 (GFR 30-59)',
    4: 'Stage 4 (GFR 15-29)',
    5: 'Stage 5 / Dialysis (GFR <15)',
  };

  return (
    <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-cyan-900">
            🫘 Kidney Metrics
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            CKD {stageLabels[ckdStage]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Potassium */}
        <div className={`p-3 rounded-lg border ${kColor.bg} ${kColor.border}`}>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">Potassium</span>
              {kPercent > 100 && <AlertTriangle className="w-4 h-4 text-rose-600" />}
            </div>
            <span className={`text-sm font-bold ${kColor.text}`}>{totalPotassium}mg</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
            <div 
              className={`h-2 rounded-full ${kColor.bar}`}
              style={{ width: `${Math.min(kPercent, 100)}%` }}
            />
          </div>
          <div className="text-xs text-slate-600">Target: &lt;{limits.potassium}mg/day</div>
        </div>

        {/* Phosphorus */}
        <div className={`p-3 rounded-lg border ${pColor.bg} ${pColor.border}`}>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">Phosphorus</span>
              {pPercent > 100 && <AlertTriangle className="w-4 h-4 text-rose-600" />}
            </div>
            <span className={`text-sm font-bold ${pColor.text}`}>{totalPhosphorus}mg</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
            <div 
              className={`h-2 rounded-full ${pColor.bar}`}
              style={{ width: `${Math.min(pPercent, 100)}%` }}
            />
          </div>
          <div className="text-xs text-slate-600">Target: &lt;{limits.phosphorus}mg/day</div>
        </div>

        {/* Sodium */}
        <div className={`p-3 rounded-lg border ${naColor.bg} ${naColor.border}`}>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">Sodium</span>
              {naPercent > 100 && <AlertTriangle className="w-4 h-4 text-rose-600" />}
            </div>
            <span className={`text-sm font-bold ${naColor.text}`}>{totalSodium}mg</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
            <div 
              className={`h-2 rounded-full ${naColor.bar}`}
              style={{ width: `${Math.min(naPercent, 100)}%` }}
            />
          </div>
          <div className="text-xs text-slate-600">Target: &lt;{limits.sodium}mg/day</div>
        </div>

        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
          <p className="font-medium mb-1">⚠️ Important</p>
          <p>Always consult your nephrologist or renal dietitian before following this plan. These recommendations should be tailored to your individual lab values and health status.</p>
        </div>
      </CardContent>
    </Card>
  );
}