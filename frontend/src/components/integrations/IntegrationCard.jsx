import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, ExternalLink, Zap } from 'lucide-react';
import { toast } from 'sonner';

// ─── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  if (status === 'connected') return (
    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border">
      <CheckCircle className="w-3 h-3 mr-1" /> Connected
    </Badge>
  );
  if (status === 'coming_soon') return (
    <Badge className="bg-amber-100 text-amber-700 border-amber-200 border">
      <Clock className="w-3 h-3 mr-1" /> Coming Soon
    </Badge>
  );
  return (
    <Badge variant="outline" className="text-slate-500">
      Not Connected
    </Badge>
  );
}

// ─── Coming Soon Card ──────────────────────────────────────────────────────────
export function ComingSoonCard({ logo, name, description, benefits = [], launchDate }) {
  const [notified, setNotified] = useState(false);

  const handleNotify = () => {
    // Store interest locally — can be wired to email list later
    const interests = JSON.parse(localStorage.getItem('vp_integration_interests') || '[]');
    if (!interests.includes(name)) {
      interests.push(name);
      localStorage.setItem('vp_integration_interests', JSON.stringify(interests));
    }
    setNotified(true);
    toast.success(`We'll notify you when ${name} integration launches!`);
  };

  return (
    <Card className="border-slate-200 bg-white relative overflow-hidden">
      {/* Subtle coming soon overlay */}
      <div className="absolute top-3 right-3">
        <StatusBadge status="coming_soon" />
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{logo}</div>
          <div>
            <CardTitle className="text-base text-slate-800">{name}</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Benefits list */}
        {benefits.length > 0 && (
          <div className="space-y-1.5">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                <Zap className="w-3 h-3 text-amber-400 flex-shrink-0" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        )}

        {launchDate && (
          <p className="text-xs text-slate-400">Expected: {launchDate}</p>
        )}

        <Button
          onClick={handleNotify}
          disabled={notified}
          variant="outline"
          size="sm"
          className={`w-full ${notified ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-slate-600'}`}
        >
          {notified ? '✅ You\'ll be notified' : '🔔 Notify me when available'}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Connected Card ────────────────────────────────────────────────────────────
export function ConnectedIntegrationCard({
  logo, name, description, isConnected, lastSync,
  onConnect, onDisconnect, isLoading, connectLabel = 'Connect',
  connectedBenefits = [],
}) {
  return (
    <Card className={`border-2 transition-colors ${isConnected ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-white'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{logo}</div>
            <div>
              <CardTitle className="text-base">{name}</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            </div>
          </div>
          <StatusBadge status={isConnected ? 'connected' : 'disconnected'} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {connectedBenefits.length > 0 && (
          <div className="space-y-1.5">
            {connectedBenefits.map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle className={`w-3 h-3 flex-shrink-0 ${isConnected ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span className={isConnected ? 'text-slate-700' : 'text-slate-400'}>{b}</span>
              </div>
            ))}
          </div>
        )}

        {isConnected && lastSync && (
          <p className="text-xs text-slate-400">Last synced: {new Date(lastSync).toLocaleDateString()}</p>
        )}

        {isConnected ? (
          <Button variant="outline" size="sm" onClick={onDisconnect} disabled={isLoading}
            className="w-full text-red-600 border-red-200 hover:bg-red-50">
            {isLoading ? 'Disconnecting...' : 'Disconnect'}
          </Button>
        ) : (
          <Button size="sm" onClick={onConnect} disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
            {isLoading ? 'Connecting...' : connectLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default ComingSoonCard;
