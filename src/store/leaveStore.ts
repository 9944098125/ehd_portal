import { create } from 'zustand';
import { Leave, LeaveFilters, LeaveRequest } from '@/types/leave';
import { leaveService } from '@/services/leave.service';

interface LeaveState {
  leaves: Leave[];
  myLeaves: Leave[];
  pendingLeaves: Leave[];
  historyLeaves: Leave[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;

  fetchLeaves: (filters?: LeaveFilters) => Promise<void>;
  fetchMyLeaves: () => Promise<void>;
  fetchPendingLeaves: () => Promise<void>;
  fetchAllHistoryLeaves: () => Promise<void>;
  applyLeave: (data: LeaveRequest) => Promise<void>;
  approveLeave: (id: string, remarks?: string) => Promise<void>;
  rejectLeave: (id: string, remarks?: string) => Promise<void>;
  cancelLeave: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useLeaveStore = create<LeaveState>((set, get) => ({
  leaves: [],
  myLeaves: [],
  pendingLeaves: [],
  historyLeaves: [],
  isLoading: false,
  error: null,
  totalCount: 0,

  fetchLeaves: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const { leaves, total } = await leaveService.getLeaves(filters);
      set({ leaves, totalCount: total, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchMyLeaves: async () => {
    set({ isLoading: true, error: null });
    try {
      const { leaves } = await leaveService.getMyLeaves();
      set({ myLeaves: leaves, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchPendingLeaves: async () => {
    set({ isLoading: true, error: null });
    try {
      const { leaves } = await leaveService.getLeaves({ status: "PENDING" });
      set({ pendingLeaves: leaves, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchAllHistoryLeaves: async () => {
    set({ isLoading: true, error: null });
    try {
      const { leaves, total } = await leaveService.getLeaves({});
      set({ historyLeaves: leaves, totalCount: total, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  applyLeave: async (data: LeaveRequest) => {
    set({ isLoading: true, error: null });
    try {
      const { leave } = await leaveService.applyLeave(data);
      set((state) => ({
        myLeaves: [leave, ...state.myLeaves],
        historyLeaves: [leave, ...state.historyLeaves],
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  approveLeave: async (id: string, remarks?: string) => {
    set({ isLoading: true, error: null });
    try {
      const { leave } = await leaveService.approveLeave(id, remarks);
      set((state) => ({
        leaves: state.leaves.map((l) => (l._id === id ? leave : l)),
        pendingLeaves: state.pendingLeaves.filter((l) => l._id !== id),
        historyLeaves: state.historyLeaves.map((l) => (l._id === id ? leave : l)),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  rejectLeave: async (id: string, remarks?: string) => {
    set({ isLoading: true, error: null });
    try {
      const { leave } = await leaveService.rejectLeave(id, remarks);
      set((state) => ({
        leaves: state.leaves.map((l) => (l._id === id ? leave : l)),
        pendingLeaves: state.pendingLeaves.filter((l) => l._id !== id),
        historyLeaves: state.historyLeaves.map((l) => (l._id === id ? leave : l)),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  cancelLeave: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { leave } = await leaveService.cancelLeave(id);
      set((state) => ({
        myLeaves: state.myLeaves.map((l) => (l._id === id ? leave : l)),
        historyLeaves: state.historyLeaves.map((l) => (l._id === id ? leave : l)),
        pendingLeaves: state.pendingLeaves.filter((l) => l._id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
