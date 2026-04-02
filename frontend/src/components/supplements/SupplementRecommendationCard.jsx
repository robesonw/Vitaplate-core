import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const AMAZON_AFFILIATE_TAG = 'vitaplate-20';

export default function SupplementRecommendationCard({ recommendation }) {
  const createAffiliateClickMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      return base44.asServiceRole.entities.AffiliateClick.create({
        user_email: user.email,
        platform: 'amazon_supplement',
        supplement_name: recommendation.name,
        amazon_search_term: recommendation.amazonSearch,
        clicked_at: new Date().toISOString(),
        estimated_order_value: recommendation.estimatedMonthlyCost,
      });
    },
    onError: (err) => {
      console.error('Failed to log affiliate click:', err);
    },
  });

  const handleBuyClick = () => {
    createAffiliateClickMutation.mutate();
    const amazonURL = `https://www.amazon.com/s?k=${encodeURIComponent(recommendation.amazonSearch)}&tag=${AMAZON_AFFILIATE_TAG}`;
    window.open(amazonURL, '_blank');
  };

  const priorityConfig = {
    HIGH: { bg: 'bg-rose-50', border: 'border-rose-200', badge: 'bg-rose-500', text: 'text-rose-700' },
    MEDIUM: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-500', text: 'text-amber-700' },
    MAINTENANCE: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-500', text: 'text-emerald-700' },
  };

  const config = priorityConfig[recommendation.priority];

  return (
    <div className={`border ${config.border} rounded-lg p-5 ${config.bg} space-y-3`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900">{recommendation.name}</h3>
            <Badge className={`${config.badge} text-white text-xs`}>
              {recommendation.priority}
            </Badge>
          </div>
          <p className="text-sm text-slate-600">{recommendation.form}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-slate-900">~${recommendation.estimatedMonthlyCost}</p>
          <p className="text-xs text-slate-500">/month</p>
        </div>
      </div>

      {/* Why this supplement */}
      <div className="bg-white bg-opacity-60 rounded p-3">
        <p className="text-sm text-slate-700">{recommendation.why}</p>
      </div>

      {/* Dose & Timing */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white bg-opacity-60 rounded p-2">
          <p className="text-xs font-medium text-slate-600">Recommended Dose</p>
          <p className="text-sm font-semibold text-slate-900 mt-1">{recommendation.dose}</p>
        </div>
        {recommendation.notes && (
          <div className="bg-white bg-opacity-60 rounded p-2">
            <p className="text-xs font-medium text-slate-600">Important</p>
            <p className="text-xs text-slate-700 mt-1">{recommendation.notes}</p>
          </div>
        )}
      </div>

      {/* Buy Button */}
      <Button
        onClick={handleBuyClick}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white"
      >
        🛒 Buy on Amazon
      </Button>
    </div>
  );
}