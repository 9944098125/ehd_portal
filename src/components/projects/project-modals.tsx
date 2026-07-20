"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useProjectStore } from "@/store/projectStore";
import { useEmployeeStore } from "@/store/employeeStore";
import { uploadImageToCloudinary } from "@/utils/cloudinary";
import { Loader2, Search, UploadCloud, Trash2, X, Tag as TagIcon, Link as LinkIcon, Calendar, Upload } from "lucide-react";

interface ProjectModalsProps {
  isCreateOpen: boolean;
  setIsCreateOpen: (v: boolean) => void;
  isEditOpen: boolean;
  setIsEditOpen: (v: boolean) => void;
  isDeleteOpen: boolean;
  setIsDeleteOpen: (v: boolean) => void;
  isViewOpen: boolean;
  setIsViewOpen: (v: boolean) => void;
  selectedProject: any;
}

export function ProjectModals({
  isCreateOpen,
  setIsCreateOpen,
  isEditOpen,
  setIsEditOpen,
  isDeleteOpen,
  setIsDeleteOpen,
  isViewOpen,
  setIsViewOpen,
  selectedProject,
}: ProjectModalsProps) {
  const { addProject, editProject, removeProject } = useProjectStore();
  const { users, fetchUsers } = useEmployeeStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    status: "ACTIVE",
    priority: "MEDIUM",
    color: "#2563EB",
    icon: "",
    tags: [] as string[],
    repository: "",
    documentation: "",
    team: [] as string[],
    teamLead: "",
    startDate: "",
    expectedEndDate: "",
    actualEndDate: "",
    attachments: [] as string[],
  });
  
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [errorDialog, setErrorDialog] = useState({ open: false, message: "" });

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (isEditOpen && selectedProject) {
      setFormData({
        name: selectedProject.name || "",
        code: selectedProject.code || "",
        description: selectedProject.description || "",
        status: selectedProject.status || "ACTIVE",
        priority: selectedProject.priority || "MEDIUM",
        color: selectedProject.color || "#2563EB",
        icon: selectedProject.icon || "",
        tags: selectedProject.tags || [],
        repository: selectedProject.repository || "",
        documentation: selectedProject.documentation || "",
        team: selectedProject.team?.map((u: any) => u._id) || [],
        teamLead: selectedProject.teamLead?._id || "",
        startDate: selectedProject.startDate ? new Date(selectedProject.startDate).toISOString().split("T")[0] : "",
        expectedEndDate: selectedProject.expectedEndDate ? new Date(selectedProject.expectedEndDate).toISOString().split("T")[0] : "",
        actualEndDate: selectedProject.actualEndDate ? new Date(selectedProject.actualEndDate).toISOString().split("T")[0] : "",
        attachments: selectedProject.attachments || [],
      });
    } else if (isCreateOpen) {
      setFormData({
        name: "",
        code: "",
        description: "",
        status: "ACTIVE",
        priority: "MEDIUM",
        color: "#2563EB",
        icon: "",
        tags: [],
        repository: "",
        documentation: "",
        team: [],
        teamLead: "",
        startDate: "",
        expectedEndDate: "",
        actualEndDate: "",
        attachments: [],
      });
    }
  }, [isCreateOpen, isEditOpen, selectedProject]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const payload: any = { ...formData };
      
      // Clean up empty strings for optional references and URLs
      if (!payload.teamLead) delete payload.teamLead;
      if (!payload.startDate) delete payload.startDate;
      if (!payload.expectedEndDate) delete payload.expectedEndDate;
      if (!payload.actualEndDate) delete payload.actualEndDate;
      if (!payload.repository) delete payload.repository;
      if (!payload.documentation) delete payload.documentation;
      if (!payload.icon) delete payload.icon;

      if (isEditOpen) {
        await editProject(selectedProject._id, payload);
        setIsEditOpen(false);
      } else {
        await addProject(payload);
        setIsCreateOpen(false);
      }
    } catch (error: any) {
      console.error(error);
      setErrorDialog({ open: true, message: error.message || "Operation failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      await removeProject(selectedProject._id);
      setIsDeleteOpen(false);
    } catch (error: any) {
      console.error(error);
      setErrorDialog({ open: true, message: error.message || "Failed to delete" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const url = await uploadImageToCloudinary(e.target.files[i]);
        urls.push(url);
      }
      setFormData((prev) => ({ ...prev, attachments: [...prev.attachments, ...urls] }));
    } catch (error) {
      console.error("Upload failed", error);
      setErrorDialog({ open: true, message: "Failed to upload file. Ensure Cloudinary is configured." });
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const filteredEmployees = useMemo(() => {
    return users.filter((u) => 
      u.role === "Employee" && 
      (u.firstName.toLowerCase().includes(employeeSearch.toLowerCase()) || 
       u.lastName.toLowerCase().includes(employeeSearch.toLowerCase()) ||
       u.email.toLowerCase().includes(employeeSearch.toLowerCase()))
    );
  }, [users, employeeSearch]);

  const toggleEmployee = (userId: string) => {
    setFormData((prev) => {
      const isSelected = prev.team.includes(userId);
      let newTeam = [];
      let newLead = prev.teamLead;

      if (isSelected) {
        newTeam = prev.team.filter((id) => id !== userId);
        if (newLead === userId) newLead = ""; // Remove as lead if removed from team
      } else {
        newTeam = [...prev.team, userId];
      }

      return { ...prev, team: newTeam, teamLead: newLead };
    });
  };

  const handleTeamLeadSelect = (userId: string | null) => {
    if (!userId) {
      setFormData(prev => ({ ...prev, teamLead: "" }));
      return;
    }
    setFormData((prev) => {
      // If the selected lead isn't in the team array, automatically add them to satisfy validation
      const newTeam = prev.team.includes(userId) ? prev.team : [...prev.team, userId];
      return { ...prev, teamLead: userId, team: newTeam };
    });
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim();
      if (val && !formData.tags.includes(val)) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, val] }));
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  return (
    <>
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setIsEditOpen(false);
        }
      }}>
        <DialogContent className="max-w-[90vw] md:max-w-[80vw] w-[90vw] md:w-[80vw] bg-white dark:bg-zinc-950 max-h-[90vh] overflow-y-auto border-0 shadow-2xl rounded-2xl p-0">
          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{isEditOpen ? "Edit Project" : "Create New Project"}</DialogTitle>
            </DialogHeader>
          </div>
          
          <div className="p-6 md:p-8">
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Project Name *</label>
                  <Input
                    className="h-11"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Help Desk Redesign"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project Code *</label>
                  <Input
                    className="h-11 uppercase"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. HDR"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description *</label>
                <Textarea
                  className="min-h-[100px]"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the project"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v || "ACTIVE" })}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLANNING">Planning</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="ON_HOLD">On Hold</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v || "MEDIUM" })}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project Color</label>
                  <div className="flex gap-2 h-11">
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-14 h-11 p-1 cursor-pointer"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1 h-11"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project Icon (SVG)</label>
                  <div className="flex gap-2">
                    <div 
                      className="w-11 h-11 border border-zinc-200 dark:border-zinc-800 rounded-md flex items-center justify-center shrink-0 overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
                      dangerouslySetInnerHTML={{ __html: formData.icon || "" }}
                    />
                    <Textarea
                      className="min-h-[44px] h-11 py-2 resize-y"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="Paste SVG code..."
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2"><Calendar className="w-4 h-4" /> Start Date</label>
                  <Input
                    type="date"
                    className="h-11"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2"><Calendar className="w-4 h-4" /> Expected End Date</label>
                  <Input
                    type="date"
                    className="h-11"
                    value={formData.expectedEndDate}
                    onChange={(e) => setFormData({ ...formData, expectedEndDate: e.target.value })}
                  />
                </div>
                {isEditOpen && formData.status === "COMPLETED" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2"><Calendar className="w-4 h-4" /> Actual End Date</label>
                    <Input
                      type="date"
                      className="h-11"
                      value={formData.actualEndDate}
                      onChange={(e) => setFormData({ ...formData, actualEndDate: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 min-h-[3rem] flex flex-wrap gap-2 items-center bg-white dark:bg-zinc-950">
                  {formData.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="px-2 py-1 flex items-center gap-1">
                      {tag} <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => removeTag(tag)} />
                    </Badge>
                  ))}
                  <Input 
                    className="border-0 shadow-none focus-visible:ring-0 w-48 h-8 px-1 flex-1" 
                    placeholder="Add tags... (Press Enter)"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    onBlur={() => {
                      if (tagInput.trim()) {
                        if (!formData.tags.includes(tagInput.trim())) {
                          setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
                        }
                        setTagInput("");
                      }
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2"><LinkIcon className="w-4 h-4" /> Repository URL</label>
                  <Input
                    className="h-11"
                    type="url"
                    value={formData.repository}
                    onChange={(e) => setFormData({ ...formData, repository: e.target.value })}
                    placeholder="e.g. https://github.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2"><LinkIcon className="w-4 h-4" /> Documentation URL</label>
                  <Input
                    className="h-11"
                    type="url"
                    value={formData.documentation}
                    onChange={(e) => setFormData({ ...formData, documentation: e.target.value })}
                    placeholder="e.g. https://notion.so/..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Assign Team (Employees Only)</label>
                  <div className="relative">
                    <div 
                      className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 h-11 flex items-center justify-between bg-white dark:bg-zinc-950 cursor-pointer"
                      onClick={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)}
                    >
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">
                        {formData.team.length === 0 ? "Select team members..." : `${formData.team.length} members selected`}
                      </span>
                      <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">Edit</span>
                    </div>

                    {isTeamDropdownOpen && (
                      <div className="absolute top-full left-0 w-full mt-1 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-950 shadow-xl z-50">
                        <div className="p-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <Input
                              placeholder="Search employees..."
                              value={employeeSearch}
                              onChange={(e) => setEmployeeSearch(e.target.value)}
                              className="pl-9 h-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-sm"
                            />
                          </div>
                        </div>
                        <div className="max-h-[220px] overflow-y-auto p-2 space-y-1">
                          {filteredEmployees.length === 0 ? (
                            <div className="p-4 text-center text-sm text-zinc-500">No employees found.</div>
                          ) : (
                            filteredEmployees.map((emp) => (
                              <label
                                key={emp._id}
                                className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.team.includes(emp._id)}
                                  onChange={() => toggleEmployee(emp._id)}
                                  className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-600"
                                />
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">{emp.firstName} {emp.lastName}</span>
                                  <span className="text-xs text-zinc-500">{emp.department} • {emp.email}</span>
                                </div>
                              </label>
                            ))
                          )}
                        </div>
                        <div className="p-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                           <Button type="button" variant="secondary" className="w-full h-8 text-xs" onClick={() => setIsTeamDropdownOpen(false)}>Done</Button>
                        </div>
                      </div>
                    )}
                  </div>
                  {isTeamDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsTeamDropdownOpen(false)}></div>}
                </div>

                <div className="space-y-6">
                  <div className="space-y-2 relative z-30">
                    <label className="text-sm font-medium">Team Lead (Must be an Employee)</label>
                    <Select 
                      value={formData.teamLead} 
                      onValueChange={handleTeamLeadSelect}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select a team lead">
                          {formData.teamLead && users.find(u => u._id === formData.teamLead) ? (
                            <div className="flex items-center gap-2">
                              <img 
                                src={users.find(u => u._id === formData.teamLead)?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${users.find(u => u._id === formData.teamLead)?.firstName} ${users.find(u => u._id === formData.teamLead)?.lastName}`}
                                className="w-5 h-5 rounded-full object-cover"
                                alt="Lead"
                              />
                              <span>{users.find(u => u._id === formData.teamLead)?.firstName} {users.find(u => u._id === formData.teamLead)?.lastName}</span>
                            </div>
                          ) : (
                            formData.teamLead && selectedProject?.teamLead?._id === formData.teamLead ? (
                              <div className="flex items-center gap-2">
                                <img 
                                  src={selectedProject.teamLead.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedProject.teamLead.firstName} ${selectedProject.teamLead.lastName}`}
                                  className="w-5 h-5 rounded-full object-cover"
                                  alt="Lead"
                                />
                                <span>{selectedProject.teamLead.firstName} {selectedProject.teamLead.lastName}</span>
                              </div>
                            ) : "Select a team lead"
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-[250px]">
                        {users.filter(u => u.role === "Employee").map(emp => (
                          <SelectItem key={emp._id} value={emp._id}>
                            <div className="flex items-center gap-2">
                              <img 
                                src={emp.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${emp.firstName} ${emp.lastName}`}
                                className="w-5 h-5 rounded-full object-cover"
                                alt="Lead"
                              />
                              <span>{emp.firstName} {emp.lastName}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.teamLead && (
                      <p className="text-xs text-zinc-500">Selecting a lead automatically adds them to the team.</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">Attachments</label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-300 border-dashed rounded-xl cursor-pointer bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-900 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <UploadCloud className="w-8 h-8 mb-3 text-zinc-400" />
                          <p className="mb-2 text-sm text-zinc-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        </div>
                        <Input type="file" className="hidden" multiple onChange={handleFileUpload} disabled={isUploading} />
                      </label>
                    </div>
                    {isUploading && <div className="text-sm text-blue-500 animate-pulse font-medium">Uploading to Cloudinary...</div>}
                    
                    {formData.attachments.length > 0 && (
                      <div className="grid grid-cols-4 gap-3 mt-4">
                        {formData.attachments.map((url, i) => (
                          <div key={i} className="relative group rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 aspect-square">
                            <img src={url} className="h-full w-full object-cover" alt="Attachment" />
                            <button 
                              onClick={() => removeAttachment(i)}
                              className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-5 h-5 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 border-t border-zinc-200 dark:border-zinc-800 sticky bottom-0 z-10 flex justify-end gap-3">
            <Button variant="outline" className="h-11 px-6" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}>
              Cancel
            </Button>
            <Button className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSubmit} disabled={isSubmitting || !formData.name || !formData.code || !formData.description}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isEditOpen ? "Update Project" : "Create Project"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-0 shadow-2xl rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Delete Project</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-zinc-500">Are you sure you want to delete <strong>{selectedProject?.name}</strong>? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-0 shadow-2xl rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600">Error</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-zinc-700 dark:text-zinc-300">
            {errorDialog.message}
          </div>
          <DialogFooter>
            <Button onClick={() => setErrorDialog(prev => ({ ...prev, open: false }))}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
