import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TrendingDown, TrendingUp } from 'recharts';
import { TrendingDown as TrendingDownIcon, TrendingUp as TrendingUpIcon, Scale } from 'lucide-react';

export default function WeightTrendChart({ wearableSyncData = [] }) {
  // Filter weight data and sort by date
  const weightData = wearableSyncData
    .filter(d => d.body_weight)
    .map(d => ({
      date: new Date(d.sync_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: d.body_weight,
      fullDate: new Date(d.sync_date)
    }))
    .sort((a, b) => a.fullDate - b.fullDate)
    .slice(-30); // Last 30 entries

  if (weightData.length < 2) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5" />
            Weight Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">Need at least 2 weight entries to show trend. Start syncing Apple Health data to track your weight over time.</p>
        </CardContent>
      </Card>
    );
  }

  const firstWeight = weightData[0].weight;
  const latestWeight = weightData[weightData.length - 1].weight;
  const weightChange = latestWeight - firstWeight;
  const percentChange = ((weightChange / firstWeight) * 100).toFixed(1);
  const isDecreasing = weightChange < 0;

  return (
    <Card className={`border-2 ${isDecreasing ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5" />
            Weight Trend
          </CardTitle>
          <div className="flex items-center gap-2">
            {isDecreasing ? (
              <>
                <TrendingDownIcon className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-700">{percentChange}%</span>
              </>
            ) : (
              <>
                <TrendingUpIcon className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-semibold text-amber-700">+{percentChange}%</span>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={weightData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
            <XAxis dataKey="date" stroke="#666" style={{ fontSize: '12px' }} />
            <YAxis 
              domain={['dataMin - 1', 'dataMax + 1']}
              stroke="#666" 
              style={{ fontSize: '12px' }} 
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
              formatter={(value) => [`${value.toFixed(1)} kg`, 'Weight']}
            />
            <Line 
              type="monotone" 
              dataKey="weight" 
              stroke={isDecreasing ? '#16a34a' : '#f59e0b'}
              strokeWidth={2}
              dot={{ fill: isDecreasing ? '#16a34a' : '#f59e0b', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-300">
          <div className="text-center p-2 rounded bg-white/50">
            <div className="text-xs text-slate-600">Starting</div>
            <div className="text-lg font-bold text-slate-900">{firstWeight.toFixed(1)}</div>
            <div className="text-xs text-slate-500">kg</div>
          </div>
          <div className="text-center p-2 rounded bg-white/50">
            <div className="text-xs text-slate-600">Current</div>
            <div className="text-lg font-bold text-slate-900">{latestWeight.toFixed(1)}</div>
            <div className="text-xs text-slate-500">kg</div>
          </div>
          <div className="text-center p-2 rounded bg-white/50">
            <div className="text-xs text-slate-600">Change</div>
            <div className={`text-lg font-bold ${isDecreasing ? 'text-emerald-700' : 'text-amber-700'}`}>
              {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}
            </div>
            <div className="text-xs text-slate-500">kg</div>
          </div>
        </div>

        {isDecreasing ? (
          <div className="p-3 rounded-lg bg-emerald-100 border border-emerald-200 text-sm text-emerald-800">
            <p className="font-medium">✅ Great Progress!</p>
            <p className="text-xs mt-1">Your weight is trending down. Keep following your meal plan and activity targets.</p>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-amber-100 border border-amber-200 text-sm text-amber-800">
            <p className="font-medium">⚠️ Weight Trending Up</p>
            <p className="text-xs mt-1">Review your calorie intake and ensure your meals match your activity level.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}