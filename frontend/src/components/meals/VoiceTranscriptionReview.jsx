import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Trash2, Plus, Check, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function VoiceTranscriptionReview({ transcript, mealType, logDate, onSuccess, onCancel }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLogging, setIsLogging] = useState(false);

  useEffect(() => {
    processTranscript();
  }, []);

  const processTranscript = async () => {
    try {
      setLoading(true);

      // Call backend function to process voice log
      const response = await base44.functions.invoke('processVoiceMealLog', {
        transcript
      });

      if (response.data && response.data.items) {
        setItems(response.data.items);
      } else {
        toast.error('Could not process meal log');
        onCancel();
      }
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Error processing meal log');
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

  const handleLogMeal = async () => {
    if (items.length === 0) {
      toast.error('Please add at least one food item');
      return;
    }

    setIsLogging(true);

    try {
      // Create nutrition log entry
      await base44.entities.NutritionLog.create({
        recipe_name: items.map(i => i.name).join(', '),
        meal_type: mealType,
        log_date: logDate,
        calories: Math.round(totalNutrition.calories),
        protein: Math.round(totalNutrition.protein * 10) / 10,
        carbs: Math.round(totalNutrition.carbs * 10) / 10,
        fat: Math.round(totalNutrition.fat * 10) / 10,
        food_source: 'voice_ai',
        food_id: 'voice_logged',
        transcript: transcript,
        food_items: items.map(i => ({
          name: i.name,
          quantity: i.quantity,
          calories: i.calories,
          protein: i.protein,
          carbs: i.carbs,
          fat: i.fat,
          fiber: i.fiber
        }))
      });

      toast.success('Meal logged from voice!');
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
            <p className="text-slate-600">Processing meal log...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Meal Log</DialogTitle>
        </DialogHeader>

        {/* Transcription Display */}
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <p className="text-xs text-indigo-600 font-medium mb-2">You said:</p>
          <p className="text-sm text-indigo-900">"{transcript}"</p>
        </div>

        {/* Items */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-slate-900">Detected Foods ({items.length})</h3>
          </div>

          {items.map((item, idx) => (
            <Card key={idx} className="border-slate-200">
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900">{item.name}</h4>
                    <p className="text-sm text-slate-600">{item.quantity}</p>
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
                    onValueChange={(value) => handlePortionChange(idx, value[0] / 100)}
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

        {/* Total Nutrition */}
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