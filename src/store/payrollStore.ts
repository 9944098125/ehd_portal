import { create } from "zustand";
import { fetchApi } from "@/services/api";
import { ISalaryStructure, IPayroll, IEmployeePayrollInfo } from "@/types/payroll";
import { toast } from 'sonner';

interface PayrollState {
  employees: IEmployeePayrollInfo[];
  myPayslips: IPayroll[];
  currentStructure: ISalaryStructure | null;
  isLoading: boolean;
  error: string | null;
  pagination: any;
  
  fetchEmployees: (page?: number, search?: string) => Promise<void>;
  fetchMyPayslips: (page?: number) => Promise<void>;
  getSalaryStructure: (employeeId: string) => Promise<ISalaryStructure | null>;
  createSalaryStructure: (data: any) => Promise<void>;
  creditSalary: (employeeId: string, month: number, year: number) => Promise<void>;
  creditAllSalaries: (month: number, year: number) => Promise<any>;
}

export const usePayrollStore = create<PayrollState>((set, get) => ({
  employees: [],
  myPayslips: [],
  currentStructure: null,
  isLoading: false,
  error: null,
  pagination: null,

  fetchEmployees: async (page = 1, search = "") => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchApi(`/api/payroll/employees?page=${page}&limit=10&search=${search}`);
      set({ employees: data.data.employees, pagination: data.data.pagination, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      toast.error("Failed to load employees", { description: error.message });
    }
  },

  fetchMyPayslips: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchApi(`/api/payroll/my?page=${page}&limit=10`);
      set({ myPayslips: data.data.payslips, pagination: data.data.pagination, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      toast.error("Failed to load payslips", { description: error.message });
    }
  },

  getSalaryStructure: async (employeeId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchApi(`/api/salary-structures/${employeeId}`);
      set({ currentStructure: data.data.structure, isLoading: false });
      return data.data.structure;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      toast.error("Failed to load salary structure", { description: error.message });
      return null;
    }
  },

  createSalaryStructure: async (postData) => {
    set({ isLoading: true, error: null });
    try {
      await fetchApi("/api/salary-structures", {
        method: "POST",
        body: JSON.stringify(postData),
      });
      set({ isLoading: false });
      toast.success("Salary structure created", { description: "The structure has been successfully saved." });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      toast.error("Failed to create structure", { description: error.message });
      throw error;
    }
  },

  creditSalary: async (employeeId, month, year) => {
    set({ isLoading: true, error: null });
    try {
      await fetchApi("/api/payroll/credit", {
        method: "POST",
        body: JSON.stringify({ employeeId, month, year }),
      });
      // Update local state to reflect paid status
      set((state) => ({
        employees: state.employees.map(emp => 
          emp._id === employeeId ? { ...emp, payrollStatus: "GENERATED" } : emp
        ),
        isLoading: false
      }));
      toast.success("Salary credited", { description: "The salary has been successfully processed." });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      toast.error("Failed to credit salary", { description: error.message });
      throw error;
    }
  },

  creditAllSalaries: async (month, year) => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchApi("/api/payroll/credit-all", {
        method: "POST",
        body: JSON.stringify({ month, year }),
      });
      set({ isLoading: false });
      toast.success("Salaries processed", { description: "All eligible salaries have been credited." });
      return data.data; // { totalEmployees, successCount, skippedCount }
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      toast.error("Failed to process salaries", { description: error.message });
      throw error;
    }
  }
}));
