import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, ThumbsUp, ThumbsDown, CalendarDays, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function CustomizationForm({ onGenerate, isLoading }) {
  const [preferences, setPreferences] = useState({
    foodsLiked: '',
    foodsAvoided: '',
    duration: 'week',
    mealFocus: 'full',
    dietaryNotes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerate(preferences);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 rounded-2xl p-6 border border-violet-100"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">AI-Powered Customization</h3>
          <p className="text-sm text-slate-500">Create a personalized meal plan based on your preferences</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-slate-700">
              <ThumbsUp className="w-4 h-4 text-emerald-500" />
              Foods I Like
            </Label>
            <Textarea
              value={preferences.foodsLiked}
              onChange={(e) => setPreferences({...preferences, foodsLiked: e.target.value})}
              placeholder="e.g., chicken, berries, spinach, quinoa, salmon..."
              className="resize-none h-24 bg-white border-slate-200 focus:border-violet-400 focus:ring-violet-400"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-slate-700">
              <ThumbsDown className="w-4 h-4 text-rose-500" />
              Foods to Avoid
            </Label>
            <Textarea
              value={preferences.foodsAvoided}
              onChange={(e) => setPreferences({...preferences, foodsAvoided: e.target.value})}
              placeholder="e.g., dairy, shellfish, mushrooms, onions..."
              className="resize-none h-24 bg-white border-slate-200 focus:border-violet-400 focus:ring-violet-400"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-slate-700">
              <CalendarDays className="w-4 h-4 text-blue-500" />
              Duration
            </Label>
            <Select
              value={preferences.duration}
              onValueChange={(value) => setPreferences({...preferences, duration: value})}
            >
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Single Day</SelectItem>
                <SelectItem value="3days">3 Days</SelectItem>
                <SelectItem value="week">Full Week</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-slate-700">
              <Utensils className="w-4 h-4 text-amber-500" />
              Meal Focus
            </Label>
            <Select
              value={preferences.mealFocus}
              onValueChange={(value) => setPreferences({...preferences, mealFocus: value})}
            >
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">All Meals</SelectItem>
                <SelectItem value="breakfast">Breakfast Focus</SelectItem>
                <SelectItem value="lunch">Lunch Focus</SelectItem>
                <SelectItem value="dinner">Dinner Focus</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-700">Additional Notes</Label>
          <Textarea
            value={preferences.dietaryNotes}
            onChange={(e) => setPreferences({...preferences, dietaryNotes: e.target.value})}
            placeholder="Any specific health goals, allergies, or dietary restrictions..."
            className="resize-none h-20 bg-white border-slate-200 focus:border-violet-400 focus:ring-violet-400"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium py-6"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating Your Plan...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Custom Meal Plan
            </>
          )}
        </Button>
      </form>
    </motion.div>
  );
}