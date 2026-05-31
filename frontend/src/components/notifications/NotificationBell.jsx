import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

// The API returns notification fields in camelCase (createdDate, read, actionUrl).
// These accessors tolerate either casing so the bell never reads `undefined`.
const notifIsRead = (n) => n.read ?? n.is_read ?? false;
const notifActionUrl = (n) => n.actionUrl ?? n.action_url ?? null;
const notifCreatedAt = (n) => n.createdDate ?? n.created_date ?? n.createdAt ?? null;

// Guard against missing/invalid timestamps — date-fns throws "Invalid time value"
// on an invalid Date, which would crash the whole app shell.
function safeRelativeTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return formatDistanceToNow(date, { addSuffix: true });
}

function NotificationBellContent() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        return await base44.entities.Notification.filter({ user_email: user?.email }, '-created_date', 50);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }
    },
    enabled: !!user?.email,
    refetchInterval: 30000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => base44.entities.Notification.update(notificationId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifications = notifications.filter(n => !notifIsRead(n));
      await Promise.all(
        unreadNotifications.map(n => base44.entities.Notification.update(n.id, { is_read: true }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notifications.filter(n => !notifIsRead(n)).length;

  const handleNotificationClick = (notification) => {
    if (!notifIsRead(notification)) {
      markAsReadMutation.mutate(notification.id);
    }
    const actionUrl = notifActionUrl(notification);
    if (actionUrl) {
      window.location.href = actionUrl;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'meal_reminder': return '🍴';
      case 'streak_alert': return '🔥';
      case 'weekly_plan': return '📅';
      case 'supplement_reminder': return '💊';
      case 'lab_reminder': return '🧬';
      case 'health_digest': return '📊';
      case 'goal_checkin': return '🎯';
      case 'new_follower': return '👤';
      case 'plan_comment': return '💬';
      case 'recipe_comment': return '💬';
      case 'plan_like': return '❤️';
      case 'recipe_like': return '❤️';
      case 'forum_reply': return '💭';
      default: return '🔔';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => markAllAsReadMutation.mutate()}>
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                    !notifIsRead(notification) ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                      <p className="text-xs text-slate-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {safeRelativeTime(notifCreatedAt(notification))}
                      </p>
                    </div>
                    {!notifIsRead(notification) && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export default function NotificationBell() {
  try {
    useQueryClient();
    return <NotificationBellContent />;
  } catch {
    return null;
  }
}