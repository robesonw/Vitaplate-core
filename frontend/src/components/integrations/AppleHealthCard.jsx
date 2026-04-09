import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone } from 'lucide-react';

export default function AppleHealthCard() {
  return (
    <Card className="border-slate-200 bg-slate-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🍎</span>
            <div>
              <CardTitle className="text-base text-slate-800">Apple Health</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Steps, sleep, heart rate & nutrition sync</p>
            </div>
          </div>
          <Badge variant="outline" className="text-slate-400 border-slate-300 text-xs">
            iOS App Required
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <Smartphone className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Native iOS app required</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Apple HealthKit only works in native iOS apps — it's not accessible from a web browser.
              A VitaPlate iOS app with HealthKit integration is on our roadmap for Q2 2026.
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          In the meantime, upload your lab results as a PDF to get biomarker-driven meal plans — our core differentiator that no wearable can match.
        </p>
      </CardContent>
    </Card>
  );
}
