import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PCOSNutritionGuide() {
  return (
    <div className="space-y-4">
      <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-violet-900">🌸 PCOS Nutrition Strategy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-white border border-violet-200">
              <Badge className="mb-2 bg-violet-100 text-violet-800">Priority</Badge>
              <h4 className="font-semibold text-slate-900 mb-2">Low Glycemic Index (GI)</h4>
              <ul className="text-xs space-y-1 text-slate-700">
                <li>• Whole grains (oats, quinoa, barley)</li>
                <li>• Legumes (lentils, chickpeas, beans)</li>
                <li>• Non-starchy vegetables</li>
                <li>• Keep GI score under 55</li>
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-white border border-violet-200">
              <Badge className="mb-2 bg-violet-100 text-violet-800">Target</Badge>
              <h4 className="font-semibold text-slate-900 mb-2">High Fiber (25-30g/day)</h4>
              <ul className="text-xs space-y-1 text-slate-700">
                <li>• Prevents insulin spikes</li>
                <li>• Supports healthy gut bacteria</li>
                <li>• Improves hormone metabolism</li>
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-white border border-violet-200">
              <Badge className="mb-2 bg-violet-100 text-violet-800">Essential</Badge>
              <h4 className="font-semibold text-slate-900 mb-2">Healthy Fats & Protein</h4>
              <ul className="text-xs space-y-1 text-slate-700">
                <li>• Olive oil, avocado, nuts</li>
                <li>• Fatty fish (omega-3s reduce inflammation)</li>
                <li>• Lean protein at every meal</li>
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-white border border-violet-200">
              <Badge className="mb-2 bg-rose-100 text-rose-800">Limit</Badge>
              <h4 className="font-semibold text-slate-900 mb-2">Restrict These</h4>
              <ul className="text-xs space-y-1 text-slate-700">
                <li>• Refined carbs (white bread, pasta)</li>
                <li>• Sugary foods & drinks</li>
                <li>• High-dairy products</li>
              </ul>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-violet-100 border border-violet-300 text-sm text-violet-900">
            <p className="font-medium mb-1">💊 Why This Matters for PCOS</p>
            <p className="text-xs">PCOS causes insulin resistance. Low GI + high fiber helps regulate blood sugar, reduce androgen levels, and improve ovulation. Anti-inflammatory foods reduce chronic inflammation linked to PCOS severity.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}