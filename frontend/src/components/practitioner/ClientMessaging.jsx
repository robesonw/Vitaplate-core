import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ClientMessaging({ client, onClose }) {
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['clientMessages', client?.client_email, user?.email],
    queryFn: async () => {
      if (!client?.client_email || !user?.email) return [];
      return await base44.entities.PractitionerMessage.filter({
        practitioner_email: user.email,
        client_email: client.client_email
      });
    },
    enabled: !!client?.client_email && !!user?.email,
    refetchInterval: 3000
  });

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    setIsSending(true);
    try {
      await base44.entities.PractitionerMessage.create({
        practitioner_email: user.email,
        client_email: client.client_email,
        sender_email: user.email,
        sender_type: 'practitioner',
        message: messageText,
        sent_date: new Date().toISOString().split('T')[0]
      });

      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['clientMessages'] });
      toast.success('Message sent');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="h-full flex flex-col border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{client.client_name}</CardTitle>
          <p className="text-sm text-slate-500 mt-1">{client.client_email}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-3 p-4 bg-slate-50 rounded-lg">
          {messages.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-8">No messages yet</p>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender_type === 'practitioner' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.sender_type === 'practitioner'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-900'
                }`}>
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-xs mt-1 ${
                    msg.sender_type === 'practitioner'
                      ? 'text-indigo-100'
                      : 'text-slate-500'
                  }`}>
                    {new Date(msg.sent_date).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="space-y-2">
          <Textarea
            placeholder="Type your message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleSendMessage();
              }
            }}
            className="resize-none h-20"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isSending || !messageText.trim()}
            className="w-full gap-2"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}