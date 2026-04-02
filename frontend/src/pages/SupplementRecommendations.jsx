import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Lock, Pill, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import SupplementRecommendationCard from '../components/supplements/SupplementRecommendationCard';

export default function SupplementRecommendations() {
  const [searchParams] = useSearchParams();
  const labResultId = searchParams.get('labResultId');
  const [isIframe, setIsIframe] = useState(false);

  useEffect(() => {
    setIsIframe(window.self !== window.top);
  }, []);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: labResult } = useQuery({
    queryKey: ['labResult', labResultId],
    queryFn: async () => {
      if (!labResultId) return null;
      const results = await base44.entities.LabResult.filter({ id: labResultId });
      return results?.[0] || null;
    },
    enabled: !!labResultId,
  });

  const { data: userPrefs } = useQuery({
    queryKey: ['userPreferences'],
    queryFn: async () => {
      if (!user?.email) return null;
      const prefs = await base44.entities.UserPreferences.filter({ created_by: user.email });
      return prefs?.[0] || null;
    },
    enabled: !!user?.email,
  });

  const generatePlanMutation = useMutation({
    mutationFn: (id) =>
      base44.functions.invoke('generateSupplementPlan', { labResultId: id }),
    onError: (err) => {
      toast.error('Failed to generate supplement plan');
      console.error(err);
    },
  });

  useEffect(() => {
    if (labResultId && !generatePlanMutation.data) {
      generatePlanMutation.mutate(labResultId);
    }
  }, [labResultId]);

  const plan = generatePlanMutation.data?.data;
  const isLoading = generatePlanMutation.isPending;

  // Check user tier (simplified - in production use subscription service)
  const isPro = userPrefs?.tier === 'pro' || userPrefs?.tier === 'premium';
  const maxRecommendations = isPro ? plan?.recommendationCount : 2;

  if (!labResultId || !labResult) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <div className="mb-6 flex justify-center">
            <div className="p-4 bg-indigo-100 rounded-full">
              <Pill className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Personalized Supplements</h1>
          <p className="text-lg text-slate-600 mb-8">
            Upload your lab results first to get personalized supplement recommendations based on your biomarkers.
          </p>
          
          <Card className="mb-8 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardContent className="pt-6">
              <div className="space-y-4 text-left">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-600 text-white text-sm font-semibold">
                      1
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Upload Lab Results</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Upload a PDF of your bloodwork or connect Apple Health to automatically import results.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-600 text-white text-sm font-semibold">
                      2
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">We Analyze Your Biomarkers</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Our AI reviews your lab values and identifies nutritional gaps based on your health goals.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-600 text-white text-sm font-semibold">
                      3
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Get Your Plan</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Receive a personalized supplement stack with affiliate links for easy ordering.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-base">
            <a href="/LabResults" className="inline-flex items-center gap-2">
              Upload Lab Results
              <ArrowRight className="w-5 h-5" />
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Your Supplement Plan</h1>
        <p className="text-slate-600 mt-1">
          Based on your labs from{' '}
          {new Date(labResult.upload_date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>

      {isIframe && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Amazon links work best on the published app. Open VitaPlate directly for the best shopping experience.
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mr-2" />
            <p className="text-slate-600">Generating your supplement plan...</p>
          </CardContent>
        </Card>
      ) : plan ? (
        <>
          {/* Overview */}
          <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    {plan.recommendationCount} supplements recommended
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Estimated monthly cost: <span className="font-bold text-indigo-600">~${plan.totalMonthlyCost}</span>
                  </p>
                </div>
                <div className="text-right">
                  <Badge className="bg-indigo-500 text-white mb-2">Personalized Plan</Badge>
                  <p className="text-xs text-slate-600">Based on your lab results</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Priority Stack */}
          {plan.recommendations.filter((r) => r.priority === 'HIGH').length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">🎯 Top Priority Stack</h2>
              <p className="text-sm text-slate-600 mb-4">
                Start with these supplements for the biggest health impact:
              </p>
              <div className="grid gap-4">
                {plan.recommendations
                  .filter((r) => r.priority === 'HIGH')
                  .slice(0, 3)
                  .map((rec, idx) => (
                    <SupplementRecommendationCard key={idx} recommendation={rec} />
                  ))}
              </div>
            </div>
          )}

          {/* All Recommendations */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900">All Recommendations</h2>
              {!isPro && <Badge className="bg-rose-100 text-rose-700">Free Tier Preview</Badge>}
            </div>

            <div className="grid gap-4">
              {plan.recommendations.map((rec, idx) => {
                const isBlurred = !isPro && idx >= maxRecommendations;

                return (
                  <div
                    key={idx}
                    className={`relative ${isBlurred ? 'opacity-60 pointer-events-none' : ''}`}
                  >
                    <SupplementRecommendationCard recommendation={rec} />

                    {isBlurred && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900 bg-opacity-20 rounded-lg backdrop-blur-sm">
                        <div className="bg-white rounded-lg p-4 text-center">
                          <Lock className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-slate-900">Upgrade to Pro</p>
                          <p className="text-xs text-slate-600 mt-1">
                            See all {plan.recommendationCount} supplement recommendations
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Disclaimer */}
          <Card className="border-slate-200 bg-slate-50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-slate-600" />
                Medical Disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700 leading-relaxed">
                These recommendations are based on your lab values and general nutritional science. They are
                <strong> not medical advice</strong>. Always consult your doctor or registered dietitian before
                starting any new supplement regimen, especially if you take prescription medications. Some supplements
                can interact with medications or medical conditions.
              </p>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600">Unable to generate supplement plan. Please try again.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}