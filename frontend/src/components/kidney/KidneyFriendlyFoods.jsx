import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Check } from 'lucide-react';

const HIGH_K_FOODS = ['banana', 'orange', 'avocado', 'potato', 'tomato', 'coconut', 'prune', 'raisin', 'kiwi', 'mango', 'date', 'spinach', 'swiss chard', 'beet'];
const HIGH_P_FOODS = ['dairy', 'milk', 'cheese', 'yogurt', 'nuts', 'seeds', 'cola', 'chocolate', 'organ meat', 'fish roe', 'salmon roe'];
const KIDNEY_FRIENDLY = ['apple', 'berries', 'cabbage', 'cauliflower', 'white rice', 'egg white', 'chicken breast', 'olive oil', 'carrot', 'cucumber', 'green beans'];

export default function KidneyFriendlyFoods({ meals = [] }) {
  const getAllIngredients = () => {
    return meals
      .flatMap(m => (m.ingredients || []))
      .map(ing => ing.toLowerCase());
  };

  const ingredients = getAllIngredients();

  const hasHighK = ingredients.some(ing => 
    HIGH_K_FOODS.some(k => ing.includes(k))
  );

  const hasHighP = ingredients.some(ing => 
    HIGH_P_FOODS.some(p => ing.includes(p))
  );

  const friendlyCount = ingredients.filter(ing =>
    KIDNEY_FRIENDLY.some(kf => ing.includes(kf))
  ).length;

  return (
    <Card className="border-cyan-200">
      <CardHeader>
        <CardTitle className="text-cyan-900">Kidney-Friendly Ingredients</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasHighK && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-rose-700">
              <p className="font-medium">⚠️ High Potassium Detected</p>
              <p className="text-xs">Limit portions of bananas, potatoes, tomatoes, oranges, avocados.</p>
            </div>
          </div>
        )}

        {hasHighP && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-700">
              <p className="font-medium">⚠️ High Phosphorus Detected</p>
              <p className="text-xs">Limit dairy, nuts, seeds, and processed foods.</p>
            </div>
          </div>
        )}

        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-900">Kidney-Friendly Choices</p>
          </div>
          <p className="text-xs text-emerald-700">
            This plan includes {friendlyCount}+ kidney-friendly ingredients like apples, berries, cauliflower, and white rice.
          </p>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
          <p className="text-xs font-medium text-slate-700 mb-2">Foods to Avoid in CKD:</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div>
              <p className="font-medium text-slate-700 mb-1">High K:</p>
              <ul className="text-xs space-y-0.5">
                <li>• Bananas, oranges</li>
                <li>• Potatoes, tomatoes</li>
                <li>• Avocados, coconut</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-slate-700 mb-1">High P:</p>
              <ul className="text-xs space-y-0.5">
                <li>• Dairy & cheese</li>
                <li>• Nuts & seeds</li>
                <li>• Dark colas</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}