import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MealKitCard from './MealKitCard';
import { Truck, TrendingDown } from 'lucide-react';

export default function MealKitOffer({ mealPlan, userDietaryPreference = null }) {
  // Calculate estimated total from meal plan
  const estimatedTotal = useMemo(() => {
    if (!mealPlan?.grocery_list) return null;
    
    let total = 0;
    Object.values(mealPlan.grocery_list).forEach(category => {
      if (Array.isArray(category)) {
        category.forEach(item => {
          const price = item.price || 3.99; // Default estimate
          const qty = item.quantity || 1;
          total += price * qty;
        });
      }
    });
    return total > 0 ? total : null;
  }, [mealPlan]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Truck className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-bold text-slate-900">Get This Week's Meals Delivered</h3>
      </div>

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <TrendingDown className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">💡 Save Time & Money</p>
              <p>
                Instead of shopping for individual ingredients, get pre-portioned meals with recipes included. 
                {estimatedTotal && ` Compare to your ~$${estimatedTotal.toFixed(2)} grocery list.`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meal Kit Options */}
      <div className="grid md:grid-cols-2 gap-4">
        <MealKitCard 
          mealPlanId={mealPlan?.id}
          provider="hellofresh"
          estimatedGroceryCost={estimatedTotal}
          dietaryPreference={userDietaryPreference}
        />
        <MealKitCard 
          mealPlanId={mealPlan?.id}
          provider="greenchef"
          estimatedGroceryCost={estimatedTotal}
          dietaryPreference={userDietaryPreference}
        />
      </div>

      {/* Features Comparison */}
      <Card className="border-slate-200 bg-slate-50">
        <CardHeader>
          <CardTitle className="text-base">Why Choose Meal Kits?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-semibold text-slate-900 mb-1">⏱️ Save Time</p>
              <p className="text-slate-600">No meal planning, shopping, or prep. Just cook and enjoy.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 mb-1">💰 Predictable Cost</p>
              <p className="text-slate-600">Know exactly what you're spending. Often cheaper than grocery shopping.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 mb-1">✨ Quality Control</p>
              <p className="text-slate-600">Fresh ingredients, precise portions, tested recipes.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}