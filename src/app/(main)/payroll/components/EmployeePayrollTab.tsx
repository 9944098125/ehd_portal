"use client";
import { useEffect, useRef, useState } from "react";
import { usePayrollStore } from "@/store/payrollStore";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { useReactToPrint } from "react-to-print";

export function EmployeePayrollTab() {
  const { myPayslips, fetchMyPayslips, pagination, isLoading } = usePayrollStore();
  const [page, setPage] = useState(1);
  const printRef = useRef<HTMLDivElement>(null);
  const [printingPayslip, setPrintingPayslip] = useState<any>(null);

  useEffect(() => {
    fetchMyPayslips(page);
  }, [page, fetchMyPayslips]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Payslip_${printingPayslip?.month}_${printingPayslip?.year}`,
    onAfterPrint: () => setPrintingPayslip(null)
  });

  const triggerPrint = (payslip: any) => {
    setPrintingPayslip(payslip);
    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  if (isLoading && myPayslips.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myPayslips.length === 0 ? (
          <div className="col-span-full p-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            No payslips available yet.
          </div>
        ) : (
          myPayslips.map((payslip) => (
            <Card key={payslip._id} className="shadow-sm hover:shadow-md transition-shadow group">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {new Date(payslip.year, payslip.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">Generated: {new Date(payslip.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400">
                    {payslip.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-emerald-600/70">Net Salary</span>
                  <div className="flex items-center gap-1.5 p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/50 transition-all group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30 group-hover:border-emerald-200 dark:group-hover:border-emerald-800">
                    <div className="bg-emerald-100 dark:bg-emerald-900/60 p-1.5 rounded-md text-emerald-700 dark:text-emerald-400">
                       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-indian-rupee"><path d="M6 3h12"/><path d="M6 8h12"/><path d="m6 13 8.5 8"/><path d="M6 13h3"/><path d="M9 13c6.667 0 6.667-10 0-10"/></svg>
                    </div>
                    <span className="text-3xl font-black tracking-tight text-emerald-700 dark:text-emerald-400">
                      {payslip.netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex gap-2">
                <Button variant="outline" className="w-full text-xs shadow-sm" onClick={() => triggerPrint(payslip)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center pt-4">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page === pagination.totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Hidden Print Container */}
      <div className="hidden">
        <div ref={printRef} className="p-8 font-sans text-black bg-white">
          {printingPayslip && (
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 p-6 flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">EHDP Inc.</h1>
                  <p className="text-xs text-gray-500 mt-1">Official Payslip Document</p>
                </div>
                <div className="text-right">
                  <h2 className="text-lg font-bold text-gray-800 uppercase tracking-widest">
                     {new Date(printingPayslip.year, printingPayslip.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </h2>
                </div>
              </div>
              <div className="p-6 space-y-6 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Basic Pay</span>
                  <span className="font-medium">{formatCurrency(printingPayslip.basicPay)}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">HRA</span>
                  <span className="font-medium">{formatCurrency(printingPayslip.hra)}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Other Allowances</span>
                  <span className="font-medium">{formatCurrency(printingPayslip.otherAllowances)}</span>
                </div>
                <div className="flex justify-between border-b pb-2 text-red-600">
                  <span>Employee PF Deduction</span>
                  <span>- {formatCurrency(printingPayslip.employeePF)}</span>
                </div>
                <div className="flex justify-between border-b pb-2 text-red-600">
                  <span>Income Tax (TDS)</span>
                  <span>- {formatCurrency(printingPayslip.incomeTax)}</span>
                </div>
                <div className="flex justify-between border-b pb-2 text-red-600">
                  <span>Professional Tax</span>
                  <span>- {formatCurrency(printingPayslip.professionalTax)}</span>
                </div>
                <div className="flex justify-between pt-4">
                  <span className="text-lg font-bold text-gray-900">Net Salary</span>
                  <span className="text-xl font-black text-gray-900">{formatCurrency(printingPayslip.netSalary)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
