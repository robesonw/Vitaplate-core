import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const INSTACART_AFFILIATE_ID = 'vitaplate'; // Replace with actual Instacart affiliate ID
const AMAZON_AFFILIATE_TAG = 'vitaplate-20';

export default function AffiliateOrderButtons({ groceryItems = [], estimatedTotal = 0, groceryListId }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [isIframe, setIsIframe] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: userPrefs } = useQuery({
    queryKey: ['userPreferences'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      const prefs = await base44.entities.UserPreferences.filter({ created_by: currentUser.email });
      return prefs?.[0] || null;
    },
  });

  useEffect(() => {
    // Check if running in iframe
    setIsIframe(window.self !== window.top);
  }, []);

  const createAffiliateClickMutation = useMutation({
    mutationFn: async (platform) => {
      const clickRecord = await base44.asServiceRole.entities.AffiliateClick.create({
        user_email: user?.email,
        platform,
        item_count: groceryItems.length,
        estimated_order_value: estimatedTotal,
        grocery_list_id: groceryListId,
        clicked_at: new Date().toISOString(),
      });
      return clickRecord.id;
    },
  });

  const formatInstacartURL = () => {
    const items = groceryItems
      .map(item => {
        const qty = item.quantity || 1;
        const unit = item.unit ? ` ${item.unit}` : '';
        return `${qty}${unit} ${item.name}`;
      })
      .slice(0, 50); // Instacart has URL length limits

    const itemsParam = items.join('|');
    const baseURL = 'https://www.instacart.com/store/checkout_ingredients';
    const params = new URLSearchParams({
      items: itemsParam,
      utm_source: 'vitaplate',
      affiliate_id: INSTACART_AFFILIATE_ID,
    });

    return `${baseURL}?${params.toString()}`;
  };

  const formatAmazonFreshURL = () => {
    const searchTerms = groceryItems
      .slice(0, 5)
      .map(item => item.name)
      .join(' ');

    const params = new URLSearchParams({
      k: searchTerms,
      tag: AMAZON_AFFILIATE_TAG,
    });

    return `https://www.amazon.com/s?${params.toString()}`;
  };

  const handleOrderClick = async (platform) => {
    if (isIframe) {
      toast.error('Checkout works best on the published app. Please open VitaPlate directly.');
      return;
    }

    if (groceryItems.length === 0) {
      toast.error('No items in your grocery list');
      return;
    }

    setIsProcessing(true);
    try {
      // Create affiliate click record
      await createAffiliateClickMutation.mutateAsync(platform);

      // Show confirmation
      setSelectedPlatform(platform);
      setShowConfirmation(true);

      // Open retailer in new tab
      const url = platform === 'instacart' ? formatInstacartURL() : formatAmazonFreshURL();
      window.open(url, '_blank');

      // Show prompt after 2 hours to confirm order
      setTimeout(() => {
        const confirmed = window.confirm(
          `Did your ${platform === 'instacart' ? 'Instacart' : 'Amazon Fresh'} order go through? Tap "OK" to mark it as completed and help us improve.`
        );
        if (confirmed) {
          toast.success('Thanks for confirming! Your feedback helps us improve.');
        }
      }, 2 * 60 * 60 * 1000); // 2 hours

    } catch (error) {
      toast.error('Failed to process order');
      console.error('Affiliate click error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const uncheckedItemCount = groceryItems.length;

  return (
    <>
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">🛍️ Order Ingredients Directly</h3>
              <p className="text-sm text-slate-600 mb-4">
                Get {uncheckedItemCount} items delivered to your door with one click
              </p>
            </div>

            {isIframe && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Checkout works best on the published app. Open VitaPlate directly for the best experience.
                </p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-3">
              <Button
                onClick={() => handleOrderClick('instacart')}
                disabled={isProcessing || groceryItems.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white h-12 text-base"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    🛒 Order on Instacart
                  </>
                )}
              </Button>

              <Button
                onClick={() => handleOrderClick('amazon_fresh')}
                disabled={isProcessing || groceryItems.length === 0}
                variant="outline"
                className="h-12 text-base"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    📦 Order on Amazon Fresh
                  </>
                )}
              </Button>
            </div>

            <div className="pt-3 border-t border-green-200">
              <p className="text-xs text-slate-500 text-center">
                ℹ️ VitaPlate earns a small commission on purchases at no extra cost to you — this helps keep the app running.
              </p>
            </div>

            {estimatedTotal > 0 && (
              <div className="p-3 bg-white rounded-lg border border-green-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700">Estimated Order Total:</span>
                  <span className="text-lg font-bold text-green-600">~${estimatedTotal.toFixed(2)}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Final price may vary on retailer site
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Opening {selectedPlatform === 'instacart' ? 'Instacart' : 'Amazon Fresh'}...</DialogTitle>
            <DialogDescription>
              Your {uncheckedItemCount} ingredients are ready to order
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>💡 Tip:</strong> Review the cart on {selectedPlatform === 'instacart' ? 'Instacart' : 'Amazon Fresh'} before checking out — some items may need substitutions based on availability.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-xs text-slate-600">
                <strong>📋 Order Summary:</strong>
              </p>
              <p className="text-sm font-semibold text-slate-900 mt-1">
                {uncheckedItemCount} items • ~${estimatedTotal.toFixed(2)}
              </p>
            </div>

            <p className="text-xs text-slate-500 text-center">
              A confirmation reminder will appear in 2 hours if you'd like to mark your order as complete.
            </p>

            <Button onClick={() => setShowConfirmation(false)} className="w-full">
              Got It
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}