import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { ShoppingBag, Loader2, Truck, Leaf } from 'lucide-react';
import { toast } from 'sonner';

export default function MealKitCard({ 
  mealPlanId, 
  provider = 'hellofresh', 
  estimatedGroceryCost = null,
  dietaryPreference = null 
}) {
  const [isLoading, setIsLoading] = useState(false);

  const providers = {
    hellofresh: {
      name: 'HelloFresh',
      tagline: 'Get ingredients + recipes delivered',
      description: 'Weekly meal kits with fresh ingredients and step-by-step recipes',
      benefits: ['Pre-portioned ingredients', 'Customizable meals', 'Flexible scheduling', 'No commitment'],
      url: 'https://www.hellofresh.com/pages/share?c=HS101&utm_source=vitaplate&utm_medium=affiliate',
      logo: '🍽️',
      color: 'from-green-600 to-emerald-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    greenchef: {
      name: 'Green Chef',
      tagline: 'Certified organic, diet-specific kits',
      description: 'USDA organic ingredients with keto, paleo, plant-based options',
      benefits: ['USDA Organic Certified', 'Diet-specific meals', 'Eco-friendly packaging', 'Locally sourced'],
      url: 'https://www.greenchef.com/?utm_source=vitaplate&utm_medium=affiliate',
      logo: '🌿',
      color: 'from-emerald-600 to-teal-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    }
  };

  const providerInfo = providers[provider];

  const handleMealKitClick = async () => {
    setIsLoading(true);
    try {
      // Track the affiliate click
      await base44.entities.AffiliateClick.create({
        affiliate_type: 'mealkit',
        item_count: null,
        estimated_value: estimatedGroceryCost,
        grocery_list_id: mealPlanId,
        items_data: {
          provider: provider,
          meal_plan_id: mealPlanId,
          grocery_cost: estimatedGroceryCost
        }
      });

      // Open affiliate link
      window.open(providerInfo.url, '_blank');
      toast.success(`Opening ${providerInfo.name}...`);
    } catch (error) {
      console.error('Meal kit click error:', error);
      toast.error('Failed to process');
    } finally {
      setIsLoading(false);
    }
  };

  const isBestMatch = provider === 'greenchef' && dietaryPreference && 
    ['keto', 'paleo', 'plant_based', 'vegan', 'vegetarian'].includes(dietaryPreference);

  return (
    <Card className={`border-2 ${providerInfo.borderColor} ${providerInfo.bgColor}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">{providerInfo.logo}</span>
              <div>
                <CardTitle className="text-slate-900">{providerInfo.name}</CardTitle>
                <p className="text-xs text-slate-600 mt-0.5">{providerInfo.tagline}</p>
              </div>
            </div>
          </div>
          {isBestMatch && (
            <Badge className="bg-emerald-600">⭐ Best Match</Badge>
          )}
          <Badge variant="outline" className="text-xs">Ad</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Description */}
        <p className="text-sm text-slate-700">{providerInfo.description}</p>

        {/* Benefits */}
        <div className="grid grid-cols-2 gap-2">
          {providerInfo.benefits.map((benefit) => (
            <div key={benefit} className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span className="text-xs text-slate-700">{benefit}</span>
            </div>
          ))}
        </div>

        {/* Value Proposition */}
        {estimatedGroceryCost && (
          <div className="p-3 rounded-lg bg-white/60 border border-slate-200">
            <p className="text-xs text-slate-600 mb-1">Estimated Value</p>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-900">
                Grocery List Cost: ${estimatedGroceryCost.toFixed(2)}
              </p>
              <p className="text-xs text-slate-600">+Delivery</p>
            </div>
            <p className="text-xs text-slate-600 mt-2">
              💡 Skip the grocery run — get exactly what you need for this week's plan, pre-portioned and delivered to your door.
            </p>
          </div>
        )}

        {/* CTA Button */}
        <Button
          onClick={handleMealKitClick}
          disabled={isLoading}
          className={`w-full bg-gradient-to-r ${providerInfo.color} hover:opacity-90 text-white`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4 mr-2" />
              Get Meal Kit
            </>
          )}
        </Button>

        {/* Disclaimer */}
        <p className="text-xs text-slate-500 text-center italic">
          VitaPlate may earn a small commission on sign-ups at no extra cost to you.
        </p>
      </CardContent>
    </Card>
  );
}