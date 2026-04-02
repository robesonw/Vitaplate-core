import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

const THYROID_NUTRIENTS = [
  {
    name: 'Iodine',
    target: '150-200 mcg/day',
    sources: 'Seaweed, seafood (salmon, cod), iodized salt, shrimp',
    role: 'Essential for thyroid hormone synthesis',
    icon: '🦪',
  },
  {
    name: 'Selenium',
    target: '55 mcg/day',
    sources: 'Brazil nuts (1-2/day), tuna, eggs, sunflower seeds',
    role: 'Activates thyroid hormones, antioxidant protection',
    icon: '🥚',
  },
  {
    name: 'Zinc',
    target: '8-11 mg/day',
    sources: 'Pumpkin seeds, beef, oysters, cashews, chickpeas',
    role: 'Supports thyroid hormone conversion',
    icon: '🌱',
  },
  {
    name: 'Tyrosine',
    target: '1-3g/day',
    sources: 'Chicken, turkey, fish, almonds, pumpkin seeds',
    role: 'Amino acid building block for thyroid hormones',
    icon: '🍗',
  },
  {
    name: 'Iron',
    target: '8-18 mg/day',
    sources: 'Red meat, spinach, lentils, fortified cereals',
    role: 'Supports thyroid peroxidase enzyme function',
    icon: '🥩',
  },
];

const ANTI_INFLAMMATORY = [
  'Fatty fish (salmon, sardines, mackerel)',
  'Berries (blueberries, strawberries)',
  'Leafy greens (spinach, kale - cooked)',
  'Olive oil',
  'Turmeric & ginger',
  'Green tea',
];

export default function ThyroidNutrients({ thyroidCondition = 'hypothyroidism' }) {
  const isHashimotos = thyroidCondition === 'hashimotos';

  return (
    <div className="space-y-4">
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="text-purple-900">🦋 Key Thyroid Nutrients</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {THYROID_NUTRIENTS.map((nutrient) => (
            <div key={nutrient.name} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-start gap-3">
                <span className="text-xl">{nutrient.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-900">{nutrient.name}</h4>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                      {nutrient.target}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mb-1">
                    <span className="font-medium">Sources:</span> {nutrient.sources}
                  </p>
                  <p className="text-xs text-slate-600">{nutrient.role}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50">
        <CardHeader>
          <CardTitle className="text-pink-900">🔥 Anti-Inflammatory Foods</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-700 mb-3">
            {isHashimotos 
              ? 'Hashimoto\'s is autoimmune. Anti-inflammatory foods help reduce flare-ups and support gut health.'
              : 'Support thyroid function and reduce inflammation with these omega-3 and antioxidant-rich foods:'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {ANTI_INFLAMMATORY.map((food) => (
              <div key={food} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-pink-600 flex-shrink-0" />
                <span className="text-sm text-slate-700">{food}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {isHashimotos && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-900">⚠️ Hashimoto's Specific</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-amber-900">
            <p><strong>Avoid Gluten:</strong> Cross-reactivity with thyroid peroxidase (TPO). Even small amounts may trigger immune response.</p>
            <p><strong>Limit Dairy:</strong> May increase inflammation in susceptible individuals. Consider elimination diet to test.</p>
            <p><strong>Support Gut Health:</strong> Take probiotics, include fermented foods, and avoid processed foods to improve nutrient absorption.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}