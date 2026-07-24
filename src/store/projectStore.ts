import { create } from "zustand";
import { getProjects, createProject, updateProject, deleteProject, getMyProjects } from "@/services/project.service";
import { toast } from 'sonner';

export interface ProjectType {
  _id: string;
  name: string;
  code: string;
  description: string;
  status: "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  team: any[];
  teamLead?: any;
  startDate?: string;
  expectedEndDate?: string;
  actualEndDate?: string;
  color: string;
  icon?: string;
  tags?: string[];
  repository?: string;
  jiraBoard?: string;
  documentation?: string;
  attachments?: string[];
  createdBy: any;
  updatedBy: any;
  createdAt: string;
  updatedAt: string;
  totalTickets?: number;
  completedTickets?: number;
  progress?: number;
  totalTimeLogged?: number;
}

interface ProjectState {
  projects: ProjectType[];
  myProjects: ProjectType[];
  isLoading: boolean;
  error: string | null;
  total: number;
  fetchProjects: (params?: Record<string, string>) => Promise<void>;
  fetchMyProjects: () => Promise<void>;
  addProject: (data: Partial<ProjectType>) => Promise<void>;
  editProject: (id: string, data: Partial<ProjectType>) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  myProjects: [],
  isLoading: false,
  error: null,
  total: 0,

  fetchProjects: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getProjects(params);
      set({ 
        projects: response.data.projects, 
        total: response.data.pagination.total,
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      toast.error("Failed to fetch projects", { description: error.message });
    }
  },

  fetchMyProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await getMyProjects();
      set({ myProjects: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      toast.error("Failed to fetch your projects", { description: error.message });
    }
  },

  addProject: async (data: Partial<ProjectType>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await createProject(data);
      set((state) => ({
        projects: [response.data, ...state.projects],
        total: state.total + 1,
        isLoading: false,
      }));
      toast.success("Project created", { description: "The new project has been successfully added." });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      toast.error("Failed to create project", { description: error.message });
      throw error;
    }
  },

  editProject: async (id: string, data: Partial<ProjectType>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await updateProject(id, data);
      set((state) => ({
        projects: state.projects.map((p) => (p._id === id ? response.data : p)),
        isLoading: false,
      }));
      toast.success("Project updated", { description: "Project details have been saved." });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      toast.error("Failed to update project", { description: error.message });
      throw error;
    }
  },

  removeProject: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await deleteProject(id);
      set((state) => ({
        projects: state.projects.filter((p) => p._id !== id),
        total: state.total - 1,
        isLoading: false,
      }));
      toast.success("Project deleted", { description: "The project has been permanently removed." });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      toast.error("Failed to delete project", { description: error.message });
      throw error;
    }
  },
}));
