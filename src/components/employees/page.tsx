"use client";

import React from "react";
import { EmployeeTable } from "@/components/employees/employee-table";

export default function EmployeesPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Employees</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage company employees and administrators.</p>
        </div>
      </div>

      <EmployeeTable />
    </div>
  );
}
