import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Loader2, Activity, TrendingUp, FileText, MessageSquare, Plus } from 'lucide-react';

export default function ClientDetailView({ clientId, client, onBack, onCreatePlan, onMessage }) {
  const { data: labResults = [], isLoading: labLoading } = useQuery({
    queryKey: ['clientLabResults', client?.client_email],
    queryFn: async () => {
      if (!client?.client_email) return [];
      return await base44.entities.LabResult.filter({
        created_by: client.client_email
      });
    },
    enabled: !!client?.client_email
  });

  const { data: nutritionLogs = [] } = useQuery({
    queryKey: ['clientNutritionLogs', client?.client_email],
    queryFn: async () => {
      if (!client?.client_email) return [];
      return await base44.entities.NutritionLog.filter({
        created_by: client.client_email
      });
    },
    enabled: !!client?.client_email
  });

  const { data: mealPlan } = useQuery({
    queryKey: ['clientMealPlan', client?.current_meal_plan_id],
    queryFn: async () => {
      if (!client?.current_meal_plan_id) return null;
      const plans = await base44.entities.MealPlan.list();
      return plans.find(p => p.id === client.current_meal_plan_id);
    },
    enabled: !!client?.current_meal_plan_id
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['practitionerNotes', client?.id],
    queryFn: async () => {
      if (!client?.client_email) return [];
      const user = await base44.auth.me();
      return await base44.entities.PractitionerNote.filter({
        practitioner_email: user.email,
        client_email: client.client_email
      });
    },
    enabled: !!client?.client_email
  });

  const lastSevenDays = nutritionLogs.filter(log => {
    const logDate = new Date(log.log_date);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return logDate >= sevenDaysAgo;
  });

  const avgCalories = lastSevenDays.length > 0
    ? Math.round(lastSevenDays.reduce((sum, log) => sum + (log.calories || 0), 0) / lastSevenDays.length)
    : 0;

  if (!client) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900">{client.client_name}</h2>
          <p className="text-slate-600">{client.client_email}</p>
        </div>
        <Badge className={client.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
          {client.subscription_status}
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              <span className="text-2xl font-bold text-slate-900">{client.health_score ?? '—'}</span>
            </div>
            <p className="text-sm text-slate-600">Health Score</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold text-slate-900">{client.meal_plan_adherence_week || 0}%</span>
            </div>
            <p className="text-sm text-slate-600">Week Adherence</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-slate-900">{avgCalories}</span>
              <span className="text-xs text-slate-500">kcal</span>
            </div>
            <p className="text-sm text-slate-600">Avg Daily Calories (7d)</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span className="text-2xl font-bold text-slate-900">{labResults.length}</span>
            </div>
            <p className="text-sm text-slate-600">Lab Results</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="labs">Lab Results</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          <TabsTrigger value="plan">Meal Plan</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Client Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Last Active</label>
                <p className="text-slate-900">
                  {client.last_active_date ? new Date(client.last_active_date).toLocaleDateString() : 'Never'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Subscription Status</label>
                <Badge className={client.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                  {client.subscription_status}
                </Badge>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Data Consent</label>
                <Badge className={client.data_consent ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                  {client.data_consent ? 'Consented' : 'Not Consented'}
                </Badge>
              </div>

              <Separator />

              <div className="flex gap-2 pt-4">
                <Button onClick={() => onCreatePlan(client)} className="flex-1 gap-2">
                  <Plus className="w-4 h-4" />
                  Create Meal Plan
                </Button>
                <Button onClick={() => onMessage(client)} variant="outline" className="flex-1 gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Send Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lab Results Tab */}
        <TabsContent value="labs">
          <Card>
            <CardHeader>
              <CardTitle>Lab Results History</CardTitle>
            </CardHeader>
            <CardContent>
              {labLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                </div>
              ) : labResults.length === 0 ? (
                <p className="text-slate-600 text-center py-8">No lab results uploaded</p>
              ) : (
                <div className="space-y-3">
                  {labResults.map(result => (
                    <div key={result.id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{result.lab_name || 'Lab Result'}</p>
                          <p className="text-sm text-slate-600 mt-1">
                            {new Date(result.test_date || result.created_date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline">View</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Nutrition Tab */}
        <TabsContent value="nutrition">
          <Card>
            <CardHeader>
              <CardTitle>Recent Nutrition Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {nutritionLogs.length === 0 ? (
                <p className="text-slate-600 text-center py-8">No nutrition logs</p>
              ) : (
                <div className="space-y-3">
                  {nutritionLogs.slice(0, 10).map(log => (
                    <div key={log.id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{log.recipe_name}</p>
                          <div className="flex gap-4 mt-2 text-xs text-slate-600">
                            <span>{log.calories} kcal</span>
                            <span>P: {log.protein}g</span>
                            <span>C: {log.carbs}g</span>
                            <span>F: {log.fat}g</span>
                          </div>
                        </div>
                        <span className="text-sm text-slate-500">
                          {new Date(log.log_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meal Plan Tab */}
        <TabsContent value="plan">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Current Meal Plan</CardTitle>
                <Button onClick={() => onCreatePlan(client)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  New Plan
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {mealPlan ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Plan Name</label>
                    <p className="text-slate-900 font-medium">{mealPlan.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Created</label>
                    <p className="text-slate-600">{new Date(mealPlan.created_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Duration</label>
                    <p className="text-slate-600">{mealPlan.duration || 'Not specified'}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-600 mb-4">No meal plan assigned</p>
                  <Button onClick={() => onCreatePlan(client)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create One Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Private Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <p className="text-slate-600 text-center py-8">No notes yet</p>
              ) : (
                <div className="space-y-3">
                  {notes.map(note => (
                    <div key={note.id} className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="secondary" className="text-xs">{note.note_type}</Badge>
                        <span className="text-xs text-slate-500">
                          {new Date(note.created_date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-700 text-sm">{note.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}