import React, { useState, useEffect } from "react";
import { useTimeTrackingStore } from "@/store/timeTrackingStore";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Trash2, Edit2, PlayCircle, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export const formatHours = (val: number) => {
  const hours = Math.floor(val);
  const mins = Math.round((val - hours) * 60);
  let label = "";
  if (hours > 0) label += `${hours}hr${hours > 1 ? 's' : ''}`;
  if (hours > 0 && mins > 0) label += ` `;
  if (mins > 0) label += `${mins}mins`;
  return label || "0mins";
};

export const parseJiraTime = (timeStr: string): number => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  
  // If it's just a number or decimal (e.g., "1.5"), assume it's hours
  if (!isNaN(Number(timeStr))) return Number(timeStr);

  const regex = /(?:(\d+)\s*w)?\s*(?:(\d+)\s*d)?\s*(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?/i;
  const match = timeStr.match(regex);
  
  if (!match) return 0;
  
  const w = parseInt(match[1] || '0', 10);
  const d = parseInt(match[2] || '0', 10);
  const h = parseInt(match[3] || '0', 10);
  const m = parseInt(match[4] || '0', 10);
  
  // Assuming 1w = 40h, 1d = 8h (Standard Jira setup)
  const totalHours = (w * 40) + (d * 8) + h + (m / 60);
  return totalHours;
};

