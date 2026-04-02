import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Lock } from 'lucide-react';

const BADGE_DEFINITIONS = [
  { id: 'first_flame', name: 'First Flame', emoji: '🔥', desc: 'Log your first day' },
  { id: 'week_warrior', name: 'Week Warrior', emoji: '⭐', desc: '7-day streak' },
  { id: 'diamond_habit', name: 'Diamond Habit', emoji: '💎', desc: '30-day streak' },
  { id: 'lab_legend', name: 'Lab Legend', emoji: '🧬', desc: 'Upload lab results' },
  { id: 'plan_follower', name: 'Plan Follower', emoji: '🥗', desc: '5-day plan streak' },
  { id: 'swapper', name: 'Swapper', emoji: '🔄', desc: 'Use 10 meal swaps' },
  { id: 'coach_pet', name: "Coach's Pet", emoji: '💬', desc: 'Ask 20 AI questions' },
  { id: 'smart_shopper', name: 'Smart Shopper', emoji: '🛒', desc: '4 weeks of grocery lists' },
  { id: 'score_climber', name: 'Score Climber', emoji: '📈', desc: '+10 point health boost' },
  { id: 'referral_pro', name: 'Referral Pro', emoji: '🤝', desc: 'Refer 3 friends' }
];

export default function BadgeCollection({ userBadges = [], streakData = {} }) {
  const badgeMap = useMemo(() => {
    const map = {};
    userBadges.forEach(badge => {
      map[badge.badge_id] = badge;
    });
    return map;
  }, [userBadges]);

  const earnedCount = userBadges.filter(b => b.is_earned).length;
  const totalBadges = BADGE_DEFINITIONS.length;

  // Calculate next badge progress
  const getNextBadgeInfo = () => {
    for (const badge of BADGE_DEFINITIONS) {
      if (!badgeMap[badge.id]?.is_earned) {
        return { ...badge, progress: badgeMap[badge.id]?.progress || 0 };
      }
    }
    return null;
  };

  const nextBadge = getNextBadgeInfo();

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-purple-600" />
            <CardTitle>Achievements</CardTitle>
          </div>
          <Badge className="bg-purple-100 text-purple-800">
            {earnedCount}/{totalBadges}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Earned Badges */}
        <div>
          <p className="text-xs font-semibold text-slate-700 mb-2 uppercase">Earned</p>
          <div className="grid grid-cols-5 gap-2">
            {BADGE_DEFINITIONS.map((badge) => {
              const earned = badgeMap[badge.id]?.is_earned;
              return (
                <div
                  key={badge.id}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                    earned
                      ? 'bg-white border-2 border-purple-300'
                      : 'bg-slate-200/50 border border-slate-300'
                  }`}
                  title={badge.desc}
                >
                  <span className={`text-2xl ${earned ? '' : 'grayscale opacity-30'}`}>
                    {badge.emoji}
                  </span>
                  <span className="text-[10px] font-medium text-center text-slate-700 line-clamp-1">
                    {badge.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next Badge Progress */}
        {nextBadge && (
          <div className="p-3 rounded-lg bg-white border-2 border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{nextBadge.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">{nextBadge.name}</p>
                <p className="text-xs text-slate-600">{nextBadge.desc}</p>
              </div>
            </div>
            <Progress value={nextBadge.progress} className="h-2" />
            <p className="text-xs text-slate-500 mt-1 text-right">
              {Math.round(nextBadge.progress)}% complete
            </p>
          </div>
        )}

        {/* All Earned Message */}
        {earnedCount === totalBadges && (
          <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-center">
            <p className="text-sm font-semibold text-yellow-900">
              🌟 Badge Collector Complete!
            </p>
            <p className="text-xs text-yellow-800">You've earned all badges!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}