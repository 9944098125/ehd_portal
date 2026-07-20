import { useAuthStore } from "@/store/authStore";

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function fetchApi<T = any>(url: string, options: FetchOptions = {}): Promise<T> {
  // Use Zustand store directly since it's client-side
  const token = useAuthStore.getState().accessToken;

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      if (typeof window !== "undefined") {
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
    }
    throw new Error(data.message || "An error occurred");
  }

  return data;
}
