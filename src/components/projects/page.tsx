"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectTable } from "./project-table";
import { ProjectModals } from "./project-modals";
import { useProjectStore } from "@/store/projectStore";
import { useAuthStore } from "@/store/authStore";

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function ProjectsPage() {
  const { user } = useAuthStore();
  const { fetchProjects, projects } = useProjectStore();
  
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const loadProjects = useCallback(() => {
    if (user?.role === "Admin" || user?.role === "Super Admin") {
      const params: Record<string, string> = {
        search: debouncedSearch,
        sortField,
        sortOrder
      };
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (priorityFilter !== "ALL") params.priority = priorityFilter;
      
      fetchProjects(params);
    }
  }, [user, debouncedSearch, statusFilter, priorityFilter, sortField, sortOrder, fetchProjects]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  if (user?.role !== "Admin" && user?.role !== "Super Admin") {
    return <div className="p-8 text-center text-red-500">You do not have permission to view this page.</div>;
  }

  return (
    <div className="flex flex-col h-full w-full gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Projects</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Manage projects, track progress, and assignments.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 h-11 px-6">
          <Plus className="w-4 h-4" />
          Create Project
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
          <Filter className="w-4 h-4" /> Filters
        </div>
        
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || "ALL")}>
          <SelectTrigger className="w-[140px] bg-white dark:bg-zinc-950">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="PLANNING">Planning</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="ON_HOLD">On Hold</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v || "ALL")}>
          <SelectTrigger className="w-[140px] bg-white dark:bg-zinc-950">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Priority</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
          </SelectContent>
        </Select>

        <div className="hidden sm:block w-[1px] h-8 bg-zinc-200 dark:bg-zinc-800 mx-2" />
        
        <Select value={sortField} onValueChange={(v) => setSortField(v || "createdAt")}>
          <SelectTrigger className="w-[160px] bg-white dark:bg-zinc-950">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Created Date</SelectItem>
            <SelectItem value="name">Project Name</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="startDate">Start Date</SelectItem>
            <SelectItem value="expectedEndDate">Expected End Date</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortOrder} onValueChange={(v) => setSortOrder(v || "desc")}>
          <SelectTrigger className="w-[120px] bg-white dark:bg-zinc-950">
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Descending</SelectItem>
            <SelectItem value="asc">Ascending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <ProjectTable
          projects={projects}
          search={search}
          setSearch={setSearch}
          onEdit={(p) => {
            setSelectedProject(p);
            setIsEditOpen(true);
          }}
          onDelete={(p) => {
            setSelectedProject(p);
            setIsDeleteOpen(true);
          }}
        />
      </div>

      <ProjectModals
        isCreateOpen={isCreateOpen}
        setIsCreateOpen={setIsCreateOpen}
        isEditOpen={isEditOpen}
        setIsEditOpen={setIsEditOpen}
        isDeleteOpen={isDeleteOpen}
        setIsDeleteOpen={setIsDeleteOpen}
        isViewOpen={isViewOpen}
        setIsViewOpen={setIsViewOpen}
        selectedProject={selectedProject}
      />
    </div>
  );
}
