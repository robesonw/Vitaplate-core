import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TrendingDown, Camera, BarChart3, Award, Loader2, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import ProgressEntryForm from '../components/progress/ProgressEntryForm';
import ProgressTimeline from '../components/progress/ProgressTimeline';
import ProgressCharts from '../components/progress/ProgressCharts';
import MilestoneDetector from '../components/progress/MilestoneDetector';
import MonthlyReportDialog from '../components/progress/MonthlyReportDialog';

export default function MyProgress() {
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: progressEntries = [], isLoading } = useQuery({
    queryKey: ['progressEntries'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.ProgressEntry.filter({ created_by: user.email }, '-entry_date');
    },
    retry: false
  });

  const { data: streakData = {} } = useQuery({
    queryKey: ['userStreak'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const streaks = await base44.entities.UserStreak.filter({ created_by: user.email });
      return streaks?.[0] || {};
    },
    retry: false
  });

  const { data: userSettings = {} } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const settings = await base44.entities.UserSettings.filter({ created_by: user.email });
      return settings?.[0] || {};
    },
    retry: false
  });

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['progressEntries'] });
  };

  // Calculate stats
  const stats = React.useMemo(() => {
    if (progressEntries.length < 2) return null;

    const weights = progressEntries
      .filter(e => e.weight)
      .sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date));

    if (weights.length < 2) return null;

    const startWeight = weights[0].weight;
    const currentWeight = weights[weights.length - 1].weight;
    const totalChange = currentWeight - startWeight;

    return {
      totalEntries: progressEntries.length,
      entriesWithPhotos: progressEntries.filter(e => e.photo_url).length,
      startWeight,
      currentWeight,
      totalChange,
      isLoss: totalChange < 0,
      avgMood: Math.round(
        progressEntries.filter(e => e.mood).reduce((sum, e) => sum + e.mood, 0) /
        progressEntries.filter(e => e.mood).length
      )
    };
  }, [progressEntries]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Progress</h1>
          <p className="text-slate-600 mt-1">
            Track your transformation with photos, measurements, and charts
          </p>
        </div>
        <Button
          onClick={() => setReportDialogOpen(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 whitespace-nowrap"
        >
          <FileText className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-4 gap-4"
        >
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-4">
              <p className="text-sm text-emerald-700 mb-1">Total Entries</p>
              <p className="text-3xl font-bold text-emerald-900">{stats.totalEntries}</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <p className="text-sm text-blue-700 mb-1">Photos</p>
              <p className="text-3xl font-bold text-blue-900">{stats.entriesWithPhotos}</p>
            </CardContent>
          </Card>

          <Card className={`border-2 ${stats.isLoss ? 'border-purple-200 bg-purple-50' : 'border-amber-200 bg-amber-50'}`}>
            <CardContent className="p-4">
              <p className={`text-sm font-medium ${stats.isLoss ? 'text-purple-700' : 'text-amber-700'}`}>
                {stats.isLoss ? 'Weight Loss' : 'Weight Gain'}
              </p>
              <p className={`text-3xl font-bold ${stats.isLoss ? 'text-purple-900' : 'text-amber-900'}`}>
                {Math.abs(stats.totalChange).toFixed(1)}kg
              </p>
            </CardContent>
          </Card>

          <Card className="border-rose-200 bg-rose-50">
            <CardContent className="p-4">
              <p className="text-sm text-rose-700 mb-1">Avg Mood</p>
              <p className="text-3xl font-bold text-rose-900">
                {['😢', '😕', '😐', '🙂', '😄'][stats.avgMood - 1] || '😐'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Milestone Banner */}
      <MilestoneDetector entries={progressEntries} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="timeline" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline">
            <Camera className="w-4 h-4 mr-2" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="charts">
            <BarChart3 className="w-4 h-4 mr-2" />
            Charts
          </TabsTrigger>
          <TabsTrigger value="add">
            <TrendingDown className="w-4 h-4 mr-2" />
            Add Entry
          </TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ProgressTimeline entries={progressEntries} />
          </motion.div>
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ProgressCharts entries={progressEntries} streakData={streakData} />
          </motion.div>
        </TabsContent>

        {/* Add Entry Tab */}
        <TabsContent value="add">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ProgressEntryForm onSuccess={handleFormSuccess} />
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Monthly Report Dialog */}
      <MonthlyReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        subscriptionStatus={userSettings.subscription_plan || 'free'}
      />
    </div>
  );
}