import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const OPTIMAL_RANGES = {
  TSH: { min: 0.4, max: 4.0, unit: 'mIU/L' },
  'Free T3': { min: 2.3, max: 4.2, unit: 'pg/mL' },
  'Free T4': { min: 0.8, max: 1.8, unit: 'ng/dL' },
};

export default function ThyroidPanel({ labResults = [] }) {
  if (!labResults || labResults.length === 0) {
    return (
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="text-purple-900">🦋 Thyroid Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">Upload lab results to view your thyroid health status (TSH, Free T3, Free T4).</p>
        </CardContent>
      </Card>
    );
  }

  // Get most recent lab result
  const latestLab = labResults[labResults.length - 1];
  const biomarkers = latestLab?.biomarkers || {};

  const getStatus = (value, range) => {
    if (!value || !range) return 'unknown';
    if (value < range.min) return 'low';
    if (value > range.max) return 'high';
    return 'normal';
  };

  const renderMarker = (name, value, unit) => {
    const range = OPTIMAL_RANGES[name];
    if (!range || !value) return null;

    const status = getStatus(value, range);
    const statusColors = {
      normal: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800', icon: '✓' },
      low: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800', icon: '↓' },
      high: { bg: 'bg-rose-50', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-800', icon: '↑' },
      unknown: { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-800', icon: '?' },
    };

    const colors = statusColors[status];

    return (
      <div key={name} className={`p-3 rounded-lg border ${colors.bg} ${colors.border}`}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-slate-900">{name}</span>
          <Badge className={colors.badge}>{colors.icon} {status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
        </div>
        <div className="text-sm text-slate-700 mb-1">
          <span className="font-medium">{value} {unit}</span>
        </div>
        <div className="text-xs text-slate-600">
          Optimal: {range.min}-{range.max} {unit}
        </div>
      </div>
    );
  };

  const tsh = biomarkers.TSH?.value;
  const freeT3 = biomarkers['Free T3']?.value;
  const freeT4 = biomarkers['Free T4']?.value;

  const hasData = tsh || freeT3 || freeT4;

  if (!hasData) {
    return (
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="text-purple-900">🦋 Thyroid Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">No thyroid biomarkers found in recent lab results. Upload lab results with TSH, Free T3, or Free T4.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="text-purple-900">🦋 Thyroid Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {renderMarker('TSH', tsh, 'mIU/L')}
        {renderMarker('Free T3', freeT3, 'pg/mL')}
        {renderMarker('Free T4', freeT4, 'ng/dL')}

        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
          <p className="font-medium mb-1">💡 About Thyroid Labs</p>
          <ul className="text-xs space-y-1 ml-3 list-disc">
            <li><strong>TSH:</strong> Controls thyroid hormone production. High = hypothyroidism, Low = hyperthyroidism.</li>
            <li><strong>Free T4:</strong> Active thyroid hormone. Low = hypothyroidism symptoms.</li>
            <li><strong>Free T3:</strong> Most active form. Low = poor conversion or Hashimoto's.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}