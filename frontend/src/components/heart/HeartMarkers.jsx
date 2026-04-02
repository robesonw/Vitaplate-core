import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, Heart } from 'lucide-react';

export default function HeartMarkers({ labResults }) {
  if (!labResults || labResults.length === 0) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Cardiovascular Markers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">Upload lab results to see your LDL, HDL, and triglyceride targets based on your actual values.</p>
        </CardContent>
      </Card>
    );
  }

  const b = labResults[0].biomarkers || {};
  
  // Extract markers (handle multiple naming conventions)
  const ldl = b.LDL?.value || b['LDL Cholesterol']?.value || b['Low-Density Lipoprotein']?.value || null;
  const hdl = b.HDL?.value || b['HDL Cholesterol']?.value || b['High-Density Lipoprotein']?.value || null;
  const triglycerides = b.Triglycerides?.value || b['Total Triglycerides']?.value || null;
  const totalChol = b['Total Cholesterol']?.value || null;

  // Define optimal targets
  const getMarkerInfo = (type, value) => {
    switch (type) {
      case 'LDL':
        return {
          current: value,
          target: value > 100 ? 70 : 100,
          unit: 'mg/dL',
          optimal: 'Under 100 mg/dL (Optimal)',
          status: value <= 70 ? 'optimal' : value <= 100 ? 'good' : value <= 130 ? 'borderline' : 'high'
        };
      case 'HDL':
        return {
          current: value,
          target: 60,
          unit: 'mg/dL',
          optimal: '60 mg/dL or higher (Protective)',
          status: value >= 60 ? 'optimal' : value >= 50 ? 'good' : 'low'
        };
      case 'Triglycerides':
        return {
          current: value,
          target: 150,
          unit: 'mg/dL',
          optimal: 'Under 150 mg/dL (Normal)',
          status: value <= 150 ? 'optimal' : value <= 200 ? 'borderline' : 'high'
        };
      default:
        return null;
    }
  };

  const ldlInfo = ldl ? getMarkerInfo('LDL', ldl) : null;
  const hdlInfo = hdl ? getMarkerInfo('HDL', hdl) : null;
  const trigsInfo = triglycerides ? getMarkerInfo('Triglycerides', triglycerides) : null;

  const getStatusColor = (status) => {
    if (status === 'optimal') return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' };
    if (status === 'good') return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' };
    if (status === 'borderline') return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' };
    return { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' };
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5" />
          Your Cardiovascular Markers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {ldlInfo && (
          <div className={`p-4 rounded-lg border ${getStatusColor(ldlInfo.status).bg} ${getStatusColor(ldlInfo.status).border}`}>
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-slate-900">LDL Cholesterol (Bad)</h4>
              <Badge className={`${getStatusColor(ldlInfo.status).text} border`}>
                {ldlInfo.status.charAt(0).toUpperCase() + ldlInfo.status.slice(1)}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-600">Your Current</p>
                <p className={`text-lg font-bold ${getStatusColor(ldlInfo.status).text}`}>{ldlInfo.current} mg/dL</p>
              </div>
              <div>
                <p className="text-slate-600">Target for You</p>
                <p className="text-lg font-bold text-emerald-700">&lt;{ldlInfo.target} mg/dL</p>
              </div>
            </div>
          </div>
        )}

        {hdlInfo && (
          <div className={`p-4 rounded-lg border ${getStatusColor(hdlInfo.status).bg} ${getStatusColor(hdlInfo.status).border}`}>
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-slate-900">HDL Cholesterol (Good)</h4>
              <Badge className={`${getStatusColor(hdlInfo.status).text} border`}>
                {hdlInfo.status.charAt(0).toUpperCase() + hdlInfo.status.slice(1)}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-600">Your Current</p>
                <p className={`text-lg font-bold ${getStatusColor(hdlInfo.status).text}`}>{hdlInfo.current} mg/dL</p>
              </div>
              <div>
                <p className="text-slate-600">Target (Protective)</p>
                <p className="text-lg font-bold text-emerald-700">&ge;60 mg/dL</p>
              </div>
            </div>
          </div>
        )}

        {trigsInfo && (
          <div className={`p-4 rounded-lg border ${getStatusColor(trigsInfo.status).bg} ${getStatusColor(trigsInfo.status).border}`}>
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-slate-900">Triglycerides</h4>
              <Badge className={`${getStatusColor(trigsInfo.status).text} border`}>
                {trigsInfo.status.charAt(0).toUpperCase() + trigsInfo.status.slice(1)}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-600">Your Current</p>
                <p className={`text-lg font-bold ${getStatusColor(trigsInfo.status).text}`}>{trigsInfo.current} mg/dL</p>
              </div>
              <div>
                <p className="text-slate-600">Target (Normal)</p>
                <p className="text-lg font-bold text-emerald-700">&lt;150 mg/dL</p>
              </div>
            </div>
          </div>
        )}

        <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-sm text-indigo-700">
          <p className="font-medium mb-1">📋 How This Plan Helps</p>
          <ul className="text-xs space-y-1 list-disc list-inside">
            <li>Reduces saturated fat to lower LDL cholesterol</li>
            <li>Increases soluble fiber (oats, beans) to improve HDL</li>
            <li>Limits sodium to support healthy blood pressure</li>
            <li>Includes 2+ omega-3 servings daily to reduce triglycerides</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}