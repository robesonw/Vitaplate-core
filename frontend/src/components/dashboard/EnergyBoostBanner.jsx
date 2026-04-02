import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Zap } from 'lucide-react';

export default function EnergyBoostBanner({ dailyCheckIn = null }) {
  if (!dailyCheckIn) return null;

  const lowEnergy = dailyCheckIn.energy_level <= 2;
  const poorSleep = dailyCheckIn.sleep_hours < 6;

  if (!lowEnergy && !poorSleep) return null;

  const reasons = [];
  if (lowEnergy) reasons.push('low energy');
  if (poorSleep) reasons.push('poor sleep');

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-900 mb-2">⚡ Energy Boost Mode</p>
            <p className="text-sm text-amber-800 mb-2">
              Based on your {reasons.join(' and ')}, today's meal plan focuses on energy-boosting foods.
            </p>
            <ul className="text-xs text-amber-800 space-y-1 ml-4 list-disc">
              <li>Complex carbs for sustained energy (oats, quinoa, sweet potatoes)</li>
              <li>Iron-rich foods to combat fatigue (spinach, lean meat, legumes)</li>
              <li>B-vitamin sources for energy metabolism (whole grains, nuts, eggs)</li>
              <li>Regular meal timing to maintain stable blood sugar</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}