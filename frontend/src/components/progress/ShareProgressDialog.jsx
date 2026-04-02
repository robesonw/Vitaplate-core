import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Share2, Trophy, TrendingUp, Target } from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';

export default function ShareProgressDialog({ open, onOpenChange, logs }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [progressType, setProgressType] = useState('weekly_summary');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['nutritionGoals', user?.email],
    queryFn: () => base44.entities.NutritionGoal.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const calculateStats = useMemo(() => {
    const last7Days = subDays(new Date(), 7);
    const recentLogs = logs.filter(l => new Date(l.log_date) >= last7Days);
    
    const uniqueDays = new Set(recentLogs.map(l => l.log_date)).size;
    const totalCalories = recentLogs.reduce((sum, l) => sum + (l.calories * (l.servings || 1)), 0);
    const totalProtein = recentLogs.reduce((sum, l) => sum + (l.protein * (l.servings || 1)), 0);
    const avgCalories = recentLogs.length > 0 ? Math.round(totalCalories / uniqueDays) : 0;
    const avgProtein = recentLogs.length > 0 ? Math.round(totalProtein / uniqueDays) : 0;

    const activeGoal = goals.find(g => g.is_active);
    let goalsMetCount = 0;

    if (activeGoal) {
      const daysWithGoal = {};
      recentLogs.forEach(log => {
        if (!daysWithGoal[log.log_date]) {
          daysWithGoal[log.log_date] = { calories: 0 };
        }
        daysWithGoal[log.log_date].calories += (log.calories || 0) * (log.servings || 1);
      });

      goalsMetCount = Object.values(daysWithGoal).filter(day => 
        day.calories >= activeGoal.target_calories * 0.9 && 
        day.calories <= activeGoal.target_calories * 1.1
      ).length;
    }

    return {
      streak_days: uniqueDays,
      meals_tracked: recentLogs.length,
      goals_met: goalsMetCount,
      avg_protein: avgProtein,
      avg_calories: avgCalories,
      calories_logged: Math.round(totalCalories)
    };
  }, [logs, goals]);

  const shareProgressMutation = useMutation({
    mutationFn: (data) => base44.entities.SharedProgress.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedProgress'] });
      toast.success('Progress shared with the community!');
      onOpenChange(false);
      setTitle('');
      setDescription('');
    },
  });

  const handleShare = () => {
    if (!title.trim()) {
      toast.error('Please add a title');
      return;
    }

    const last7Days = subDays(new Date(), 7);
    
    shareProgressMutation.mutate({
      title,
      description: description || `I've been tracking my nutrition consistently! ${calculateStats.meals_tracked} meals logged this week.`,
      progress_type: progressType,
      stats: calculateStats,
      date_range: {
        from: format(last7Days, 'yyyy-MM-dd'),
        to: format(new Date(), 'yyyy-MM-dd')
      },
      author_name: user?.full_name || 'Anonymous'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Progress</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Progress Type */}
          <div>
            <Label>Progress Type</Label>
            <Select value={progressType} onValueChange={setProgressType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly_summary">📊 Weekly Summary</SelectItem>
                <SelectItem value="streak">🔥 Tracking Streak</SelectItem>
                <SelectItem value="goal_reached">🎯 Goal Achievement</SelectItem>
                <SelectItem value="milestone">🏆 Milestone</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats Preview */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200">
            <p className="text-xs text-slate-600 mb-2">Your 7-day stats:</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-600">Meals:</span>
                <span className="font-bold ml-1">{calculateStats.meals_tracked}</span>
              </div>
              <div>
                <span className="text-slate-600">Streak:</span>
                <span className="font-bold ml-1">{calculateStats.streak_days} days</span>
              </div>
              <div>
                <span className="text-slate-600">Avg Calories:</span>
                <span className="font-bold ml-1">{calculateStats.avg_calories}</span>
              </div>
              <div>
                <span className="text-slate-600">Goals Met:</span>
                <span className="font-bold ml-1">{calculateStats.goals_met} days</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <Label>Title *</Label>
            <Input
              placeholder="e.g., Completed 7-day tracking streak!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <Label>Description (Optional)</Label>
            <Textarea
              placeholder="Share your journey, tips, or how you're feeling..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            onClick={handleShare}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
            disabled={shareProgressMutation.isPending}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Progress
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}