import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { Loader2, X, Plus, Edit2, Save, Clock, Users, ChefHat } from 'lucide-react';
import { toast } from 'sonner';

export default function ImportedRecipePreview({ recipe, onSave, onCancel, onAddToMealPlan }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedRecipe, setEditedRecipe] = useState(recipe);
  const [showAddToMealPlan, setShowAddToMealPlan] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      onSave(editedRecipe);
      toast.success('Recipe saved to your collection!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to save recipe');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateRecipe = (field, value) => {
    setEditedRecipe(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateIngredient = (index, field, value) => {
    const newIngredients = [...editedRecipe.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setEditedRecipe(prev => ({
      ...prev,
      ingredients: newIngredients
    }));
  };

  const removeIngredient = (index) => {
    setEditedRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const addIngredient = () => {
    setEditedRecipe(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', quantity: '' }]
    }));
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Review Imported Recipe</span>
            <Badge className="bg-indigo-100 text-indigo-700">Imported</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Recipe Name */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Recipe Name
            </label>
            {isEditing ? (
              <Input
                value={editedRecipe.name}
                onChange={(e) => updateRecipe('name', e.target.value)}
                className="bg-slate-50"
              />
            ) : (
              <h2 className="text-2xl font-bold text-slate-900">{editedRecipe.name}</h2>
            )}
          </div>

          {/* Recipe Meta */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Servings</label>
              {isEditing ? (
                <Input
                  type="number"
                  value={editedRecipe.servings}
                  onChange={(e) => updateRecipe('servings', Number(e.target.value))}
                  className="bg-slate-50"
                />
              ) : (
                <div className="flex items-center gap-2 text-slate-700">
                  <Users className="w-4 h-4 text-slate-400" />
                  {editedRecipe.servings} servings
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Prep Time</label>
              {isEditing ? (
                <Input
                  value={editedRecipe.prep_time}
                  onChange={(e) => updateRecipe('prep_time', e.target.value)}
                  placeholder="e.g., 15 minutes"
                  className="bg-slate-50"
                />
              ) : (
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {editedRecipe.prep_time}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Cook Time</label>
              {isEditing ? (
                <Input
                  value={editedRecipe.cooking_time}
                  onChange={(e) => updateRecipe('cooking_time', e.target.value)}
                  placeholder="e.g., 30 minutes"
                  className="bg-slate-50"
                />
              ) : (
                <div className="flex items-center gap-2 text-slate-700">
                  <ChefHat className="w-4 h-4 text-slate-400" />
                  {editedRecipe.cooking_time}
                </div>
              )}
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-700">Ingredients</label>
              {isEditing && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={addIngredient}
                  className="gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              )}
            </div>
            <div className="space-y-2 bg-slate-50 rounded-lg p-4">
              {editedRecipe.ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2 items-end">
                  {isEditing ? (
                    <>
                      <Input
                        placeholder="Quantity"
                        value={ingredient.quantity}
                        onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                        className="w-24 text-sm"
                      />
                      <Input
                        placeholder="Ingredient"
                        value={ingredient.name}
                        onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                        className="flex-1 text-sm"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeIngredient(index)}
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">{ingredient.quantity}</span> {ingredient.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-3 block">Instructions</label>
            <ol className="space-y-2 bg-slate-50 rounded-lg p-4">
              {editedRecipe.instructions.map((instruction, index) => (
                <li key={index} className="text-sm text-slate-700 flex gap-3">
                  <span className="font-medium text-slate-400 flex-shrink-0">{index + 1}.</span>
                  <span>{instruction}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Nutrition */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-3 block">Per Serving Nutrition</label>
            <div className="grid grid-cols-5 gap-2 bg-slate-50 rounded-lg p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{editedRecipe.calories}</p>
                <p className="text-xs text-slate-500">Calories</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">{editedRecipe.protein}g</p>
                <p className="text-xs text-slate-500">Protein</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">{editedRecipe.carbs}g</p>
                <p className="text-xs text-slate-500">Carbs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{editedRecipe.fat}g</p>
                <p className="text-xs text-slate-500">Fat</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{editedRecipe.fiber}g</p>
                <p className="text-xs text-slate-500">Fiber</p>
              </div>
            </div>
          </div>

          {/* Source URL */}
          {editedRecipe.source_url && !isEditing && (
            <div className="text-xs text-slate-500">
              Source: <a href={editedRecipe.source_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all">
                {editedRecipe.source_url}
              </a>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
              className="flex-1"
            >
              Cancel
            </Button>

            {isEditing ? (
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Recipe
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="flex-1 gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>

                <Button
                  onClick={() => {
                    handleSave();
                    setShowAddToMealPlan(true);
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Save & Add to Meal Plan
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}