import { fetchApi } from "./api";

export const getProjects = async (params = {}) => {
  const queryString = new URLSearchParams(params as Record<string, string>).toString();
  return fetchApi(`/api/projects?${queryString}`);
};

export const getProject = async (id: string) => {
  return fetchApi(`/api/projects/${id}`);
};

export const createProject = async (data: any) => {
  return fetchApi("/api/projects", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateProject = async (id: string, data: any) => {
  return fetchApi(`/api/projects/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteProject = async (id: string) => {
  return fetchApi(`/api/projects/${id}`, {
    method: "DELETE",
  });
};

export const getMyProjects = async () => {
  return fetchApi("/api/projects/my-projects");
};
