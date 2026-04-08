import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FlaskConical, TrendingUp, TrendingDown, Minus,
  Pill, Calendar, Trash2, CheckCircle, AlertTriangle, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import LabUploader from '../components/labs/LabUploader';
import { PageErrorBoundary, ComponentErrorBoundary } from '../components/ErrorBoundary';

const STATUS_COLORS = {
  high:       'bg-red-100 text-red-700 border-red-200',
  low:        'bg-blue-100 text-blue-700 border-blue-200',
  borderline: 'bg-amber-100 text-amber-700 border-amber-200',
  normal:     'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export default function LabResults() {
  const [selectedLabId, setSelectedLabId] = useState(null);
  const queryClient = useQueryClient();

  const { data: labResults = [], isLoading } = useQuery({
    queryKey: ['labResults'],
    queryFn:  () => base44.entities.LabResult.list(),
  });

  const { data: trends } = useQuery({
    queryKey: ['labTrends'],
    queryFn:  async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const { data: { session } } = await (await import('@/api/base44Client')).supabase.auth.getSession();
      const res = await fetch(`${apiUrl}/api/labs/trends`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      return res.json();
    },
    enabled: labResults.length >= 2,
  });

  const { data: supplements } = useQuery({
    queryKey: ['supplements'],
    queryFn:  () => base44.functions.invoke('generateSupplementPlan'),
    enabled:  labResults.length > 0,
    retry:    false,
  });

  const handleDelete = async (id) => {
    if (!confirm('Delete this lab result?')) return;
    try {
      await base44.entities.LabResult.delete(id);
      queryClient.invalidateQueries({ queryKey: ['labResults'] });
      queryClient.invalidateQueries({ queryKey: ['labTrends'] });
      toast.success('Lab result deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleUploadComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['labResults'] });
    queryClient.invalidateQueries({ queryKey: ['labTrends'] });
    queryClient.invalidateQueries({ queryKey: ['supplements'] });
  };

  const selectedLab = labResults.find(l => l.id === selectedLabId) || labResults[0];

  return (
    <PageErrorBoundary title="Lab Results">
      <div className="space-y-6 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Lab Results</h1>
            <p className="text-slate-500 mt-1">
              Upload your blood work — AI extracts and tracks your biomarkers automatically
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-indigo-600 border-indigo-200">
              <FlaskConical className="w-3 h-3 mr-1" />
              {labResults.length} result{labResults.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue={labResults.length === 0 ? 'upload' : 'results'}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload">Upload Labs</TabsTrigger>
            <TabsTrigger value="results">My Results</TabsTrigger>
            <TabsTrigger value="trends" disabled={labResults.length < 2}>
              Trends {labResults.length < 2 ? '(need 2+)' : ''}
            </TabsTrigger>
            <TabsTrigger value="supplements" disabled={labResults.length === 0}>
              Supplements
            </TabsTrigger>
          </TabsList>

          {/* ── Upload Tab ────────────────────────────────────────────────────── */}
          <TabsContent value="upload" className="space-y-4 mt-6">
            <ComponentErrorBoundary>
              <LabUploader onUploadComplete={handleUploadComplete} />
            </ComponentErrorBoundary>
          </TabsContent>

          {/* ── Results Tab ───────────────────────────────────────────────────── */}
          <TabsContent value="results" className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            ) : labResults.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <FlaskConical className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No lab results yet</h3>
                <p className="text-sm mb-4">Upload your first lab report to get AI-powered biomarker analysis</p>
                <Button onClick={() => document.querySelector('[data-value="upload"]')?.click()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Upload First Lab Report
                </Button>
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Lab list */}
                <div className="space-y-2">
                  {labResults.map((lab) => {
                    const biomarkers = lab.biomarkers || {};
                    const abnormalCount = Object.values(biomarkers).filter(v => v.status !== 'normal').length;
                    const isSelected = (selectedLab?.id === lab.id);
                    return (
                      <div
                        key={lab.id}
                        onClick={() => setSelectedLabId(lab.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="font-medium text-slate-800">{lab.uploadDate}</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-500"
                            onClick={(e) => { e.stopPropagation(); handleDelete(lab.id); }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Badge className="text-xs bg-slate-100 text-slate-600">
                            {Object.keys(biomarkers).length} markers
                          </Badge>
                          {abnormalCount > 0 && (
                            <Badge className="text-xs bg-amber-100 text-amber-700">
                              {abnormalCount} need attention
                            </Badge>
                          )}
                        </div>
                        {lab.notes && <p className="text-xs text-slate-500 mt-1 truncate">{lab.notes}</p>}
                      </div>
                    );
                  })}
                </div>

                {/* Biomarker detail */}
                {selectedLab && (
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-800">
                        Results — {selectedLab.uploadDate}
                      </h3>
                      <Button size="sm" variant="outline"
                        onClick={() => window.location.href = '/HealthDietHub'}
                        className="text-indigo-600 border-indigo-200">
                        Generate Meal Plan <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>

                    {/* Abnormal first */}
                    {Object.entries(selectedLab.biomarkers || {})
                      .sort(([,a], [,b]) => {
                        const order = { high: 0, low: 1, borderline: 2, normal: 3 };
                        return (order[a.status] || 3) - (order[b.status] || 3);
                      })
                      .map(([name, data]) => (
                        <motion.div key={name}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between p-3 bg-white border rounded-lg hover:border-slate-300 transition-colors"
                        >
                          <div>
                            <p className="font-medium text-slate-800 text-sm">{name}</p>
                            {data.reference && <p className="text-xs text-slate-400">Ref: {data.reference}</p>}
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <div>
                              <span className="font-bold text-slate-800">{data.value}</span>
                              <span className="text-xs text-slate-500 ml-1">{data.unit}</span>
                            </div>
                            <Badge className={`text-xs border ${STATUS_COLORS[data.status]}`}>
                              {data.status === 'high' && <TrendingUp className="w-3 h-3 mr-1" />}
                              {data.status === 'low' && <TrendingDown className="w-3 h-3 mr-1" />}
                              {data.status === 'normal' && <CheckCircle className="w-3 h-3 mr-1" />}
                              {data.status === 'borderline' && <AlertTriangle className="w-3 h-3 mr-1" />}
                              {data.status}
                            </Badge>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ── Trends Tab ────────────────────────────────────────────────────── */}
          <TabsContent value="trends" className="mt-6">
            <ComponentErrorBoundary>
              {trends?.hasTrends ? (
                <div className="space-y-6">
                  {/* Summary cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="bg-emerald-50 border-emerald-200">
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-emerald-700">{trends.improved}</p>
                        <p className="text-sm text-emerald-600">Improved markers</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-red-50 border-red-200">
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-red-700">{trends.worsened}</p>
                        <p className="text-sm text-red-600">Worsened markers</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-50 border-slate-200">
                      <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-slate-700">{trends.totalMarkers}</p>
                        <p className="text-sm text-slate-600">Tracked markers</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Trend rows */}
                  <div className="space-y-2">
                    {Object.entries(trends.trends || {}).map(([name, trend]) => (
                      <div key={name} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                        <p className="font-medium text-slate-800 w-1/3">{name}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-slate-500">{trend.previous.value} {trend.previous.unit}</span>
                          <span className="text-slate-400">→</span>
                          <span className="font-bold text-slate-800">{trend.current.value} {trend.current.unit}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${trend.improved ? 'bg-emerald-100 text-emerald-700' : Math.abs(trend.deltaPct) < 1 ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-700'}`}>
                            {trend.direction === 'up' ? <TrendingUp className="w-3 h-3 mr-1 inline" /> :
                             trend.direction === 'down' ? <TrendingDown className="w-3 h-3 mr-1 inline" /> :
                             <Minus className="w-3 h-3 mr-1 inline" />}
                            {trend.deltaPct > 0 ? '+' : ''}{trend.deltaPct}%
                          </Badge>
                          {trend.improved
                            ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                            : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <TrendingUp className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="font-medium">{trends?.message || 'Upload 2+ lab results to see trends'}</p>
                </div>
              )}
            </ComponentErrorBoundary>
          </TabsContent>

          {/* ── Supplements Tab ───────────────────────────────────────────────── */}
          <TabsContent value="supplements" className="mt-6">
            <ComponentErrorBoundary>
              {supplements?.recommendations?.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800">
                      Personalized Supplement Recommendations
                    </h3>
                    <Badge variant="outline" className="text-indigo-600">
                      Based on your {supplements.labDate} labs
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500">
                    Estimated monthly cost: <strong>${supplements.totalMonthlyCost}</strong> — recommendations are prioritized by your specific lab values.
                  </p>
                  <div className="grid gap-4">
                    {supplements.recommendations.map((rec, i) => (
                      <motion.div key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-4 bg-white border rounded-xl hover:border-indigo-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Pill className="w-5 h-5 text-indigo-500" />
                            <h4 className="font-semibold text-slate-800">{rec.name}</h4>
                          </div>
                          <Badge className={rec.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                            {rec.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{rec.why}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                          <span><strong>Dose:</strong> {rec.dose}</span>
                          <span>·</span>
                          <span><strong>Est. cost:</strong> ~${rec.estimatedMonthlyCost}/mo</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-4">
                    ⚠️ These recommendations are based on standard reference ranges and your lab values. Always consult your healthcare provider before starting any supplement.
                  </p>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <Pill className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p>Upload lab results to get personalized supplement recommendations</p>
                </div>
              )}
            </ComponentErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </PageErrorBoundary>
  );
}
