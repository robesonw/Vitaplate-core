import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Eye, Clock, Flame, ChefHat } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function AdminRecipeModeration() {
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [moderationNotes, setModerationNotes] = useState('');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['allSharedRecipes'],
    queryFn: () => base44.entities.SharedRecipe.list('-created_date'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }) => 
      base44.entities.SharedRecipe.update(id, { status, moderation_notes: notes }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['allSharedRecipes'] });
      queryClient.invalidateQueries({ queryKey: ['sharedRecipes'] });
      toast.success(`Recipe ${variables.status}`);
      setSelectedRecipe(null);
      setModerationNotes('');
      
      // Notify recipe author
      const recipe = recipes.find(r => r.id === variables.id);
      if (recipe?.created_by) {
        base44.entities.Notification.create({
          recipient_email: recipe.created_by,
          type: variables.status === 'approved' ? 'recipe_approved' : 'recipe_rejected',
          title: `Recipe ${variables.status === 'approved' ? 'Approved' : 'Rejected'}`,
          message: `Your recipe "${recipe.name}" has been ${variables.status}. ${variables.notes || ''}`,
          actor_name: 'Admin Team',
        });
      }
    },
  });

  const handleApprove = (recipe) => {
    updateStatusMutation.mutate({
      id: recipe.id,
      status: 'approved',
      notes: moderationNotes
    });
  };

  const handleReject = (recipe) => {
    updateStatusMutation.mutate({
      id: recipe.id,
      status: 'rejected',
      notes: moderationNotes
    });
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Access denied. Admin only.</p>
      </div>
    );
  }

  const pendingRecipes = recipes.filter(r => r.status === 'pending');
  const approvedRecipes = recipes.filter(r => r.status === 'approved');
  const rejectedRecipes = recipes.filter(r => r.status === 'rejected');

  const RecipeCard = ({ recipe }) => (
    <Card className="border-slate-200 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {recipe.image_url && (
            <img
              src={recipe.image_url}
              alt={recipe.name}
              className="w-24 h-24 object-cover rounded-lg"
            />
          )}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-slate-900">{recipe.name}</h3>
                <p className="text-xs text-slate-500">
                  by {recipe.author_name} • {formatDistanceToNow(new Date(recipe.created_date), { addSuffix: true })}
                </p>
              </div>
              <Badge
                className={
                  recipe.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  recipe.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-rose-100 text-rose-700'
                }
              >
                {recipe.status}
              </Badge>
            </div>
            <p className="text-sm text-slate-600 mb-2 line-clamp-2">{recipe.description}</p>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge variant="outline" className="capitalize text-xs">
                {recipe.meal_type}
              </Badge>
              {recipe.cuisine && <Badge variant="secondary" className="text-xs">{recipe.cuisine}</Badge>}
              {recipe.difficulty && (
                <Badge variant="outline" className="text-xs">
                  <ChefHat className="w-3 h-3 mr-1" />
                  {recipe.difficulty}
                </Badge>
              )}
              {recipe.calories && (
                <Badge variant="outline" className="text-xs">
                  <Flame className="w-3 h-3 mr-1 text-orange-500" />
                  {recipe.calories}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedRecipe(recipe)}
              >
                <Eye className="w-3 h-3 mr-1" />
                Review
              </Button>
              {recipe.status === 'pending' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedRecipe(recipe);
                      setTimeout(() => handleApprove(recipe), 100);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setSelectedRecipe(recipe)}
                    variant="destructive"
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Recipe Moderation</h1>
        <p className="text-slate-600 mt-1">Review and moderate community-submitted recipes</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700 font-medium">Pending Review</p>
                <p className="text-3xl font-bold text-amber-900">{pendingRecipes.length}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-700 font-medium">Approved</p>
                <p className="text-3xl font-bold text-emerald-900">{approvedRecipes.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-rose-700 font-medium">Rejected</p>
                <p className="text-3xl font-bold text-rose-900">{rejectedRecipes.length}</p>
              </div>
              <XCircle className="w-8 h-8 text-rose-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingRecipes.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedRecipes.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedRecipes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {pendingRecipes.length === 0 ? (
            <Card className="border-slate-200">
              <CardContent className="p-12 text-center">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-600">No pending recipes</p>
              </CardContent>
            </Card>
          ) : (
            pendingRecipes.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} />)
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4 mt-6">
          {approvedRecipes.length === 0 ? (
            <Card className="border-slate-200">
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-600">No approved recipes</p>
              </CardContent>
            </Card>
          ) : (
            approvedRecipes.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} />)
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4 mt-6">
          {rejectedRecipes.length === 0 ? (
            <Card className="border-slate-200">
              <CardContent className="p-12 text-center">
                <XCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-600">No rejected recipes</p>
              </CardContent>
            </Card>
          ) : (
            rejectedRecipes.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} />)
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={!!selectedRecipe} onOpenChange={(open) => !open && setSelectedRecipe(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedRecipe && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedRecipe.name}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {selectedRecipe.image_url && (
                  <img
                    src={selectedRecipe.image_url}
                    alt={selectedRecipe.name}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Submitted by</p>
                    <p className="font-medium">{selectedRecipe.author_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Submitted</p>
                    <p className="font-medium">
                      {formatDistanceToNow(new Date(selectedRecipe.created_date), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-600 mb-1">Description</p>
                  <p className="text-slate-900">{selectedRecipe.description}</p>
                </div>

                {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Ingredients</p>
                    <ul className="space-y-1">
                      {selectedRecipe.ingredients.map((ing, idx) => (
                        <li key={idx} className="text-sm text-slate-600">• {ing}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedRecipe.prep_steps && selectedRecipe.prep_steps.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Preparation Steps</p>
                    <ol className="space-y-2">
                      {selectedRecipe.prep_steps.map((step, idx) => (
                        <li key={idx} className="text-sm text-slate-600 flex gap-2">
                          <span className="font-medium">{idx + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {selectedRecipe.status === 'pending' && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">Moderation Notes (optional)</p>
                      <Textarea
                        value={moderationNotes}
                        onChange={(e) => setModerationNotes(e.target.value)}
                        placeholder="Add any notes for the submitter..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(selectedRecipe)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        disabled={updateStatusMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Recipe
                      </Button>
                      <Button
                        onClick={() => handleReject(selectedRecipe)}
                        variant="destructive"
                        className="flex-1"
                        disabled={updateStatusMutation.isPending}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Recipe
                      </Button>
                    </div>
                  </>
                )}

                {selectedRecipe.moderation_notes && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium text-slate-700 mb-1">Moderation Notes</p>
                    <p className="text-sm text-slate-600">{selectedRecipe.moderation_notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}