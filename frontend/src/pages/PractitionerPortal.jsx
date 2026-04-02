import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Copy, Share2, DollarSign, Users, TrendingUp, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PractitionerPortal() {
  const [isCopied, setIsCopied] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  const { data: practitionerCode = '' } = useQuery({
    queryKey: ['practitionerCode', user?.email],
    queryFn: async () => {
      if (!user?.email) return '';
      const apps = await base44.entities.PractitionerApplication.filter({
        email: user.email,
        status: 'approved'
      });
      return apps.length > 0 ? apps[0].practitioner_code : '';
    },
    enabled: !!user?.email
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ['practitionerPatients', practitionerCode],
    queryFn: async () => {
      if (!practitionerCode) return [];
      const consents = await base44.entities.PractitionerConsent.filter({
        practitioner_code: practitionerCode
      });
      return consents;
    },
    enabled: !!practitionerCode
  });

  const { data: earnings = [] } = useQuery({
    queryKey: ['practitionerEarnings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.PractitionerEarning.filter({
        practitioner_email: user.email
      });
    },
    enabled: !!user?.email
  });

  const patientLink = `${window.location.origin}/join/${practitionerCode}`;
  const activePatients = referrals.filter(r => r.consent_given).length;
  const currentMonth = new Date().toISOString().split('T')[0].slice(0, 7) + '-01';
  const monthlyEarnings = earnings.find(e => e.month === currentMonth);
  const estimatedMonthly = activePatients * 2;
  const totalEarned = earnings.reduce((sum, e) => sum + (e.total_amount || 0), 0);
  const totalPaid = earnings.filter(e => e.is_paid).reduce((sum, e) => sum + (e.total_amount || 0), 0);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(patientLink);
    setIsCopied(true);
    toast.success('Patient link copied!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const message = `I'm recommending VitaPlate to my patients! Join with this link and get 1 month free: ${patientLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Practitioner Portal</h1>
        <p className="text-slate-600 mt-1">Manage your patient referrals and track your earnings</p>
      </div>

      {!practitionerCode ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">Application Pending</h3>
                <p className="text-sm text-amber-800 mb-4">
                  Your practitioner application is being reviewed. You'll receive an email confirmation once approved.
                </p>
                <Button asChild variant="outline">
                  <a href="/practitioners">View Application Status</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Your Referral Link */}
          <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-indigo-600" />
                Your Referral Link
              </CardTitle>
              <CardDescription>Share this link with patients to earn commissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Code Display */}
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <p className="text-sm text-slate-600 mb-2 font-medium">Practitioner Code:</p>
                <p className="text-2xl font-bold text-indigo-600 font-mono">{practitionerCode}</p>
              </div>

              {/* Patient Link */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={patientLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono text-slate-600"
                />
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
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
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleCopyLink}
                  className="flex-1"
                  variant="outline"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
                <Button
                  onClick={handleShareWhatsApp}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share on WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Earnings Summary */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <Badge className="bg-blue-100 text-blue-700">{activePatients}</Badge>
                </div>
                <p className="text-sm text-slate-600 mb-1">Active Patients</p>
                <p className="text-2xl font-bold text-slate-900">{activePatients}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <Badge className="bg-emerald-100 text-emerald-700">${estimatedMonthly}</Badge>
                </div>
                <p className="text-sm text-slate-600 mb-1">This Month (Est.)</p>
                <p className="text-2xl font-bold text-slate-900">${estimatedMonthly}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                  <Badge className="bg-purple-100 text-purple-700">${totalPaid}</Badge>
                </div>
                <p className="text-sm text-slate-600 mb-1">Total Paid Out</p>
                <p className="text-2xl font-bold text-slate-900">${totalPaid}</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="patients">Your Patients</TabsTrigger>
              <TabsTrigger value="earnings">Earnings History</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Practitioner Dashboard</CardTitle>
                  <CardDescription>
                    Manage your referrals and client accounts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Button asChild className="h-20 text-left justify-start p-6 text-base">
                      <Link to="/MyClients">
                        <Users className="w-6 h-6 mr-3" />
                        <div>
                          <div className="font-semibold">Manage Clients</div>
                          <div className="text-xs opacity-90">View lab results, nutrition, meal plans</div>
                        </div>
                      </Link>
                    </Button>

                    <Button variant="outline" asChild className="h-20 text-left justify-start p-6 text-base">
                      <a href="#subscription">
                        <TrendingUp className="w-6 h-6 mr-3" />
                        <div>
                          <div className="font-semibold">Upgrade Plan</div>
                          <div className="text-xs opacity-90">Manage up to 10 or unlimited clients</div>
                        </div>
                      </a>
                    </Button>
                  </div>

                  <Separator />

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">How it works:</h4>
                    <ul className="space-y-1 text-sm text-blue-800">
                      <li>✓ Patients sign up with your referral code</li>
                      <li>✓ They consent to share their health data with you</li>
                      <li>✓ You can view their labs, meals, and progress</li>
                      <li>✓ Create custom meal plans for each client</li>
                      <li>✓ Earn $2/month per active patient subscription</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Patients Tab */}
            <TabsContent value="patients">
              <Card>
                <CardHeader>
                  <CardTitle>Referred Patients</CardTitle>
                  <CardDescription>
                    Patients who signed up with your code
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {referrals.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium mb-2">No patients yet</p>
                      <p className="text-sm text-slate-400 mb-4">Share your referral link to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {referrals.map((referral) => (
                        <div key={referral.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{referral.patient_email}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              Signed up: {new Date(referral.consent_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={referral.consent_given ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                              {referral.consent_given ? 'Active' : 'Pending Consent'}
                            </Badge>
                            {referral.consent_given && (
                              <Badge variant="outline" className="text-xs">
                                Data Access
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Earnings Tab */}
            <TabsContent value="earnings">
              <Card>
                <CardHeader>
                  <CardTitle>Earnings History</CardTitle>
                  <CardDescription>
                    Monthly earnings from patient referrals ($2/patient/month)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {earnings.length === 0 ? (
                    <div className="text-center py-12">
                      <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">No earnings yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {earnings.sort((a, b) => new Date(b.month) - new Date(a.month)).map((earning) => (
                        <div key={earning.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50">
                          <div>
                            <p className="font-medium text-slate-900">
                              {new Date(earning.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </p>
                            <p className="text-sm text-slate-600 mt-1">
                              {earning.active_patients} patients × ${earning.commission_per_patient}/month
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-slate-900">${earning.total_amount}</p>
                            <Badge className={earning.is_paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                              {earning.is_paid ? 'Paid' : 'Pending'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Payout Info */}
          <Card className="border-slate-200 bg-slate-50">
            <CardHeader>
              <CardTitle className="text-base">How Payments Work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700">
              <p>✓ You earn <strong>$2/month</strong> for each active patient who maintains a Pro subscription</p>
              <p>✓ Monthly earnings calculated on the 1st of each month</p>
              <p>✓ Payments issued on the 15th via your preferred method (PayPal or bank transfer)</p>
              <p>✓ Patients must be actively subscribed to count toward your earnings</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}