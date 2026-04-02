import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Info, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HealthAlerts() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['healthAlerts', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const result = await base44.entities.HealthAlert.filter({ user_email: user.email });
      return result.sort((a, b) => {
        const severityOrder = { urgent: 0, warning: 1, advisory: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
    },
    enabled: !!user?.email,
  });

  const acknowledgeAlertMutation = async (alertId, acknowledged) => {
    await base44.entities.HealthAlert.update(alertId, {
      acknowledged: !acknowledged,
      acknowledged_date: !acknowledged ? new Date().toISOString().split('T')[0] : null,
    });
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'urgent':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <Zap className="w-5 h-5 text-amber-600" />;
      case 'advisory':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-slate-600" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'urgent':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'advisory':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const getSeverityBadgeColor = (severity) => {
    switch (severity) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-amber-100 text-amber-800';
      case 'advisory':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const acknowledgedAlerts = alerts?.filter((a) => a.acknowledged) || [];
  const activeAlerts = alerts?.filter((a) => !a.acknowledged) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Health Alerts</h1>
        <p className="text-slate-600 mt-2">
          Review personalized health recommendations based on your lab results and nutrition data.
        </p>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length === 0 ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-green-900 mb-1">All Clear!</h3>
            <p className="text-green-700 mb-4">
              No active health alerts. Keep up with your nutrition goals!
            </p>
            <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
              <Link to="/Dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Active Alerts ({activeAlerts.length})
          </h2>
          {activeAlerts.map((alert) => (
            <Card
              key={alert.id}
              className={`border-2 ${getSeverityColor(alert.severity)}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{alert.message}</CardTitle>
                        <Badge className={getSeverityBadgeColor(alert.severity)}>
                          {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                        </Badge>
                      </div>
                      <CardDescription>{alert.alert_type.replace(/_/g, ' ')}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {alert.current_metric && (
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <p className="text-sm font-medium text-slate-700">Current Status</p>
                    <p className="text-base text-slate-900 mt-1">{alert.current_metric}</p>
                  </div>
                )}

                {alert.recommended_action && (
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <p className="text-sm font-medium text-slate-700">Recommended Action</p>
                    <p className="text-base text-slate-900 mt-1">{alert.recommended_action}</p>
                  </div>
                )}

                {alert.suggested_foods && alert.suggested_foods.length > 0 && (
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <p className="text-sm font-medium text-slate-700 mb-2">Suggested Foods</p>
                    <div className="flex flex-wrap gap-2">
                      {alert.suggested_foods.map((food, idx) => (
                        <Badge key={idx} variant="outline">
                          {food}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {alert.lab_reference && (
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <p className="text-sm font-medium text-slate-700">Lab Reference</p>
                    <div className="mt-1 text-sm text-slate-600">
                      <p>
                        <strong>{alert.lab_reference.marker_name}:</strong> {alert.lab_reference.value}
                      </p>
                      <p className="text-xs mt-1">
                        Tested: {new Date(alert.lab_reference.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => acknowledgeAlertMutation(alert.id, alert.acknowledged)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Mark as Addressed
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="flex-1"
                  >
                    <Link to="/LabResults">View Lab Results</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Acknowledged Alerts */}
      {acknowledgedAlerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Acknowledged Alerts ({acknowledgedAlerts.length})
          </h2>
          {acknowledgedAlerts.map((alert) => (
            <Card
              key={alert.id}
              className="border-slate-200 opacity-75"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-1" />
                    <div className="flex-1">
                      <CardTitle className="text-base">{alert.message}</CardTitle>
                      <CardDescription className="text-xs">
                        Acknowledged {new Date(alert.acknowledged_date).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => acknowledgeAlertMutation(alert.id, alert.acknowledged)}
                  variant="outline"
                  size="sm"
                >
                  Mark as Active Again
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}