"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { uploadImageToCloudinary } from "@/utils/cloudinary";
import { useTicketStore } from "@/store/ticketStore";
import { useAuthStore } from "@/store/authStore";
import { useProjectStore } from "@/store/projectStore";
import { Ticket, Folder, Tag as TagIcon, Clock, Paperclip, UploadCloud, Trash2, Users, Building2, Search, X } from "lucide-react";
import { TimeTrackingSection } from "./time-tracking-section";

interface TicketModalsProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit" | "view" | null;
  ticket?: any;
  onEdit?: () => void;
}

export const TicketModals: React.FC<TicketModalsProps> = ({ isOpen, onClose, mode, ticket, onEdit }) => {
  const { addTicket, editTicket, removeTicket } = useTicketStore();
  const { user } = useAuthStore();
  const { myProjects, fetchMyProjects } = useProjectStore();
  
  const [formData, setFormData] = useState({
    title: "",
    projectId: "",
    priority: "MEDIUM",
    content: "",
    estimatedHours: "",
    tags: "",
    images: [] as string[],
    department: "",
    assignees: [] as string[],
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchAssignee, setSearchAssignee] = useState("");
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorDialog, setErrorDialog] = useState({ open: false, message: "" });

  useEffect(() => {
    if (isOpen) {
      fetchMyProjects();
    }
  }, [isOpen, fetchMyProjects]);

  useEffect(() => {
    if (ticket && (mode === "edit" || mode === "view")) {
      setFormData({
        title: ticket.title || "",
        projectId: ticket.projectId?._id || ticket.projectId || "",
        priority: ticket.priority || "MEDIUM",
        content: ticket.content || "",
        estimatedHours: ticket.estimatedHours?.toString() || "",
        tags: ticket.tags?.join(", ") || "",
        images: ticket.images || [],
        department: ticket.department || "",
        assignees: ticket.assignees?.map((a: any) => a._id || a) || [],
      });
    } else {
      setFormData({
        title: "",
        projectId: "",
        priority: "MEDIUM",
        content: "",
        estimatedHours: "",
        tags: "",
        images: [],
        department: "",
        assignees: [],
      });
    }
    setSearchAssignee("");
    setIsAssigneeDropdownOpen(false);
  }, [ticket, mode, isOpen]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const url = await uploadImageToCloudinary(e.target.files[i]);
        urls.push(url);
      }
      setFormData(prev => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch (error) {
      console.error("Upload failed", error);
      setErrorDialog({ open: true, message: "Failed to upload image. Ensure Cloudinary is configured." });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        estimatedHours: formData.estimatedHours ? Number(formData.estimatedHours) : undefined,
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      };

      if (mode === "create") {
        await addTicket(payload);
      } else if (mode === "edit" && ticket) {
        await editTicket(ticket._id, payload);
      }
      onClose();
    } catch (error: any) {
      console.error("Submission failed", error);
      setErrorDialog({ open: true, message: error.message || "Failed to save ticket" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await removeTicket(ticket._id);
      setDeleteConfirmOpen(false);
      onClose();
    } catch (error) {
      setDeleteConfirmOpen(false);
      setErrorDialog({ open: true, message: "Failed to delete. You might not have permission." });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDelete = () => {
    setDeleteConfirmOpen(true);
  };

  // Derive available assignees from selected project
  const availableAssignees = useMemo(() => {
    if (!formData.projectId) return [];
    const selectedProject = myProjects.find(p => p._id === formData.projectId);
    return selectedProject?.team || [];
  }, [formData.projectId, myProjects]);

  const canTrackTime = useMemo(() => {
    if (!user || !ticket) return false;
    const role = (user as any)?.role;
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') return true;
    const userId = (user as any)?._id || (user as any)?.userId;
    if (ticket.assignees?.some((a: any) => a === userId || a._id === userId)) return true;
    if (ticket.owner?._id === userId || ticket.owner === userId) return true;
    return false;
  }, [user, ticket]);

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent onInteractionOutside={(e) => { e.stopPropagation(); }} className="max-w-[80vw] sm:max-w-[80vw] w-[80vw] sm:w-[80vw] bg-white dark:bg-zinc-950 max-h-[90vh] overflow-y-auto border-0 shadow-2xl rounded-2xl p-0">
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 border-b border-zinc-200 dark:border-zinc-800">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Ticket size={24} />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    {mode === "create" && "Create New Ticket"}
                    {mode === "edit" && "Edit Ticket"}
                    {mode === "view" && ticket?.title}
                  </DialogTitle>
                  <DialogDescription className="text-zinc-500 dark:text-zinc-400 mt-1">
                    {mode === "view" 
                      ? `Project: ${ticket?.projectId?.name || "Unknown"} • Created by ${ticket?.owner?.firstName}`
                      : "Fill in the details below to define the task requirements."
                    }
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {mode === "view" ? (
          <div className="p-6 md:p-8 space-y-8">
            <div className="flex items-center space-x-6 text-sm text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center"><Folder className="w-4 h-4 mr-2" /> {ticket?.projectId?.name || "Unknown"}</div>
              <div className="flex items-center"><Clock className="w-4 h-4 mr-2" /> {ticket.estimatedHours || 0} Hours</div>
              <div className="flex items-center">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  ticket.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
                  ticket.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                  ticket.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {ticket.priority}
                </span>
              </div>
            </div>

            <div className="prose dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200">
              <p className="whitespace-pre-wrap leading-relaxed">{ticket.content}</p>
            </div>

            {ticket.tags && ticket.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {ticket.tags.map((tag: string, i: number) => (
                  <span key={i} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-3 py-1 rounded-md text-sm flex items-center">
                    <TagIcon className="w-3 h-3 mr-2" /> {tag}
                  </span>
                ))}
              </div>
            )}

            {ticket.images?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center"><Paperclip className="w-4 h-4 mr-2" /> Attachments</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {ticket.images.map((img: string, i: number) => (
                    <a href={img} target="_blank" rel="noreferrer" key={i} className="block group relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 aspect-video">
                      <img src={img} alt="attachment" className="object-cover w-full h-full transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            <div className="bg-zinc-50 dark:bg-zinc-900/50 -mx-6 md:-mx-8 -mb-6 md:-mb-8 p-6 md:p-8 mt-8 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <div className="text-sm text-zinc-500">
                Created on {new Date(ticket.createdAt).toLocaleDateString()}
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => onClose()}>Close</Button>
                <Button onClick={onEdit}>Edit</Button>
                {((user as any)?._id || (user as any)?.userId) === ticket.owner?._id && (
                  <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                )}
              </div>
            </div>
            {canTrackTime && <TimeTrackingSection ticketId={ticket._id} />}
          </div>
        ) : (
          <div className="p-6 md:p-8 space-y-8">
            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Ticket Title *</label>
                <Input className="h-11 text-lg font-medium" placeholder="E.g. Fix login authentication bug" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Project *</label>
                <div className="relative">
                  <Folder className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 z-10" />
                  <Select value={formData.projectId} onValueChange={v => setFormData({ ...formData, projectId: v || "", assignees: [] })}>
                    <SelectTrigger className="pl-10 h-11">
                      <SelectValue placeholder="Select Project">
                        {formData.projectId 
                          ? (() => {
                              const p = myProjects.find((proj: any) => proj._id === formData.projectId);
                              if (p) {
                                return (
                                  <div className="inline-flex items-center pb-0.5 border-b-2" style={{ borderBottomColor: p.color || '#3b82f6' }}>
                                    {p.icon ? (
                                      p.icon.includes('<svg') ? (
                                        <div className="w-4 h-4 shrink-0 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: p.icon }} />
                                      ) : p.icon.startsWith('http') ? (
                                        <img src={p.icon} alt={p.name} className="w-4 h-4 rounded-full object-cover shrink-0" />
                                      ) : (
                                        <span className="text-sm leading-none flex items-center justify-center shrink-0">{p.icon}</span>
                                      )
                                    ) : (
                                      <Folder className="w-4 h-4 text-zinc-500 shrink-0" />
                                    )}
                                    <span className="mx-2 text-zinc-300 dark:text-zinc-600 text-xs font-bold">•</span>
                                    <span className="truncate font-medium">{p.name}</span>
                                  </div>
                                );
                              }
                              return ticket?.projectId?.name || "Select Project";
                            })()
                          : "Select Project"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {myProjects.length > 0 ? (
                        myProjects.map((p: any) => (
                          <SelectItem key={p._id} value={p._id}>
                            <div className="inline-flex items-center pb-0.5 border-b-2 mt-1 mb-1" style={{ borderBottomColor: p.color || '#3b82f6' }}>
                              {p.icon ? (
                                p.icon.includes('<svg') ? (
                                  <div className="w-4 h-4 shrink-0 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: p.icon }} />
                                ) : p.icon.startsWith('http') ? (
                                  <img src={p.icon} alt={p.name} className="w-4 h-4 rounded-full object-cover shrink-0" />
                                ) : (
                                  <span className="text-sm leading-none flex items-center justify-center shrink-0">{p.icon}</span>
                                )
                              ) : (
                                <Folder className="w-4 h-4 text-zinc-500 shrink-0" />
                              )}
                              <span className="mx-2 text-zinc-300 dark:text-zinc-600 text-xs font-bold">•</span>
                              <span className="truncate font-medium">{p.name}</span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-3 text-sm text-zinc-500 text-center">No projects available</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Priority</label>
                <Select value={formData.priority} onValueChange={v => setFormData({ ...formData, priority: v || "MEDIUM" })}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Estimated Hours</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input className="pl-10 h-11" type="number" placeholder="e.g. 5" value={formData.estimatedHours} onChange={e => setFormData({ ...formData, estimatedHours: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tags</label>
                <div className="relative">
                  <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input className="pl-10 h-11" placeholder="bug, frontend, urgent" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Department</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 z-10" />
                  <Select 
                    value={formData.department} 
                    onValueChange={v => setFormData({ ...formData, department: v || "" })}
                  >
                    <SelectTrigger className="pl-10 h-11"><SelectValue placeholder="Select Department" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Human Resource">Human Resource</SelectItem>
                      <SelectItem value="Information Technology">Information Technology</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Administration">Administration</SelectItem>
                      <SelectItem value="Research & Development">Research & Development</SelectItem>
                      <SelectItem value="Legal">Legal</SelectItem>
                      <SelectItem value="Security">Security</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 relative">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Assignees</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.assignees.map(assigneeId => {
                    const emp = availableAssignees.find((e: any) => e._id === assigneeId);
                    if (!emp) return null;
                    return (
                      <div key={assigneeId} className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-md text-xs font-medium border border-blue-200 dark:border-blue-800">
                        {emp.profileImage ? (
                          <img src={emp.profileImage} alt={emp.firstName} className="w-4 h-4 rounded-full mr-1.5 object-cover" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-blue-200 dark:bg-blue-800 mr-1.5 flex items-center justify-center text-[8px] font-bold">
                            {emp.firstName[0]}
                          </div>
                        )}
                        {emp.firstName} {emp.lastName}
                        <button onClick={() => setFormData(prev => ({ ...prev, assignees: prev.assignees.filter(id => id !== assigneeId) }))} className="ml-1.5 text-blue-500 hover:text-blue-700 dark:hover:text-blue-200">
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 z-10" />
                  <Input 
                    className="pl-10 h-11" 
                    placeholder={formData.projectId ? "Search project team..." : "Select project first"} 
                    value={searchAssignee}
                    onChange={e => {
                      setSearchAssignee(e.target.value);
                      setIsAssigneeDropdownOpen(true);
                    }}
                    onFocus={() => { if (formData.projectId) setIsAssigneeDropdownOpen(true); }}
                    onBlur={() => setTimeout(() => setIsAssigneeDropdownOpen(false), 200)}
                    disabled={!formData.projectId}
                  />
                  {isAssigneeDropdownOpen && formData.projectId && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                      {availableAssignees
                        .filter((emp: any) => !formData.assignees.includes(emp._id))
                        .filter((emp: any) => `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchAssignee.toLowerCase()))
                        .map((emp: any) => (
                          <div 
                            key={emp._id}
                            className="px-3 py-2 flex items-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, assignees: [...prev.assignees, emp._id] }));
                              setSearchAssignee("");
                              setIsAssigneeDropdownOpen(false);
                            }}
                          >
                            {emp.profileImage ? (
                              <img src={emp.profileImage} alt={emp.firstName} className="w-6 h-6 rounded-full mr-2 object-cover" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 mr-2 flex items-center justify-center text-[10px] font-bold">
                                {emp.firstName[0]}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{emp.firstName} {emp.lastName}</span>
                              <span className="text-xs text-zinc-500">{emp.department}</span>
                            </div>
                          </div>
                        ))}
                      {availableAssignees.filter((emp: any) => !formData.assignees.includes(emp._id)).length === 0 && (
                        <div className="p-3 text-sm text-zinc-500 text-center">No available team members found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Description *</label>
              <Textarea className="min-h-[150px] p-4 text-base" placeholder="Describe the issue or task in detail..." value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Attachments</label>
              
              <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-300 border-dashed rounded-xl cursor-pointer bg-zinc-50 dark:hover:bg-bray-800 dark:bg-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-8 h-8 mb-3 text-zinc-400" />
                    <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">PNG, JPG, GIF (MAX. 5MB)</p>
                  </div>
                  <Input id="dropzone-file" type="file" className="hidden" multiple onChange={handleImageUpload} disabled={isUploading} />
                </label>
              </div>

              {isUploading && (
                <div className="text-sm text-blue-500 animate-pulse font-medium">Uploading images securely to Cloudinary...</div>
              )}
              
              {formData.images.length > 0 && (
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3 mt-4">
                  {formData.images.map((img, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 aspect-square">
                      <img src={img} className="h-full w-full object-cover" alt="upload preview" />
                      <button 
                        onClick={() => removeImage(i)}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900/50 -mx-6 md:-mx-8 -mb-6 md:-mb-8 p-6 md:p-8 mt-8 border-t border-zinc-200 dark:border-zinc-800 flex justify-end space-x-3 rounded-b-2xl">
              <Button variant="outline" className="h-11 px-6" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
              <Button 
                className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleSubmit} 
                disabled={isSubmitting || isUploading || !formData.title || !formData.projectId || !formData.content}
              >
                {isSubmitting ? "Saving..." : (mode === "create" ? "Create Ticket" : "Save Changes")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Delete Confirmation Dialog */}
    <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
      <DialogContent onInteractionOutside={(e) => { e.stopPropagation(); }} className="sm:max-w-md bg-white dark:bg-zinc-950 border-0 shadow-2xl rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Confirm Deletion</DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400 mt-2">
            Are you sure you want to delete this ticket? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={isDeleting}>Cancel</Button>
          <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Yes, Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Error Dialog */}
    <Dialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog(prev => ({ ...prev, open }))}>
      <DialogContent onInteractionOutside={(e) => { e.stopPropagation(); }} className="sm:max-w-md bg-white dark:bg-zinc-950 border-0 shadow-2xl rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-red-600 dark:text-red-500">Error</DialogTitle>
          <DialogDescription className="text-zinc-700 dark:text-zinc-300 mt-2 text-base">
            {errorDialog.message}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end mt-6">
          <Button onClick={() => setErrorDialog(prev => ({ ...prev, open: false }))}>OK</Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};
