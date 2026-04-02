import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingDown, AlertCircle } from 'lucide-react';

export default function GlucoseChartCard({ glucose_readings = [], meal_times = [] }) {
  // Generate demo data if none provided
  const data = useMemo(() => {
    if (glucose_readings.length === 0) {
      return Array.from({ length: 24 }, (_, i) => ({
        time: `${i.toString().padStart(2, '0')}:00`,
        glucose: Math.floor(80 + Math.sin(i / 4) * 35 + Math.random() * 15),
      }));
    }
    return glucose_readings.map((r) => ({
      time: new Date(r.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      glucose: r.glucose_value,
    }));
  }, [glucose_readings]);

  const avgGlucose = Math.round(data.reduce((sum, d) => sum + d.glucose, 0) / data.length);
  const timeInRange = data.filter((d) => d.glucose >= 70 && d.glucose <= 140).length;
  const timeInRangePercent = Math.round((timeInRange / data.length) * 100);

  const getStatusColor = (glucose) => {
    if (glucose < 70) return 'text-blue-600';
    if (glucose <= 140) return 'text-emerald-600';
    if (glucose <= 180) return 'text-amber-600';
    return 'text-red-600';
  };

  const getStatusBg = (glucose) => {
    if (glucose < 70) return 'bg-blue-50';
    if (glucose <= 140) return 'bg-emerald-50';
    if (glucose <= 180) return 'bg-amber-50';
    return 'bg-red-50';
  };

  const currentGlucose = data[data.length - 1]?.glucose || 0;

  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-emerald-600" />
              Glucose Levels
            </CardTitle>
            <CardDescription>Today's blood sugar readings</CardDescription>
          </div>
          {currentGlucose > 180 && (
            <Badge className="bg-red-100 text-red-700 border-red-200">
              <AlertCircle className="w-3 h-3 mr-1" />
              High
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className={`${getStatusBg(currentGlucose)} rounded-lg p-3`}>
            <p className="text-xs text-slate-600 mb-1">Current</p>
            <p className={`text-2xl font-bold ${getStatusColor(currentGlucose)}`}>
              {currentGlucose}
            </p>
            <p className="text-xs text-slate-500">mg/dL</p>
          </div>

          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-600 mb-1">Average</p>
            <p className="text-2xl font-bold text-slate-900">{avgGlucose}</p>
            <p className="text-xs text-slate-500">mg/dL</p>
          </div>

          <div className={`${timeInRangePercent >= 70 ? 'bg-emerald-50' : 'bg-amber-50'} rounded-lg p-3`}>
            <p className="text-xs text-slate-600 mb-1">In Range</p>
            <p className={`text-2xl font-bold ${timeInRangePercent >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {timeInRangePercent}%
            </p>
            <p className="text-xs text-slate-500">70-140 mg/dL</p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-slate-50 rounded-lg p-4">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12, fill: '#64748b' }}
              />
              <YAxis 
                domain={[60, 200]}
                tick={{ fontSize: 12, fill: '#64748b' }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #cbd5e1' }}
                formatter={(value) => [`${value} mg/dL`, 'Glucose']}
              />
              {/* Target range zones */}
              <ReferenceLine y={70} stroke="#3b82f6" strokeDasharray="5 5" opacity={0.3} />
              <ReferenceLine y={140} stroke="#10b981" strokeDasharray="5 5" opacity={0.3} />
              <ReferenceLine y={180} stroke="#f59e0b" strokeDasharray="5 5" opacity={0.3} />
              
              {/* Glucose line */}
              <Line 
                type="monotone" 
                dataKey="glucose" 
                stroke="#06b6d4" 
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></div>
            <span className="text-slate-600">Low (&lt;70)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300"></div>
            <span className="text-slate-600">Target (70-140)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-100 border border-red-300"></div>
            <span className="text-slate-600">High (&gt;180)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}