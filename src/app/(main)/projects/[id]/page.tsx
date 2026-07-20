"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProject } from "@/services/project.service";
import { ProjectType } from "@/store/projectStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Link as LinkIcon, Paperclip, CheckCircle2, CircleDashed, Users, Tag, AlertCircle } from "lucide-react";

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [project, setProject] = useState<ProjectType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await getProject(id);
        setProject(response.data);
      } catch (err: any) {
        setError(err.message || "Failed to load project details");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProject();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-10 w-48 mb-4" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6 md:p-8 max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Project Not Found</h2>
        <p className="text-zinc-500">{error || "The project you are looking for does not exist."}</p>
        <Button onClick={() => router.push("/projects")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "ACTIVE": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "ON_HOLD": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      case "PLANNING": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      default: return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL": return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900";
      case "HIGH": return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-900";
      case "MEDIUM": return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900";
      case "LOW": return "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700";
      default: return "";
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/projects")} className="h-10 w-10 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ backgroundColor: `${project.color}20` }}
          >
            {project.icon ? (
              <div dangerouslySetInnerHTML={{ __html: project.icon }} className="w-7 h-7 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full" />
            ) : "📁"}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                {project.name}
              </h1>
              <Badge className={`${getStatusColor(project.status)} hover:bg-opacity-80 border-0`}>
                {project.status.replace("_", " ")}
              </Badge>
              <Badge variant="outline" className={`${getPriorityColor(project.priority)}`}>
                {project.priority} Priority
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1 text-zinc-500">
              <Badge variant="secondary" className="font-mono text-xs">{project.code}</Badge>
              <span>•</span>
              <span className="text-sm">Created {formatDate(project.createdAt)} by {project.createdBy?.firstName} {project.createdBy?.lastName}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-semibold mb-4">About Project</h2>
            <div className="prose dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">
              {project.description}
            </div>
          </div>

          {/* Progress & Tickets */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
              Ticket Progress
              <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">{Math.round(project.progress || 0)}%</span>
            </h2>
            <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden mb-6">
              <div 
                className="h-full bg-blue-600 transition-all duration-1000 ease-out"
                style={{ width: `${project.progress || 0}%`, backgroundColor: project.color }}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl">
                <span className="text-zinc-500 text-sm mb-1 flex items-center gap-1"><CircleDashed className="w-4 h-4" /> Total Tickets</span>
                <span className="text-2xl font-bold">{project.totalTickets || 0}</span>
              </div>
              <div className="flex flex-col p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl">
                <span className="text-green-600 dark:text-green-400 text-sm mb-1 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Completed</span>
                <span className="text-2xl font-bold text-green-700 dark:text-green-500">{project.completedTickets || 0}</span>
              </div>
              <div className="flex flex-col p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl">
                <span className="text-amber-600 dark:text-amber-400 text-sm mb-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Remaining</span>
                <span className="text-2xl font-bold text-amber-700 dark:text-amber-500">{(project.totalTickets || 0) - (project.completedTickets || 0)}</span>
              </div>
            </div>
          </div>

          {/* Attachments */}
          {project.attachments && project.attachments.length > 0 && (
            <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Paperclip className="w-5 h-5" /> Attachments</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {project.attachments.map((url, i) => (
                  <a 
                    key={i} 
                    href={url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="group relative rounded-xl overflow-hidden aspect-square border border-zinc-200 dark:border-zinc-800 block"
                  >
                    <img src={url} alt="Attachment" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white text-sm font-medium bg-black/60 px-3 py-1 rounded-full">View</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Key Dates */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-zinc-500" /> Key Dates</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-zinc-100 dark:border-zinc-800/50">
                <span className="text-zinc-500 text-sm">Start Date</span>
                <span className="font-medium text-sm">{formatDate(project.startDate)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-zinc-100 dark:border-zinc-800/50">
                <span className="text-zinc-500 text-sm">Expected End</span>
                <span className="font-medium text-sm">{formatDate(project.expectedEndDate)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-sm">Actual End</span>
                <span className="font-medium text-sm text-green-600 dark:text-green-500">{formatDate(project.actualEndDate)}</span>
              </div>
            </div>
          </div>

          {/* Links */}
          {(project.repository || project.documentation) && (
            <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><LinkIcon className="w-4 h-4 text-zinc-500" /> Resources</h3>
              <div className="space-y-3">
                {project.repository && (
                  <a href={project.repository} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-zinc-700 dark:text-zinc-300 transition-colors">
                    <div className="p-2 bg-white dark:bg-zinc-950 rounded-lg shadow-sm"><LinkIcon className="w-4 h-4" /></div>
                    <div className="flex-1 overflow-hidden">
                      <div className="text-sm font-medium">Repository</div>
                      <div className="text-xs text-blue-500 truncate">{project.repository}</div>
                    </div>
                  </a>
                )}
                {project.documentation && (
                  <a href={project.documentation} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-zinc-700 dark:text-zinc-300 transition-colors">
                    <div className="p-2 bg-white dark:bg-zinc-950 rounded-lg shadow-sm"><LinkIcon className="w-4 h-4" /></div>
                    <div className="flex-1 overflow-hidden">
                      <div className="text-sm font-medium">Documentation</div>
                      <div className="text-xs text-blue-500 truncate">{project.documentation}</div>
                    </div>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Tag className="w-4 h-4 text-zinc-500" /> Tags</h3>
              <div className="flex flex-wrap gap-2">
                {project.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="px-3 py-1 font-normal bg-zinc-100 dark:bg-zinc-800">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Team */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <h3 className="font-semibold mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2"><Users className="w-4 h-4 text-zinc-500" /> Team</div>
              <Badge variant="outline">{project.team?.length || 0} Members</Badge>
            </h3>
            
            <div className="space-y-3 mt-4">
              {project.teamLead && (
                <div className="mb-4">
                  <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Team Lead</div>
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                    <img 
                      src={project.teamLead.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${project.teamLead.firstName} ${project.teamLead.lastName}`}
                      alt="Lead" 
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <div className="text-sm font-medium">{project.teamLead.firstName} {project.teamLead.lastName}</div>
                      <div className="text-xs text-blue-600 dark:text-blue-400">{project.teamLead.department}</div>
                    </div>
                  </div>
                </div>
              )}

              {project.team && project.team.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Members</div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {project.team.filter(m => m._id !== project.teamLead?._id).map((member: any) => (
                      <div key={member._id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                        <img 
                          src={member.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${member.firstName} ${member.lastName}`}
                          alt="Member" 
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{member.firstName} {member.lastName}</div>
                          <div className="text-xs text-zinc-500 truncate">{member.department}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
