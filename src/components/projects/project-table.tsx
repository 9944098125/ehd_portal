"use client";

import { Eye, Pencil, Trash2, Search, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface ProjectTableProps {
  projects: any[];
  search: string;
  setSearch: (val: string) => void;
  onEdit: (project: any) => void;
  onDelete: (project: any) => void;
}

export function ProjectTable({
  projects,
  search,
  setSearch,
  onEdit,
  onDelete,
}: ProjectTableProps) {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900";
      case "ACTIVE": return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900";
      case "ON_HOLD": return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900";
      case "PLANNING": return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-900";
      default: return "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL": return "text-red-700 dark:text-red-400";
      case "HIGH": return "text-orange-700 dark:text-orange-400";
      case "MEDIUM": return "text-blue-700 dark:text-blue-400";
      case "LOW": return "text-zinc-700 dark:text-zinc-400";
      default: return "";
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="w-full">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 uppercase border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-4 font-medium whitespace-nowrap">Project</th>
              <th className="px-6 py-4 font-medium whitespace-nowrap">Code</th>
              <th className="px-6 py-4 font-medium whitespace-nowrap">Status</th>
              <th className="px-6 py-4 font-medium whitespace-nowrap">Priority</th>
              <th className="px-6 py-4 font-medium whitespace-nowrap">Team Lead</th>
              <th className="px-6 py-4 font-medium whitespace-nowrap text-center">Team Size</th>
              <th className="px-6 py-4 font-medium whitespace-nowrap min-w-[150px]">Progress</th>
              <th className="px-6 py-4 font-medium whitespace-nowrap">Created</th>
              <th className="px-6 py-4 font-medium whitespace-nowrap text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {projects.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-zinc-500">
                  No projects found.
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr key={project._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded flex items-center justify-center shrink-0 shadow-sm"
                        style={{ backgroundColor: `${project.color}20`, color: project.color }}
                      >
                        {project.icon ? (
                          <div dangerouslySetInnerHTML={{ __html: project.icon }} className="w-5 h-5 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full" />
                        ) : (
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-zinc-900 dark:text-zinc-100 max-w-[150px] truncate">{project.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-zinc-600 dark:text-zinc-300">{project.code}</td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={`${getStatusColor(project.status)}`}>
                      {project.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium text-xs uppercase tracking-wider ${getPriorityColor(project.priority)}`}>
                      {project.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {project.teamLead ? (
                      <div className="flex items-center gap-2">
                        <img 
                          src={project.teamLead.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${project.teamLead.firstName} ${project.teamLead.lastName}`}
                          alt="Lead" 
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[100px]">{project.teamLead.firstName} {project.teamLead.lastName}</span>
                      </div>
                    ) : (
                      <span className="text-zinc-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800">
                      {project.team?.length || 0}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${project.progress || 0}%`, backgroundColor: project.color }}
                        />
                      </div>
                      <span className="text-xs font-medium w-8 text-right">{Math.round(project.progress || 0)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 whitespace-nowrap text-xs">
                    {formatDate(project.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => router.push(`/projects/${project._id}`)} className="text-zinc-500 hover:text-blue-600 h-8 w-8">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onEdit(project)} className="text-zinc-500 hover:text-emerald-600 h-8 w-8">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(project)} className="text-zinc-500 hover:text-red-600 h-8 w-8">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
