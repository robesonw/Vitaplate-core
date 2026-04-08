import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, Shield, Trophy, Crown, Medal, Users, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/api/base44Client';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function apiGet(path) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${session?.access_token}` },
  });
  return res.json();
}

async function apiPost(path, body = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
    body: JSON.stringify(body),
  });
  return res.json();
}

function HealthScoreRing({ score }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444';
  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <motion.circle cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-slate-800">{score}</span>
        <span className="text-xs text-slate-500 font-medium">/ 100</span>
      </div>
    </div>
  );
}

function BadgeCard({ badge }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div whileHover={{ scale: 1.05 }}
            className={`relative flex flex-col items-center p-3 rounded-xl border-2 cursor-help transition-all ${
              badge.earned ? 'border-yellow-300 bg-yellow-50 shadow-sm' : 'border-slate-200 bg-slate-50 opacity-50 grayscale'
            }`}>
            <span className="text-3xl mb-1">{badge.emoji}</span>
            <p className="text-xs font-semibold text-slate-700 text-center leading-tight">{badge.name}</p>
            {badge.earned && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            )}
            {badge.earned && badge.points && <span className="text-xs text-yellow-600 font-bold mt-1">+{badge.points}pts</span>}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent className="text-center max-w-xs">
          <p className="font-semibold">{badge.emoji} {badge.name}</p>
          <p className="text-slate-400 text-xs mt-1">{badge.desc}</p>
          {badge.earned
            ? <p className="text-yellow-500 text-xs mt-1">✅ Earned {badge.earnedAt ? new Date(badge.earnedAt).toLocaleDateString() : ''}</p>
            : <p className="text-slate-400 text-xs mt-1">🔒 Not yet earned</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function StreaksAchievementsSection() {
  const queryClient = useQueryClient();
  const [showFreezeConfirm, setShowFreezeConfirm] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['gamificationProfile'],
    queryFn:  () => apiGet('/api/gamification/profile'),
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard'],
    queryFn:  () => apiGet('/api/gamification/leaderboard'),
  });

  const freezeMutation = useMutation({
    mutationFn: () => apiPost('/api/gamification/freeze'),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message, { duration: 5000 });
        queryClient.invalidateQueries({ queryKey: ['gamificationProfile'] });
        setShowFreezeConfirm(false);
      } else {
        toast.error(data.error);
      }
    },
  });

  if (isLoading) {
    return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />)}</div>;
  }

  const { streak = {}, healthScore = 0, badges = [], earnedCount = 0, totalBadges = 0 } = profile || {};
  const milestones = [1, 7, 14, 30, 100];
  const nextMilestone = milestones.find(m => m > streak.current) || 100;
  const prevMilestone = milestones.filter(m => m <= streak.current).pop() || 0;
  const milestoneProgress = nextMilestone > prevMilestone ? ((streak.current - prevMilestone) / (nextMilestone - prevMilestone)) * 100 : 100;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="badges">Badges ({earnedCount}/{totalBadges})</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Streak Hero */}
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium mb-2">Current Streak</p>
                  <div className="flex items-center gap-3">
                    <motion.div animate={{ scale: [1, 1.05, 1], rotate: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 2 }}>
                      <span className="text-5xl">🔥</span>
                    </motion.div>
                    <div>
                      <p className="text-5xl font-black">{streak.current || 0}</p>
                      <p className="text-orange-200 text-sm">days</p>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-3">
                  <div><p className="text-orange-100 text-xs">Longest</p><p className="text-2xl font-bold">{streak.longest || 0} 🏆</p></div>
                  <div><p className="text-orange-100 text-xs">Points</p><p className="text-2xl font-bold">{(streak.points || 0).toLocaleString()} ⭐</p></div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-orange-200 mb-1">
                  <span>{streak.current || 0} days</span>
                  <span>Next: {nextMilestone} days 🎯</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-white rounded-full" initial={{ width: 0 }}
                    animate={{ width: `${milestoneProgress}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
                </div>
              </div>
            </div>
            <CardContent className="p-4 bg-white">
              {showFreezeConfirm ? (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Shield className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <p className="text-sm text-blue-700 flex-1">Use your streak freeze? Bridges 1 missed day. 1 per month.</p>
                  <Button size="sm" variant="outline" onClick={() => setShowFreezeConfirm(false)}>Cancel</Button>
                  <Button size="sm" className="bg-blue-600 text-white" onClick={() => freezeMutation.mutate()} disabled={freezeMutation.isPending}>
                    {freezeMutation.isPending ? '...' : 'Use Freeze'}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Shield className={`w-4 h-4 ${streak.freezeAvailable ? 'text-blue-500' : 'text-slate-400'}`} />
                    <span>Streak Freeze: {streak.freezeAvailable ? '1 available this month' : 'Used this month'}</span>
                  </div>
                  {streak.freezeAvailable && (streak.current || 0) > 0 && (
                    <Button size="sm" variant="outline" onClick={() => setShowFreezeConfirm(true)} className="text-blue-600 border-blue-200 hover:bg-blue-50">
                      🧊 Use Freeze
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Health Score */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" />Health Score</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-6">
                <HealthScoreRing score={healthScore} />
                <div className="flex-1 space-y-2">
                  {[
                    { label: 'Daily streak', max: 30, val: Math.min(30, (streak.current || 0) * 2), color: 'bg-orange-400' },
                    { label: 'Badges earned', max: 30, val: Math.min(30, earnedCount * 2), color: 'bg-yellow-400' },
                    { label: 'Plan activity', max: 40, val: Math.min(40, (streak.points || 0) / 75), color: 'bg-emerald-400' },
                  ].map(({ label, max, val, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs text-slate-500 mb-1"><span>{label}</span><span>{Math.round(val)}/{max}</span></div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div className={`h-full rounded-full ${color}`} initial={{ width: 0 }}
                          animate={{ width: `${(val / max) * 100}%` }} transition={{ duration: 1, delay: 0.2 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent badges */}
          {earnedCount > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-500" />Recent Badges</CardTitle></CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-5 gap-2">
                  {badges.filter(b => b.earned).slice(0, 5).map(badge => <BadgeCard key={badge.id} badge={badge} />)}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="badges" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Badge Collection</CardTitle>
                <Badge className="bg-yellow-100 text-yellow-700">{earnedCount} / {totalBadges} earned</Badge>
              </div>
              <Progress value={(earnedCount / Math.max(totalBadges, 1)) * 100} className="h-2 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {badges.map(badge => <BadgeCard key={badge.id} badge={badge} />)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Crown className="w-4 h-4 text-yellow-500" />Global Leaderboard</CardTitle>
              {leaderboard?.currentUser && (
                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200 mt-2">
                  <Medal className="w-5 h-5 text-indigo-500" />
                  <div>
                    <p className="text-sm font-semibold text-indigo-800">Your Rank: #{leaderboard.currentUser.rank}</p>
                    <p className="text-xs text-indigo-600">{(leaderboard.currentUser.points || 0).toLocaleString()} points · {leaderboard.currentUser.streak}-day streak</p>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {leaderboard?.leaders?.length > 0 ? leaderboard.leaders.map((user, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${i === 0 ? 'bg-yellow-50 border-yellow-200' : i === 1 ? 'bg-slate-50 border-slate-200' : i === 2 ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-100'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-slate-400 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 text-sm">{user.name}</p>
                    <p className="text-xs text-slate-500">🔥 {user.streak}-day streak</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800 text-sm">{(user.points || 0).toLocaleString()}</p>
                    <p className="text-xs text-slate-400">points</p>
                  </div>
                </motion.div>
              )) : (
                <div className="text-center py-8 text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">Be the first on the leaderboard!</p>
                  <p className="text-xs mt-1">Check in daily to earn points and climb ranks</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
