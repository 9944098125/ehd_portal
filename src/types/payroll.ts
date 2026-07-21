export interface ISalaryStructure {
  _id: string;
  employee: any;
  annualPay: number;
  monthlyPay: number;
  basicPay: number;
  hra: number;
  otherAllowances: number;
  employeePF: number;
  employerPF: number;
  professionalTax: number;
  incomeTax: number;
  otherDeductions: number;
  netSalary: number;
  effectiveDate: string;
  remarks?: string;
  isActive: boolean;
}

export interface IPayroll {
  _id: string;
  employee: any;
  salaryStructure: string | ISalaryStructure;
  month: number;
  year: number;
  grossSalary: number;
  basicPay: number;
  hra: number;
  otherAllowances: number;
  employeePF: number;
  employerPF: number;
  professionalTax: number;
  incomeTax: number;
  otherDeductions: number;
  netSalary: number;
  status: "GENERATED" | "PAID";
  paidDate?: string;
  payslipUrl?: string;
  createdAt: string;
}

export interface IEmployeePayrollInfo {
  _id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  department: string;
  designation: string;
  profilePicture?: string;
  salaryStructure: ISalaryStructure | null;
  payrollStatus: string;
  currentPayroll: IPayroll | null;
}
