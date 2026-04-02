import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Eye, Plus, Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function ClientsTable({ clients, isLoading, onSelectClient, onMessage }) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </CardContent>
      </Card>
    );
  }

  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto mb-3 flex items-center justify-center">
            <Plus className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">No clients yet</h3>
          <p className="text-slate-600 text-sm mb-4">
            Patients who sign up with your referral code will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Clients</CardTitle>
        <CardDescription>{clients.length} client{clients.length !== 1 ? 's' : ''} managed</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-600">Client</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-600">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-600">Health Score</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-600">Adherence</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-600">Last Active</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(client => (
                <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50">
                  {/* Client Name */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={client.client_photo_url} />
                        <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
                          {client.client_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{client.client_name}</p>
                        <p className="text-xs text-slate-500">{client.client_email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Subscription Status */}
                  <td className="py-4 px-4">
                    <Badge className={client.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                      {client.subscription_status}
                    </Badge>
                  </td>

                  {/* Health Score */}
                  <td className="py-4 px-4">
                    <div className="font-medium text-slate-900">
                      {client.health_score ?? '—'}{client.health_score ? '/100' : ''}
                    </div>
                  </td>

                  {/* Adherence */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 transition-all"
                          style={{ width: `${client.meal_plan_adherence_week || 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-700">
                        {client.meal_plan_adherence_week || 0}%
                      </span>
                    </div>
                  </td>

                  {/* Last Active */}
                  <td className="py-4 px-4 text-sm text-slate-600">
                    {client.last_active_date ? new Date(client.last_active_date).toLocaleDateString() : 'Never'}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSelectClient(client.id)}
                        className="gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onMessage(client)}
                        className="gap-1"
                      >
                        <MessageSquare className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}