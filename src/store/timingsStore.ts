import { create } from "zustand";
import { useAuthStore } from "./authStore";
import { toast } from 'sonner';

export interface TicketTimingSummary {
  _id: string;
  title: string;
  status: string;
  projectTitle: string;
  totalHours: number;
  dailyBreakdown: Record<number, number>; // 1: Mon... 7: Sun
}

export interface UserTimingSummary {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  profileImage?: string;
  totalHours: number;
  dailyBreakdown: Record<number, number>;
}

interface TimingsState {
  myTickets: TicketTimingSummary[];
  teamUsers: UserTimingSummary[];
  
  teamNextCursor: string | null;
  teamHasMore: boolean;
  
  isMyLoading: boolean;
  isTeamLoading: boolean;
  isFetchingNextTeamPage: boolean;
  
  error: string | null;
  
  filters: {
    search: string;
    department: string;
    role: string;
    project: string;
  };
  currentWeekStart: Date;
}

interface TimingsActions {
  setFilters: (filters: Partial<TimingsState["filters"]>) => void;
  setWeek: (date: Date) => void;
  nextWeek: () => void;
  prevWeek: () => void;
  fetchMyTimings: () => Promise<void>;
  fetchTeamTimings: () => Promise<void>;
  fetchNextTeamPage: () => Promise<void>;
  fetchAllInitial: () => Promise<void>;
  reset: () => void;
}

export const getMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const initialState: Omit<TimingsState, "currentWeekStart"> = {
  myTickets: [],
  teamUsers: [],
  teamNextCursor: null,
  teamHasMore: false,
  isMyLoading: true,
  isTeamLoading: true,
  isFetchingNextTeamPage: false,
  error: null,
  filters: {
    search: "",
    department: "",
    role: "",
    project: "",
  },
};

export const useTimingsStore = create<TimingsState & TimingsActions>((set, get) => ({
  ...initialState,
  currentWeekStart: getMonday(new Date()),

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      myTickets: [],
      teamUsers: [],
      teamNextCursor: null,
      teamHasMore: false,
    }));
    get().fetchAllInitial();
  },

  setWeek: (date) => {
    set({ 
      currentWeekStart: getMonday(date), 
      myTickets: [],
      teamUsers: [],
      teamNextCursor: null,
      teamHasMore: false 
    });
    get().fetchAllInitial();
  },

  nextWeek: () => {
    const next = new Date(get().currentWeekStart);
    next.setDate(next.getDate() + 7);
    get().setWeek(next);
  },

  prevWeek: () => {
    const prev = new Date(get().currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    get().setWeek(prev);
  },

  fetchAllInitial: async () => {
    const role = useAuthStore.getState().user?.role;
    if (role === "Employee") {
      await get().fetchMyTimings();
    } else {
      await Promise.all([
        get().fetchMyTimings(),
        get().fetchTeamTimings()
      ]);
    }
  },

  fetchMyTimings: async () => {
    const { filters, currentWeekStart } = get();
    set({ isMyLoading: true, error: null });

    try {
      const endDate = new Date(currentWeekStart);
      endDate.setDate(endDate.getDate() + 6);

      const query = new URLSearchParams();
      if (filters.project) query.append("project", filters.project);
      
      query.append("startDate", currentWeekStart.toISOString());
      query.append("endDate", endDate.toISOString());
      query.append("limit", "1000");

      const token = useAuthStore.getState().accessToken;
      const response = await fetch(`/api/timings/my?${query.toString()}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to fetch my timings");

      const data = await response.json();
      
      set({
        myTickets: data.data.tickets,
        isMyLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isMyLoading: false });
      toast.error("Failed to load your timings", { description: error.message });
    }
  },

  fetchTeamTimings: async () => {
    const { filters, currentWeekStart } = get();
    set({ isTeamLoading: true, error: null });

    try {
      const endDate = new Date(currentWeekStart);
      endDate.setDate(endDate.getDate() + 6);

      const query = new URLSearchParams();
      if (filters.search) query.append("search", filters.search);
      if (filters.department) query.append("department", filters.department);
      if (filters.role) query.append("role", filters.role);
      if (filters.project) query.append("project", filters.project);
      
      query.append("startDate", currentWeekStart.toISOString());
      query.append("endDate", endDate.toISOString());
      query.append("limit", "10");

      const token = useAuthStore.getState().accessToken;
      const response = await fetch(`/api/timings/team?${query.toString()}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to fetch team timings");

      const data = await response.json();
      
      set({
        teamUsers: data.data.users,
        teamNextCursor: data.data.nextCursor,
        teamHasMore: data.data.hasMore,
        isTeamLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isTeamLoading: false });
      toast.error("Failed to load team timings", { description: error.message });
    }
  },

  fetchNextTeamPage: async () => {
    const { filters, teamNextCursor, teamHasMore, isFetchingNextTeamPage, currentWeekStart } = get();
    
    if (!teamHasMore || isFetchingNextTeamPage || !teamNextCursor) return;

    set({ isFetchingNextTeamPage: true, error: null });

    try {
      const endDate = new Date(currentWeekStart);
      endDate.setDate(endDate.getDate() + 6);

      const query = new URLSearchParams();
      if (filters.search) query.append("search", filters.search);
      if (filters.department) query.append("department", filters.department);
      if (filters.role) query.append("role", filters.role);
      if (filters.project) query.append("project", filters.project);
      query.append("cursor", teamNextCursor);
      query.append("startDate", currentWeekStart.toISOString());
      query.append("endDate", endDate.toISOString());
      query.append("limit", "10");

      const token = useAuthStore.getState().accessToken;
      const response = await fetch(`/api/timings/team?${query.toString()}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to fetch next team page");

      const data = await response.json();

      set((state) => ({
        teamUsers: [...state.teamUsers, ...data.data.users],
        teamNextCursor: data.data.nextCursor,
        teamHasMore: data.data.hasMore,
        isFetchingNextTeamPage: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isFetchingNextTeamPage: false });
      toast.error("Failed to load more timings", { description: error.message });
    }
  },

  reset: () => set({ ...initialState, currentWeekStart: getMonday(new Date()) }),
}));
