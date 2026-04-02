import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CRPAlert({ labResults = [] }) {
  if (!labResults.length) return null;

  const latestLab = labResults[0];
  const crp = latestLab?.biomarkers?.CRP?.value || 
              latestLab?.biomarkers?.['C-Reactive Protein']?.value ||
              latestLab?.biomarkers?.['hs-CRP']?.value;

  if (!crp) return null;

  const isElevated = crp > 3.0;
  const isHighRisk = crp > 10.0;

  if (!isElevated) {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <TrendingDown className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-emerald-900 text-sm">✅ CRP Within Normal Range</p>
              <p className="text-xs text-emerald-700 mt-1">
                Your CRP is {crp} mg/L (normal &lt;3.0). Continue with anti-inflammatory eating to maintain low inflammation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-2 ${isHighRisk ? 'border-rose-300 bg-rose-50' : 'border-amber-300 bg-amber-50'}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isHighRisk ? 'text-rose-600' : 'text-amber-600'}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <p className={`font-semibold text-sm ${isHighRisk ? 'text-rose-900' : 'text-amber-900'}`}>
                ⚠️ Elevated Inflammation Detected
              </p>
              <Badge className={isHighRisk ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}>
                CRP: {crp} mg/L
              </Badge>
            </div>
            <p className={`text-xs ${isHighRisk ? 'text-rose-800' : 'text-amber-800'} mb-3`}>
              {isHighRisk 
                ? 'Your CRP indicates high systemic inflammation. Strong dietary intervention is recommended.'
                : 'Your CRP suggests mild to moderate inflammation. Diet can help reduce it.'}
            </p>

            <div className="space-y-2">
              <div>
                <p className="text-xs font-semibold text-slate-900 mb-1">🔥 Prioritize Daily:</p>
                <ul className="text-xs text-slate-700 space-y-0.5 ml-3">
                  <li>• Fatty fish: salmon, sardines, mackerel (omega-3 rich)</li>
                  <li>• Turmeric + black pepper (curcumin is powerful anti-inflammatory)</li>
                  <li>• Ginger, green tea, berries</li>
                  <li>• Extra virgin olive oil</li>
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-900 mb-1">❌ Strictly Avoid:</p>
                <ul className="text-xs text-slate-700 space-y-0.5 ml-3">
                  <li>• Processed foods, refined carbs, added sugar</li>
                  <li>• Vegetable oils (canola, soybean, corn)</li>
                  <li>• Processed meats, fried foods, trans fats</li>
                  <li>• High omega-6 foods without omega-3 balance</li>
                </ul>
              </div>
            </div>

            {isHighRisk && (
              <p className="text-xs text-rose-700 mt-3 font-medium">
                💊 Consider consulting a dietitian or physician for a comprehensive anti-inflammatory protocol.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}