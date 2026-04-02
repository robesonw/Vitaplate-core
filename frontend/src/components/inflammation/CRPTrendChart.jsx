import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingDown, TrendingUp } from 'lucide-react';

export default function CRPTrendChart({ labResults = [] }) {
  if (!labResults.length) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">📊 CRP 30-Day Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">Upload multiple lab results over time to see your CRP trend and track inflammation improvement.</p>
        </CardContent>
      </Card>
    );
  }

  // Extract CRP values with dates
  const crpData = labResults
    .map(lab => {
      const crp = lab.biomarkers?.CRP?.value || 
                  lab.biomarkers?.['C-Reactive Protein']?.value ||
                  lab.biomarkers?.['hs-CRP']?.value;
      return {
        date: new Date(lab.upload_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: crp,
        fullDate: new Date(lab.upload_date)
      };
    })
    .filter(d => d.value != null)
    .sort((a, b) => a.fullDate - b.fullDate)
    .slice(-12); // Last 12 lab results

  if (crpData.length < 2) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">📊 CRP 30-Day Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">Need at least 2 lab results to show trend. Upload another lab result to track improvement.</p>
        </CardContent>
      </Card>
    );
  }

  const firstValue = crpData[0].value;
  const lastValue = crpData[crpData.length - 1].value;
  const change = lastValue - firstValue;
  const percentChange = ((change / firstValue) * 100).toFixed(1);
  const isImproving = change < 0;

  return (
    <Card className={`border-2 ${isImproving ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-900">📊 CRP 30-Day Trend</CardTitle>
          <div className="flex items-center gap-2">
            {isImproving ? (
              <>
                <TrendingDown className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-700">{percentChange}%</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-semibold text-amber-700">+{percentChange}%</span>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={crpData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
            <XAxis dataKey="date" stroke="#666" style={{ fontSize: '12px' }} />
            <YAxis stroke="#666" style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
              formatter={(value) => [`${value.toFixed(2)} mg/L`, 'CRP']}
            />
            <ReferenceLine 
              y={3.0} 
              stroke="#ef4444" 
              strokeDasharray="5 5"
              label={{ value: 'Normal (<3.0)', position: 'right', fontSize: 12, fill: '#ef4444' }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={isImproving ? '#16a34a' : '#f59e0b'}
              strokeWidth={2}
              dot={{ fill: isImproving ? '#16a34a' : '#f59e0b', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-300">
          <div className="text-center p-2 rounded bg-white/50">
            <div className="text-xs text-slate-600">First Result</div>
            <div className="text-lg font-bold text-slate-900">{firstValue.toFixed(2)}</div>
            <div className="text-xs text-slate-500">mg/L</div>
          </div>
          <div className="text-center p-2 rounded bg-white/50">
            <div className="text-xs text-slate-600">Latest Result</div>
            <div className="text-lg font-bold text-slate-900">{lastValue.toFixed(2)}</div>
            <div className="text-xs text-slate-500">mg/L</div>
          </div>
          <div className="text-center p-2 rounded bg-white/50">
            <div className="text-xs text-slate-600">Change</div>
            <div className={`text-lg font-bold ${isImproving ? 'text-emerald-700' : 'text-amber-700'}`}>
              {change > 0 ? '+' : ''}{change.toFixed(2)}
            </div>
            <div className="text-xs text-slate-500">mg/L</div>
          </div>
        </div>

        {isImproving ? (
          <div className="p-3 rounded-lg bg-emerald-100 border border-emerald-200 text-sm text-emerald-800">
            <p className="font-medium">✅ Inflammation Improving!</p>
            <p className="text-xs mt-1">Keep following your anti-inflammatory diet. Consistent dietary choices are key to sustained improvement.</p>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-amber-100 border border-amber-200 text-sm text-amber-800">
            <p className="font-medium">⚠️ Inflammation Increasing</p>
            <p className="text-xs mt-1">Increase anti-inflammatory foods: omega-3 fish, turmeric, ginger, berries. Reduce processed foods and vegetable oils.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}