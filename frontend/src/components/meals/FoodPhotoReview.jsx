import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Trash2, Plus, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function FoodPhotoReview({ photo, mealType, logDate, onSuccess, onCancel }) {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [items, setItems] = useState([]);
  const [isLogging, setIsLogging] = useState(false);

  useEffect(() => {
    analyzePhoto();
  }, []);

  const analyzePhoto = async () => {
    try {
      setLoading(true);

      // Call backend function to analyze photo with AI
      const response = await base44.functions.invoke('analyzeFoodPhoto', {
        imageData: photo
      });

      if (response.data && response.data.items) {
        setItems(response.data.items);
        setAnalysisData(response.data);
      } else {
        toast.error('Could not analyze photo. Please try again.');
        onCancel();
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Error analyzing photo');
      onCancel();
    } finally {
      setLoading(false);
    }
  };

  const totalNutrition = {
    calories: items.reduce((sum, item) => sum + (item.calories || 0), 0),
    protein: items.reduce((sum, item) => sum + (item.protein || 0), 0),
    carbs: items.reduce((sum, item) => sum + (item.carbs || 0), 0),
    fat: items.reduce((sum, item) => sum + (item.fat || 0), 0),
    fiber: items.reduce((sum, item) => sum + (item.fiber || 0), 0)
  };

  const handlePortionChange = (index, multiplier) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      portion_multiplier: multiplier,
      calories: Math.round(newItems[index].base_calories * multiplier),
      protein: Math.round(newItems[index].base_protein * multiplier * 10) / 10,
      carbs: Math.round(newItems[index].base_carbs * multiplier * 10) / 10,
      fat: Math.round(newItems[index].base_fat * multiplier * 10) / 10,
      fiber: Math.round(newItems[index].base_fiber * multiplier * 10) / 10
    };
    setItems(newItems);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleAddCustomItem = () => {
    setItems([
      ...items,
      {
        name: 'New Item',
        portion: '1 serving',
        portion_multiplier: 1,
        base_calories: 0,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        is_custom: true
      }
    ]);
  };

  const handleLogMeal = async () => {
    if (items.length === 0) {
      toast.error('Please add at least one food item');
      return;
    }

    setIsLogging(true);

    try {
      // Upload photo first
      let photoUrl = null;
      try {
        const uploadResponse = await base44.integrations.Core.UploadFile({
          file: photo
        });
        photoUrl = uploadResponse.file_url;
      } catch (uploadError) {
        console.warn('Photo upload failed, logging without photo', uploadError);
      }

      // Create nutrition log entry
      await base44.entities.NutritionLog.create({
        recipe_name: items.map(i => i.name).join(', '),
        meal_type: mealType,
        log_date: logDate,
        calories: Math.round(totalNutrition.calories),
        protein: Math.round(totalNutrition.protein * 10) / 10,
        carbs: Math.round(totalNutrition.carbs * 10) / 10,
        fat: Math.round(totalNutrition.fat * 10) / 10,
        food_source: 'photo_ai',
        food_id: 'photo_logged',
        photo_url: photoUrl,
        food_items: items.map(i => ({
          name: i.name,
          portion: i.portion,
          calories: i.calories,
          protein: i.protein,
          carbs: i.carbs,
          fat: i.fat,
          fiber: i.fiber
        }))
      });

      toast.success('Meal logged from photo!');
      onSuccess();
    } catch (error) {
      console.error('Log meal error:', error);
      toast.error('Failed to log meal');
    } finally {
      setIsLogging(false);
    }
  };

  if (loading) {
    return (
      <Dialog open onOpenChange={onCancel}>
        <DialogContent className="sm:max-w-2xl">
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-slate-600">Analyzing your meal...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Detected Foods</DialogTitle>
          <DialogDescription>
            {items.length === 0 ? "No food items detected" : `Found ${items.length} item${items.length !== 1 ? 's' : ''}`}
          </DialogDescription>
        </DialogHeader>

        {/* Photo Preview */}
        {photo && (
          <div className="mb-4 rounded-lg overflow-hidden bg-slate-100">
            <img src={photo} alt="Food" className="w-full h-48 object-cover" />
          </div>
        )}

        {/* Uncertainty Alert */}
        {analysisData?.confidence && analysisData.confidence < 0.7 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                I'm not fully confident about this. Please review and adjust.
              </p>
              <p className="text-xs text-amber-700 mt-1">You can add, remove, or adjust portions below.</p>
            </div>
          </div>
        )}

        {/* Food Items */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-900">Food Items</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddCustomItem}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </div>

          {items.map((item, idx) => (
            <Card key={idx} className="border-slate-200">
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900">{item.name}</h4>
                    <p className="text-sm text-slate-600">{item.portion}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveItem(idx)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Portion Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-slate-700">Portion Size</label>
                    <span className="text-sm text-slate-600">
                      {Math.round((item.portion_multiplier || 1) * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[(item.portion_multiplier || 1) * 100]}
                    onValueChange={(value) =>
                      handlePortionChange(idx, value[0] / 100)
                    }
                    min={25}
                    max={200}
                    step={10}
                    className="w-full"
                  />
                </div>

                {/* Nutrition Info */}
                <div className="grid grid-cols-5 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 rounded">
                    <p className="text-slate-600">Calories</p>
                    <p className="font-semibold text-slate-900">{item.calories}</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded">
                    <p className="text-blue-600">Protein</p>
                    <p className="font-semibold text-slate-900">{item.protein}g</p>
                  </div>
                  <div className="p-2 bg-amber-50 rounded">
                    <p className="text-amber-600">Carbs</p>
                    <p className="font-semibold text-slate-900">{item.carbs}g</p>
                  </div>
                  <div className="p-2 bg-red-50 rounded">
                    <p className="text-red-600">Fat</p>
                    <p className="font-semibold text-slate-900">{item.fat}g</p>
                  </div>
                  <div className="p-2 bg-green-50 rounded">
                    <p className="text-green-600">Fiber</p>
                    <p className="font-semibold text-slate-900">{item.fiber}g</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Total Nutrition Summary */}
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="text-lg">Total Nutrition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{Math.round(totalNutrition.calories)}</p>
                <p className="text-xs text-slate-600">Calories</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{Math.round(totalNutrition.protein * 10) / 10}</p>
                <p className="text-xs text-slate-600">Protein (g)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">{Math.round(totalNutrition.carbs * 10) / 10}</p>
                <p className="text-xs text-slate-600">Carbs (g)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{Math.round(totalNutrition.fat * 10) / 10}</p>
                <p className="text-xs text-slate-600">Fat (g)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{Math.round(totalNutrition.fiber * 10) / 10}</p>
                <p className="text-xs text-slate-600">Fiber (g)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleLogMeal}
            disabled={isLogging || items.length === 0}
            className="gap-2"
          >
            {isLogging ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Logging...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Log This Meal
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}