import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Link2, Loader2, Heart, Clock, ChefHat, Flame, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import ImportedRecipePreview from '@/components/recipes/ImportedRecipePreview';

export default function RecipeImport() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const queryClient = useQueryClient();

  const handleImport = async () => {
    if (!url.trim()) { toast.error('Please enter a URL'); return; }
    setLoading(true);
    setRecipe(null);
    try {
      const res = await base44.functions.invoke('importRecipeFromUrl', { url: url.trim() });
      if (res.data.error) {
        toast.error(res.data.error);
        return;
      }
      setRecipe(res.data.recipe);
      setShowPreview(true);
      toast.success('Recipe extracted! Review and edit below.');
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Could not extract recipe from this URL');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecipe = async (editedRecipe) => {
    try {
      // Flatten ingredients array for compatibility
      const ingredientsList = editedRecipe.ingredients
        .map(ing => `${ing.quantity} ${ing.name}`)
        .filter(ing => ing.trim().length > 1);

      await base44.entities.FavoriteMeal.create({
        name: editedRecipe.name,
        meal_type: editedRecipe.meal_type || 'dinner',
        calories: `${editedRecipe.calories} kcal`,
        protein: editedRecipe.protein || 0,
        carbs: editedRecipe.carbs || 0,
        fat: editedRecipe.fat || 0,
        prepTime: editedRecipe.prep_time || '',
        cooking_time: editedRecipe.cooking_time || '',
        difficulty: editedRecipe.difficulty || 'Medium',
        prepSteps: editedRecipe.instructions || [],
        ingredients: ingredientsList,
        cuisine: editedRecipe.cuisine || '',
        tags: editedRecipe.dietary_tags || [],
        source_type: 'imported',
        source_url: editedRecipe.source_url,
      });
      queryClient.invalidateQueries({ queryKey: ['favoriteMeals'] });
      setShowPreview(false);
      setRecipe(null);
      setUrl('');
    } catch (error) {
      console.error('Save error:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Import Recipe from URL</h1>
        <p className="text-slate-600 mt-1">Paste any recipe URL, TikTok, or Instagram link to extract and save the recipe</p>
      </div>

      <Card className="border-indigo-200 bg-indigo-50">
        <CardContent className="p-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                className="pl-9 bg-white h-11"
                placeholder="https://www.allrecipes.com/recipe/... or TikTok/Instagram link"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleImport()}
              />
            </div>
            <Button
              onClick={handleImport}
              disabled={loading}
              className="h-11 px-6 bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Link2 className="w-4 h-4 mr-2" />}
              {loading ? 'Extracting...' : 'Import'}
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Supports: AllRecipes, Food Network, Serious Eats, NYT Cooking, TikTok, Instagram, and more
          </p>
        </CardContent>
      </Card>

      {/* Loading State */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="border-slate-200">
              <CardContent className="p-12 text-center">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">Fetching and analyzing recipe...</p>
                <p className="text-sm text-slate-400 mt-1">This may take a moment</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recipe Preview Dialog */}
      <AnimatePresence>
        {recipe && showPreview && (
          <ImportedRecipePreview
            recipe={recipe}
            onSave={handleSaveRecipe}
            onCancel={() => {
              setShowPreview(false);
              setRecipe(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}