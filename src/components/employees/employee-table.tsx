"use client";

import React, { useEffect, useState } from "react";
import { useEmployeeStore } from "@/store/employeeStore";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Search, Edit2, Trash2, Users } from "lucide-react";
import { EmployeeModals } from "./employee-modals";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export const EmployeeTable = () => {
  const { users, isLoading, fetchUsers, removeUser } = useEmployeeStore();
  const { user: currentUser } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit" | null;
    employee?: any;
  }>({ isOpen: false, mode: null });
  const [deleteConfirmState, setDeleteConfirmState] = useState<{ open: boolean; userId: string | null }>({ open: false, userId: null });
  const [errorDialog, setErrorDialog] = useState({ open: false, message: "" });
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    fetchUsers({ search: searchTerm });
  }, [fetchUsers, searchTerm]);

  const confirmDelete = async () => {
    if (!deleteConfirmState.userId) return;
    setIsDeleting(true);
    try {
      await removeUser(deleteConfirmState.userId);
      setDeleteConfirmState({ open: false, userId: null });
    } catch (error: any) {
      setDeleteConfirmState({ open: false, userId: null });
      setErrorDialog({ open: true, message: error.message || "Failed to delete user" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmState({ open: true, userId: id });
  };

  if (currentUser?.role === "Employee") {
    return <div className="text-destructive p-4 font-medium">Access Denied.</div>;
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search employees..." 
            className="pl-9 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => setModalState({ isOpen: true, mode: "create" })} className="shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-4 font-semibold tracking-wider">Employee</th>
              <th className="px-6 py-4 font-semibold tracking-wider">Department</th>
              <th className="px-6 py-4 font-semibold tracking-wider">Role</th>
              <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
              <th className="px-6 py-4 font-semibold tracking-wider">Joined</th>
              <th className="px-6 py-4 text-right font-semibold tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="border-b border-border">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-0 h-64">
                  <EmptyState 
                    icon={Users}
                    title="No employees found"
                    description="Get started by adding a new employee to your team."
                    actionLabel="Add Employee"
                    onAction={() => setModalState({ isOpen: true, mode: "create" })}
                  />
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      {user.profileImage ? (
                        <img src={user.profileImage} alt="" className="h-9 w-9 rounded-full object-cover shadow-sm" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shadow-sm">
                          {user.firstName[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-foreground tracking-tight">{user.firstName} {user.lastName}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{user.department}</td>
                  <td className="px-6 py-4">
                    <span className="bg-muted text-muted-foreground px-2.5 py-1 rounded-md text-xs font-medium border border-border/50">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                      user.status === "Active" ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" :
                      user.status === "Suspended" ? "bg-destructive/10 text-destructive border-destructive/20" :
                      "bg-muted text-muted-foreground border-border/50"
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setModalState({ isOpen: true, mode: "edit", employee: user })}
                        className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(user._id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <EmployeeModals 
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        employee={modalState.employee}
        onClose={() => setModalState({ isOpen: false, mode: null })}
      />

      <Dialog open={deleteConfirmState.open} onOpenChange={(open) => setDeleteConfirmState(prev => ({ ...prev, open }))}>
        <DialogContent onInteractionOutside={(e) => { e.stopPropagation(); }} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="outline" onClick={() => setDeleteConfirmState({ open: false, userId: null })} disabled={isDeleting}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog(prev => ({ ...prev, open }))}>
        <DialogContent onInteractionOutside={(e) => { e.stopPropagation(); }} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Error</DialogTitle>
            <DialogDescription>
              {errorDialog.message}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setErrorDialog(prev => ({ ...prev, open: false }))}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
