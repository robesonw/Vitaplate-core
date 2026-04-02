import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Flame, Clock, ChefHat, Wrench, ThumbsUp, MessageCircle, Send, Heart, Utensils, Calendar, Sparkles, ShoppingCart, RefreshCw, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import ReviewSection from '../reviews/ReviewSection';

export default function SharedRecipeDetailDialog({ recipe, open, onOpenChange, comments: allComments = [] }) {
  const [newComment, setNewComment] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [localRecipe, setLocalRecipe] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (recipe) setLocalRecipe(recipe);
  }, [recipe]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const addCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.RecipeComment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipeComments'] });
      setNewComment('');
      toast.success('Comment added!');
      
      // Notify recipe author
      if (recipe.created_by && recipe.created_by !== user?.email) {
        base44.entities.Notification.create({
          recipient_email: recipe.created_by,
          type: 'recipe_comment',
          title: 'New Comment',
          message: `${user?.full_name || 'Someone'} commented on your recipe "${recipe.name}"`,
          actor_name: user?.full_name || 'Anonymous',
        });
      }
    },
  });

  const likeMutation = useMutation({
    mutationFn: () => base44.entities.UserInteraction.create({
      target_id: localRecipe.id,
      target_type: 'shared_recipe',
      interaction_type: 'like',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedRecipes'] });
      toast.success('Liked!');
      
      // Notify recipe author
      if (localRecipe.created_by && localRecipe.created_by !== user?.email) {
        base44.entities.Notification.create({
          recipient_email: localRecipe.created_by,
          type: 'recipe_like',
          title: 'Recipe Liked',
          message: `${user?.full_name || 'Someone'} liked your recipe "${localRecipe.name}"`,
          actor_name: user?.full_name || 'Anonymous',
        });
      }
    },
  });

  const regenerateGroceryList = async () => {
    setRegenerating(true);
    try {
      const ingredientNames = meal.ingredients || localRecipe.ingredients || [];
      
      const priceData = await base44.integrations.Core.InvokeLLM({
        prompt: `For these ingredients: ${ingredientNames.join(', ')}. Provide current average grocery prices in USD per typical package/unit from major US grocery stores. Categorize them into: Proteins, Vegetables, Fruits, Grains, Dairy/Alternatives, Spices/Condiments, Other.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            categories: {
              type: "object",
              additionalProperties: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    price: { type: "number" },
                    unit: { type: "string" },
                    quantity: { type: "number" }
                  }
                }
              }
            }
          }
        }
      });
      
      if (priceData?.categories) {
        const totalCost = Object.values(priceData.categories).flat().reduce(
          (sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0
        );
        
        if (isFromFavorites) {
          await base44.entities.FavoriteMeal.update(localRecipe.id, {
            grocery_list: priceData.categories,
            estimated_cost: totalCost
          });
        }
        
        setLocalRecipe({
          ...localRecipe,
          grocery_list: priceData.categories,
          estimated_cost: totalCost
        });
        
        queryClient.invalidateQueries({ queryKey: ['favoriteMeals'] });
        toast.success('Grocery list updated!');
      }
    } catch (error) {
      toast.error('Failed to generate grocery list');
    } finally {
      setRegenerating(false);
    }
  };

  const saveToGroceryLists = async () => {
    try {
      await base44.entities.GroceryList.create({
        name: `${localRecipe.name} - Grocery List`,
        items: localRecipe.grocery_list || {},
        total_cost: localRecipe.estimated_cost || 0,
        notes: `Grocery list for ${localRecipe.name}`
      });
      
      toast.success('Saved to Grocery Lists!');
    } catch (error) {
      toast.error('Failed to save to grocery lists');
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    addCommentMutation.mutate({
      recipe_id: recipe.id,
      comment: newComment,
      author_name: user?.full_name || 'Anonymous',
    });
  };

  if (!localRecipe) return null;

  const recipeComments = allComments.filter(c => c.recipe_id === localRecipe.id);
  const meal = localRecipe.meal_data || {};
  const isFromFavorites = localRecipe.source === 'favorite';
  
  const mealIcons = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snacks: '🍎'
  };

  const difficultyColors = {
    Easy: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Medium: 'bg-amber-100 text-amber-700 border-amber-200',
    Hard: 'bg-rose-100 text-rose-700 border-rose-200'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{mealIcons[localRecipe.meal_type]}</span>
            <div>
              <DialogTitle className="text-xl">{localRecipe.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="capitalize">
                  {localRecipe.meal_type}
                </Badge>
                {localRecipe.cuisine && <Badge variant="secondary">{localRecipe.cuisine}</Badge>}
                {meal.difficulty && (
                  <Badge className={difficultyColors[meal.difficulty] || ''}>
                    {meal.difficulty}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="preparation">Preparation</TabsTrigger>
            <TabsTrigger value="grocery">Grocery</TabsTrigger>
            <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
            <TabsTrigger value="comments">Comments ({recipeComments.length})</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Source Reference */}
            {isFromFavorites && (
              <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center gap-2">
                <Heart className="w-4 h-4 text-indigo-600" />
                <div>
                  <p className="text-xs font-medium text-indigo-900">From Your Favorites</p>
                  {recipe.source_type && (
                    <p className="text-xs text-indigo-700">
                      {recipe.source_type === 'meal_plan' && 'Saved from Meal Plan'}
                      {recipe.source_type === 'ai_recipe' && 'AI Generated Recipe'}
                      {recipe.source_type === 'shared_recipe' && 'Community Recipe'}
                    </p>
                  )}
                </div>
              </div>
            )}

            {!isFromFavorites && localRecipe.author_name && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-slate-600" />
                <div>
                  <p className="text-xs font-medium text-slate-700">Shared by</p>
                  <p className="text-sm text-slate-900">{localRecipe.author_name}</p>
                </div>
              </div>
            )}

            {/* Image */}
            {(localRecipe.image_url || meal.imageUrl) && (
              <div className="rounded-lg overflow-hidden">
                <img
                  src={localRecipe.image_url || meal.imageUrl}
                  alt={localRecipe.name}
                  className="w-full h-64 object-cover"
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-lg">
              {(localRecipe.prepTime || meal.prepTime) && (
                <div className="text-center">
                  <Clock className="w-4 h-4 text-slate-600 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-slate-900">{localRecipe.prepTime || meal.prepTime}</div>
                  <div className="text-xs text-slate-600">Prep Time</div>
                </div>
              )}
              {(localRecipe.cooking_time || meal.cooking_time) && (
                <div className="text-center">
                  <Utensils className="w-4 h-4 text-slate-600 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-slate-900">{localRecipe.cooking_time || meal.cooking_time}</div>
                  <div className="text-xs text-slate-600">Cook Time</div>
                </div>
              )}
              {(localRecipe.difficulty || meal.difficulty) && (
                <div className="text-center">
                  <ChefHat className="w-4 h-4 text-slate-600 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-slate-900">{localRecipe.difficulty || meal.difficulty}</div>
                  <div className="text-xs text-slate-600">Difficulty</div>
                </div>
              )}
              {recipe.calories && (
                <div className="text-center">
                  <Flame className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-slate-900">{localRecipe.calories}</div>
                  <div className="text-xs text-slate-600">Calories</div>
                </div>
              )}
            </div>

            {/* Health Benefits */}
            {(meal.healthBenefit || localRecipe.healthBenefit) && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <h3 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Health Benefits
                </h3>
                <p className="text-sm text-emerald-700">{meal.healthBenefit || localRecipe.healthBenefit}</p>
              </div>
            )}

            {/* Prep Tip */}
            {(meal.prepTip || localRecipe.description) && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="font-semibold text-amber-900 mb-2">Chef's Tips</h3>
                <p className="text-sm text-amber-700 whitespace-pre-line">{meal.prepTip || localRecipe.description}</p>
              </div>
            )}

            {/* Nutrients */}
            {(meal.nutrients || localRecipe.nutrients) && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-1">🌟 Key Nutrients</p>
                <p className="text-sm text-blue-800">{meal.nutrients || localRecipe.nutrients}</p>
              </div>
            )}

            {/* Tags */}
            {localRecipe.tags && localRecipe.tags.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">🏷️ Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {localRecipe.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {!isFromFavorites && (
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => likeMutation.mutate()} disabled={likeMutation.isPending}>
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Like ({localRecipe.likes_count || 0})
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="preparation" className="space-y-4">
            {/* Ingredients */}
            {(meal.ingredients || localRecipe.ingredients) && (meal.ingredients?.length > 0 || localRecipe.ingredients?.length > 0) && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Ingredients</h3>
                <ul className="space-y-2">
                  {(meal.ingredients || localRecipe.ingredients).map((ingredient, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-slate-700">{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(meal.prepSteps || localRecipe.prepSteps) && (meal.prepSteps?.length > 0 || localRecipe.prepSteps?.length > 0) && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Preparation Steps</h3>
                  <ol className="space-y-3">
                    {(meal.prepSteps || localRecipe.prepSteps).map((step, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 text-white text-sm flex items-center justify-center font-medium">
                          {idx + 1}
                        </span>
                        <p className="text-sm text-slate-700 flex-1 pt-1">{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </>
            )}

            {(meal.equipment || localRecipe.equipment) && (meal.equipment?.length > 0 || localRecipe.equipment?.length > 0) && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    Equipment Needed
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(meal.equipment || localRecipe.equipment).map((item, idx) => (
                      <Badge key={idx} variant="secondary">{item}</Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="grocery" className="space-y-4">
            {localRecipe.grocery_list && Object.keys(localRecipe.grocery_list).length > 0 ? (
              <>
                <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-semibold text-indigo-900">Grocery List</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {localRecipe.estimated_cost && (
                      <div className="text-right">
                        <div className="text-xs text-indigo-600">Estimated Total</div>
                        <div className="text-xl font-bold text-indigo-700">
                          ${localRecipe.estimated_cost.toFixed(2)}
                        </div>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={saveToGroceryLists}
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Save to Lists
                    </Button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(localRecipe.grocery_list).map(([category, items]) => (
                    items && items.length > 0 && (
                      <div key={category} className="p-4 bg-slate-50 rounded-lg">
                        <h4 className="text-sm font-semibold text-slate-700 mb-3">
                          {category}
                        </h4>
                        <ul className="space-y-2">
                          {items.map((item, idx) => (
                            <li key={idx} className="flex items-center justify-between text-sm">
                              <span className="text-slate-700">
                                {item.quantity && item.quantity !== 1 ? `${item.quantity}x ` : ''}
                                {item.name}
                              </span>
                              {item.price && (
                                <span className="text-xs font-medium text-slate-600">
                                  ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  ))}
                </div>

                <p className="text-xs text-slate-500 text-center">
                  *Prices may vary by location and season
                </p>
              </>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-slate-500 mb-4">No detailed grocery list available</p>
                {(meal.ingredients || localRecipe.ingredients) && (meal.ingredients?.length > 0 || localRecipe.ingredients?.length > 0) ? (
                  <>
                    <Button
                      onClick={regenerateGroceryList}
                      disabled={regenerating}
                      className="mb-4"
                    >
                      {regenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Generate Grocery List
                        </>
                      )}
                    </Button>
                    <div className="mt-4 text-left max-w-md mx-auto">
                      <p className="text-sm font-medium text-slate-700 mb-2">Ingredients needed:</p>
                      <ul className="space-y-1">
                        {(meal.ingredients || localRecipe.ingredients).map((ing, idx) => (
                          <li key={idx} className="text-sm text-slate-600">• {ing}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-400">No ingredients information available</p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="nutrition" className="space-y-4">
            {(localRecipe.calories || localRecipe.protein || localRecipe.carbs || localRecipe.fat) ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {localRecipe.calories && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-center">
                      <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-slate-900">{localRecipe.calories}</div>
                      <div className="text-xs text-slate-600">Calories</div>
                    </div>
                  )}
                  {localRecipe.protein && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-700">{localRecipe.protein}g</div>
                      <div className="text-xs text-slate-600">Protein</div>
                    </div>
                  )}
                  {localRecipe.carbs && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
                      <div className="text-2xl font-bold text-amber-700">{localRecipe.carbs}g</div>
                      <div className="text-xs text-slate-600">Carbs</div>
                    </div>
                  )}
                  {localRecipe.fat && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-center">
                      <div className="text-2xl font-bold text-rose-700">{localRecipe.fat}g</div>
                      <div className="text-xs text-slate-600">Fat</div>
                    </div>
                  )}
                </div>

                {(meal.nutrients || localRecipe.nutrients) && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <h3 className="font-semibold text-emerald-900 mb-2">Additional Nutrients</h3>
                    <p className="text-sm text-emerald-700">{meal.nutrients || localRecipe.nutrients}</p>
                  </div>
                )}

                {(meal.healthBenefit || localRecipe.healthBenefit) && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Health Benefits
                    </h3>
                    <p className="text-sm text-purple-700">{meal.healthBenefit || localRecipe.healthBenefit}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Flame className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p>No nutrition information available</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="comments" className="space-y-4 mt-4">
            <h4 className="font-semibold text-slate-900">Comments</h4>
            
            {/* Add Comment */}
            <div className="flex gap-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
                className="flex-1"
              />
              <Button 
                onClick={handleAddComment} 
                disabled={!newComment.trim() || addCommentMutation.isPending}
                className="self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Comments List */}
            <div className="space-y-3">
              {recipeComments.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No comments yet. Be the first to comment!</p>
              ) : (
                recipeComments.map((comment) => (
                  <Card key={comment.id} className="border-slate-200">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-medium text-sm text-slate-900">{comment.author_name}</span>
                        <span className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">{comment.comment}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4 mt-4">
            <ReviewSection targetId={localRecipe.id} targetType={isFromFavorites ? "favorite_meal" : "shared_recipe"} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}