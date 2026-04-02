import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Package } from 'lucide-react';

const PANTRY_STAPLES = {
  'Proteins & Fish': [
    { item: 'Salmon (fresh or frozen)', omega3: true },
    { item: 'Sardines (canned)', omega3: true },
    { item: 'Mackerel', omega3: true },
    { item: 'Trout', omega3: true },
    { item: 'Grass-fed beef (occasionally)', omega3: false },
    { item: 'Pasture-raised eggs', omega3: false },
  ],
  'Vegetables': [
    { item: 'Spinach', color: 'dark leafy' },
    { item: 'Kale', color: 'dark leafy' },
    { item: 'Broccoli', color: 'cruciferous' },
    { item: 'Cauliflower', color: 'cruciferous' },
    { item: 'Bell peppers (red, yellow)', color: 'colorful' },
    { item: 'Tomatoes', color: 'colorful' },
    { item: 'Carrots', color: 'colorful' },
    { item: 'Sweet potatoes', color: 'colorful' },
  ],
  'Fruits & Berries': [
    { item: 'Blueberries', antioxidant: true },
    { item: 'Strawberries', antioxidant: true },
    { item: 'Raspberries', antioxidant: true },
    { item: 'Blackberries', antioxidant: true },
    { item: 'Apples', antioxidant: true },
    { item: 'Cherries', antioxidant: true },
  ],
  'Spices & Seasonings': [
    { item: 'Turmeric + Black pepper', powerful: true },
    { item: 'Ginger (fresh or dried)', powerful: true },
    { item: 'Garlic', powerful: true },
    { item: 'Cinnamon', antioxidant: true },
    { item: 'Cumin', antioxidant: true },
    { item: 'Oregano', antioxidant: true },
  ],
  'Oils & Fats': [
    { item: 'Extra virgin olive oil', healthy: true },
    { item: 'Avocado oil', healthy: true },
    { item: 'Coconut oil', healthy: true },
    { item: 'Walnut oil', omega3: true },
    { item: 'Flaxseeds', omega3: true },
    { item: 'Chia seeds', omega3: true },
  ],
  'Nuts & Seeds': [
    { item: 'Walnuts', omega3: true },
    { item: 'Almonds', healthy: true },
    { item: 'Pumpkin seeds', healthy: true },
    { item: 'Sunflower seeds', healthy: true },
  ],
  'Grains & Legumes': [
    { item: 'Oats', fiber: true },
    { item: 'Quinoa', protein: true },
    { item: 'Brown rice', fiber: true },
    { item: 'Lentils', fiber: true },
    { item: 'Chickpeas', fiber: true },
    { item: 'Black beans', fiber: true },
  ],
  'Beverages': [
    { item: 'Green tea', antioxidant: true },
    { item: 'Herbal tea (ginger, turmeric)', antioxidant: true },
    { item: 'Bone broth', healing: true },
    { item: 'Filtered water', essential: true },
  ],
};

export default function AntiInflammatoryPantry() {
  const [checked, setChecked] = useState(new Set());

  const handleToggle = (item) => {
    const newSet = new Set(checked);
    if (newSet.has(item)) {
      newSet.delete(item);
    } else {
      newSet.add(item);
    }
    setChecked(newSet);
  };

  const totalItems = Object.values(PANTRY_STAPLES).flat().length;
  const checkedCount = checked.size;

  return (
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
      <CardHeader>
        <CardTitle className="text-emerald-900 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Your Anti-Inflammatory Pantry
        </CardTitle>
        <p className="text-sm text-emerald-700 mt-2">
          Keep these staples on hand. Checked: {checkedCount} / {totalItems}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(PANTRY_STAPLES).map(([category, items]) => (
          <div key={category}>
            <h4 className="font-semibold text-slate-900 mb-3">{category}</h4>
            <div className="space-y-2">
              {items.map((entry) => (
                <div key={entry.item} className="flex items-center gap-3 p-2 rounded hover:bg-white/50 transition-colors">
                  <Checkbox
                    id={entry.item}
                    checked={checked.has(entry.item)}
                    onCheckedChange={() => handleToggle(entry.item)}
                  />
                  <Label 
                    htmlFor={entry.item} 
                    className="cursor-pointer flex-1 text-sm text-slate-700"
                  >
                    {entry.item}
                  </Label>
                  <div className="flex gap-1">
                    {entry.omega3 && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Omega-3</span>}
                    {entry.powerful && <span className="text-xs bg-rose-100 text-rose-800 px-2 py-0.5 rounded">Powerful</span>}
                    {entry.antioxidant && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">Antioxidant</span>}
                    {entry.healthy && <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Healthy Fat</span>}
                    {entry.fiber && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Fiber</span>}
                    {entry.protein && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Protein</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="p-3 rounded-lg bg-white border border-emerald-200 text-sm text-slate-700">
          <p className="font-medium text-slate-900 mb-2">🛒 Shopping Tip</p>
          <p>Build your grocery list from these anti-inflammatory staples. Focus on omega-3 rich fish, colorful vegetables, and herbs/spices. Avoid processed foods and vegetable oils.</p>
        </div>
      </CardContent>
    </Card>
  );
}