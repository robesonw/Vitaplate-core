import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppleHealthCard from '@/components/integrations/AppleHealthCard';
import GoogleFitCard from '@/components/integrations/GoogleFitCard';
import FitbitCard from '@/components/integrations/FitbitCard';
import GarminCard from '@/components/integrations/GarminCard';
import OuraRingCard from '@/components/integrations/OuraRingCard';
import WHOOPCard from '@/components/integrations/WHOOPCard';
import GoogleCalendarCard from '@/components/integrations/GoogleCalendarCard';
import DexcomCard from '@/components/integrations/DexcomCard';

export default function Integrations() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Integrations</h1>
        <p className="text-slate-600 mt-2">
          Connect your health devices and apps to sync activity data and personalize your meal plans.
        </p>
      </div>

      {/* Wearable Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">📱 Activity Syncing</h2>
          <p className="text-sm text-slate-600 mt-1">
            Connect your phone's health platform to automatically sync steps, calories, sleep, and heart rate.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AppleHealthCard />
          <GoogleFitCard />
          <FitbitCard />
          <GarminCard />
        </div>
      </div>

      {/* How It Works */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg">How Activity Sync Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold text-slate-900 mb-1">🔄 Auto-Adjustment</h4>
            <p className="text-slate-700">
              Your daily calorie target automatically adjusts based on your activity level:
            </p>
            <ul className="mt-2 ml-4 space-y-1 text-slate-700">
              <li>• <strong>Sedentary</strong> (&lt;5K steps): No adjustment</li>
              <li>• <strong>Lightly Active</strong> (5K-7.5K steps): +150 calories</li>
              <li>• <strong>Active</strong> (7.5K-10K steps): +250 calories</li>
              <li>• <strong>Very Active</strong> (10K-15K steps): +400 calories</li>
              <li>• <strong>Extremely Active</strong> (15K+ steps): +600 calories</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-1">📊 Data Used</h4>
            <p className="text-slate-700">
              We track and use: steps, calories burned, sleep hours, resting heart rate, and body weight.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-1">🔒 Privacy</h4>
            <p className="text-slate-700">
              Your health data is encrypted and only used to personalize your nutrition recommendations.
              You can disconnect at any time.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Integration */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">📅 Calendar & Scheduling</h2>
          <p className="text-sm text-slate-600 mt-1">
            Sync your meal plans directly to your calendar.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GoogleCalendarCard />
        </div>
      </div>

      {/* Health Monitoring */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">🩺 Health Monitoring</h2>
          <p className="text-sm text-slate-600 mt-1">
            Monitor blood sugar, biometrics, and other health markers in real time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DexcomCard />
        </div>
      </div>

      {/* Additional Wearables */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">⌚ Premium Wearables</h2>
          <p className="text-sm text-slate-600 mt-1">
            Advanced biometric tracking from premium devices.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OuraRingCard />
          <WHOOPCard />
        </div>
      </div>

      {/* Coming Soon */}
      <Card className="border-dashed border-slate-300">
        <CardHeader>
          <CardTitle className="text-lg">Coming Soon 🚀</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">⌚ More Wearables</h4>
              <ul className="space-y-1 text-slate-700">
                <li>• Apple Watch Health</li>
                <li>• Withings Health Devices</li>
                <li>• Polar Sports Watch</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">🏥 Health Data</h4>
              <ul className="space-y-1 text-slate-700">
                <li>• Lab results sync</li>
                <li>• Epic/EHR integration</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}