"use client";

import { useEffect } from "react";
import { useTimingsStore } from "@/store/timingsStore";
import { useAuthStore } from "@/store/authStore";
import Filters from "./Filters";
import MyTimesheetGrid from "./MyTimesheetGrid";
import TeamTimesheetGrid from "./TeamTimesheetGrid";

export default function TimingsClient() {
  const { fetchAllInitial, reset } = useTimingsStore();
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    fetchAllInitial();
    return () => reset();
  }, [fetchAllInitial, reset]);

  return (
    <div className="flex flex-col h-full space-y-4 p-4 md:p-6 md:pb-0 h-[calc(100vh-5rem)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timesheets</h1>
          <p className="text-muted-foreground">Track and manage time</p>
        </div>
      </div>

      <div className="shrink-0">
        <Filters />
      </div>
      
      <div className="flex-1 min-h-0 flex flex-col pb-6 space-y-8 overflow-y-auto custom-scrollbar">
        <div className="flex flex-col shrink-0 min-h-[300px]">
          <MyTimesheetGrid />
        </div>

        {user && user.role !== "Employee" && (
          <div className="flex flex-col shrink-0 min-h-[500px]">
            <TeamTimesheetGrid />
          </div>
        )}
      </div>
    </div>
  );
}
