import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppleHealthCard from '@/components/integrations/AppleHealthCard';
import GoogleFitCard from '@/components/integrations/GoogleFitCard';
import FitbitCard from '@/components/integrations/FitbitCard';
import GarminCard from '@/components/integrations/GarminCard';
import OuraRingCard from '@/components/integrations/OuraRingCard';
import WHOOPCard from '@/components/integrations/WHOOPCard';
import GoogleCalendarCard from '@/components/integrations/GoogleCalendarCard';
import DexcomCard from '@/components/integrations/DexcomCard';
import { PageErrorBoundary } from '@/components/ErrorBoundary';
import { FlaskConical, Calendar, Activity, Zap } from 'lucide-react';

export default function Integrations() {
  return (
    <PageErrorBoundary title="Integrations">
      <div className="space-y-8 max-w-5xl mx-auto">

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-slate-900">Integrations</h1>
            <Badge className="bg-amber-100 text-amber-700 border border-amber-200">
              Coming Soon
            </Badge>
          </div>
          <p className="text-slate-600">
            Connect your health devices and apps — integrations are in active development.
            Click "Notify me" on any integration to be first when it launches.
          </p>
        </div>

        {/* What's already working */}
        <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-indigo-600" />
              What's Already Integrated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { icon: '🔬', label: 'Lab Results (PDF Upload)', desc: 'Upload any Quest, LabCorp, or standard lab PDF — AI extracts all biomarkers automatically', live: true },
                { icon: '🧬', label: 'Biomarker Tracking', desc: 'All 30+ markers tracked over time with trend comparison between uploads', live: true },
                { icon: '💊', label: 'Supplement Recommendations', desc: 'Rules-based recs generated directly from your lab values — no AI cost', live: true },
                { icon: '📧', label: 'Email Notifications', desc: 'Weekly digest, streak reminders, and health alerts delivered to your inbox', live: true },
              ].map(({ icon, label, desc, live }) => (
                <div key={label} className="flex gap-3 p-3 bg-white rounded-lg border border-indigo-100">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">{label}</p>
                      {live && <Badge className="text-xs bg-emerald-100 text-emerald-700">Live ✅</Badge>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Priority integration — Dexcom CGM */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-semibold text-slate-900">🌟 Priority Integration</h2>
            <Badge className="bg-red-100 text-red-700 border border-red-200">Most Requested</Badge>
          </div>
          <p className="text-sm text-slate-500">The CGM integration is our #1 priority — no other meal planning app has real-time glucose data.</p>
          <div className="max-w-sm">
            <DexcomCard />
          </div>
        </div>

        {/* Activity & Wearables */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-semibold text-slate-900">Activity & Wearables</h2>
          </div>
          <p className="text-sm text-slate-500">
            When connected, your activity data automatically adjusts calorie targets and meal plan intensity.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AppleHealthCard />
            <GoogleFitCard />
            <FitbitCard />
            <GarminCard />
            <OuraRingCard />
            <WHOOPCard />
          </div>
        </div>

        {/* Calendar */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-slate-900">Calendar & Planning</h2>
          </div>
          <div className="max-w-sm">
            <GoogleCalendarCard />
          </div>
        </div>

        {/* FHIR / EHR */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">🏥 Clinical Integrations (Future)</CardTitle>
              <Badge variant="outline" className="text-xs">Q4 2026</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p>Direct EHR (Epic, Cerner) and Apple Health FHIR integrations are planned — these eliminate the PDF upload step entirely by pulling lab results automatically from your medical record.</p>
            <p className="text-xs text-slate-400 mt-2">These require healthcare-grade API agreements and HIPAA compliance certification — we're working on it.</p>
          </CardContent>
        </Card>

      </div>
    </PageErrorBoundary>
  );
}
