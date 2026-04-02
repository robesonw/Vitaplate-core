import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Share2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function SharePlanDialog({ plan, open, onOpenChange }) {
  const [shareForm, setShareForm] = useState({ title: '', description: '', tags: '' });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const sharePlanMutation = useMutation({
    mutationFn: (data) => base44.entities.SharedMealPlan.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedMealPlans'] });
      toast.success('Meal plan shared with the community!');
      onOpenChange(false);
      setShareForm({ title: '', description: '', tags: '' });
    },
  });

  const handleOpenChange = (newOpen) => {
    onOpenChange(newOpen);
    if (newOpen && plan) {
      setShareForm({
        title: plan.name || '',
        description: '',
        tags: ''
      });
    }
  };

  const handleShare = () => {
    if (!plan || !shareForm.title) {
      toast.error('Please fill in required fields');
      return;
    }

    sharePlanMutation.mutate({
      original_plan_id: plan.id,
      title: shareForm.title,
      description: shareForm.description,
      plan_data: plan,
      diet_type: plan.diet_type,
      cultural_style: plan.cultural_style,
      tags: shareForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      author_name: user?.full_name || 'Anonymous',
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Meal Plan with Community</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input
              placeholder="Give it a catchy title..."
              value={shareForm.title}
              onChange={(e) => setShareForm({ ...shareForm, title: e.target.value })}
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              placeholder="Tell others why this plan works for you..."
              value={shareForm.description}
              onChange={(e) => setShareForm({ ...shareForm, description: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <Label>Tags (comma-separated)</Label>
            <Input
              placeholder="e.g., high-protein, budget-friendly, quick"
              value={shareForm.tags}
              onChange={(e) => setShareForm({ ...shareForm, tags: e.target.value })}
            />
          </div>
          <Button onClick={handleShare} className="w-full" disabled={sharePlanMutation.isPending}>
            {sharePlanMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 mr-2" />
                Share with Community
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}