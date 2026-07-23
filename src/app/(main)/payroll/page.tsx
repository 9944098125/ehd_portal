"use client";
import { useAuthStore } from "@/store/authStore";
import { EmployeePayrollTab } from "./components/EmployeePayrollTab";
import { AdminPayrollTab } from "./components/AdminPayrollTab";
import { Skeleton } from "@/components/ui/skeleton";

export default function PayrollPage() {
  const { user } = useAuthStore();
  
  if (!user) {
    return <div className="p-6"><Skeleton className="h-96 w-full" /></div>;
  }
  
  return (
    <div className="p-6 w-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent">
            Payroll Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {user.role === "Employee" 
              ? "View and download your monthly payslips." 
              : "Manage employee salary structures and monthly payouts."}
          </p>
        </div>
      </div>
      
      {user.role === "Employee" ? <EmployeePayrollTab /> : <AdminPayrollTab />}
    </div>
  );
}
