import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { base44, supabase } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { TrendingDown, TrendingUp, Minus, Scale, Zap, Smile, Trophy, Plus, ChevronRight, FlaskConical } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner';
import { PageErrorBoundary, ComponentErrorBoundary } from '@/components/ErrorBoundary';
import StreaksAchievementsSection from '@/components/streaks/StreaksAchievementsSection';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function apiGet(path) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${session?.access_token}` },
  });
  return res.json();
}

async function apiPost(path, body) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
    body: JSON.stringify(body),
  });
  return res.json();
}

const ENERGY_LABELS = { 1: 'Exhausted', 2: 'Low', 3: 'Moderate', 4: 'Good', 5: 'Excellent' };
const MOOD_LABELS   = { 1: 'Terrible', 2: 'Bad', 3: 'Neutral', 4: 'Good', 5: 'Great' };

export default function MyProgress() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ weight: '', energy: 3, mood: 3, notes: '' });
  const [showForm, setShowForm] = useState(false);

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['progressTrends'],
    queryFn:  () => apiGet('/api/progress/trends?days=90'),
  });

  const { data: stats } = useQuery({
    queryKey: ['progressStats'],
    queryFn:  () => apiGet('/api/progress/stats'),
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['progressEntries'],
    queryFn:  () => base44.entities.ProgressEntry.list(),
  });

  const logEntry = useMutation({
    mutationFn: (data) => apiPost('/api/progress', data),
    onSuccess:  () => {
      toast.success('Progress logged! 🎉');
      queryClient.invalidateQueries({ queryKey: ['progressTrends'] });
      queryClient.invalidateQueries({ queryKey: ['progressStats'] });
      queryClient.invalidateQueries({ queryKey: ['progressEntries'] });
      queryClient.invalidateQueries({ queryKey: ['gamificationProfile'] });
      setForm({ weight: '', energy: 3, mood: 3, notes: '' });
      setShowForm(false);
    },
    onError: () => toast.error('Failed to log progress'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    logEntry.mutate({
      weight:  form.weight ? parseFloat(form.weight) : undefined,
      energy:  form.energy,
      mood:    form.mood,
      notes:   form.notes,
      logDate: new Date().toISOString().split('T')[0],
    });
  };

  const weightChartData = trends?.weight?.data?.map(d => ({ date: d.date, Weight: d.weight })) || [];
  const energyMoodData  = entries.slice(0, 30).reverse().map(e => ({
    date:   e.logDate,
    Energy: e.energy,
    Mood:   e.mood,
  })).filter(d => d.Energy || d.Mood);

  return (
    <PageErrorBoundary title="My Progress">
      <div className="space-y-6 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Progress</h1>
            <p className="text-slate-500 mt-1">Track your health journey over time</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Log Today
          </Button>
        </div>

        {/* Quick log form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-indigo-200 bg-indigo-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Log Today's Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Weight (kg)</Label>
                    <Input type="number" step="0.1" placeholder="e.g. 72.5"
                      value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Energy Level: {ENERGY_LABELS[form.energy]}</Label>
                    <div className="flex gap-2 mt-1">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} type="button" onClick={() => setForm(f => ({ ...f, energy: n }))}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${form.energy === n ? 'bg-amber-500 text-white shadow' : 'bg-white border border-slate-200 text-slate-600 hover:border-amber-300'}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Mood: {MOOD_LABELS[form.mood]}</Label>
                    <div className="flex gap-2 mt-1">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} type="button" onClick={() => setForm(f => ({ ...f, mood: n }))}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${form.mood === n ? 'bg-violet-500 text-white shadow' : 'bg-white border border-slate-200 text-slate-600 hover:border-violet-300'}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Notes (optional)</Label>
                    <Textarea placeholder="How are you feeling?" value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="h-10" />
                  </div>
                  <div className="sm:col-span-2 flex gap-3">
                    <Button type="submit" disabled={logEntry.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                      {logEntry.isPending ? 'Saving...' : 'Save Progress'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Days Tracked', value: stats?.daysTracked || 0, icon: '📅', color: 'text-indigo-600' },
            { label: 'Total Logs', value: stats?.totalEntries || 0, icon: '📊', color: 'text-emerald-600' },
            { label: 'This Week', value: stats?.thisWeek || 0, icon: '⭐', color: 'text-amber-600' },
            {
              label: 'Weight Change',
              value: stats?.weightChange != null ? `${stats.weightChange > 0 ? '+' : ''}${stats.weightChange} kg` : '—',
              icon:  stats?.weightChange < 0 ? '📉' : stats?.weightChange > 0 ? '📈' : '⚖️',
              color: stats?.weightChange < 0 ? 'text-emerald-600' : stats?.weightChange > 0 ? 'text-red-500' : 'text-slate-500',
            },
          ].map(({ label, value, icon, color }) => (
            <Card key={label}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl mb-1">{icon}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-slate-500 mt-1">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="charts">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="streaks">Streaks & Badges</TabsTrigger>
          </TabsList>

          {/* Charts Tab */}
          <TabsContent value="charts" className="space-y-6 mt-4">
            <ComponentErrorBoundary>
              {trendsLoading ? (
                <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
              ) : !trends?.hasData ? (
                <Card className="border-dashed">
                  <CardContent className="p-12 text-center">
                    <Scale className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No progress data yet</h3>
                    <p className="text-slate-500 text-sm mb-4">Log your first entry to start tracking trends</p>
                    <Button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white">Log Today</Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Weight Chart */}
                  {weightChartData.length > 1 && (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Scale className="w-4 h-4 text-indigo-500" /> Weight Trend
                          </CardTitle>
                          {trends.weight.delta != null && (
                            <Badge className={trends.weight.delta < 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                              {trends.weight.delta > 0 ? '+' : ''}{trends.weight.delta} kg
                              {trends.weight.delta < 0 ? <TrendingDown className="w-3 h-3 ml-1 inline" /> : <TrendingUp className="w-3 h-3 ml-1 inline" />}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                          <LineChart data={weightChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                            <YAxis tick={{ fontSize: 11 }} domain={['dataMin - 2', 'dataMax + 2']} />
                            <Tooltip formatter={(v) => [`${v} kg`, 'Weight']} />
                            <Line type="monotone" dataKey="Weight" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}

                  {/* Energy & Mood Chart */}
                  {energyMoodData.length > 1 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-500" /> Energy & Mood
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                          <LineChart data={energyMoodData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                            <YAxis tick={{ fontSize: 11 }} domain={[0, 5]} ticks={[1,2,3,4,5]} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="Energy" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="Mood"   stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}

                  {/* Lab correlation */}
                  {trends.labCorrelation?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <FlaskConical className="w-4 h-4 text-purple-500" /> Lab Marker Changes
                          <Badge variant="outline" className="text-xs ml-auto">Alongside your progress</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {trends.labCorrelation.map(({ name, current, previous, unit, delta }) => (
                            <div key={name} className={`p-3 rounded-xl border ${delta < 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                              <p className="text-xs font-semibold text-slate-600">{name}</p>
                              <p className="text-lg font-bold text-slate-800">{current} <span className="text-xs font-normal">{unit}</span></p>
                              <p className={`text-xs font-medium flex items-center gap-1 ${delta < 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {delta < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                                {delta > 0 ? '+' : ''}{delta} from {previous}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </ComponentErrorBoundary>
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones" className="mt-4">
            <ComponentErrorBoundary>
              {trends?.milestones?.length > 0 ? (
                <div className="space-y-3">
                  {trends.milestones.map((m, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-4 p-4 bg-white border rounded-xl shadow-sm">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-2xl">
                        {m.type === 'weight_loss' ? '📉' : m.type === 'consistency' ? '🔥' : '⭐'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{m.message}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Keep it up — you're building a healthy habit</p>
                      </div>
                      <Trophy className="w-5 h-5 text-yellow-500 ml-auto" />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-12 text-center">
                    <Trophy className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No milestones yet</h3>
                    <p className="text-slate-500 text-sm">Log consistently and milestones will appear here</p>
                  </CardContent>
                </Card>
              )}
            </ComponentErrorBoundary>
          </TabsContent>

          {/* Streaks Tab */}
          <TabsContent value="streaks" className="mt-4">
            <ComponentErrorBoundary>
              <StreaksAchievementsSection />
            </ComponentErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </PageErrorBoundary>
  );
}
