import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle, Lightbulb, Check, X, ChevronDown, ChevronUp } from 'lucide-react';

const SEVERITY_CONFIG = {
  urgent: { color: 'border-red-300 bg-red-50', icon: AlertCircle, textColor: 'text-red-900', badge: 'bg-red-100 text-red-800' },
  warning: { color: 'border-orange-300 bg-orange-50', icon: AlertTriangle, textColor: 'text-orange-900', badge: 'bg-orange-100 text-orange-800' },
  advisory: { color: 'border-yellow-300 bg-yellow-50', icon: Lightbulb, textColor: 'text-yellow-900', badge: 'bg-yellow-100 text-yellow-800' },
};

export default function HealthAlertsCard() {
  const [expandedAlert, setExpandedAlert] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['healthAlerts', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.HealthAlert.filter(
        { user_email: user.email, acknowledged: false },
        '-created_date',
        10
      );
    },
    enabled: !!user?.email,
  });

  const acknowledgeAlert = useMutation({
    mutationFn: (alertId) =>
      base44.entities.HealthAlert.update(alertId, {
        acknowledged: true,
        acknowledged_date: new Date().toISOString().split('T')[0],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['healthAlerts'] });
      setExpandedAlert(null);
    },
  });

  const updateMealPlan = useMutation({
    mutationFn: async (alert) => {
      // Mark alert as actioned
      await base44.entities.HealthAlert.update(alert.id, {
        action_taken: 'updated_meal_plan',
        acknowledged: true,
      });
      
      // Here you could trigger meal plan adjustment
      // For now, just acknowledge
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['healthAlerts'] });
      setExpandedAlert(null);
    },
  });

  if (isLoading) {
    return null;
  }

  if (alerts.length === 0) {
    return null;
  }

  return (
    <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Health Alerts</CardTitle>
            <CardDescription>Proactive insights based on your eating patterns</CardDescription>
          </div>
          <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-800">
            {alerts.length} active
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => {
          const config = SEVERITY_CONFIG[alert.severity];
          const Icon = config.icon;
          const isExpanded = expandedAlert === alert.id;

          return (
            <div
              key={alert.id}
              className={`rounded-lg border-2 p-4 transition-all ${config.color}`}
            >
              <div
                onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                className="cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.textColor}`} />
                    <div className="flex-1">
                      <p className={`font-semibold ${config.textColor}`}>{alert.message}</p>
                      <p className="text-sm mt-1 opacity-75">{alert.current_metric}</p>
                    </div>
                  </div>
                  <span className={`badge ${config.badge} px-2 py-1 rounded text-xs font-semibold capitalize`}>
                    {alert.severity}
                  </span>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className={`mt-4 pt-4 border-t-2 ${config.color === 'border-red-300 bg-red-50' ? 'border-red-200' : config.color === 'border-orange-300 bg-orange-50' ? 'border-orange-200' : 'border-yellow-200'}`}>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase opacity-60 mb-1">Recommended Action</p>
                      <p className="text-sm">{alert.recommended_action}</p>
                    </div>

                    {alert.suggested_foods?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase opacity-60 mb-2">Try These Foods</p>
                        <div className="flex flex-wrap gap-2">
                          {alert.suggested_foods.slice(0, 5).map((food) => (
                            <span
                              key={food}
                              className="inline-block bg-white/60 px-2 py-1 rounded text-xs capitalize"
                            >
                              {food}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {alert.lab_reference && (
                      <div className="bg-white/40 rounded p-2 text-xs">
                        <p className="font-semibold mb-1">{alert.lab_reference.marker_name}</p>
                        <p>Last result: <strong>{alert.lab_reference.value}</strong> ({alert.lab_reference.date})</p>
                        <p className="mt-1 italic">Trending {alert.predicted_direction?.replace(/_/g, ' ')}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1"
                        onClick={() => updateMealPlan.mutate(alert)}
                        disabled={updateMealPlan.isPending}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Got it, update my plan
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acknowledgeAlert.mutate(alert.id)}
                        disabled={acknowledgeAlert.isPending}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}