import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import StreakCounter from './StreakCounter';
import BadgeCollection from './BadgeCollection';
import { Skeleton } from '@/components/ui/skeleton';

export default function StreaksAchievementsSection() {
  const { data: streakData, isLoading: streakLoading } = useQuery({
    queryKey: ['userStreak'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const streaks = await base44.entities.UserStreak.filter({ created_by: user.email });
      return streaks?.[0] || {};
    },
    retry: false
  });

  const { data: badges = [], isLoading: badgesLoading } = useQuery({
    queryKey: ['userBadges'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const userBadges = await base44.entities.UserBadge.filter({ created_by: user.email });
      return userBadges || [];
    },
    retry: false
  });

  if (streakLoading || badgesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StreakCounter streakData={streakData} />
      <BadgeCollection userBadges={badges} streakData={streakData} />
    </div>
  );
}