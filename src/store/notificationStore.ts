import { create } from 'zustand';
import { Notification } from '@/types/leave';
import { useAuthStore } from './authStore';
import { toast } from 'sonner';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  clearError: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = useAuthStore.getState().accessToken;
      const response = await fetch("/api/notifications", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to fetch notifications");
      const { notifications } = await response.json();
      
      const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;
      
      set({ notifications, unreadCount, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      const token = useAuthStore.getState().accessToken;
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to mark notification as read");
      
      set((state) => {
        const updated = state.notifications.map((n) => 
          n._id === id ? { ...n, isRead: true } : n
        );
        const unreadCount = updated.filter((n) => !n.isRead).length;
        return { notifications: updated, unreadCount };
      });
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to mark as read", { description: error.message });
    }
  },

  markAllAsRead: async () => {
    try {
      const token = useAuthStore.getState().accessToken;
      const response = await fetch("/api/notifications/read-all", {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to mark all as read");
      
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
      toast.success("All caught up", { description: "All notifications marked as read." });
    } catch (error: any) {
      set({ error: error.message });
      toast.error("Failed to mark all as read", { description: error.message });
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => {
      const isDuplicate = state.notifications.some(n => n._id === notification._id);
      if (isDuplicate) return state;
      
      const updated = [notification, ...state.notifications];
      const unreadCount = updated.filter((n) => !n.isRead).length;
      return { notifications: updated, unreadCount };
    });
  },

  clearError: () => set({ error: null }),
}));
