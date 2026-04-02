import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TrendingUp, TrendingDown } from 'recharts';
import { TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon, Heart } from 'lucide-react';

export default function HRVTrendChart({ wearableSyncData = [] }) {
  // Filter HRV data and sort by date
  const hrvData = wearableSyncData
    .filter(d => d.hrv)
    .map(d => ({
      date: new Date(d.sync_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      hrv: d.hrv,
      fullDate: new Date(d.sync_date)
    }))
    .sort((a, b) => a.fullDate - b.fullDate)
    .slice(-30); // Last 30 entries

  if (hrvData.length < 2) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            HRV (Heart Rate Variability) Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">Connect Oura Ring or WHOOP and sync data over time to see your HRV trend. Higher HRV generally indicates better recovery.</p>
        </CardContent>
      </Card>
    );
  }

  const firstHRV = hrvData[0].hrv;
  const latestHRV = hrvData[hrvData.length - 1].hrv;
  const hrvChange = latestHRV - firstHRV;
  const percentChange = ((hrvChange / firstHRV) * 100).toFixed(1);
  const isImproving = hrvChange > 0;
  const avgHRV = Math.round(hrvData.reduce((sum, d) => sum + d.hrv, 0) / hrvData.length);

  return (
    <Card className={`border-2 ${isImproving ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            HRV Trend
          </CardTitle>
          <div className="flex items-center gap-2">
            {isImproving ? (
              <>
                <TrendingUpIcon className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-700">+{percentChange}%</span>
              </>
            ) : (
              <>
                <TrendingDownIcon className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-semibold text-amber-700">{percentChange}%</span>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={hrvData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
            <XAxis dataKey="date" stroke="#666" style={{ fontSize: '12px' }} />
            <YAxis stroke="#666" style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
              formatter={(value) => [`${value} ms`, 'HRV']}
            />
            <Line 
              type="monotone" 
              dataKey="hrv" 
              stroke={isImproving ? '#16a34a' : '#f59e0b'}
              strokeWidth={2}
              dot={{ fill: isImproving ? '#16a34a' : '#f59e0b', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-300">
          <div className="text-center p-2 rounded bg-white/50">
            <div className="text-xs text-slate-600">Lowest</div>
            <div className="text-lg font-bold text-slate-900">
              {Math.min(...hrvData.map(d => d.hrv))}
            </div>
            <div className="text-xs text-slate-500">ms</div>
          </div>
          <div className="text-center p-2 rounded bg-white/50">
            <div className="text-xs text-slate-600">Average</div>
            <div className="text-lg font-bold text-slate-900">{avgHRV}</div>
            <div className="text-xs text-slate-500">ms</div>
          </div>
          <div className="text-center p-2 rounded bg-white/50">
            <div className="text-xs text-slate-600">Latest</div>
            <div className="text-lg font-bold text-slate-900">{latestHRV}</div>
            <div className="text-xs text-slate-500">ms</div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-blue-100 border border-blue-300 text-sm text-blue-900">
          <p className="font-medium mb-1">💡 Understanding HRV</p>
          <p className="text-xs">
            Higher HRV generally indicates better cardiovascular fitness and recovery. Increasing HRV over time suggests your body is adapting well to training and stress.
          </p>
        </div>

        {isImproving ? (
          <div className="p-3 rounded-lg bg-emerald-100 border border-emerald-200 text-sm text-emerald-800">
            <p className="font-medium">✅ HRV Improving</p>
            <p className="text-xs mt-1">Your HRV is increasing, indicating better recovery and cardiovascular adaptation. Keep up your current routine!</p>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-amber-100 border border-amber-200 text-sm text-amber-800">
            <p className="font-medium">⚠️ HRV Declining</p>
            <p className="text-xs mt-1">Your HRV is decreasing. Consider increasing sleep, reducing stress, and focusing on recovery days.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}