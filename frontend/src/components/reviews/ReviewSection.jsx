import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Star, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function ReviewSection({ targetId, targetType }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', targetId],
    queryFn: () => base44.entities.Review.filter({ target_id: targetId, target_type: targetType }),
  });

  const createReviewMutation = useMutation({
    mutationFn: (data) => base44.entities.Review.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', targetId] });
      toast.success('Review submitted!');
      setRating(0);
      setComment('');
      setShowForm(false);
    },
  });

  const helpfulMutation = useMutation({
    mutationFn: ({ reviewId, currentCount }) => 
      base44.entities.Review.update(reviewId, { helpful_count: currentCount + 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', targetId] });
    },
  });

  const handleSubmitReview = () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    createReviewMutation.mutate({
      target_id: targetId,
      target_type: targetType,
      rating,
      comment: comment.trim(),
      author_name: user?.full_name || 'Anonymous',
    });
  };

  const userHasReviewed = reviews.some(r => r.created_by === user?.email);
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="space-y-4">
      {/* Average Rating */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-3xl font-bold text-slate-900">
              {averageRating.toFixed(1)}
            </span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-slate-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-sm text-slate-600">
            Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
          </p>
        </div>

        {!userHasReviewed && (
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Write Review'}
          </Button>
        )}
      </div>

      {/* Review Form */}
      {showForm && !userHasReviewed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="border-indigo-200 bg-indigo-50/50">
            <CardContent className="p-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Your Rating *
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoverRating || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Your Review (Optional)
                </label>
                <Textarea
                  placeholder="Share your experience with this recipe..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleSubmitReview}
                disabled={createReviewMutation.isPending}
                className="w-full"
              >
                {createReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {userHasReviewed && !showForm && (
        <p className="text-sm text-slate-600 text-center py-2 bg-slate-50 rounded-lg">
          You've already reviewed this recipe
        </p>
      )}

      {/* Reviews List */}
      {reviews.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900">Reviews</h3>
            {reviews
              .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
              .map((review) => (
                <Card key={review.id} className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-900">
                            {review.author_name}
                          </span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-slate-500">
                          {new Date(review.created_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => helpfulMutation.mutate({
                          reviewId: review.id,
                          currentCount: review.helpful_count || 0
                        })}
                        className="text-slate-600"
                      >
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        {review.helpful_count || 0}
                      </Button>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-slate-700">{review.comment}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </>
      )}
    </div>
  );
}