export const TimeTrackingSection = ({ ticketId }: { ticketId: string }) => {
  const { user } = useAuthStore();
  const { entries, loading, fetchLogs, createLog, updateLog, deleteLog } = useTimeTrackingStore();
  
  const [hours, setHours] = useState<string>("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit State
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editHours, setEditHours] = useState<string>("");
  const [editDescription, setEditDescription] = useState("");

  // Delete State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (ticketId) {
      fetchLogs(ticketId, (user as any)?._id || (user as any)?.userId);
    }
  }, [ticketId, fetchLogs, user]);

  const handleAddTime = async () => {
    if (!hours) return;
    const parsedHours = parseJiraTime(hours);
    if (parsedHours <= 0) {
      alert("Please enter a valid time (e.g. '1h 30m', '45m', '1.5')");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createLog({
        ticket: ticketId,
        hours: parsedHours,
        description,
      }, userId);
      setHours("");
      setDescription("");
    } catch (e: any) {
      alert(e.message || "Failed to log time");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTime = async () => {
    if (!editingEntryId || !editHours) return;
    const parsedHours = parseJiraTime(editHours);
    if (parsedHours <= 0) {
      alert("Please enter a valid time (e.g. '1h 30m', '45m', '1.5')");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await updateLog(editingEntryId, {
        hours: parsedHours,
        description: editDescription,
      }, userId);
      setEditingEntryId(null);
    } catch (e: any) {
      alert(e.message || "Failed to update time log");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTime = async (id: string) => {
    try {
      await deleteLog(id);
      setDeleteConfirmId(null);
    } catch (e) {
      // handled by store
    }
  };

  const userId = (user as any)?._id || (user as any)?.userId;

  // Calculate metrics locally to ensure they are always perfectly in sync with the displayed entries
  const computedTotal = entries.reduce((acc, entry) => acc + entry.hours, 0);
  const computedMyTime = entries.reduce((acc, entry) => {
    return entry.user._id === userId ? acc + entry.hours : acc;
  }, 0);
  
  // Calculate breakdown for other users (assignees)
  const otherUsersTime = Array.from(entries.reduce((acc, entry) => {
    if (entry.user._id !== userId) {
      const existing = acc.get(entry.user._id) || { user: entry.user, hours: 0 };
      acc.set(entry.user._id, { ...existing, hours: existing.hours + entry.hours });
    }
    return acc;
  }, new Map<string, { user: any, hours: number }>()).values());

  return (
    <div className="mt-8 border-t border-zinc-200 dark:border-zinc-800 pt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-blue-500" />
          Time Tracking
        </h3>
        <div className="flex gap-2 flex-wrap text-sm font-medium justify-end max-w-xl">
          <div className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-md text-zinc-600 dark:text-zinc-300">
            Total: <span className="font-bold text-zinc-900 dark:text-white">{formatHours(computedTotal)}</span>
          </div>
          {computedMyTime > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-md text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
              My Time: <span className="font-bold">{formatHours(computedMyTime)}</span>
            </div>
          )}
          {otherUsersTime.map(u => (
            <div key={u.user._id} className="bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-md text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 flex items-center gap-2">
               {u.user.profileImage ? (
                  <img src={u.user.profileImage} alt={u.user.firstName} className="w-5 h-5 rounded-full object-cover shadow-sm" />
               ) : (
                  <div className="w-5 h-5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-center font-bold text-[10px] shadow-sm">
                    {u.user.firstName?.[0]}
                  </div>
               )}
               <span>{u.user.firstName}:</span> <span className="font-bold">{formatHours(u.hours)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Time Form */}
      <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 mb-8">
        <h4 className="text-sm font-semibold mb-4 flex items-center text-zinc-700 dark:text-zinc-300">
          <Plus className="w-4 h-4 mr-1" /> Log Time
        </h4>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-1/2">
            <div className="relative">
              <Input 
                type="text"
                className="h-10 pr-24"
                placeholder="Hours (e.g. 1h 30m, 45m, 1.5)"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
              {hours && parseJiraTime(hours) > 0 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md pointer-events-none">
                  {formatHours(parseJiraTime(hours))}
                </div>
              )}
            </div>
          </div>
          <div className="w-full sm:w-1/2">
            <Button 
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white" 
              disabled={!hours || isSubmitting}
              onClick={handleAddTime}
            >
              {isSubmitting ? "Saving..." : "Add Time"}
            </Button>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div>
        <h4 className="text-sm font-semibold mb-4 text-zinc-700 dark:text-zinc-300">Time Tracking History</h4>
        {loading && entries.length === 0 ? (
          <div className="text-sm text-zinc-500 animate-pulse">Loading logs...</div>
        ) : entries.length === 0 ? (
          <div className="text-sm text-zinc-500 italic bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-lg text-center border border-zinc-100 dark:border-zinc-800">
            No time has been logged on this ticket yet.
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {entries.map((entry) => {
              const isOwner = entry.user._id === userId;
              
              return (
                <div key={entry._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-blue-300 dark:hover:border-blue-700/50 transition-colors">
                  <div className="flex items-start sm:items-center gap-3">
                    {entry.user.profileImage ? (
                      <img src={entry.user.profileImage} alt={entry.user.firstName} className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {entry.user.firstName?.[0]}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{entry.user.firstName} {entry.user.lastName}</span>
                        <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-600 dark:text-zinc-400 font-medium">
                          {formatHours(entry.hours)}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {new Date(entry.date).toLocaleDateString()}
                        </span>
                      </div>
                      {entry.description && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">{entry.description}</p>
                      )}
                    </div>
                  </div>
                  
                  {isOwner && (
                    <div className="flex items-center gap-2 mt-3 sm:mt-0 ml-11 sm:ml-0">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        onClick={() => {
                          setEditHours(entry.hours.toString());
                          setEditDescription(entry.description || "");
                          setEditingEntryId(entry._id);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                        onClick={() => setDeleteConfirmId(entry._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingEntryId} onOpenChange={(open) => !open && setEditingEntryId(null)}>
        <DialogContent onInteractionOutside={(e) => { e.stopPropagation(); }} className="sm:max-w-md bg-white dark:bg-zinc-950 border-0 shadow-2xl rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>Edit Time Log</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Hours</label>
              <div className="relative">
                <Input 
                  type="text"
                  className="h-10 pr-24"
                  placeholder="Hours (e.g. 1h 30m, 45m, 1.5)"
                  value={editHours}
                  onChange={(e) => setEditHours(e.target.value)}
                />
                {editHours && parseJiraTime(editHours) > 0 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md pointer-events-none">
                    {formatHours(parseJiraTime(editHours))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEntryId(null)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleEditTime} disabled={isSubmitting || !editHours}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent onInteractionOutside={(e) => { e.stopPropagation(); }} className="sm:max-w-sm bg-white dark:bg-zinc-950 border-0 shadow-2xl rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>Delete Time Log</DialogTitle>
            <DialogDescription>Are you sure you want to delete this entry? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDeleteTime(deleteConfirmId)}>Yes, Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
