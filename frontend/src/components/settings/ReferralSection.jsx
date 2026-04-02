import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Gift, Copy, Check, Users } from 'lucide-react';
import { toast } from 'sonner';

function generateCode(email) {
  // Deterministic code from email so it's always the same for a user
  const base = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 6);
  const hash = email.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 9000 + 1000;
  return `VP-${base}${hash}`;
}

export default function ReferralSection({ user }) {
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const referralCode = user?.email ? generateCode(user.email) : null;
  const referralLink = referralCode ? `${window.location.origin}/?ref=${referralCode}` : '';

  // Ensure referral record exists
  useEffect(() => {
    if (!user?.email || !referralCode) return;
    base44.entities.Referral.filter({ referrer_email: user.email }).then(existing => {
      if (existing.length === 0) {
        base44.entities.Referral.create({
          referrer_email: user.email,
          referral_code: referralCode,
        });
      }
    });
  }, [user?.email, referralCode]);

  const { data: referrals = [] } = useQuery({
    queryKey: ['myReferrals', user?.email],
    queryFn: () => base44.entities.Referral.filter({ referrer_email: user.email }),
    enabled: !!user?.email,
  });

  const completedReferrals = referrals.filter(r => r.status === 'completed' || r.status === 'rewarded');

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Card className="border-purple-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-purple-600" />
          <CardTitle>Refer a Friend</CardTitle>
        </div>
        <CardDescription>Share VitaPlate and earn 1 month of Pro free for each friend who signs up</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* How it works */}
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { step: '1', label: 'Share your link', icon: '🔗' },
            { step: '2', label: 'Friend signs up', icon: '👤' },
            { step: '3', label: 'You get 1 month Pro free', icon: '🎁' },
          ].map(s => (
            <div key={s.step} className="p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xs text-slate-600 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Referral link */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Your Referral Link</label>
          <div className="flex gap-2">
            <Input value={referralLink} readOnly className="bg-slate-50 text-sm font-mono" />
            <Button variant="outline" onClick={handleCopy} className="shrink-0">
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-slate-500">Code: <span className="font-mono font-semibold text-purple-700">{referralCode}</span></p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-800">{referrals.length}</div>
            <div className="text-xs text-slate-500">Total Referrals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">{completedReferrals.length}</div>
            <div className="text-xs text-slate-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{completedReferrals.length}</div>
            <div className="text-xs text-slate-500">Months Earned</div>
          </div>
        </div>

        {/* Recent referrals */}
        {completedReferrals.length > 0 && (
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
              <Users className="w-4 h-4" /> Friends who joined
            </p>
            <div className="space-y-2">
              {completedReferrals.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{r.referred_email || 'Anonymous'}</span>
                  <Badge className={r.status === 'rewarded' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                    {r.status === 'rewarded' ? '✓ Rewarded' : 'Completed'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}