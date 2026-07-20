import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { authService } from '@/services/auth.service';
import { User, LoginCredentials } from '@/types/auth';

const customStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(name) || sessionStorage.getItem(name) || null;
  },
  setItem: (name, value) => {
    if (typeof window === 'undefined') return;
    try {
      const parsed = JSON.parse(value);
      if (parsed.state?.rememberMe) {
        localStorage.setItem(name, value);
        sessionStorage.removeItem(name);
      } else {
        sessionStorage.setItem(name, value);
        localStorage.removeItem(name);
      }
    } catch (e) {
      sessionStorage.setItem(name, value);
    }
  },
  removeItem: (name) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(name);
    sessionStorage.removeItem(name);
  },
};

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  rememberMe: boolean;
  
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,
      rememberMe: false,

      login: async (credentials) => {
        set({ isLoading: true, error: null, rememberMe: credentials.rememberMe || false });
        try {
          const response = await authService.login(credentials);
          set({
            user: response.data.user,
            accessToken: response.data.accessToken,
            isLoading: false,
          });
          
          if (typeof window !== 'undefined') {
            if (credentials.rememberMe) {
              localStorage.setItem('refreshToken', response.data.refreshToken);
              sessionStorage.removeItem('refreshToken');
            } else {
              sessionStorage.setItem('refreshToken', response.data.refreshToken);
              localStorage.removeItem('refreshToken');
            }
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'An error occurred during login';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        set({ user: null, accessToken: null, error: null, rememberMe: false });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('refreshToken');
          sessionStorage.removeItem('refreshToken');
        }
      },

      updateUser: (updatedFields) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedFields } : null,
        }));
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => customStorage),
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken, rememberMe: state.rememberMe }),
    }
  )
);
