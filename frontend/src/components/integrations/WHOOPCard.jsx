import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function WHOOPCard({ lastSync = null, onSyncComplete = () => {} }) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleConnect = async () => {
    setIsSyncing(true);
    try {
      toast.info('🔗 Redirecting to WHOOP authorization...', { duration: 3000 });
      // In production, redirect to WHOOP OAuth endpoint
      // window.location.href = `${BACKEND_URL}/auth/whoop`;
    } catch (error) {
      toast.error('WHOOP connection failed');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className="border-slate-200 hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
              ⚡
            </div>
            <div>
              <CardTitle className="text-slate-900">WHOOP</CardTitle>
              <p className="text-xs text-slate-600 mt-1">Recovery, strain & performance</p>
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

        <div className="space-y-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700">
          <p className="font-medium">What you'll sync:</p>
          <ul className="space-y-1 ml-3">
            <li>• Recovery score (0-100%)</li>
            <li>• Strain score & zones</li>
            <li>• HRV & heart rate</li>
            <li>• Sleep performance metrics</li>
          </ul>
        </div>

        <Button 
          onClick={handleConnect}
          disabled={isSyncing || !!lastSync}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
        >
          {isSyncing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : lastSync ? (
            <>
              <TrendingUp className="w-4 h-4 mr-2" />
              Connected
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 mr-2" />
              Connect WHOOP
            </>
          )}
        </Button>

        <p className="text-xs text-slate-600 p-2 rounded bg-blue-50 border border-blue-200">
          💡 Your daily recovery and strain scores will dynamically adjust meal timing and macros for peak performance.
        </p>
      </CardContent>
    </Card>
  );
}