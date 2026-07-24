"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useEmployeeStore } from "@/store/employeeStore";
import { UserPlus, Mail, Phone, Briefcase, Hash, Shield, Building2, Eye, EyeOff } from "lucide-react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

interface EmployeeModalsProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit" | null;
  employee?: any;
}

export const EmployeeModals: React.FC<EmployeeModalsProps> = ({ isOpen, onClose, mode, employee }) => {
  const { addUser, editUser } = useEmployeeStore();
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    employeeId: "",
    department: "",
    designation: "",
    role: "Employee",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorDialog, setErrorDialog] = useState({ open: false, message: "" });

  useEffect(() => {
    if (employee && mode === "edit") {
      setFormData({
        firstName: employee.firstName || "",
        lastName: employee.lastName || "",
        email: employee.email || "",
        phone: employee.phone || "",
        password: "", // intentionally blank for edit unless changing
        employeeId: employee.employeeId || "",
        department: employee.department || "",
        designation: employee.designation || "",
        role: employee.role || "Employee",
      });
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        employeeId: "",
        department: "",
        designation: "",
        role: "Employee",
      });
    }
  }, [employee, mode, isOpen]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await addUser(formData);
      } else if (mode === "edit" && employee) {
        // If password is blank on edit, we usually don't send it. 
        // For simplicity, we send what we have. A proper API would ignore empty password.
        const payload = { ...formData };
        if (!payload.password) delete (payload as any).password;
        await editUser(employee._id, payload);
      }
      onClose();
    } catch (error: any) {
      console.error("Submission failed", error);
      setErrorDialog({ open: true, message: error.message || "Failed to save employee" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent onInteractionOutside={(e) => { e.stopPropagation(); }} className="max-w-[80vw] sm:max-w-[80vw] w-[80vw] sm:w-[80vw] bg-white dark:bg-zinc-950 max-h-[90vh] overflow-y-auto border-0 shadow-2xl rounded-2xl p-0">
        <form onSubmit={(e) => { e.preventDefault(); if (!(isSubmitting || !formData.firstName || !formData.lastName || !formData.email || !formData.department || !formData.designation || (mode === "create" && !formData.password))) handleSubmit(); }}>
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 border-b border-zinc-200 dark:border-zinc-800">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <UserPlus size={24} />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {mode === "create" ? "Add New Employee" : "Edit Employee"}
                </DialogTitle>
                <DialogDescription className="text-zinc-500 dark:text-zinc-400 mt-1">
                  Fill in the details below to {mode === "create" ? "add a new team member" : "update this employee's profile"}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          {/* Section 1: Personal Details */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 uppercase tracking-wider">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">First Name *</label>
                <Input className="h-11" placeholder="Jane" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Last Name *</label>
                <Input className="h-11" placeholder="Doe" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input className="pl-10 h-11" type="email" placeholder="jane.doe@company.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Phone Number *</label>
                <div className="relative">
                  <PhoneInput
                    country={'us'}
                    value={formData.phone}
                    onChange={(phone) => setFormData({ ...formData, phone })}
                    inputClass="!w-full !h-11 !text-base !bg-transparent !border-zinc-200 dark:!border-zinc-800 !text-zinc-900 dark:!text-zinc-100 !rounded-md"
                    containerClass="!w-full"
                    buttonClass="!bg-transparent !border-zinc-200 dark:!border-zinc-800 !rounded-l-md hover:!bg-zinc-50 dark:hover:!bg-zinc-800"
                    dropdownClass="!bg-white dark:!bg-zinc-900 !text-zinc-900 dark:!text-zinc-100 !border-zinc-200 dark:!border-zinc-800"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {/* Section 2: Employment Details */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 uppercase tracking-wider">Employment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Employee ID *</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input className="pl-10 h-11" placeholder="EMP-001" value={formData.employeeId} onChange={e => setFormData({ ...formData, employeeId: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Department *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 z-10" />
                  <Select value={formData.department} onValueChange={v => setFormData({ ...formData, department: v || "" })}>
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Designation *</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input className="pl-10 h-11" placeholder="Software Engineer" value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">System Role *</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 z-10" />
                  <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v || "Employee" })}>
                    <SelectTrigger className="pl-10 h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Employee">Employee (Basic Access)</SelectItem>
                      <SelectItem value="Admin">Admin (Manager Access)</SelectItem>
                      <SelectItem value="Super Admin">Super Admin (Full Access)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {/* Section 3: Security */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4 uppercase tracking-wider">Security</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Password {mode === "edit" ? "(Leave blank to keep current)" : "*"}</label>
                <div className="relative">
                  <Input 
                    className="h-11 pr-10" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={formData.password} 
                    onChange={e => setFormData({ ...formData, password: e.target.value })} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 flex justify-end space-x-3 rounded-b-2xl">
          <Button variant="outline" type="button" className="h-11 px-6" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button 
            type="submit"
            className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white" 
            disabled={isSubmitting || !formData.firstName || !formData.lastName || !formData.email || !formData.department || !formData.designation || (mode === "create" && !formData.password)}
          >
            {isSubmitting ? "Saving..." : (mode === "create" ? "Add Employee" : "Save Changes")}
          </Button>
        </div>
        </form>
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
