import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Gift, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function ReferralStatsCard() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  const { data: referralStats = {} } = useQuery({
    queryKey: ['referralStats', user?.email],
    queryFn: async () => {
      if (!user?.email) return {};
      const referrals = await base44.entities.Referral.filter({
        referrer_email: user.email
      });

      const rewarded = referrals.filter(r => r.status === 'rewarded').length;

      return {
        total_referred: referrals.filter(r => 
          r.status === 'joined' || r.status === 'upgraded' || r.status === 'rewarded'
        ).length,
        months_earned: rewarded
      };
    },
    enabled: !!user?.email,
  });

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-200 flex items-center justify-center">
              <Gift className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Refer & Earn</h3>
              <p className="text-xs text-slate-600">Get free Pro months</p>
            </div>
          </div>
          <Link to="/ReferAFriend">
            <Button size="sm" variant="ghost">
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Friends referred</span>
            <span className="text-lg font-bold text-purple-700">
              {referralStats.total_referred || 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Months earned</span>
            <span className="text-lg font-bold text-pink-700">
              {referralStats.months_earned || 0} 🎁
            </span>
          </div>
        </div>

        <Link to="/ReferAFriend" className="block">
          <Button variant="outline" className="w-full text-sm">
            <Users className="w-4 h-4 mr-2" />
            Share Your Link
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}