import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag } from 'lucide-react';

export default function MealKitToggle({ groceryItems = [], onToggle = () => {} }) {
  const [isMealKitMode, setIsMealKitMode] = useState(false);

  // Common meal kit ingredients (typically included in HelloFresh/Green Chef kits)
  const mealKitIncludedCategories = ['Proteins', 'Vegetables', 'Grains', 'Fruits', 'Dairy/Alternatives'];
  const itemsInKit = groceryItems.filter(item => 
    mealKitIncludedCategories.includes(item.category)
  ).length;

  const handleToggle = (checked) => {
    setIsMealKitMode(checked);
    onToggle(checked);
  };

  return (
    <Card className={`border-2 ${isMealKitMode ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              <Label className="text-base font-semibold text-slate-900 cursor-pointer">
                View as Meal Kit
              </Label>
            </div>
            <p className="text-sm text-slate-600">
              {isMealKitMode 
                ? `${itemsInKit} items can be covered by a meal kit delivery. Other items (spices, pantry staples) would need separate shopping.`
                : 'Toggle to see which items would be included in a meal kit delivery'}
            </p>
          </div>
          <Switch
            checked={isMealKitMode}
            onCheckedChange={handleToggle}
          />
        </div>

        {isMealKitMode && (
          <div className="mt-3 pt-3 border-t border-emerald-200">
            <div className="flex items-center gap-2 text-sm text-emerald-800 mb-2">
              <Badge className="bg-emerald-100 text-emerald-800">Meal Kit Items</Badge>
              <span className="font-semibold">{itemsInKit} / {groceryItems.length}</span>
            </div>
            <p className="text-xs text-emerald-700">
              💡 Meal kits typically include fresh proteins, vegetables, grains, dairy, and fruits. 
              Check HelloFresh or Green Chef for exact offerings.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}