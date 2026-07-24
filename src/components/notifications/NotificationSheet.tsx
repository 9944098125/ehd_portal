"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, Trash2, CalendarHeart } from "lucide-react";
import { useNotificationStore } from "@/store/notificationStore";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function NotificationSheet() {
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Disabled notification fetching for now.
    // Will be implemented later with Socket.IO.
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "LEAVE_REQUESTED":
        return <Bell className="h-4 w-4 text-blue-500" />;
      case "LEAVE_APPROVED":
        return <Check className="h-4 w-4 text-green-500" />;
      case "LEAVE_REJECTED":
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case "ORGANIZATION_LEAVE_ANNOUNCEMENT":
        return <CalendarHeart className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger render={
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 rounded-full"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      } />
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <SheetTitle>Notifications</SheetTitle>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => markAllAsRead()} className="text-xs">
              Mark all as read
            </Button>
          )}
        </SheetHeader>
        <ScrollArea className="flex-1 -mx-6 px-6">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground space-y-2">
              <Bell className="h-8 w-8 opacity-20" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={cn(
                    "flex gap-3 p-3 rounded-lg transition-colors cursor-pointer border",
                    !notification.isRead ? "bg-muted/50 border-primary/20" : "bg-transparent border-transparent hover:bg-muted/30"
                  )}
                  onClick={() => {
                    if (!notification.isRead) markAsRead(notification._id);
                  }}
                >
                  <div className="mt-1 flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-background border shadow-sm flex items-center justify-center">
                      {getIcon(notification.type)}
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={cn("text-sm", !notification.isRead && "font-medium")}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="flex-shrink-0 flex items-center">
                      <div className="h-2 w-2 bg-primary rounded-full" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
