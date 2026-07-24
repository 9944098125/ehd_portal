import { create } from "zustand";
import { TimeEntry, CreateTimeEntryPayload, UpdateTimeEntryPayload } from "@/types/timeTracking";
import { fetchApi } from "@/services/api";
import { toast } from 'sonner';

interface TimeTrackingState {
  entries: TimeEntry[];
  loading: boolean;
  totalTime: number; // for a specific ticket context
  myTime: number; // for a specific ticket context
  fetchLogs: (ticketId: string, userId?: string) => Promise<void>;
  createLog: (payload: CreateTimeEntryPayload, userId?: string) => Promise<void>;
  updateLog: (id: string, payload: UpdateTimeEntryPayload, userId?: string) => Promise<void>;
  deleteLog: (id: string) => Promise<void>;
}

export const useTimeTrackingStore = create<TimeTrackingState>((set, get) => ({
  entries: [],
  loading: false,
  totalTime: 0,
  myTime: 0,

  fetchLogs: async (ticketId, userId) => {
    set({ loading: true });
    try {
      const data = await fetchApi(`/api/time-entries?ticketId=${ticketId}&limit=100&t=${Date.now()}`, { cache: 'no-store' });
      
      const fetchedEntries = data.data.entries;
      let total = 0;
      let myTotal = 0;

      fetchedEntries.forEach((entry: TimeEntry) => {
        total += entry.hours;
        if (userId && entry.user._id === userId) {
          myTotal += entry.hours;
        }
      });

      set({ entries: fetchedEntries, totalTime: total, myTime: myTotal, loading: false });
    } catch (error: any) {
      console.error(error);
      set({ loading: false });
      toast.error("Failed to load time logs", { description: error.message });
    }
  },

  createLog: async (payload, userId) => {
    try {
      await fetchApi("/api/time-entries", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      await get().fetchLogs(payload.ticket, userId);
      toast.success("Time log added", { description: "Your time has been successfully logged." });
    } catch (error: any) {
      toast.error("Failed to add time log", { description: error.message });
      throw error;
    }
  },

  updateLog: async (id, payload, userId) => {
    try {
      await fetchApi(`/api/time-entries/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const state = get();
      if (state.entries.length > 0) {
        await state.fetchLogs(state.entries[0].ticket._id || state.entries[0].ticket, userId);
      }
      toast.success("Time log updated", { description: "The time log has been modified." });
    } catch (error: any) {
      toast.error("Failed to update time log", { description: error.message });
      throw error;
    }
  },

  deleteLog: async (id) => {
    try {
      await fetchApi(`/api/time-entries/${id}`, {
        method: "DELETE",
      });

      const state = get();
      if (state.entries.length > 0) {
        await state.fetchLogs(state.entries[0].ticket._id || state.entries[0].ticket);
      }
      toast.success("Time log deleted", { description: "The time log has been removed." });
    } catch (error: any) {
      toast.error("Failed to delete time log", { description: error.message });
      throw error;
    }
  },
}));
