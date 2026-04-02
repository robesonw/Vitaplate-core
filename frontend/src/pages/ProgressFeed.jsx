import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, MessageSquare, TrendingUp, Trophy, Target, Flame, Send } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import NutritionLeaderboard from '../components/leaderboard/NutritionLeaderboard';

export default function ProgressFeed() {
  const [commentText, setCommentText] = useState({});
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: sharedProgress = [] } = useQuery({
    queryKey: ['sharedProgress'],
    queryFn: () => base44.entities.SharedProgress.list('-created_date', 50),
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['progressComments'],
    queryFn: () => base44.entities.ProgressComment.list('-created_date'),
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['progressInteractions'],
    queryFn: () => base44.entities.UserInteraction.filter({ target_type: 'shared_progress' }),
  });

  const likeProgressMutation = useMutation({
    mutationFn: async (progressId) => {
      const existing = interactions.find(
        i => i.target_id === progressId && i.created_by === user?.email && i.interaction_type === 'like'
      );

      if (existing) {
        await base44.entities.UserInteraction.delete(existing.id);
        await base44.entities.SharedProgress.update(progressId, {
          likes_count: Math.max(0, (sharedProgress.find(p => p.id === progressId)?.likes_count || 0) - 1)
        });
      } else {
        await base44.entities.UserInteraction.create({
          target_id: progressId,
          target_type: 'shared_progress',
          interaction_type: 'like'
        });
        await base44.entities.SharedProgress.update(progressId, {
          likes_count: (sharedProgress.find(p => p.id === progressId)?.likes_count || 0) + 1
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedProgress'] });
      queryClient.invalidateQueries({ queryKey: ['progressInteractions'] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ progressId, comment }) => base44.entities.ProgressComment.create({
      progress_id: progressId,
      comment,
      author_name: user?.full_name || 'Anonymous'
    }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['progressComments'] });
      const progress = sharedProgress.find(p => p.id === variables.progressId);
      base44.entities.SharedProgress.update(variables.progressId, {
        comments_count: (progress?.comments_count || 0) + 1
      });
      queryClient.invalidateQueries({ queryKey: ['sharedProgress'] });
      setCommentText(prev => ({ ...prev, [variables.progressId]: '' }));
      toast.success('Comment added!');
    },
  });

  const hasLiked = (progressId) => {
    return interactions.some(
      i => i.target_id === progressId && i.created_by === user?.email && i.interaction_type === 'like'
    );
  };

  const getProgressComments = (progressId) => {
    return comments.filter(c => c.progress_id === progressId);
  };

  const getProgressIcon = (type) => {
    switch(type) {
      case 'streak': return <Flame className="w-5 h-5 text-orange-500" />;
      case 'goal_reached': return <Target className="w-5 h-5 text-green-500" />;
      case 'milestone': return <Trophy className="w-5 h-5 text-amber-500" />;
      default: return <TrendingUp className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Progress Feed</h1>
        <p className="text-slate-600 mt-1">See what the community is achieving</p>
      </div>

      <Tabs defaultValue="feed" className="space-y-6">
        <TabsList>
          <TabsTrigger value="feed">Community Feed</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-4">
          {sharedProgress.length === 0 ? (
            <Card className="border-slate-200">
              <CardContent className="p-12 text-center">
                <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No shared progress yet</h3>
                <p className="text-slate-600">Be the first to share your nutrition tracking progress!</p>
              </CardContent>
            </Card>
          ) : (
            sharedProgress.map((progress, index) => (
              <motion.div
                key={progress.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-slate-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getProgressIcon(progress.progress_type)}
                        <div>
                          <CardTitle className="text-lg">{progress.title}</CardTitle>
                          <p className="text-sm text-slate-500 mt-1">
                            by {progress.author_name} • {format(new Date(progress.created_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {progress.progress_type.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {progress.description && (
                      <p className="text-slate-700">{progress.description}</p>
                    )}

                    {/* Stats */}
                    {progress.stats && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-lg bg-slate-50">
                        {progress.stats.meals_tracked && (
                          <div className="text-center">
                            <p className="text-2xl font-bold text-slate-900">{progress.stats.meals_tracked}</p>
                            <p className="text-xs text-slate-600">Meals Tracked</p>
                          </div>
                        )}
                        {progress.stats.streak_days && (
                          <div className="text-center">
                            <p className="text-2xl font-bold text-orange-600">{progress.stats.streak_days}</p>
                            <p className="text-xs text-slate-600">Day Streak</p>
                          </div>
                        )}
                        {progress.stats.goals_met && (
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{progress.stats.goals_met}</p>
                            <p className="text-xs text-slate-600">Goals Met</p>
                          </div>
                        )}
                        {progress.stats.avg_protein && (
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{progress.stats.avg_protein}g</p>
                            <p className="text-xs text-slate-600">Avg Protein</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-4 pt-2 border-t border-slate-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => likeProgressMutation.mutate(progress.id)}
                        className={hasLiked(progress.id) ? 'text-rose-600' : ''}
                      >
                        <Heart className={`w-4 h-4 mr-1 ${hasLiked(progress.id) ? 'fill-rose-600' : ''}`} />
                        {progress.likes_count || 0}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        {progress.comments_count || 0}
                      </Button>
                    </div>

                    {/* Comments */}
                    <div className="space-y-3">
                      {getProgressComments(progress.id).map(comment => (
                        <div key={comment.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                          <p className="text-sm font-medium text-slate-900">{comment.author_name}</p>
                          <p className="text-sm text-slate-700 mt-1">{comment.comment}</p>
                        </div>
                      ))}

                      {/* Add Comment */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a comment..."
                          value={commentText[progress.id] || ''}
                          onChange={(e) => setCommentText(prev => ({ ...prev, [progress.id]: e.target.value }))}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && commentText[progress.id]?.trim()) {
                              addCommentMutation.mutate({
                                progressId: progress.id,
                                comment: commentText[progress.id]
                              });
                            }
                          }}
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            if (commentText[progress.id]?.trim()) {
                              addCommentMutation.mutate({
                                progressId: progress.id,
                                comment: commentText[progress.id]
                              });
                            }
                          }}
                          disabled={!commentText[progress.id]?.trim()}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>

        <TabsContent value="leaderboard">
          <NutritionLeaderboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}