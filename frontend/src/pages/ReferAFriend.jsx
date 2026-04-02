import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Share2, Mail, MessageCircle, Gift, Users, TrendingUp, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ReferAFriend() {
  const [isCopied, setIsCopied] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  const { data: referralCode = '', isLoading: isLoadingCode } = useQuery({
    queryKey: ['referralCode', user?.email],
    queryFn: async () => {
      if (!user?.email) return '';
      const response = await base44.functions.invoke('generateReferralCode', {});
      return response.data.referral_code;
    },
    enabled: !!user?.email,
  });

  const { data: referralStats = {} } = useQuery({
    queryKey: ['referralStats', user?.email],
    queryFn: async () => {
      if (!user?.email) return {};
      const referrals = await base44.entities.Referral.filter({
        referrer_email: user.email
      });

      const total = referrals.length;
      const completed = referrals.filter(r => r.status === 'joined' || r.status === 'upgraded' || r.status === 'rewarded').length;
      const rewarded = referrals.filter(r => r.status === 'rewarded').length;

      return {
        total_referred: completed,
        months_earned: rewarded,
        pending: total - completed,
        referrals: referrals
      };
    },
    enabled: !!user?.email,
  });

  const referralLink = `${window.location.origin}/refer/${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setIsCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const message = `Hey! 👋 I'm using VitaPlate to track my nutrition and lab results. Check it out: ${referralLink} - We both get 1 month free Pro if you join!`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShareEmail = () => {
    const subject = 'You should try VitaPlate - personalized nutrition from your lab results';
    const body = `Hi!

I wanted to share something I've been using - VitaPlate. It helps me understand my nutrition based on my actual lab results and health goals.

Check it out here: ${referralLink}

Here's the cool part - when you sign up and upgrade to Pro, we both get 1 month free! 🎁

${user?.full_name || 'Your friend'}`;

    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
  };

  const handleShareMessage = () => {
    const message = `Hey! I'm using VitaPlate to track my nutrition and lab results. Join me and we both get 1 month free Pro: ${referralLink}`;
    if (navigator.share) {
      navigator.share({
        title: 'VitaPlate',
        text: message,
        url: referralLink,
      });
    } else {
      handleCopyLink();
    }
  };

  if (isLoadingCode) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Refer a Friend</h1>
        <p className="text-slate-600 mt-1">
          Share VitaPlate with friends and earn free Pro months for both of you
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-600" />
              <span className="text-3xl font-bold text-blue-900">{referralStats.total_referred || 0}</span>
            </div>
            <p className="text-sm text-blue-700 font-medium">Friends Referred</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Gift className="w-8 h-8 text-emerald-600" />
              <span className="text-3xl font-bold text-emerald-900">{referralStats.months_earned || 0}</span>
            </div>
            <p className="text-sm text-emerald-700 font-medium">Months Earned</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-amber-600" />
              <span className="text-3xl font-bold text-amber-900">{referralStats.pending || 0}</span>
            </div>
            <p className="text-sm text-amber-700 font-medium">Pending Upgrades</p>
          </CardContent>
        </Card>
      </div>

      {/* Share Section */}
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-600" />
            Share Your Link
          </CardTitle>
          <CardDescription>Copy your unique referral link and share it with friends</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Referral Link */}
          <div className="flex gap-2">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-lg font-mono text-sm text-slate-600"
            />
            <Button
              onClick={handleCopyLink}
              variant="outline"
              size="sm"
              className="whitespace-nowrap"
            >
              {isCopied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-4">
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy Link
            </Button>

            <Button
              onClick={handleShareWhatsApp}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>

            <Button
              onClick={handleShareEmail}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Email
            </Button>

            <Button
              onClick={handleShareMessage}
              variant="outline"
              className="flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              More
            </Button>
          </div>

          {/* Pre-written Message */}
          <div className="mt-6 p-4 bg-white rounded-lg border border-slate-200">
            <p className="text-sm text-slate-700 mb-2 font-medium">💬 Share this message:</p>
            <p className="text-sm text-slate-600 italic bg-slate-50 p-3 rounded border-l-4 border-indigo-300">
              "Hey! 👋 I'm using VitaPlate to understand my nutrition based on my actual lab results. It's been a game-changer for my health. Check it out - we both get 1 month free Pro if you join! {referralLink}"
            </p>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <Badge className="bg-indigo-100 text-indigo-700 w-8 h-8 flex items-center justify-center rounded-full">1</Badge>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">Share Your Link</h4>
              <p className="text-sm text-slate-600">Send your unique referral link to friends via WhatsApp, email, or any platform</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <Badge className="bg-indigo-100 text-indigo-700 w-8 h-8 flex items-center justify-center rounded-full">2</Badge>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">Friend Signs Up</h4>
              <p className="text-sm text-slate-600">They create an account using your link and get 1 month free Pro</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <Badge className="bg-indigo-100 text-indigo-700 w-8 h-8 flex items-center justify-center rounded-full">3</Badge>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">Friend Upgrades</h4>
              <p className="text-sm text-slate-600">When they upgrade to a paid plan, you both get 1 month free Pro</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <Badge className="bg-emerald-100 text-emerald-700 w-8 h-8 flex items-center justify-center rounded-full">✓</Badge>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">Rewards Applied</h4>
              <p className="text-sm text-slate-600">The free month is automatically added to both accounts immediately</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Referrals */}
      {referralStats.referrals && referralStats.referrals.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Your Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {referralStats.referrals.map((ref) => (
                <div key={ref.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {ref.referred_email ? ref.referred_email.split('@')[0] : 'Pending signup'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Code: {ref.referral_code}
                    </p>
                  </div>
                  <Badge
                    className={
                      ref.status === 'rewarded' ? 'bg-emerald-100 text-emerald-700' :
                      ref.status === 'upgraded' ? 'bg-blue-100 text-blue-700' :
                      ref.status === 'joined' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }
                  >
                    {ref.status === 'rewarded' ? '🎉 Rewarded' :
                     ref.status === 'upgraded' ? '💳 Upgraded' :
                     ref.status === 'joined' ? '✓ Joined' :
                     '⏳ Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Call to Action */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            🎯 Share Today, Earn Rewards
          </h3>
          <p className="text-slate-600 mb-4">
            Invite friends and build a community around better health. Every referral that upgrades gives you both 1 month free Pro!
          </p>
          <Button
            onClick={handleCopyLink}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy & Share Your Link
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}