import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Share2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function ShareMealDialog({ meal, mealType, open, onOpenChange }) {
  const [shareForm, setShareForm] = useState({ description: '', tags: '' });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const shareMealMutation = useMutation({
    mutationFn: (data) => base44.entities.SharedRecipe.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedRecipes'] });
      toast.success('Recipe shared with the community!');
      onOpenChange(false);
      setShareForm({ description: '', tags: '' });
    },
  });

  React.useEffect(() => {
    if (meal && open) {
      setShareForm({
        description: '',
        tags: ''
      });
    }
  }, [meal, open]);

  const handleShare = () => {
    if (!meal || !mealType) {
      toast.error('Missing meal information');
      return;
    }

    shareMealMutation.mutate({
      name: meal.name,
      meal_type: mealType,
      description: shareForm.description,
      meal_data: meal,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      image_url: meal.imageUrl || '',
      tags: shareForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      author_name: user?.full_name || 'Anonymous',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{meal?.name}" Recipe</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {meal?.imageUrl && (
            <img
              src={meal.imageUrl}
              alt={meal.name}
              className="w-full h-48 object-cover rounded-lg"
            />
          )}
          <div>
            <Label>Description (Optional)</Label>
            <Textarea
              placeholder="Why do you love this recipe? Any tips or modifications?"
              value={shareForm.description}
              onChange={(e) => setShareForm({ ...shareForm, description: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <Label>Tags (comma-separated)</Label>
            <Input
              placeholder="e.g., quick, protein-rich, kid-friendly"
              value={shareForm.tags}
              onChange={(e) => setShareForm({ ...shareForm, tags: e.target.value })}
            />
          </div>
          <Button onClick={handleShare} className="w-full" disabled={shareMealMutation.isPending}>
            {shareMealMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 mr-2" />
                Share Recipe with Community
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}