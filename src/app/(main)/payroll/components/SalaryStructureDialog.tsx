"use client";
import { useState, useEffect } from "react";
import { usePayrollStore } from "@/store/payrollStore";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IndianRupee } from "lucide-react";

export function SalaryStructureDialog({ 
  open, 
  onOpenChange, 
  employeeId, 
  onSuccess 
}: { 
  open: boolean, 
  onOpenChange: (open: boolean) => void,
  employeeId: string | null,
  onSuccess: () => void
}) {
  const { createSalaryStructure, getSalaryStructure } = usePayrollStore();
  const [loading, setLoading] = useState(false);
  
  // State
  const [grossMonthly, setGrossMonthly] = useState("0");
  const [employeePF, setEmployeePF] = useState("1800");
  const [employerPF, setEmployerPF] = useState("1800");
  const [professionalTax, setProfessionalTax] = useState("200");
  const [incomeTax, setIncomeTax] = useState("0");
  
  useEffect(() => {
    if (open && employeeId) {
      getSalaryStructure(employeeId).then(struct => {
         if (struct) {
            setGrossMonthly(struct.monthlyPay.toString());
            setEmployeePF(struct.employeePF.toString());
            setEmployerPF(struct.employerPF.toString());
            setProfessionalTax(struct.professionalTax.toString());
            setIncomeTax(struct.incomeTax.toString());
         } else {
            setGrossMonthly("0"); 
            setEmployeePF("1800"); 
            setEmployerPF("1800"); 
            setProfessionalTax("200");
            setIncomeTax("0");
         }
      });
    }
  }, [open, employeeId]);

  // Auto Tax Calculation Logic
  useEffect(() => {
    const gross = parseFloat(grossMonthly) || 0;
    const annual = gross * 12;
    
    // Simplistic Income Tax: 10% on anything over 12 Lakhs
    if (annual > 1200000) {
      const excess = annual - 1200000;
      const annualTax = excess * 0.10;
      setIncomeTax((annualTax / 12).toFixed(2));
    } else {
      setIncomeTax("0");
    }
  }, [grossMonthly]);

  const handleSave = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const mPay = parseFloat(grossMonthly) || 0;
      const pt = parseFloat(professionalTax) || 0;
      const ePF = parseFloat(employeePF) || 0;
      const erPF = parseFloat(employerPF) || 0;
      const iTax = parseFloat(incomeTax) || 0;
      
      const netSalary = mPay - ePF - pt - iTax;
      
      await createSalaryStructure({
        employee: employeeId,
        annualPay: mPay * 12,
        monthlyPay: mPay,
        basicPay: mPay * 0.5, // assuming 50% is basic
        hra: mPay * 0.2,
        otherAllowances: mPay * 0.3,
        employeePF: ePF,
        employerPF: erPF,
        professionalTax: pt,
        incomeTax: iTax,
        otherDeductions: 0,
        netSalary,
        effectiveDate: new Date(),
        remarks: "Auto-generated structure"
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(val) => { if (!loading) onOpenChange(val); }} disablePointerDismissal={true}>
      <DialogContent 
        className="sm:max-w-[500px]"
      >
        <DialogHeader>
          <DialogTitle>Salary Structure</DialogTitle>
          <DialogDescription>
            Configure the monthly payroll structure for this employee. Income tax is calculated automatically if annual pay exceeds ₹12L.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2 group">
              <label className="text-sm font-medium group-focus-within:text-primary transition-colors">Gross Monthly Salary</label>
              <div className="relative flex items-center">
                <IndianRupee className="absolute left-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  type="number"
                  value={grossMonthly}
                  onChange={(e) => setGrossMonthly(e.target.value)}
                  disabled={loading}
                  className="pl-9 h-11 text-lg font-semibold tracking-tight transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
             <div className="grid gap-2 group">
               <label className="text-sm font-medium text-muted-foreground">Annual Est.</label>
               <div className="relative flex items-center">
                 <IndianRupee className="absolute left-3 h-3 w-3 text-muted-foreground" />
                 <Input disabled value={((parseFloat(grossMonthly) || 0) * 12).toLocaleString('en-IN')} className="pl-8 h-11 bg-muted/30" />
               </div>
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2 group">
               <label className="text-sm font-medium group-focus-within:text-amber-600 transition-colors">Employee PF</label>
               <div className="relative flex items-center">
                 <IndianRupee className="absolute left-3 h-3 w-3 text-amber-600/70 group-focus-within:text-amber-600 transition-colors" />
                 <Input type="number" value={employeePF} onChange={(e) => setEmployeePF(e.target.value)} disabled={loading} className="pl-8 focus-visible:ring-amber-500/30 text-amber-700" />
               </div>
             </div>
             <div className="grid gap-2 group">
               <label className="text-sm font-medium group-focus-within:text-amber-600 transition-colors">Employer PF</label>
               <div className="relative flex items-center">
                 <IndianRupee className="absolute left-3 h-3 w-3 text-amber-600/70 group-focus-within:text-amber-600 transition-colors" />
                 <Input type="number" value={employerPF} onChange={(e) => setEmployerPF(e.target.value)} disabled={loading} className="pl-8 focus-visible:ring-amber-500/30 text-amber-700" />
               </div>
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2 group">
               <label className="text-sm font-medium group-focus-within:text-amber-600 transition-colors">Professional Tax</label>
               <div className="relative flex items-center">
                 <IndianRupee className="absolute left-3 h-3 w-3 text-amber-600/70 group-focus-within:text-amber-600 transition-colors" />
                 <Input type="number" value={professionalTax} onChange={(e) => setProfessionalTax(e.target.value)} disabled={loading} className="pl-8 focus-visible:ring-amber-500/30 text-amber-700" />
               </div>
             </div>
             <div className="grid gap-2 group">
               <label className="text-sm font-medium group-focus-within:text-red-500 transition-colors">Income Tax (Monthly)</label>
               <div className="relative flex items-center">
                 <IndianRupee className="absolute left-3 h-3 w-3 text-red-500/70 group-focus-within:text-red-500 transition-colors" />
                 <Input 
                   type="number"
                   value={incomeTax}
                   onChange={(e) => setIncomeTax(e.target.value)}
                   disabled={loading}
                   className="pl-8 focus-visible:ring-red-500/30 text-red-600 font-medium"
                 />
               </div>
             </div>
          </div>
          
          <div className="mt-4 p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl flex justify-between items-center border border-emerald-100 dark:border-emerald-900 shadow-sm transition-all hover:shadow-md">
             <span className="font-semibold text-sm text-emerald-800 dark:text-emerald-300">Estimated Net Salary</span>
             <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight flex items-center gap-1">
                <IndianRupee className="h-5 w-5" />
                {((parseFloat(grossMonthly) || 0) - (parseFloat(employeePF) || 0) - (parseFloat(professionalTax) || 0) - (parseFloat(incomeTax) || 0)).toLocaleString('en-IN')}
             </span>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 shadow-md">
            {loading ? "Saving..." : "Save Structure"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
