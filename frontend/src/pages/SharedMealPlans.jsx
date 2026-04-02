import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, Heart, Bookmark, Eye, Search, Plus, Share2, UserPlus, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import PlanDetailsView from '../components/plans/PlanDetailsView';
import SharedPlanDetailDialog from '../components/community/SharedPlanDetailDialog';

export default function SharedMealPlans() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedPlanForShare, setSelectedPlanForShare] = useState(null);
  const [shareForm, setShareForm] = useState({ title: '', description: '', tags: '' });
  const [viewingPlan, setViewingPlan] = useState(null);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [ratingForm, setRatingForm] = useState({ rating: 5, comment: '' });
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedPlanDetail, setSelectedPlanDetail] = useState(null);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: sharedPlans = [] } = useQuery({
    queryKey: ['sharedMealPlans'],
    queryFn: () => base44.entities.SharedMealPlan.list('-created_date'),
  });

  const { data: myPlans = [] } = useQuery({
    queryKey: ['mealPlans'],
    queryFn: () => base44.entities.MealPlan.list('-created_date'),
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => base44.entities.Review.list(),
  });

  const { data: following = [] } = useQuery({
    queryKey: ['following', user?.email],
    queryFn: () => base44.entities.UserFollow.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const sharePlanMutation = useMutation({
    mutationFn: (data) => base44.entities.SharedMealPlan.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedMealPlans'] });
      toast.success('Meal plan shared with the community!');
      setShareDialogOpen(false);
      setShareForm({ title: '', description: '', tags: '' });
    },
  });

  const addReviewMutation = useMutation({
    mutationFn: (data) => base44.entities.Review.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review added!');
      setRatingDialogOpen(false);
      setRatingForm({ rating: 5, comment: '' });
    },
  });

  const followMutation = useMutation({
    mutationFn: (data) => base44.entities.UserFollow.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      toast.success(`Following ${variables.following_user_name}`);
      
      // Create notification
      base44.entities.Notification.create({
        recipient_email: variables.following_user_email,
        type: 'new_follower',
        title: 'New Follower',
        message: `${user?.full_name || 'Someone'} started following you`,
        actor_name: user?.full_name || 'Anonymous',
      });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: (followId) => base44.entities.UserFollow.delete(followId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      toast.success('Unfollowed');
    },
  });

  const interactionMutation = useMutation({
    mutationFn: (data) => base44.entities.UserInteraction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedMealPlans'] });
    },
  });

  const handleShare = () => {
    if (!selectedPlanForShare || !shareForm.title) {
      toast.error('Please fill in required fields');
      return;
    }

    sharePlanMutation.mutate({
      original_plan_id: selectedPlanForShare.id,
      title: shareForm.title,
      description: shareForm.description,
      plan_data: selectedPlanForShare,
      diet_type: selectedPlanForShare.diet_type,
      cultural_style: selectedPlanForShare.cultural_style,
      tags: shareForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      author_name: user?.full_name || 'Anonymous',
    });
  };

  const handleLike = (plan) => {
    interactionMutation.mutate({
      target_id: plan.id,
      target_type: 'shared_plan',
      interaction_type: 'like',
    });
    
    // Create notification for author
    if (plan.created_by && plan.created_by !== user?.email) {
      base44.entities.Notification.create({
        recipient_email: plan.created_by,
        type: 'plan_like',
        title: 'Meal Plan Liked',
        message: `${user?.full_name || 'Someone'} liked your meal plan "${plan.title}"`,
        actor_name: user?.full_name || 'Anonymous',
      });
    }
    
    toast.success('Liked!');
  };

  const isFollowing = (userEmail) => {
    return following.some(f => f.following_user_email === userEmail);
  };

  const handleFollow = (plan) => {
    if (!plan.created_by) return;
    
    const existingFollow = following.find(f => f.following_user_email === plan.created_by);
    
    if (existingFollow) {
      unfollowMutation.mutate(existingFollow.id);
    } else {
      followMutation.mutate({
        following_user_email: plan.created_by,
        following_user_name: plan.author_name,
      });
    }
  };

  const handleSave = (plan) => {
    // Save as user's own meal plan
    base44.entities.MealPlan.create({
      name: `${plan.title} (Community)`,
      diet_type: plan.diet_type,
      days: plan.plan_data.days,
      cultural_style: plan.cultural_style,
    });
    
    interactionMutation.mutate({
      target_id: plan.id,
      target_type: 'shared_plan',
      interaction_type: 'save',
    });
    
    toast.success('Saved to your meal plans!');
  };

  const openRatingDialog = (plan) => {
    setViewingPlan(plan);
    setRatingDialogOpen(true);
  };

  const handleAddReview = () => {
    if (!viewingPlan || !ratingForm.rating) return;

    addReviewMutation.mutate({
      target_id: viewingPlan.id,
      target_type: 'shared_plan',
      rating: ratingForm.rating,
      comment: ratingForm.comment,
      author_name: user?.full_name || 'Anonymous',
    });
  };

  const filteredPlans = sharedPlans.filter(plan => {
    const matchesSearch = plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterCategory === 'all' || plan.diet_type === filterCategory;
    return matchesSearch && matchesFilter;
  });

  const getPlanRating = (planId) => {
    const planReviews = reviews.filter(r => r.target_id === planId);
    if (planReviews.length === 0) return null;
    const avg = planReviews.reduce((sum, r) => sum + r.rating, 0) / planReviews.length;
    return { average: avg, count: planReviews.length };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Shared Meal Plans</h1>
          <p className="text-slate-600 mt-1">Discover and save meal plans from the community</p>
        </div>
        <Button onClick={() => setShareDialogOpen(true)} className="bg-gradient-to-r from-indigo-600 to-purple-600">
          <Share2 className="w-4 h-4 mr-2" />
          Share Your Plan
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search meal plans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by diet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Diets</SelectItem>
                <SelectItem value="liver-centric">Liver-Centric</SelectItem>
                <SelectItem value="low-sugar">Low-Sugar</SelectItem>
                <SelectItem value="vegetarian">Vegetarian</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlans.map((plan, index) => {
          const rating = getPlanRating(plan.id);
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className="border-slate-200 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => {
                  setSelectedPlanDetail(plan);
                  setDetailDialogOpen(true);
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary" className="capitalize">
                      {plan.diet_type?.replace(/-/g, ' ')}
                    </Badge>
                    {rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-medium">{rating.average.toFixed(1)}</span>
                        <span className="text-xs text-slate-500">({rating.count})</span>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-lg">{plan.title}</CardTitle>
                  <p className="text-sm text-slate-600 line-clamp-2 mt-1">
                    {plan.description || 'A delicious and healthy meal plan'}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {plan.views_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {plan.likes_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bookmark className="w-3 h-3" />
                      {plan.saves_count || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      by {plan.author_name}
                    </p>
                    {plan.created_by && plan.created_by !== user?.email && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollow(plan);
                        }}
                        className="h-6 text-xs"
                      >
                        {isFollowing(plan.created_by) ? (
                          <>
                            <UserCheck className="w-3 h-3 mr-1" />
                            Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3 mr-1" />
                            Follow
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  {plan.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {plan.tags.slice(0, 3).map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(plan);
                      }}
                    >
                      <Heart className="w-3 h-3 mr-1" />
                      Like
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSave(plan);
                      }}
                    >
                      <Bookmark className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        openRatingDialog(plan);
                      }}
                    >
                      <Star className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredPlans.length === 0 && (
        <Card className="border-slate-200 border-dashed">
          <CardContent className="p-12 text-center">
            <Share2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No meal plans found. Be the first to share!</p>
          </CardContent>
        </Card>
      )}

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Meal Plan with Community</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Plan to Share</Label>
              <Select onValueChange={(id) => setSelectedPlanForShare(myPlans.find(p => p.id === id))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a meal plan..." />
                </SelectTrigger>
                <SelectContent>
                  {myPlans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title *</Label>
              <Input
                placeholder="Give it a catchy title..."
                value={shareForm.title}
                onChange={(e) => setShareForm({ ...shareForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Tell others why this plan works for you..."
                value={shareForm.description}
                onChange={(e) => setShareForm({ ...shareForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input
                placeholder="e.g., high-protein, budget-friendly, quick"
                value={shareForm.tags}
                onChange={(e) => setShareForm({ ...shareForm, tags: e.target.value })}
              />
            </div>
            <Button onClick={handleShare} className="w-full" disabled={sharePlanMutation.isPending}>
              {sharePlanMutation.isPending ? 'Sharing...' : 'Share with Community'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rate This Meal Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Your Rating</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRatingForm({ ...ratingForm, rating: star })}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= ratingForm.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Your Review (Optional)</Label>
              <Textarea
                placeholder="Share your thoughts..."
                value={ratingForm.comment}
                onChange={(e) => setRatingForm({ ...ratingForm, comment: e.target.value })}
                rows={3}
              />
            </div>
            <Button onClick={handleAddReview} className="w-full" disabled={addReviewMutation.isPending}>
              {addReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SharedPlanDetailDialog
        plan={selectedPlanDetail}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </div>
  );
}