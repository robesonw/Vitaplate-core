import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Star } from 'lucide-react';

export default function RecipeRating({ recipeId, targetType, compact = false }) {
  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', recipeId],
    queryFn: () => base44.entities.Review.filter({ target_id: recipeId, target_type: targetType }),
    enabled: !!recipeId,
  });

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  if (reviews.length === 0 && compact) return null;

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${
              star <= Math.round(averageRating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-slate-300'
            }`}
          />
        ))}
      </div>
      {!compact && (
        <span className="text-sm text-slate-600">
          {averageRating.toFixed(1)} ({reviews.length})
        </span>
      )}
      {compact && reviews.length > 0 && (
        <span className="text-xs text-slate-600">
          {averageRating.toFixed(1)}
        </span>
      )}
    </div>
  );
}