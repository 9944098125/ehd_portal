import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPayroll extends Document {
  employee: mongoose.Types.ObjectId | any;
  salaryStructure: mongoose.Types.ObjectId | any;
  month: number;
  year: number;
  
  // Values captured at generation time to preserve history
  grossSalary: number; // same as monthlyPay
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
  paidDate?: Date;
  payslipUrl?: string;
  
  generatedBy: mongoose.Types.ObjectId | any;
  createdAt: Date;
  updatedAt: Date;
}

const payrollSchema = new Schema<IPayroll>(
  {
    employee: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    salaryStructure: { type: Schema.Types.ObjectId, ref: "SalaryStructure", required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    
    grossSalary: { type: Number, required: true },
    basicPay: { type: Number, required: true },
    hra: { type: Number, default: 0 },
    otherAllowances: { type: Number, default: 0 },
    
    employeePF: { type: Number, default: 0 },
    employerPF: { type: Number, default: 0 },
    professionalTax: { type: Number, default: 0 },
    incomeTax: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },
    
    netSalary: { type: Number, required: true },
    
    status: {
      type: String,
      enum: ["GENERATED", "PAID"],
      default: "GENERATED",
    },
    paidDate: { type: Date },
    payslipUrl: { type: String },
    
    generatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate payroll for same month/year
payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

if (mongoose.models.Payroll) {
  delete mongoose.models.Payroll;
}

const Payroll: Model<IPayroll> = mongoose.model<IPayroll>("Payroll", payrollSchema);

export default Payroll;
