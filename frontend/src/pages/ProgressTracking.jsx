import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp, Minus, Plus, Camera, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

export default function ProgressTracking() {
  const [newEntry, setNewEntry] = useState({ log_date: new Date().toISOString().split('T')[0], weight_lbs: '', notes: '' });
  const [unit, setUnit] = useState('lbs');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['weightLogs'],
    queryFn: () => base44.entities.WeightLog.list('log_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WeightLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weightLogs'] });
      setNewEntry({ log_date: new Date().toISOString().split('T')[0], weight_lbs: '', notes: '' });
      setShowForm(false);
      toast.success('Weight logged!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WeightLog.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weightLogs'] });
      toast.success('Entry deleted');
    },
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setNewEntry(prev => ({ ...prev, photo_url: file_url }));
      toast.success('Photo uploaded');
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const weightLbs = parseFloat(newEntry.weight_lbs);
    if (!newEntry.log_date || isNaN(weightLbs) || weightLbs <= 0) {
      toast.error('Please enter a valid weight');
      return;
    }
    createMutation.mutate({
      log_date: newEntry.log_date,
      weight_lbs: weightLbs,
      weight_kg: parseFloat((weightLbs * 0.453592).toFixed(1)),
      notes: newEntry.notes,
      photo_url: newEntry.photo_url,
    });
  };

  // Chart data
  const chartData = logs.map(l => ({
    date: format(parseISO(l.log_date), 'MMM d'),
    weight: unit === 'lbs' ? l.weight_lbs : l.weight_kg,
  }));

  // Stats
  const firstLog = logs[0];
  const lastLog = logs[logs.length - 1];
  const totalChange = firstLog && lastLog ? (lastLog.weight_lbs - firstLog.weight_lbs) : null;
  const recentLogs = [...logs].reverse().slice(0, 10);

  const TrendIcon = totalChange === null ? null : totalChange < 0 ? TrendingDown : totalChange > 0 ? TrendingUp : Minus;
  const trendColor = totalChange === null ? '' : totalChange < 0 ? 'text-emerald-600' : totalChange > 0 ? 'text-rose-500' : 'text-slate-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Progress Tracking</h1>
          <p className="text-slate-600 mt-1">Track your weight and see your journey over time</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-indigo-600 to-purple-600">
          <Plus className="w-4 h-4 mr-2" />
          Log Weight
        </Button>
      </div>

      {/* Log Form */}
      {showForm && (
        <Card className="border-indigo-200 bg-indigo-50">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newEntry.log_date}
                  onChange={e => setNewEntry(p => ({ ...p, log_date: e.target.value }))}
                  className="bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label>Weight ({unit === 'lbs' ? 'lbs' : 'kg'})</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder={unit === 'lbs' ? '150' : '68'}
                    value={newEntry.weight_lbs}
                    onChange={e => setNewEntry(p => ({ ...p, weight_lbs: e.target.value }))}
                    className="bg-white"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-white shrink-0"
                    onClick={() => setUnit(u => u === 'lbs' ? 'kg' : 'lbs')}
                  >
                    {unit}
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="How are you feeling?"
                  value={newEntry.notes}
                  onChange={e => setNewEntry(p => ({ ...p, notes: e.target.value }))}
                  className="bg-white h-16 resize-none"
                />
              </div>
              <div className="space-y-1">
                <Label>Progress Photo (optional)</Label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    <Button type="button" variant="outline" className="bg-white" asChild>
                      <span>
                        {uploadingPhoto ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
                        {newEntry.photo_url ? 'Photo added ✓' : 'Upload Photo'}
                      </span>
                    </Button>
                  </label>
                  {newEntry.photo_url && (
                    <img src={newEntry.photo_url} alt="preview" className="w-10 h-10 rounded object-cover border" />
                  )}
                </div>
              </div>
              <div className="md:col-span-2 flex gap-3">
                <Button type="submit" disabled={createMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Entry
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stats Row */}
      {logs.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-slate-200">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">Starting</p>
              <p className="text-2xl font-bold text-slate-800">{firstLog?.weight_lbs} <span className="text-sm font-normal">lbs</span></p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">Current</p>
              <p className="text-2xl font-bold text-slate-800">{lastLog?.weight_lbs} <span className="text-sm font-normal">lbs</span></p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">Total Change</p>
              <div className={`flex items-center justify-center gap-1 text-2xl font-bold ${trendColor}`}>
                {TrendIcon && <TrendIcon className="w-5 h-5" />}
                {totalChange !== null ? `${totalChange > 0 ? '+' : ''}${totalChange.toFixed(1)}` : '—'}
                <span className="text-sm font-normal">lbs</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">Entries</p>
              <p className="text-2xl font-bold text-slate-800">{logs.length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart */}
      {logs.length >= 2 && (
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Weight Over Time</CardTitle>
            <div className="flex gap-1">
              {['lbs', 'kg'].map(u => (
                <Button key={u} variant={unit === u ? 'default' : 'outline'} size="sm" className="h-7 px-3 text-xs" onClick={() => setUnit(u)}>{u}</Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [`${v} ${unit}`, 'Weight']}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Log History */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Log History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
          ) : recentLogs.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <p className="text-sm">No entries yet. Click "Log Weight" to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
                  {log.photo_url && (
                    <img src={log.photo_url} alt="progress" className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800">
                        {format(parseISO(log.log_date), 'MMMM d, yyyy')}
                      </span>
                      <Badge variant="secondary" className="text-sm">
                        {log.weight_lbs} lbs
                        {log.weight_kg && <span className="text-slate-400 ml-1">/ {log.weight_kg} kg</span>}
                      </Badge>
                    </div>
                    {log.notes && <p className="text-sm text-slate-500 mt-0.5">{log.notes}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => deleteMutation.mutate(log.id)}
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}