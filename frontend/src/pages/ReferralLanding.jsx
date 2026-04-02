import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Users, Flame, TrendingUp, Activity, Loader2 } from 'lucide-react';

export default function ReferralLanding() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [referrerName, setReferrerName] = useState('A friend');
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        setIsAuthenticated(!!user);
        setIsLoading(false);
      } catch {
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    checkAuth();

    // Fetch referrer name if code is valid
    if (code) {
      const fetchReferrer = async () => {
        try {
          const referrals = await base44.entities.Referral.filter({
            referral_code: code
          });
          if (referrals.length > 0) {
            const email = referrals[0].referrer_email;
            const name = email.split('@')[0];
            setReferrerName(name.charAt(0).toUpperCase() + name.slice(1));
          }
        } catch (error) {
          console.error('Error fetching referrer:', error);
        }
      };
      fetchReferrer();
    }
  }, [code]);

  const handleSignUp = () => {
    // Store referral code in session storage
    sessionStorage.setItem('referral_code', code);
    navigate('/Onboarding');
  };

  const handleLogin = () => {
    sessionStorage.setItem('referral_code', code);
    base44.auth.redirectToLogin('/Dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695042d8937b0c0cf7f7afd6/1812bfbf0_image.png"
              alt="VitaPlate"
              className="w-8 h-8"
            />
            <h1 className="font-semibold text-slate-900">VitaPlate</h1>
          </div>
          {isAuthenticated && (
            <Button variant="outline" onClick={() => navigate('/Dashboard')}>
              Go to Dashboard
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left Side - Message */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-slate-900">
                {referrerName} thinks VitaPlate will change your health
              </h1>
              <p className="text-xl text-slate-600">
                Get personalized meal plans, track nutrition, and unlock insights from your lab results.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Activity className="w-6 h-6 text-indigo-600 mt-1" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Connect Your Lab Results</h3>
                  <p className="text-sm text-slate-600">Upload bloodwork PDFs and get instant biomarker analysis</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Flame className="w-6 h-6 text-orange-600 mt-1" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">AI-Powered Meal Plans</h3>
                  <p className="text-sm text-slate-600">Personalized nutrition based on your health goals and labs</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-emerald-600 mt-1" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Track Your Transformation</h3>
                  <p className="text-sm text-slate-600">Progress photos, measurements, and monthly health reports</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Users className="w-6 h-6 text-blue-600 mt-1" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Community Support</h3>
                  <p className="text-sm text-slate-600">Share progress, get inspired, earn achievements</p>
                </div>
              </div>
            </div>

            {/* Special Offer */}
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-6">
                <p className="text-sm text-green-700 font-medium">🎁 SPECIAL OFFER</p>
                <h3 className="text-2xl font-bold text-green-900 mt-2">1 Month Free Pro</h3>
                <p className="text-sm text-green-700 mt-2">
                  When you sign up, you'll get 1 month of Pro access free. And if you upgrade, your friend {referrerName} gets a free month too!
                </p>
              </CardContent>
            </Card>

            {/* CTA Buttons */}
            <div className="space-y-3">
              {isAuthenticated ? (
                <Button
                  onClick={() => navigate('/Dashboard')}
                  size="lg"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-12"
                >
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleSignUp}
                    size="lg"
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-12"
                  >
                    Create Free Account
                  </Button>
                  <Button
                    onClick={handleLogin}
                    size="lg"
                    variant="outline"
                    className="w-full h-12"
                  >
                    Already have an account? Log in
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Right Side - Visual */}
          <div className="hidden md:block">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-0">
                <img
                  src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&h=600&fit=crop"
                  alt="Healthy eating"
                  className="w-full h-96 object-cover rounded-lg"
                />
              </CardContent>
            </Card>

            {/* Trust Badge */}
            <div className="mt-8 space-y-4">
              <Card className="border-slate-200">
                <CardContent className="p-4">
                  <p className="text-sm text-slate-600 text-center">
                    ⭐ <strong>4.9/5</strong> from 2,000+ users
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardContent className="p-4">
                  <p className="text-sm text-slate-600 text-center">
                    🔒 Your health data stays private and secure
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}