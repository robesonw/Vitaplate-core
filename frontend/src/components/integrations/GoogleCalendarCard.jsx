import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function GoogleCalendarCard() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const url = await base44.connectors.connectAppUser('google_calendar_connector');
      const popup = window.open(url, '_blank', 'width=500,height=600');
      
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          setIsConnecting(false);
          setIsConnected(true);
        }
      }, 500);
    } catch (error) {
      console.error('Failed to connect Google Calendar:', error);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm('Disconnect Google Calendar? Existing events will not be deleted.')) {
      try {
        await base44.connectors.disconnectAppUser('google_calendar_connector');
        setIsConnected(false);
      } catch (error) {
        console.error('Failed to disconnect:', error);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-500" />
            <div>
              <CardTitle>Google Calendar</CardTitle>
              <CardDescription>Sync meal plans to your calendar</CardDescription>
            </div>
          </div>
          {isConnected && <Badge className="bg-green-100 text-green-700 border-0">Connected</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          Sync your meal plans as calendar events with prep times, ingredients, and reminders.
        </p>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-700">Features:</p>
          <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
            <li>Auto-schedule meals at customizable times</li>
            <li>Color-coded events by meal type</li>
            <li>Includes ingredients and prep instructions</li>
            <li>15-minute reminders for each meal</li>
            <li>Weekly meal prep reminder</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleConnect}
            disabled={isConnecting || isConnected}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : isConnected ? (
              'Connected'
            ) : (
              'Connect Google Calendar'
            )}
          </Button>
          {isConnected && (
            <Button
              onClick={handleDisconnect}
              variant="outline"
              className="flex-1"
            >
              Disconnect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}