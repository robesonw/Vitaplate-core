import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Trash2, Eye, Heart, Share2, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import PlanDetailsView from '../components/plans/PlanDetailsView';
import FavoriteMealsPanel from '../components/meals/FavoriteMealsPanel';
import SharePlanDialog from '../components/share/SharePlanDialog';
import MealKitOffer from '../components/meals/MealKitOffer';
import SyncToCalendarDialog from '../components/meals/SyncToCalendarDialog';

export default function MealPlans() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [planToShare, setPlanToShare] = useState(null);
  const [exportingPlanId, setExportingPlanId] = useState(null);
  const [syncCalendarDialogOpen, setSyncCalendarDialogOpen] = useState(false);
  const [planToSync, setPlanToSync] = useState(null);

  const queryClient = useQueryClient();

  const { data: mealPlans = [], isLoading } = useQuery({
    queryKey: ['mealPlans'],
    queryFn: () => base44.entities.MealPlan.list('-created_date'),
    initialData: [],
  });

  const deletePlanMutation = useMutation({
    mutationFn: (planId) => base44.entities.MealPlan.delete(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      toast.success('Meal plan deleted');
    },
  });

  const handleViewPlan = (plan) => {
    setSelectedPlan(plan);
    setViewDialogOpen(true);
  };

  const handleSharePlan = (plan) => {
    setPlanToShare(plan);
    setShareDialogOpen(true);
  };

  const handleSyncToCalendar = (plan) => {
    setPlanToSync(plan);
    setSyncCalendarDialogOpen(true);
  };

  const handleExportPDF = async (plan) => {
    setExportingPlanId(plan.id);
    try {
      const response = await base44.functions.invoke('exportMealPlanPDF', { planId: plan.id });
      // response.data is a Blob-compatible object; treat as arraybuffer
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${plan.name || 'meal-plan'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF exported!');
    } catch (e) {
      toast.error('Failed to export PDF');
    } finally {
      setExportingPlanId(null);
    }
  };

  // Expose handleViewPlan globally for FavoriteMealDetailDialog
  useEffect(() => {
    window.openMealPlanById = (planId) => {
      const plan = mealPlans.find(p => p.id === planId);
      if (plan) {
        handleViewPlan(plan);
      } else {
        toast.error('Meal plan not found');
      }
    };
    return () => {
      delete window.openMealPlanById;
    };
  }, [mealPlans]);

  const dietColors = {
    'liver-centric': 'bg-rose-100 text-rose-700 border-rose-200',
    'low-sugar': 'bg-amber-100 text-amber-700 border-amber-200',
    'vegetarian': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'custom': 'bg-purple-100 text-purple-700 border-purple-200',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Meal Plans & Favorites</h1>
        <p className="text-slate-600 mt-1">
          View your saved meal plans and favorite meals
        </p>
      </div>

      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList>
          <TabsTrigger value="plans">
            <Calendar className="w-4 h-4 mr-2" />
            My Plans
          </TabsTrigger>
          <TabsTrigger value="favorites">
            <Heart className="w-4 h-4 mr-2" />
            Favorites
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6">
          {mealPlans.length === 0 ? (
        <Card className="border-slate-200 border-dashed">
          <CardContent className="p-12 text-center">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Meal Plans Yet
            </h3>
            <p className="text-slate-600">
              Create your first meal plan in the Health Diet Hub
            </p>
          </CardContent>
          </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mealPlans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base mb-2">{plan.name}</CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className={`${dietColors[plan.diet_type]} border capitalize`}>
                          {plan.diet_type?.replace(/-/g, ' ')}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {plan.days?.length || 0} days
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-slate-500 mb-4">
                    Created {new Date(plan.created_date).toLocaleDateString()}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewPlan(plan)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      title="Sync to Google Calendar"
                      onClick={() => handleSyncToCalendar(plan)}
                    >
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSharePlan(plan)}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportPDF(plan)}
                      disabled={exportingPlanId === plan.id}
                      title="Export PDF"
                    >
                      {exportingPlanId === plan.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Download className="w-4 h-4 text-indigo-600" />
                      }
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deletePlanMutation.mutate(plan.id)}
                      disabled={deletePlanMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            ))}
          </div>
        )}
        </TabsContent>

        <TabsContent value="favorites">
          <FavoriteMealsPanel />
        </TabsContent>
      </Tabs>

      <PlanDetailsView
        plan={selectedPlan}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        mealKitOffer={<MealKitOffer mealPlan={selectedPlan} />}
      />

      <SharePlanDialog
        plan={planToShare}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
      />

      <SyncToCalendarDialog
        open={syncCalendarDialogOpen}
        onOpenChange={setSyncCalendarDialogOpen}
        mealPlan={planToSync}
        onSuccess={() => {
          toast.success('Meal plan synced to Google Calendar!');
          setSyncCalendarDialogOpen(false);
        }}
      />
    </div>
  );
}