import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import ClientsTable from '@/components/practitioner/ClientsTable';
import ClientDetailView from '@/components/practitioner/ClientDetailView';
import ClientMessaging from '@/components/practitioner/ClientMessaging';
import { ArrowLeft, MessageSquare, Plus } from 'lucide-react';

export default function MyClients() {
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [messagingClient, setMessagingClient] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false
  });

  const { data: allClients = [], isLoading } = useQuery({
    queryKey: ['myClients', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.PractitionerClient.filter({
        practitioner_email: user.email
      });
    },
    enabled: !!user?.email
  });

  const selectedClient = allClients.find(c => c.id === selectedClientId);

  const handleCreatePlan = (client) => {
    // TODO: Open create plan dialog
    alert(`Create meal plan for ${client.client_name}`);
  };

  if (selectedClientId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedClientId(null)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">Client Details</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ClientDetailView
              clientId={selectedClientId}
              client={selectedClient}
              onBack={() => setSelectedClientId(null)}
              onCreatePlan={handleCreatePlan}
              onMessage={setMessagingClient}
            />
          </div>

          {messagingClient ? (
            <ClientMessaging
              client={messagingClient}
              onClose={() => setMessagingClient(null)}
            />
          ) : (
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => handleCreatePlan(selectedClient)}
                  className="w-full justify-start gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Meal Plan
                </Button>
                <Button
                  onClick={() => setMessagingClient(selectedClient)}
                  variant="outline"
                  className="w-full justify-start gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Send Message
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Clients</h1>
        <p className="text-slate-600 mt-1">Manage and track your patient clients</p>
      </div>

      <ClientsTable
        clients={allClients}
        isLoading={isLoading}
        onSelectClient={setSelectedClientId}
        onMessage={setMessagingClient}
      />
    </div>
  );
}