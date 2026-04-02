import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

const GOITROGENIC_FOODS = [
  { name: 'Broccoli', note: 'Cook well to reduce goitrogenic compounds' },
  { name: 'Kale', note: 'Cooked versions are safer than raw' },
  { name: 'Cauliflower', note: 'Steam or boil for 5+ minutes' },
  { name: 'Brussels sprouts', note: 'Roasting or boiling reduces compounds' },
  { name: 'Cabbage', note: 'Fermentation reduces goitrogens' },
  { name: 'Soy products', note: 'Restrict soy milk, tofu, edamame' },
  { name: 'Millet', note: 'Avoid or cook thoroughly' },
];

export default function GoitrogensAlert({ meals = [] }) {
  if (!meals || meals.length === 0) return null;

  const allIngredients = meals
    .flatMap(m => (m.ingredients || []))
    .map(ing => ing.toLowerCase());

  const goitrogensFound = GOITROGENIC_FOODS.filter(g =>
    allIngredients.some(ing => ing.includes(g.name.toLowerCase()))
  );

  if (goitrogensFound.length === 0) return null;

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-amber-900 mb-2">🥦 Goitrogenic Foods Detected</h4>
            <p className="text-sm text-amber-800 mb-3">
              These foods contain compounds that may interfere with thyroid function if eaten raw or in large amounts.
              <strong> The good news: cooking them significantly reduces goitrogens!</strong>
            </p>
            <div className="space-y-2">
              {goitrogensFound.map((food) => (
                <div key={food.name} className="text-sm text-amber-800">
                  <span className="font-medium">{food.name}:</span> {food.note}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}