"use client";
import { useEffect, useState, useRef } from "react";
import { usePayrollStore } from "@/store/payrollStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, CheckCircle, Pencil } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useVirtualizer } from "@tanstack/react-virtual";
import { SalaryStructureDialog } from "./SalaryStructureDialog";
import { EmployeePayrollTab } from "./EmployeePayrollTab";

export function AdminPayrollTab() {
  const { employees, fetchEmployees, creditSalary, creditAllSalaries, isLoading } = usePayrollStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreditingAll, setIsCreditingAll] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchEmployees(1);
  }, [fetchEmployees]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchEmployees(1, searchQuery);
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const rowVirtualizer = useVirtualizer({
    count: employees.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 5,
  });

  const handleCreateStructure = (empId: string) => {
    setSelectedEmpId(empId);
    setIsDialogOpen(true);
  };

  const handleCredit = async (empId: string) => {
    const d = new Date();
    await creditSalary(empId, d.getMonth() + 1, d.getFullYear());
  };

  const handleCreditAll = async () => {
    const d = new Date();
    setIsCreditingAll(true);
    await creditAllSalaries(d.getMonth() + 1, d.getFullYear());
    await fetchEmployees(1, searchQuery); // refresh
    setIsCreditingAll(false);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full max-w-sm flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, ID or Dept..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 backdrop-blur-sm border-muted-foreground/20 focus:border-primary transition-colors"
            />
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            onClick={handleCreditAll} 
            disabled={isCreditingAll || (employees.length > 0 && employees.filter(e => e.salaryStructure && e.payrollStatus === "NOT_GENERATED").length === 0)}
            className="w-full sm:w-auto shadow-md bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isCreditingAll ? "Processing..." : (employees.length > 0 && employees.filter(e => e.salaryStructure && e.payrollStatus === "NOT_GENERATED").length === 0) ? "All Salaries Credited" : "Credit All Salaries"}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col h-[600px]">
        {/* Sticky Header */}
        <div className="bg-muted/50 border-b overflow-hidden pr-2">
           <div className="flex text-xs text-muted-foreground uppercase font-medium">
             <div className="flex-[2] min-w-[200px] px-6 py-4">Employee</div>
             <div className="flex-1 min-w-[150px] px-6 py-4">Department</div>
             <div className="flex-1 min-w-[120px] px-6 py-4 text-right">Pay</div>
             <div className="flex-1 min-w-[120px] px-6 py-4 text-center">Structure</div>
             <div className="flex-1 min-w-[120px] px-6 py-4 text-center">Current Month</div>
             <div className="w-[180px] px-6 py-4 text-right">Actions</div>
           </div>
        </div>

        {/* Virtualized Body */}
        <div 
          ref={parentRef}
          className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-border"
        >
          {isLoading && employees.length === 0 ? (
             <div className="p-4 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                   <Skeleton key={i} className="h-12 w-full" />
                ))}
             </div>
          ) : employees.length === 0 ? (
             <div className="p-12 text-center text-muted-foreground">
                No employees found in your scope.
             </div>
          ) : (
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const emp = employees[virtualRow.index];
                const hasStructure = !!emp.salaryStructure;
                const hasPayroll = emp.payrollStatus !== "NOT_GENERATED";
                
                return (
                  <div
                    key={virtualRow.index}
                    className="absolute top-0 left-0 w-full flex items-center border-b border-border/50 hover:bg-muted/50 transition-colors group text-sm"
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div className="flex-[2] min-w-[200px] px-6 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                         {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium truncate">{emp.firstName} {emp.lastName}</div>
                        <div className="text-xs text-muted-foreground truncate">{emp.employeeId}</div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-[150px] px-6">
                      <div className="truncate">{emp.department}</div>
                      <div className="text-xs text-muted-foreground truncate">{emp.designation}</div>
                    </div>
                    <div className="flex-1 min-w-[120px] px-6 text-right">
                      {hasStructure ? (
                        <>
                          <div className="font-medium text-emerald-600 dark:text-emerald-400">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(emp.salaryStructure?.monthlyPay || 0)}
                            <span className="text-[10px] font-normal text-muted-foreground ml-1">/mo</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(emp.salaryStructure?.annualPay || 0)}
                            <span className="text-[10px] font-normal ml-1">/yr</span>
                          </div>
                        </>
                      ) : '-'}
                    </div>
                    <div className="flex-1 min-w-[120px] px-6 text-center">
                      <span className={`px-2 py-1 text-[10px] font-semibold rounded-full ${hasStructure ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>
                        {hasStructure ? "Active" : "None"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-[120px] px-6 text-center">
                      <span className={`px-2 py-1 text-[10px] font-semibold rounded-full ${hasPayroll ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {hasPayroll ? "Paid" : "Pending"}
                      </span>
                    </div>
                    <div className="w-[180px] px-6 flex justify-end gap-2">
                      {!hasStructure ? (
                         <Button variant="outline" size="sm" onClick={() => handleCreateStructure(emp._id)}>
                            <Plus className="w-3 h-3 mr-1" /> Structure
                         </Button>
                      ) : (
                         <>
                           <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit Structure" onClick={() => handleCreateStructure(emp._id)}>
                              <Pencil className="w-4 h-4 text-blue-600" />
                           </Button>
                           <Button 
                             size="sm" 
                             variant={hasPayroll ? "outline" : "default"}
                             disabled={hasPayroll}
                             onClick={() => handleCredit(emp._id)}
                             className={!hasPayroll ? "bg-indigo-600 hover:bg-indigo-700" : ""}
                           >
                              {hasPayroll ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : "Credit"}
                           </Button>
                         </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <SalaryStructureDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        employeeId={selectedEmpId} 
        onSuccess={() => fetchEmployees(1, searchQuery)}
      />

      <div className="pt-8 mt-12 border-t">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">My Payslips</h2>
          <p className="text-sm text-muted-foreground mt-1">View and download your personal monthly payslips.</p>
        </div>
        <EmployeePayrollTab />
      </div>
    </div>
  );
}
