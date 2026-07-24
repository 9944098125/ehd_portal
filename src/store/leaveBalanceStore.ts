import { create } from 'zustand';
import { LeaveBalance } from '@/types/leave';
import { leaveService } from '@/services/leave.service';
import { toast } from 'sonner';

interface LeaveBalanceState {
  balance: LeaveBalance | null;
  isLoading: boolean;
  error: string | null;

  fetchBalance: () => Promise<void>;
  clearError: () => void;
}

export const useLeaveBalanceStore = create<LeaveBalanceState>((set) => ({
  balance: null,
  isLoading: false,
  error: null,

  fetchBalance: async () => {
    set({ isLoading: true, error: null });
    try {
      const { balance } = await leaveService.getLeaveBalance();
      set({ balance, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      toast.error("Failed to fetch leave balance", { description: error.message });
    }
  },

  clearError: () => set({ error: null }),
}));
