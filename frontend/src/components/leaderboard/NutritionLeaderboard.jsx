import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, TrendingUp, Target, Flame, Crown, Medal, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NutritionLeaderboard() {
  const [timeRange, setTimeRange] = useState('week');

  const { data: logs = [] } = useQuery({
    queryKey: ['allNutritionLogs'],
    queryFn: () => base44.entities.NutritionLog.list('-created_date', 500),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['allNutritionGoals'],
    queryFn: () => base44.entities.NutritionGoal.list(),
  });

  const getDaysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  };

  const calculateLeaderboard = (metric) => {
    const days = timeRange === 'week' ? 7 : 30;
    const cutoffDate = getDaysAgo(days);
    const recentLogs = logs.filter(l => l.log_date >= cutoffDate);

    const userStats = {};

    recentLogs.forEach(log => {
      const email = log.created_by;
      if (!userStats[email]) {
        userStats[email] = {
          email,
          totalMeals: 0,
          totalCalories: 0,
          totalProtein: 0,
          streak: 0,
          goalsMetCount: 0,
          uniqueDays: new Set()
        };
      }

      userStats[email].totalMeals++;
      userStats[email].totalCalories += (log.calories || 0) * (log.servings || 1);
      userStats[email].totalProtein += (log.protein || 0) * (log.servings || 1);
      userStats[email].uniqueDays.add(log.log_date);
    });

    // Calculate streaks and goals met
    Object.keys(userStats).forEach(email => {
      const userGoal = goals.find(g => g.created_by === email && g.is_active);
      userStats[email].streak = userStats[email].uniqueDays.size;
      
      if (userGoal) {
        const userLogs = recentLogs.filter(l => l.created_by === email);
        const daysWithGoal = {};
        
        userLogs.forEach(log => {
          if (!daysWithGoal[log.log_date]) {
            daysWithGoal[log.log_date] = { calories: 0, protein: 0 };
          }
          daysWithGoal[log.log_date].calories += (log.calories || 0) * (log.servings || 1);
          daysWithGoal[log.log_date].protein += (log.protein || 0) * (log.servings || 1);
        });

        userStats[email].goalsMetCount = Object.values(daysWithGoal).filter(day => 
          day.calories >= userGoal.target_calories * 0.9 && 
          day.calories <= userGoal.target_calories * 1.1
        ).length;
      }
    });

    let sortedUsers = Object.values(userStats);

    switch (metric) {
      case 'meals':
        sortedUsers.sort((a, b) => b.totalMeals - a.totalMeals);
        break;
      case 'streak':
        sortedUsers.sort((a, b) => b.streak - a.streak);
        break;
      case 'goals':
        sortedUsers.sort((a, b) => b.goalsMetCount - a.goalsMetCount);
        break;
      case 'protein':
        sortedUsers.sort((a, b) => b.totalProtein - a.totalProtein);
        break;
    }

    return sortedUsers.slice(0, 10);
  };

  const getRankIcon = (rank) => {
    if (rank === 0) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 1) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 2) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="text-slate-500 font-semibold">#{rank + 1}</span>;
  };

  const categories = [
    { id: 'meals', label: 'Most Meals Logged', icon: Target, key: 'totalMeals', suffix: ' meals' },
    { id: 'streak', label: 'Longest Streak', icon: Flame, key: 'streak', suffix: ' days' },
    { id: 'goals', label: 'Goals Met', icon: Trophy, key: 'goalsMetCount', suffix: ' days' },
    { id: 'protein', label: 'Total Protein', icon: TrendingUp, key: 'totalProtein', suffix: 'g' },
  ];

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Community Leaderboard
          </CardTitle>
          <Tabs value={timeRange} onValueChange={setTimeRange}>
            <TabsList>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="meals" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            {categories.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id}>
                <cat.icon className="w-4 h-4 mr-1" />
                <span className="hidden md:inline">{cat.label.split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map(category => {
            const leaderboard = calculateLeaderboard(category.id);
            
            return (
              <TabsContent key={category.id} value={category.id}>
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-900 mb-3">{category.label}</h3>
                  {leaderboard.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">No data yet. Start tracking to compete!</p>
                  ) : (
                    leaderboard.map((user, index) => (
                      <motion.div
                        key={user.email}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200' :
                          index === 1 ? 'bg-slate-50 border-slate-200' :
                          index === 2 ? 'bg-amber-50 border-amber-100' :
                          'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 flex items-center justify-center">
                            {getRankIcon(index)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {user.email.split('@')[0]}
                            </p>
                            {index < 3 && (
                              <p className="text-xs text-slate-500">
                                {index === 0 ? '🔥 Top Performer' : index === 1 ? '💪 Strong' : '⭐ Great'}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant={index === 0 ? 'default' : 'secondary'} className="font-bold">
                          {Math.round(user[category.key])}{category.suffix}
                        </Badge>
                      </motion.div>
                    ))
                  )}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}