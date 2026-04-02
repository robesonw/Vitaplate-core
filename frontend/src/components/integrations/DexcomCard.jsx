import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, AlertCircle, Check } from 'lucide-react';

export default function DexcomCard() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConnect = () => {
    setLoading(true);
    // Future: Implement OAuth flow
    setTimeout(() => {
      setLoading(false);
      setConnected(true);
    }, 1500);
  };

  const handleDisconnect = () => {
    setConnected(false);
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Dexcom CGM</CardTitle>
              <CardDescription>Real-time glucose monitoring</CardDescription>
            </div>
          </div>
          {connected && (
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
              <Check className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-sm mb-2 text-slate-900">Supported Devices</h4>
          <div className="flex flex-wrap gap-2">
            {['Dexcom G6', 'Dexcom G7', 'Dexcom Stelo', 'Dexcom ONE+'].map((device) => (
              <Badge key={device} variant="outline" className="bg-white">
                {device}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-slate-900">What you'll get</h4>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex gap-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>Real-time glucose readings (synced every 15 minutes)</span>
            </li>
            <li className="flex gap-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>See how meals affect your blood sugar</span>
            </li>
            <li className="flex gap-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>Glucose trend analysis & time in range tracking</span>
            </li>
            <li className="flex gap-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>Smart alerts for blood sugar patterns</span>
            </li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <p className="text-xs text-blue-900">
            <strong>Premium Feature:</strong> Full glucose integration is available with Pro and Premium plans. Free users can manually log glucose readings.
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          {!connected ? (
            <Button 
              onClick={handleConnect} 
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Connecting...' : 'Connect Dexcom'}
            </Button>
          ) : (
            <>
              <Button variant="outline" className="flex-1">
                View Glucose
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleDisconnect}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Disconnect
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}