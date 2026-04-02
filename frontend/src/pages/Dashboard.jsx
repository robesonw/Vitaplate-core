import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  TrendingUp,
  Calendar,
  Flame,
  Target,
  Clock,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Mic
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import QuickStartChecklist from '../components/onboarding/QuickStartChecklist';
import OnboardingTour from '../components/onboarding/OnboardingTour';
import StreakCard from '../components/dashboard/StreakCard';
import StreakCounter from '../components/streaks/StreakCounter';
import HealthScoreCard from '../components/dashboard/HealthScoreCard';
import HealthAlertsCard from '../components/dashboard/HealthAlertsCard';
import ActivitySummaryCard from '../components/dashboard/ActivitySummaryCard';
import VoiceMealLogger from '../components/meals/VoiceMealLogger';
import VoiceTranscriptionReview from '../components/meals/VoiceTranscriptionReview';
import { useSubscription } from '../lib/useSubscription';

export default function Dashboard() {
  const [voiceReviewOpen, setVoiceReviewOpen] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState(null);

  const { data: mealPlans = [] } = useQuery({
    queryKey: ['mealPlans'],
    queryFn: () => base44.entities.MealPlan.list('-created_date', 10),
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: sharedPlans = [] } = useQuery({
    queryKey: ['sharedPlans'],
    queryFn: () => base44.entities.SharedMealPlan.list('-created_date', 3),
  });

  const { data: labResults = [] } = useQuery({
    queryKey: ['labResults'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.LabResult.filter({ created_by: currentUser.email }, '-upload_date');
    },
  });

  const { isPro } = useSubscription();

  const { data: nutritionLogs = [] } = useQuery({
    queryKey: ['nutritionLogsStreak'],
    queryFn: () => base44.entities.NutritionLog.list('-log_date', 90),
  });

  const { data: streakData = {} } = useQuery({
    queryKey: ['userStreak'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      const streaks = await base44.entities.UserStreak.filter({ created_by: currentUser.email });
      return streaks?.[0] || {};
    },
    retry: false
  });

  // Calculate accurate statistics
  const totalMeals = mealPlans.reduce((sum, p) => {
    return sum + (p.days?.length || 0) * 4; // breakfast, lunch, dinner, snacks
  }, 0);

  const avgCalories = React.useMemo(() => {
    if (mealPlans.length === 0) return 0;
    
    let totalCals = 0;
    let dayCount = 0;
    
    mealPlans.forEach(plan => {
      plan.days?.forEach(day => {
        ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealType => {
          const meal = day[mealType];
          if (meal?.calories) {
            const match = meal.calories.match(/(\d+)/);
            if (match) {
              totalCals += parseInt(match[1]);
              dayCount++;
            }
          }
        });
      });
    });
    
    return dayCount > 0 ? Math.round(totalCals / (mealPlans.reduce((sum, p) => sum + (p.days?.length || 0), 0) || 1)) : 0;
  }, [mealPlans]);

  const stats = {
    activePlans: mealPlans.length,
    totalMeals,
    avgCalories,
    communityShares: sharedPlans.length,
  };

  const statCards = [
    { 
      title: 'Active Plans', 
      value: stats.activePlans,
      subtitle: 'meal plans',
      icon: Calendar,
      color: 'indigo'
    },
    { 
      title: 'Meals Planned', 
      value: stats.totalMeals,
      subtitle: 'total meals',
      icon: Target,
      color: 'emerald'
    },
    { 
      title: 'Avg Calories/Day', 
      value: stats.avgCalories > 0 ? `${stats.avgCalories}` : 'N/A',
      subtitle: stats.avgCalories > 0 ? 'kcal per day' : 'Create plans to track',
      icon: Flame,
      color: 'orange'
    },
    { 
      title: 'Community Shares', 
      value: stats.communityShares,
      subtitle: 'shared recently',
      icon: TrendingUp,
      color: 'purple'
    },
  ];

  // Generate recent activity from actual data
  const recentActivity = React.useMemo(() => {
    const activities = [];
    
    // Add meal plan activities
    mealPlans.slice(0, 3).forEach(plan => {
      const date = new Date(plan.created_date);
      const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
      const timeText = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`;
      
      activities.push({
        action: 'Created meal plan',
        plan: plan.name,
        time: timeText
      });
    });
    
    // Add lab result if exists
    if (labResults.length > 0) {
      const date = new Date(labResults[0].upload_date);
      const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
      const timeText = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`;
      
      activities.push({
        action: 'Uploaded lab results',
        plan: 'Health tracking',
        time: timeText
      });
    }
    
    return activities.length > 0 ? activities.slice(0, 4) : [
      { action: 'Welcome!', plan: 'Start by creating your first meal plan', time: 'Get started' }
    ];
  }, [mealPlans, labResults]);

  const handleVoiceTranscribed = (transcript) => {
    setVoiceTranscript(transcript);
    setVoiceReviewOpen(true);
  };

  const quickActions = [
    { title: 'Create AI Meal Plan', description: 'Generate personalized plan', icon: Sparkles, href: 'HealthDietHub' },
    { title: 'View Analytics', description: 'Track your nutrition', icon: TrendingUp, href: 'Analytics' },
    { title: 'Browse Community', description: 'Discover shared recipes', icon: Target, href: 'Community' },
  ];

  return (
    <div className="space-y-6">
      <OnboardingTour />
      
      {/* Quick Start Checklist */}
      <QuickStartChecklist />
      
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome back, {user?.full_name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="text-slate-600 mt-1">
            Here's your nutrition overview for today
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to={createPageUrl('Index')}>
            🏠 Home Page
          </Link>
        </Button>
      </div>

      {/* Streak Counter Widget */}
      <StreakCounter streakData={streakData} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            indigo: 'bg-indigo-500',
            emerald: 'bg-emerald-500',
            orange: 'bg-orange-500',
            purple: 'bg-purple-500',
          };
          
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-slate-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                      <p className="text-xs text-slate-500 mt-1">{stat.subtitle}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl ${colorClasses[stat.color]} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Health Alerts Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
      >
        <HealthAlertsCard />
      </motion.div>

      {/* Health Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <HealthScoreCard labResults={labResults} isPro={isPro} />
      </motion.div>

      {/* Activity Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38 }}
      >
        <ActivitySummaryCard />
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Today's Nutrition Goals</CardTitle>
              <CardDescription>Track your daily intake targets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Calories</span>
                  <span className="text-sm font-semibold text-slate-900">1,250 / 2,000 kcal</span>
                </div>
                <Progress value={62.5} className="h-2" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Protein</span>
                  <span className="text-sm font-semibold text-slate-900">85 / 120g</span>
                </div>
                <Progress value={70.8} className="h-2" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Carbs</span>
                  <span className="text-sm font-semibold text-slate-900">180 / 250g</span>
                </div>
                <Progress value={72} className="h-2" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Fats</span>
                  <span className="text-sm font-semibold text-slate-900">45 / 65g</span>
                </div>
                <Progress value={69.2} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                      <p className="text-sm text-slate-600">{activity.plan}</p>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-6 h-full flex flex-col items-start justify-between">
              <div className="w-full">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center mb-3 group-hover:bg-red-100 transition-colors">
                  <Mic className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">Quick Voice Log</h3>
                <p className="text-sm text-slate-600">Log meal by voice</p>
              </div>
              <div className="w-full mt-4">
                <VoiceMealLogger 
                  onTranscriptionComplete={handleVoiceTranscribed}
                  isProcessing={voiceReviewOpen}
                />
              </div>
            </CardContent>
          </Card>
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} to={createPageUrl(action.href)}>
                <Card className="border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors">
                          <Icon className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-1">{action.title}</h3>
                        <p className="text-sm text-slate-600">{action.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Recent Meal Plans */}
      {mealPlans.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Meal Plans</h2>
            <Link to={createPageUrl('MealPlans')}>
              <Button variant="ghost" size="sm" className="gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mealPlans.slice(0, 3).map((plan) => (
              <Card key={plan.id} className="border-slate-200 hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{plan.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {plan.days?.length || 0} days planned
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {plan.diet_type?.replace(/-/g, ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={createPageUrl('MealPlans')}>
                      View Plan <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Voice Transcription Review Dialog */}
      {voiceReviewOpen && voiceTranscript && (
        <VoiceTranscriptionReview
          transcript={voiceTranscript}
          mealType="lunch"
          logDate={new Date().toISOString().split('T')[0]}
          onSuccess={() => {
            setVoiceReviewOpen(false);
            setVoiceTranscript(null);
          }}
          onCancel={() => {
            setVoiceReviewOpen(false);
            setVoiceTranscript(null);
          }}
        />
      )}
    </div>
  );
}