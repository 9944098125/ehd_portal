"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, User as UserIcon, Loader2, Edit2, Check } from "lucide-react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

interface EditableFieldProps {
  label: string;
  field: string;
  value: string;
  type?: string;
  onSave: (field: string, newValue: string) => Promise<void>;
}

const EditableField = ({ label, field, value, type = "text", onSave }: EditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current && type !== "phone") {
      inputRef.current.focus();
    }
  }, [isEditing, type]);

  const handleSave = async () => {
    if (currentValue === value) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onSave(field, currentValue);
    } catch (error) {
      // Revert on error
      setCurrentValue(value);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setCurrentValue(value);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center py-5 border-b border-zinc-100 dark:border-zinc-800/50 group">
      <div className="w-full sm:w-1/3 text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2 sm:mb-0">
        {label}
      </div>
      <div className="w-full sm:w-2/3 flex items-center justify-between min-h-[40px]">
        {isEditing ? (
          <div className="flex items-center w-full gap-2 relative">
            {type === "phone" ? (
               <PhoneInput
                  country={'us'}
                  value={currentValue}
                  onChange={(phone) => setCurrentValue(phone)}
                  onBlur={handleSave}
                  inputClass="!w-full !h-10 !text-sm !bg-white dark:!bg-zinc-950 !border-zinc-200 dark:!border-zinc-800 !text-zinc-900 dark:!text-zinc-100 !rounded-md"
                  containerClass="!w-full flex-1"
                  buttonClass="!bg-transparent !border-zinc-200 dark:!border-zinc-800 !rounded-l-md hover:!bg-zinc-50 dark:hover:!bg-zinc-800"
                  dropdownClass="!bg-white dark:!bg-zinc-900 !text-zinc-900 dark:!text-zinc-100 !border-zinc-200 dark:!border-zinc-800"
                />
            ) : (
              <Input
                ref={inputRef}
                type={type}
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="h-10 flex-1 bg-white dark:bg-zinc-950"
                disabled={isSaving}
              />
            )}
            
            {/* Fallback save button for mobile or explicit click */}
            <button 
              onMouseDown={(e) => { e.preventDefault(); handleSave(); }}
              className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md absolute right-1 z-10 cursor-pointer"
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
          </div>
        ) : (
          <>
            <span className="text-zinc-900 dark:text-zinc-100 font-medium">
              {value || "—"}
            </span>
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              title="Edit"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const ReadOnlyField = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col sm:flex-row sm:items-center py-5 border-b border-zinc-100 dark:border-zinc-800/50">
    <div className="w-full sm:w-1/3 text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2 sm:mb-0">
      {label}
    </div>
    <div className="w-full sm:w-2/3 flex items-center min-h-[40px]">
       <span className="text-zinc-500 dark:text-zinc-500 font-medium">
         {value || "—"}
       </span>
    </div>
  </div>
);


export default function ProfilePage() {
  const { user, accessToken, updateUser } = useAuthStore();
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    profileImage: "",
    department: "",
    designation: "",
    employeeId: "",
    role: "",
  });

  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        profileImage: user.profileImage || "",
        department: user.department || "",
        designation: user.designation || "",
        employeeId: user.employeeId || "",
        role: user.role || "",
      });
    }
  }, [user]);

  const handleFieldSave = async (field: string, newValue: string) => {
    setMessage({ type: "", text: "" });

    const updatedData = { ...formData, [field]: newValue };

    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          [field]: newValue,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setFormData(updatedData);
        updateUser(data.data);
      } else {
        throw new Error(data.error || "Failed to update profile");
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
      throw error; // Propagate error so EditableField can revert
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage({ type: "", text: "" });

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "");

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: uploadData,
      });

      const data = await res.json();
      if (res.ok) {
        await handleFieldSave("profileImage", data.secure_url);
      } else {
        throw new Error(data.error?.message || "Failed to upload image");
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">My Profile</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Manage your personal information and account settings</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 sm:p-10 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-zinc-950 shadow-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                {formData.profileImage ? (
                  <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-12 h-12 text-zinc-400" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {formData.firstName} {formData.lastName}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400">{formData.role} • {formData.department}</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:px-10 py-6">
          {message.text && (
            <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'}`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Personal Information</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Click the edit icon on any field to update it.</p>
              
              <EditableField label="First Name" field="firstName" value={formData.firstName} onSave={handleFieldSave} />
              <EditableField label="Last Name" field="lastName" value={formData.lastName} onSave={handleFieldSave} />
              <EditableField label="Email Address" field="email" type="email" value={formData.email} onSave={handleFieldSave} />
              <EditableField label="Phone Number" field="phone" type="phone" value={formData.phone} onSave={handleFieldSave} />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Company Information</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">These fields are read-only.</p>
              
              <ReadOnlyField label="Employee ID" value={formData.employeeId} />
              <ReadOnlyField label="Role" value={formData.role} />
              <ReadOnlyField label="Department" value={formData.department} />
              <ReadOnlyField label="Designation" value={formData.designation} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
