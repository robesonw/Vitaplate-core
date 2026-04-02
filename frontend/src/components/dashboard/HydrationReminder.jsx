import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Droplet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function HydrationReminder({ waterGlasses = 0, dailyCheckIn = null }) {
  if (!dailyCheckIn || dailyCheckIn.water_glasses >= 8) {
    return null;
  }

  const remaining = 8 - (waterGlasses || dailyCheckIn.water_glasses || 0);
  const percentComplete = Math.round((waterGlasses || dailyCheckIn.water_glasses || 0) / 8 * 100);

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Droplet className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-blue-900 mb-2">💧 Stay Hydrated!</p>
            <p className="text-sm text-blue-800 mb-2">
              You've had <strong>{waterGlasses || dailyCheckIn.water_glasses || 0} of 8</strong> glasses today. Drink <strong>{remaining} more</strong> to reach your goal.
            </p>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
            <p className="text-xs text-blue-700 mt-2">
              ✓ Proper hydration boosts energy, improves digestion, and helps nutrient absorption.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}