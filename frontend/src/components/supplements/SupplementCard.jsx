import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { Star, ShoppingCart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SupplementCard({ supplement, labResultId, isPriority = false }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAmazonClick = async () => {
    setIsLoading(true);
    try {
      // Track the affiliate click
      await base44.entities.AffiliateClick.create({
        affiliate_type: 'supplement',
        item_count: 1,
        estimated_value: null,
        grocery_list_id: labResultId,
        items_data: {
          supplement: supplement.name,
          dosage: supplement.dosage,
          reason: supplement.reason
        }
      });

      // Open Amazon affiliate link
      window.open(supplement.productUrl, '_blank');
      toast.success('Opening Amazon...');
    } catch (error) {
      console.error('Amazon click error:', error);
      toast.error('Failed to track click');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={`border-2 ${isPriority ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200'}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-slate-900">{supplement.name}</CardTitle>
              {isPriority && (
                <Badge className="bg-emerald-600">⭐ Priority</Badge>
              )}
            </div>
            <p className="text-sm text-slate-600">{supplement.form}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 mb-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-slate-900">{supplement.rating}</span>
            </div>
            <p className="text-xs text-slate-600">{supplement.reviews.toLocaleString()} reviews</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Reason */}
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-xs text-blue-900 font-medium mb-1">Why It's Recommended:</p>
          <p className="text-sm text-blue-800">{supplement.reason}</p>
        </div>

        {/* Benefits */}
        <div>
          <p className="text-xs font-semibold text-slate-700 mb-2">Health Benefits:</p>
          <ul className="text-sm text-slate-700 space-y-1 ml-3 list-disc">
            {supplement.benefits.split(', ').map((benefit, idx) => (
              <li key={idx}>{benefit}</li>
            ))}
          </ul>
        </div>

        {/* Dosage */}
        <div className="p-3 rounded-lg bg-slate-100">
          <p className="text-xs font-semibold text-slate-700 mb-1">Recommended Dosage:</p>
          <p className="text-sm font-medium text-slate-900">{supplement.dosage}</p>
        </div>

        {/* Amazon Button */}
        <Button
          onClick={handleAmazonClick}
          disabled={isLoading}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 mr-2" />
              View on Amazon
            </>
          )}
        </Button>

        {/* Disclaimer */}
        <p className="text-xs text-slate-500 italic">
          💡 Affiliate link — VitaPlate earns a small commission at no extra cost to you.
        </p>
      </CardContent>
    </Card>
  );
}