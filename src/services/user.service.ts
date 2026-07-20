import { fetchApi } from "./api";

export const getUsers = async (params: Record<string, string> = {}) => {
  const query = new URLSearchParams(params).toString();
  return fetchApi(`/api/users${query ? `?${query}` : ""}`);
};

export const getUser = async (id: string) => {
  return fetchApi(`/api/users/${id}`);
};

export const createUser = async (data: any) => {
  return fetchApi("/api/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateUser = async (id: string, data: any) => {
  return fetchApi(`/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteUser = async (id: string) => {
  return fetchApi(`/api/users/${id}`, {
    method: "DELETE",
  });
};
