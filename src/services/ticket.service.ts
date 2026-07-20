import { fetchApi } from "./api";

export const getTickets = async (params: Record<string, string> = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchApi(`/api/tickets${query ? `?${query}` : ""}`);
};

export const getTicket = async (id: string) => {
  return fetchApi(`/api/tickets/${id}`);
};

export const createTicket = async (data: any) => {
  return fetchApi("/api/tickets", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateTicket = async (id: string, data: any) => {
  return fetchApi(`/api/tickets/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteTicket = async (id: string) => {
  return fetchApi(`/api/tickets/${id}`, {
    method: "DELETE",
  });
};
