"use client"

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  message: string;
  read: boolean;
  created_at: string;
  type: string;
  task_id: string | null;
}

export function NotificationsPopover() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Fetch notifications when component mounts or user changes
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);
          
        if (error) throw error;
        
        if (data) {
          setNotifications(data as Notification[]);
          setUnreadCount(data.filter(n => !n.read).length);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    
    fetchNotifications();
    
    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
        
      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
        
      if (error) throw error;
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Navigate if task related
    if (notification.task_id) {
      router.push(`/dashboard/tasks/${notification.task_id}`);
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end">
        <div className="flex items-center justify-between p-4 pb-2">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto p-0 text-xs font-medium"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <Tabs defaultValue="all" className="w-full">
          <div className="border-b px-4">
            <TabsList className="h-9 w-full justify-start rounded-none bg-transparent p-0">
              <TabsTrigger
                value="all"
                className="h-9 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="unread"
                className="h-9 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Unread
                {unreadCount > 0 && ` (${unreadCount})`}
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="all" className="pt-2">
            <ScrollArea className="h-[300px]">
              {notifications.length === 0 ? (
                <div className="flex h-[200px] items-center justify-center">
                  <p className="text-sm text-muted-foreground">No notifications</p>
                </div>
              ) : (
                <div className="flex flex-col divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`cursor-pointer p-4 hover:bg-muted ${
                        !notification.read ? 'bg-muted/50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm">{notification.message}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="mt-0.5 h-2 w-2 rounded-full bg-primary"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="unread" className="pt-2">
            <ScrollArea className="h-[300px]">
              {notifications.filter(n => !n.read).length === 0 ? (
                <div className="flex h-[200px] items-center justify-center">
                  <p className="text-sm text-muted-foreground">No unread notifications</p>
                </div>
              ) : (
                <div className="flex flex-col divide-y">
                  {notifications
                    .filter(n => !n.read)
                    .map((notification) => (
                      <div
                        key={notification.id}
                        className="cursor-pointer bg-muted/50 p-4 hover:bg-muted"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm">{notification.message}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          <div className="mt-0.5 h-2 w-2 rounded-full bg-primary"></div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}