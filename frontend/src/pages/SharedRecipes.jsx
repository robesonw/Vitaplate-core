import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChefHat, Heart, Eye, Users, TrendingUp, Search, Filter, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import SharedRecipeDetailDialog from '../components/community/SharedRecipeDetailDialog';
import RecipeRating from '../components/recipes/RecipeRating';
import SubmitRecipeDialog from '../components/community/SubmitRecipeDialog';

const mealIcons = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snacks: '🍎'
};

export default function SharedRecipes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMealType, setFilterMealType] = useState('all');
  const [filterCuisine, setFilterCuisine] = useState('all');
  const [filterDietary, setFilterDietary] = useState('all');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allSharedRecipes = [], isLoading } = useQuery({
    queryKey: ['sharedRecipes'],
    queryFn: () => base44.entities.SharedRecipe.list('-created_date'),
  });

  // Filter to show only approved recipes
  const allRecipes = allSharedRecipes.filter(r => r.status === 'approved');

  const { data: recipeComments = [] } = useQuery({
    queryKey: ['recipeComments'],
    queryFn: () => base44.entities.RecipeComment.list('-created_date'),
  });

  const { data: favoriteMeals = [] } = useQuery({
    queryKey: ['favoriteMeals'],
    queryFn: () => base44.entities.FavoriteMeal.list('-created_date'),
  });

  // Separate user's recipes from community recipes
  const myRecipes = allRecipes.filter(r => r.created_by === user?.email);
  const sharedRecipes = allRecipes.filter(r => r.created_by !== user?.email);

  const interactionMutation = useMutation({
    mutationFn: (data) => base44.entities.UserInteraction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedRecipes'] });
    },
  });

  const handleLike = (recipeId, authorEmail) => {
    interactionMutation.mutate({
      target_id: recipeId,
      target_type: 'shared_recipe',
      interaction_type: 'like',
    });
    
    if (authorEmail && authorEmail !== user?.email) {
      base44.entities.Notification.create({
        recipient_email: authorEmail,
        type: 'recipe_like',
        title: 'Recipe Liked',
        message: `${user?.full_name || 'Someone'} liked your recipe`,
        actor_name: user?.full_name || 'Anonymous',
      });
    }
    
    toast.success('Liked!');
  };

  const handleSave = (recipe) => {
    base44.entities.FavoriteMeal.create({
      name: recipe.name,
      meal_type: recipe.meal_type,
      calories: recipe.calories,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fat: recipe.fat,
      prepTip: recipe.meal_data?.tips || recipe.description,
      prepSteps: recipe.meal_data?.instructions || [],
      difficulty: recipe.meal_data?.difficulty,
      equipment: recipe.meal_data?.equipment || [],
      healthBenefit: recipe.meal_data?.health_benefits,
      imageUrl: recipe.image_url,
      source_type: 'shared_recipe',
      source_recipe_id: recipe.id,
      ingredients: recipe.meal_data?.ingredients || [],
      estimated_cost: recipe.meal_data?.estimated_cost,
    });
    
    interactionMutation.mutate({
      target_id: recipe.id,
      target_type: 'shared_recipe',
      interaction_type: 'save',
    });
    
    toast.success('Saved to favorites!');
  };

  // Combine all recipes (shared + favorites) and remove duplicates
  const allRecipesWithFavorites = [
    ...allRecipes.map(r => ({ ...r, source: 'shared' })),
    ...favoriteMeals.map(r => ({ 
      ...r, 
      source: 'favorite',
      // Normalize structure for dialog compatibility
      meal_data: r.meal_data || {
        name: r.name,
        calories: r.calories,
        protein: r.protein,
        carbs: r.carbs,
        fat: r.fat,
        prepSteps: r.prepSteps,
        prepTime: r.prepTime,
        difficulty: r.difficulty,
        equipment: r.equipment,
        healthBenefit: r.healthBenefit,
        prepTip: r.prepTip,
        imageUrl: r.imageUrl,
        ingredients: r.ingredients
      }
    }))
  ];

  // Remove duplicates: if a favorite was sourced from a shared recipe, keep only the favorite
  const uniqueRecipes = allRecipesWithFavorites.reduce((acc, recipe) => {
    // Check if this recipe is a duplicate
    const isDuplicate = acc.some(existing => {
      // Check if it's the same recipe by comparing IDs or names
      if (recipe.source === 'favorite' && recipe.source_recipe_id === existing.id) {
        return true; // Favorite sourced from this shared recipe
      }
      if (existing.source === 'favorite' && existing.source_recipe_id === recipe.id) {
        return true; // This shared recipe already exists as a favorite
      }
      // Also check for same name to catch other duplicates
      return existing.name?.toLowerCase().trim() === recipe.name?.toLowerCase().trim() &&
             existing.meal_type === recipe.meal_type;
    });

    if (!isDuplicate) {
      acc.push(recipe);
    }
    return acc;
  }, []);

  const filteredRecipes = uniqueRecipes.filter(recipe => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      recipe.name?.toLowerCase().includes(searchLower) ||
      recipe.ingredients?.some(ing => ing.toLowerCase().includes(searchLower)) ||
      recipe.tags?.some(tag => tag.toLowerCase().includes(searchLower));
    
    const matchesMealType = filterMealType === 'all' || recipe.meal_type === filterMealType;
    const matchesCuisine = filterCuisine === 'all' || recipe.cuisine?.toLowerCase() === filterCuisine.toLowerCase();
    const matchesDietary = filterDietary === 'all' || 
      recipe.tags?.some(tag => tag.toLowerCase() === filterDietary.toLowerCase());
    
    return matchesSearch && matchesMealType && matchesCuisine && matchesDietary;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Recipes</h1>
          <p className="text-slate-600 mt-1">Your saved and community-shared recipes</p>
        </div>
        <Button onClick={() => setSubmitDialogOpen(true)} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Submit Recipe
        </Button>
      </div>

      <Card className="border-slate-200">
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search by name, ingredients, tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          <div className="grid md:grid-cols-4 gap-3">
            <Select value={filterMealType} onValueChange={setFilterMealType}>
              <SelectTrigger>
                <SelectValue placeholder="Meal Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Meals</SelectItem>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snacks">Snacks</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCuisine} onValueChange={setFilterCuisine}>
              <SelectTrigger>
                <SelectValue placeholder="Cuisine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cuisines</SelectItem>
                <SelectItem value="italian">Italian</SelectItem>
                <SelectItem value="mexican">Mexican</SelectItem>
                <SelectItem value="chinese">Chinese</SelectItem>
                <SelectItem value="japanese">Japanese</SelectItem>
                <SelectItem value="indian">Indian</SelectItem>
                <SelectItem value="thai">Thai</SelectItem>
                <SelectItem value="mediterranean">Mediterranean</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterDietary} onValueChange={setFilterDietary}>
              <SelectTrigger>
                <SelectValue placeholder="Dietary" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="vegetarian">Vegetarian</SelectItem>
                <SelectItem value="vegan">Vegan</SelectItem>
                <SelectItem value="gluten-free">Gluten-Free</SelectItem>
                <SelectItem value="keto">Keto</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setFilterMealType('all');
                setFilterCuisine('all');
                setFilterDietary('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Recipes ({filteredRecipes.length})</TabsTrigger>
          <TabsTrigger value="my">My Recipes ({myRecipes.length})</TabsTrigger>
          <TabsTrigger value="community">Community ({sharedRecipes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {filteredRecipes.length === 0 ? (
            <Card className="border-slate-200 border-dashed">
              <CardContent className="p-12 text-center">
                <ChefHat className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No recipes found matching your filters</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map((recipe, index) => (
                <RecipeCard 
                  key={`${recipe.source}-${recipe.id}`}
                  recipe={recipe} 
                  index={index}
                  onLike={handleLike}
                  onSave={handleSave}
                  setSelectedRecipe={setSelectedRecipe}
                  setDetailDialogOpen={setDetailDialogOpen}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my" className="space-y-6">
          {myRecipes.length === 0 ? (
            <Card className="border-slate-200 border-dashed">
              <CardContent className="p-12 text-center">
                <ChefHat className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No Recipes Yet
                </h3>
                <p className="text-slate-600">
                  Create your first recipe using the AI Recipe Generator
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myRecipes.map((recipe, index) => (
                <RecipeCard 
                  key={recipe.id} 
                  recipe={recipe} 
                  index={index}
                  onLike={handleLike}
                  onSave={handleSave}
                  setSelectedRecipe={setSelectedRecipe}
                  setDetailDialogOpen={setDetailDialogOpen}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="community" className="space-y-6">
          {sharedRecipes.length === 0 ? (
            <Card className="border-slate-200 border-dashed">
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No Community Recipes
                </h3>
                <p className="text-slate-600">
                  Be the first to share a recipe with the community!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sharedRecipes.map((recipe, index) => (
                <RecipeCard 
                  key={recipe.id} 
                  recipe={recipe} 
                  index={index}
                  onLike={handleLike}
                  onSave={handleSave}
                  setSelectedRecipe={setSelectedRecipe}
                  setDetailDialogOpen={setDetailDialogOpen}
                />
              ))}
            </div>
          )}
        </TabsContent>

      </Tabs>

      <SharedRecipeDetailDialog
        recipe={selectedRecipe}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        comments={recipeComments}
      />

      <SubmitRecipeDialog
        open={submitDialogOpen}
        onOpenChange={setSubmitDialogOpen}
      />
    </div>
  );
}

function RecipeCard({ recipe, index, onLike, onSave, setSelectedRecipe, setDetailDialogOpen }) {
  const isFromFavorites = recipe.source === 'favorite';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="overflow-hidden border-slate-200 hover:shadow-lg transition-all cursor-pointer group"
        onClick={() => {
          setSelectedRecipe(recipe);
          setDetailDialogOpen(true);
        }}
      >
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
          {recipe.image_url ? (
            <img 
              src={recipe.image_url} 
              alt={recipe.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => e.target.style.display = 'none'}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ChefHat className="w-16 h-16 text-slate-300" />
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className="bg-white/90 backdrop-blur-sm text-slate-900 capitalize">
              {mealIcons[recipe.meal_type]} {recipe.meal_type}
            </Badge>
            {isFromFavorites && (
              <Badge className="bg-indigo-100 text-indigo-700 backdrop-blur-sm">
                ❤️ Favorite
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-lg text-slate-900 line-clamp-1">
              {recipe.name}
            </h3>
            {recipe.description && (
              <p className="text-sm text-slate-600 line-clamp-2 mt-1">
                {recipe.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">🔥 {recipe.calories}</Badge>
            {recipe.protein > 0 && (
              <Badge variant="outline" className="text-blue-600">
                P: {recipe.protein}g
              </Badge>
            )}
          </div>

          <RecipeRating 
            recipeId={recipe.id} 
            targetType={isFromFavorites ? 'favorite_meal' : 'shared_recipe'} 
            compact 
          />

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {recipe.likes_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {recipe.views_count || 0}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              by {recipe.author_name}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}