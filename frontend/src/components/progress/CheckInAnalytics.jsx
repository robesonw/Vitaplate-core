import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { TrendingDown, TrendingUp, Zap, Moon, Droplet } from 'lucide-react';

export default function CheckInAnalytics({ checkInData = [] }) {
  if (checkInData.length < 2) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Daily Check-In Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">Complete at least 2 days of check-ins to see trends and insights.</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for charts
  const sortedData = [...checkInData].sort((a, b) => new Date(a.check_in_date) - new Date(b.check_in_date)).slice(-30);

  const chartData = sortedData.map(d => ({
    date: new Date(d.check_in_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: d.weight,
    energy: d.energy_level,
    sleep: d.sleep_hours,
    water: d.water_glasses,
    mood: d.mood
  }));

  // Calculate stats
  const avgEnergy = Math.round(sortedData.reduce((sum, d) => sum + (d.energy_level || 0), 0) / sortedData.length * 10) / 10;
  const avgSleep = (sortedData.reduce((sum, d) => sum + (d.sleep_hours || 0), 0) / sortedData.length).toFixed(1);
  const totalWater = sortedData.reduce((sum, d) => sum + (d.water_glasses || 0), 0);
  const avgWater = Math.round(totalWater / sortedData.length);

  // Sleep vs Energy correlation
  const sleepEnergyData = sortedData.map(d => ({
    sleep: d.sleep_hours,
    energy: d.energy_level,
    date: new Date(d.check_in_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }));

  // Water streak
  let waterStreak = 0;
  for (let i = sortedData.length - 1; i >= 0; i--) {
    if (sortedData[i].water_glasses >= 8) {
      waterStreak++;
    } else {
      break;
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-orange-500" />
              <p className="text-xs text-slate-600">Avg Energy</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{avgEnergy}/5</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Moon className="w-4 h-4 text-indigo-500" />
              <p className="text-xs text-slate-600">Avg Sleep</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{avgSleep}h</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Droplet className="w-4 h-4 text-blue-500" />
              <p className="text-xs text-slate-600">Avg Water</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{avgWater}</p>
            <p className="text-xs text-slate-600">glasses/day</p>
          </CardContent>
        </Card>

        <Card className={`border-2 ${waterStreak >= 3 ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200'}`}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Droplet className="w-4 h-4 text-emerald-600" />
              <p className="text-xs text-slate-600">Water Streak</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{waterStreak}</p>
            <p className="text-xs text-slate-600">days (8+ glasses)</p>
          </CardContent>
        </Card>
      </div>

      {/* Energy Trend */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500" />
            Energy Level Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
              <XAxis dataKey="date" stroke="#666" style={{ fontSize: '12px' }} />
              <YAxis domain={[0, 5]} stroke="#666" style={{ fontSize: '12px' }} />
              <Tooltip />
              <Bar dataKey="energy" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sleep vs Energy Correlation */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-500" />
            Sleep vs Energy Correlation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
              <XAxis dataKey="sleep" name="Sleep (hours)" stroke="#666" style={{ fontSize: '12px' }} />
              <YAxis dataKey="energy" name="Energy (1-5)" domain={[0, 5]} stroke="#666" style={{ fontSize: '12px' }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Sleep-Energy" data={sleepEnergyData} fill="#6366f1" />
            </ScatterChart>
          </ResponsiveContainer>
          <p className="text-xs text-slate-600 mt-3">
            💡 The chart shows the relationship between sleep and energy. More sleep typically correlates with higher energy.
          </p>
        </CardContent>
      </Card>

      {/* Water Intake Trend */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplet className="w-5 h-5 text-blue-500" />
            Water Intake Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
              <XAxis dataKey="date" stroke="#666" style={{ fontSize: '12px' }} />
              <YAxis stroke="#666" style={{ fontSize: '12px' }} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="water" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-xs text-blue-900">
              <strong>Hydration Goal:</strong> 8+ glasses of water per day. {waterStreak > 0 && `You've had a ${waterStreak}-day streak! Keep it up.`}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}