import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function ProgressCharts({ entries = [], streakData = {} }) {
  // Prepare chart data
  const chartData = useMemo(() => {
    return [...entries]
      .sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date))
      .map(entry => ({
        date: format(parseISO(entry.entry_date), 'MMM d'),
        fullDate: entry.entry_date,
        weight: entry.weight,
        bodyFat: entry.body_fat_percentage,
        waist: entry.waist_cm,
        streak: streakData.meal_log_streak || 0
      }));
  }, [entries, streakData]);

  // Calculate stats
  const stats = useMemo(() => {
    if (chartData.length < 2) return null;

    const weights = chartData.filter(d => d.weight).map(d => d.weight);
    const firstWeight = weights[0];
    const lastWeight = weights[weights.length - 1];
    const totalChange = lastWeight - firstWeight;
    const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;

    return {
      startWeight: firstWeight,
      currentWeight: lastWeight,
      totalChange,
      isLoss: totalChange < 0,
      avgWeight
    };
  }, [chartData]);

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {stats && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <p className="text-sm text-slate-600 mb-1">Starting Weight</p>
              <p className="text-2xl font-bold text-slate-900">
                {stats.startWeight.toFixed(1)} kg
              </p>
            </CardContent>
          </Card>

          <Card className={`border-2 ${stats.isLoss ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                {stats.isLoss ? (
                  <TrendingDown className="w-4 h-4 text-emerald-600" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                )}
                <p className={`text-sm font-medium ${stats.isLoss ? 'text-emerald-700' : 'text-amber-700'}`}>
                  Total Change
                </p>
              </div>
              <p className={`text-2xl font-bold ${stats.isLoss ? 'text-emerald-700' : 'text-amber-700'}`}>
                {Math.abs(stats.totalChange).toFixed(1)} kg {stats.isLoss ? 'Lost' : 'Gained'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-4">
              <p className="text-sm text-slate-600 mb-1">Current Weight</p>
              <p className="text-2xl font-bold text-slate-900">
                {stats.currentWeight.toFixed(1)} kg
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Weight Chart */}
      {chartData.some(d => d.weight) && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-indigo-600" />
              Weight Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip formatter={(value) => value?.toFixed(1)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Weight (kg)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Body Fat Chart */}
      {chartData.some(d => d.bodyFat) && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Body Fat % Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip formatter={(value) => value?.toFixed(1)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="bodyFat"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Body Fat %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Waist Chart */}
      {chartData.some(d => d.waist) && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Waist Measurement Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip formatter={(value) => value?.toFixed(1)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="waist"
                  stroke="#ec4899"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Waist (cm)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}