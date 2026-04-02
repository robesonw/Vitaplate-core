import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Star, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Bug,
  Lightbulb,
  ThumbsUp
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminFeedback() {
  const [activeTab, setActiveTab] = useState('all');
  const queryClient = useQueryClient();

  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ['feedbacks'],
    queryFn: () => base44.entities.Feedback.list('-created_date'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Feedback.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
      toast.success('Status updated');
    },
  });

  const stats = {
    total: feedbacks.length,
    new: feedbacks.filter(f => f.status === 'new').length,
    reviewed: feedbacks.filter(f => f.status === 'reviewed').length,
    resolved: feedbacks.filter(f => f.status === 'resolved').length,
    avgRating: feedbacks.length > 0 
      ? (feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.filter(f => f.rating).length).toFixed(1)
      : 0
  };

  const filteredFeedbacks = activeTab === 'all' 
    ? feedbacks 
    : feedbacks.filter(f => f.status === activeTab);

  const getTypeIcon = (type) => {
    switch(type) {
      case 'bug': return <Bug className="w-4 h-4 text-rose-600" />;
      case 'feature_request': return <Lightbulb className="w-4 h-4 text-amber-600" />;
      case 'praise': return <ThumbsUp className="w-4 h-4 text-emerald-600" />;
      default: return <MessageSquare className="w-4 h-4 text-slate-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      new: { label: 'New', className: 'bg-blue-100 text-blue-700' },
      reviewed: { label: 'Reviewed', className: 'bg-yellow-100 text-yellow-700' },
      resolved: { label: 'Resolved', className: 'bg-green-100 text-green-700' }
    };
    const { label, className } = config[status] || config.new;
    return <Badge className={className}>{label}</Badge>;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading feedback...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Feedback Management</h1>
        <p className="text-slate-600 mt-1">Review and manage beta user feedback</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-xs text-slate-500">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.new}</p>
                <p className="text-xs text-slate-500">New</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.reviewed}</p>
                <p className="text-xs text-slate-500">Reviewed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.resolved}</p>
                <p className="text-xs text-slate-500">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.avgRating}</p>
                <p className="text-xs text-slate-500">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="new">New ({stats.new})</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed ({stats.reviewed})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({stats.resolved})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {filteredFeedbacks.length === 0 ? (
            <Card className="border-slate-200">
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No feedback in this category</p>
              </CardContent>
            </Card>
          ) : (
            filteredFeedbacks.map((feedback) => (
              <Card key={feedback.id} className="border-slate-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getTypeIcon(feedback.feedback_type)}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-base capitalize">
                            {feedback.feedback_type.replace('_', ' ')}
                          </CardTitle>
                          {getStatusBadge(feedback.status)}
                        </div>
                        <p className="text-sm text-slate-500">
                          {feedback.user_name} • {feedback.user_email} • {feedback.page}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(feedback.created_date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {feedback.rating && (
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < feedback.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 mb-4">{feedback.message}</p>
                  
                  <div className="flex gap-2">
                    {feedback.status !== 'reviewed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({ 
                          id: feedback.id, 
                          status: 'reviewed' 
                        })}
                      >
                        Mark as Reviewed
                      </Button>
                    )}
                    {feedback.status !== 'resolved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({ 
                          id: feedback.id, 
                          status: 'resolved' 
                        })}
                      >
                        Mark as Resolved
                      </Button>
                    )}
                    {feedback.status !== 'new' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateStatusMutation.mutate({ 
                          id: feedback.id, 
                          status: 'new' 
                        })}
                      >
                        Reset to New
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}