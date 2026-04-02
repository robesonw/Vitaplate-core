import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Share2, MessageSquare, Star, TrendingUp, BookOpen, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';

export default function Community() {
  const { data: sharedPlans = [] } = useQuery({
    queryKey: ['sharedMealPlans'],
    queryFn: () => base44.entities.SharedMealPlan.list('-created_date', 5),
  });

  const { data: forumPosts = [] } = useQuery({
    queryKey: ['forumPosts'],
    queryFn: () => base44.entities.ForumPost.list('-created_date', 5),
  });

  const stats = [
    { label: 'Shared Plans', value: sharedPlans.length, icon: Share2, color: 'text-indigo-600' },
    { label: 'Forum Posts', value: forumPosts.length, icon: MessageSquare, color: 'text-purple-600' },
    { label: 'Community Members', value: '500+', icon: Users, color: 'text-emerald-600' },
  ];

  const features = [
    {
      title: 'Discover Meal Plans',
      description: 'Browse and save meal plans shared by the community',
      icon: Share2,
      color: 'from-indigo-500 to-purple-500',
      link: 'SharedMealPlans',
    },
    {
      title: 'Progress & Leaderboard',
      description: 'See community achievements and compete on leaderboards',
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-500',
      link: 'ProgressFeed',
    },
    {
      title: 'Community Forum',
      description: 'Ask questions, share tips, and connect with others',
      icon: MessageSquare,
      color: 'from-purple-500 to-pink-500',
      link: 'Forum',
    },
    {
      title: 'Browse Recipes',
      description: 'Explore individual recipes shared by the community',
      icon: Star,
      color: 'from-amber-500 to-orange-500',
      link: 'SharedRecipes',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-slate-900">Community Hub</h1>
        <p className="text-lg text-slate-600">
          Connect, share, and learn from fellow nutrition enthusiasts
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-10 h-10 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <Card className="border-slate-200 hover:shadow-lg transition-all cursor-pointer group">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to={createPageUrl(feature.link)}>
                    Explore
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Shared Plans */}
      {sharedPlans.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Trending Meal Plans
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to={createPageUrl('SharedMealPlans')}>View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sharedPlans.slice(0, 3).map((plan) => (
                <div key={plan.id} className="p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">{plan.title}</h4>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">{plan.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-slate-500">by {plan.author_name}</span>
                        {plan.average_rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-medium">{plan.average_rating.toFixed(1)}</span>
                          </div>
                        )}
                        <span className="text-xs text-slate-500">{plan.saves_count || 0} saves</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {plan.diet_type?.replace(/-/g, ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Forum Posts */}
      {forumPosts.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                Recent Discussions
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to={createPageUrl('Forum')}>View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {forumPosts.slice(0, 3).map((post) => (
                <div key={post.id} className="p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">{post.title}</h4>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-slate-500">by {post.author_name}</span>
                        <span className="text-xs text-slate-500">{post.comments_count || 0} comments</span>
                        <span className="text-xs text-slate-500">{post.views_count || 0} views</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {post.category.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTA */}
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardContent className="p-8 text-center">
          <Sparkles className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">Share Your Success!</h3>
          <p className="text-slate-600 mb-4">
            Have a meal plan that worked great for you? Share it with the community!
          </p>
          <Button asChild size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600">
            <Link to={createPageUrl('MealPlans')}>Share a Meal Plan</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}