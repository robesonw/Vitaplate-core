import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Circle } from 'lucide-react';
import { toast } from 'sonner';

export default function OuraRingCard({ lastSync = null, onSyncComplete = () => {} }) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleConnect = async () => {
    setIsSyncing(true);
    try {
      toast.info('🔗 Redirecting to Oura Ring authorization...', { duration: 3000 });
      // In production, redirect to Oura OAuth endpoint
      // window.location.href = `${BACKEND_URL}/auth/oura`;
    } catch (error) {
      toast.error('Oura Ring connection failed');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className="border-slate-200 hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-lg">
              ◯
            </div>
            <div>
              <CardTitle className="text-slate-900">Oura Ring</CardTitle>
              <p className="text-xs text-slate-600 mt-1">Readiness, sleep & recovery</p>
            </div>
          </div>
          <Badge variant="outline" className="text-slate-600">
            {lastSync ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastSync && (
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-600">Last sync</p>
            <p className="font-semibold text-slate-900">
              {new Date(lastSync).toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
        )}

        <div className="space-y-2 p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-indigo-700">
          <p className="font-medium">What you'll sync:</p>
          <ul className="space-y-1 ml-3">
            <li>• Readiness & sleep scores</li>
            <li>• HRV (Heart Rate Variability)</li>
            <li>• Sleep stage breakdown</li>
            <li>• Body temperature deviation</li>
          </ul>
        </div>

        <Button 
          onClick={handleConnect}
          disabled={isSyncing || !!lastSync}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          {isSyncing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : lastSync ? (
            <>
              <Circle className="w-4 h-4 mr-2 fill-current" />
              Connected
            </>
          ) : (
            <>
              <Circle className="w-4 h-4 mr-2" />
              Connect Oura Ring
            </>
          )}
        </Button>

        <p className="text-xs text-slate-600 p-2 rounded bg-blue-50 border border-blue-200">
          💡 Your readiness and HRV scores will automatically adjust your meal recommendations for optimal recovery.
        </p>
      </CardContent>
    </Card>
  );
}