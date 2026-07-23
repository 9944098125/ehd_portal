import { Leave, LeaveBalance, LeaveFilters, LeaveRequest } from "@/types/leave";
import { useAuthStore } from "@/store/authStore";

const getHeaders = () => {
  const token = useAuthStore.getState().accessToken;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const leaveService = {
  getLeaves: async (filters: LeaveFilters) => {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append("status", filters.status);
    if (filters.leaveType) queryParams.append("leaveType", filters.leaveType);
    if (filters.department) queryParams.append("department", filters.department);
    if (filters.search) queryParams.append("search", filters.search);
    if (filters.page) queryParams.append("page", filters.page.toString());
    if (filters.limit) queryParams.append("limit", filters.limit.toString());
    
    const response = await fetch(`/api/leaves?${queryParams.toString()}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch leaves");
    const json = await response.json();
    return json.data;
  },

  getMyLeaves: async (filters?: LeaveFilters) => {
    const response = await fetch("/api/leaves/my", {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch my leaves");
    const json = await response.json();
    return json.data;
  },

  applyLeave: async (data: LeaveRequest) => {
    const response = await fetch("/api/leaves", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to apply leave");
    }
    const json = await response.json();
    return json.data;
  },

  approveLeave: async (id: string, remarks?: string) => {
    const response = await fetch(`/api/leaves/${id}/approve`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ remarks }),
    });
    if (!response.ok) throw new Error("Failed to approve leave");
    const json = await response.json();
    return json.data;
  },

  rejectLeave: async (id: string, remarks?: string) => {
    const response = await fetch(`/api/leaves/${id}/reject`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ remarks }),
    });
    if (!response.ok) throw new Error("Failed to reject leave");
    const json = await response.json();
    return json.data;
  },

  cancelLeave: async (id: string) => {
    const response = await fetch(`/api/leaves/${id}/cancel`, {
      method: "PATCH",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to cancel leave");
    const json = await response.json();
    return json.data;
  },

  getLeaveBalance: async () => {
    const response = await fetch("/api/leaves/balance", {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch leave balance");
    const json = await response.json();
    return json.data;
  },
};
