import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, TrendingUp, AlertCircle } from 'lucide-react';

export default function RecoveryStatusCard({ todayRecovery = null }) {
  if (!todayRecovery) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900 flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Recovery Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">Connect Oura Ring or WHOOP to see your daily recovery score.</p>
        </CardContent>
      </Card>
    );
  }

  const score = todayRecovery.recovery_score || todayRecovery.readiness_score;
  
  if (!score) return null;

  // Determine recovery status
  let status, bgColor, borderColor, icon, statusText;
  
  if (score >= 67) {
    status = 'green';
    bgColor = 'bg-emerald-50';
    borderColor = 'border-emerald-200';
    icon = '🟢';
    statusText = 'High Recovery';
  } else if (score >= 34) {
    status = 'yellow';
    bgColor = 'bg-amber-50';
    borderColor = 'border-amber-200';
    icon = '🟡';
    statusText = 'Moderate Recovery';
  } else {
    status = 'red';
    bgColor = 'bg-rose-50';
    borderColor = 'border-rose-200';
    icon = '🔴';
    statusText = 'Low Recovery';
  }

  const getRecommendation = () => {
    switch (status) {
      case 'green':
        return 'You\'re well-recovered. Today is optimal for high-performance meals with adequate carbs and protein.';
      case 'yellow':
        return 'Moderate recovery. Balanced macros with focus on anti-inflammatory foods recommended.';
      case 'red':
        return 'Low recovery. Focus on easy-to-digest, anti-inflammatory foods with extra protein for muscle repair.';
      default:
        return '';
    }
  };

  return (
    <Card className={`border-2 ${borderColor} ${bgColor}`}>
      <CardHeader>
        <CardTitle className="text-slate-900 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Recovery Status
          </span>
          <span className="text-3xl">{icon}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-700 mb-1">Today's Score</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-slate-900">{Math.round(score)}</span>
              <span className="text-slate-600">%</span>
            </div>
          </div>
          <Badge className={`${
            status === 'green' ? 'bg-emerald-100 text-emerald-800' :
            status === 'yellow' ? 'bg-amber-100 text-amber-800' :
            'bg-rose-100 text-rose-800'
          }`}>
            {statusText}
          </Badge>
        </div>

        {todayRecovery.hrv && (
          <div className="p-3 rounded-lg bg-white/50 border border-slate-200">
            <p className="text-xs text-slate-600">Heart Rate Variability</p>
            <p className="font-semibold text-slate-900">{todayRecovery.hrv} ms</p>
          </div>
        )}

        {todayRecovery.strain_score !== undefined && (
          <div className="p-3 rounded-lg bg-white/50 border border-slate-200">
            <p className="text-xs text-slate-600">Strain Score</p>
            <p className="font-semibold text-slate-900">{Math.round(todayRecovery.strain_score)}/100</p>
          </div>
        )}

        <div className={`p-3 rounded-lg border flex items-start gap-2 ${
          status === 'green' ? 'bg-emerald-100 border-emerald-300' :
          status === 'yellow' ? 'bg-amber-100 border-amber-300' :
          'bg-rose-100 border-rose-300'
        }`}>
          {status === 'red' && <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          {status !== 'red' && <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          <div className="text-sm font-medium text-slate-900">
            {getRecommendation()}
          </div>
        </div>

        <p className="text-xs text-slate-600 p-2 rounded bg-slate-100">
          Data from {todayRecovery.wearable_source === 'oura' ? 'Oura Ring' : 'WHOOP'}
        </p>
      </CardContent>
    </Card>
  );
}