import { create } from "zustand";
import { getTickets, createTicket, updateTicket, deleteTicket } from "@/services/ticket.service";

interface TicketState {
  tickets: any[];
  isLoading: boolean;
  error: string | null;
  fetchTickets: (params?: Record<string, string>) => Promise<void>;
  addTicket: (data: any) => Promise<void>;
  editTicket: (id: string, data: any) => Promise<void>;
  removeTicket: (id: string) => Promise<void>;
  updateTicketStatusOptimistic: (id: string, newStatus: string) => void;
}

export const useTicketStore = create<TicketState>((set, get) => ({
  tickets: [],
  isLoading: false,
  error: null,

  fetchTickets: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getTickets(params);
      set({ tickets: response.data.tickets, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  addTicket: async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await createTicket(data);
      set((state) => ({
        tickets: [response.data, ...state.tickets],
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  editTicket: async (id: string, data: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await updateTicket(id, data);
      set((state) => ({
        tickets: state.tickets.map((t) => (t._id === id ? response.data : t)),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  removeTicket: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await deleteTicket(id);
      set((state) => ({
        tickets: state.tickets.filter((t) => t._id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateTicketStatusOptimistic: (id: string, newStatus: string) => {
    set((state) => ({
      tickets: state.tickets.map((t) => (t._id === id ? { ...t, status: newStatus } : t)),
    }));
  },
}));
