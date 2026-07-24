import { create } from "zustand";
import { getUsers, createUser, updateUser, deleteUser } from "@/services/user.service";
import { toast } from 'sonner';

interface EmployeeState {
  users: any[];
  isLoading: boolean;
  error: string | null;
  fetchUsers: (params?: Record<string, string>) => Promise<void>;
  addUser: (data: any) => Promise<void>;
  editUser: (id: string, data: any) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
}

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  users: [],
  isLoading: false,
  error: null,

  fetchUsers: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getUsers(params);
      set({ users: response.data.users, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      toast.error("Failed to fetch users", { description: error.message });
    }
  },

  addUser: async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await createUser(data);
      set((state) => ({
        users: [response.data, ...state.users],
        isLoading: false,
      }));
      toast.success("User added", { description: "Employee has been successfully added." });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      toast.error("Failed to add user", { description: error.message });
      throw error;
    }
  },

  editUser: async (id: string, data: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await updateUser(id, data);
      set((state) => ({
        users: state.users.map((u) => (u._id === id ? response.data : u)),
        isLoading: false,
      }));
      toast.success("User updated", { description: "Employee details have been saved." });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      toast.error("Failed to update user", { description: error.message });
      throw error;
    }
  },

  removeUser: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await deleteUser(id);
      set((state) => ({
        users: state.users.filter((u) => u._id !== id),
        isLoading: false,
      }));
      toast.success("User deleted", { description: "Employee has been successfully removed." });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      toast.error("Failed to delete user", { description: error.message });
      throw error;
    }
  },
}));
