import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISalaryStructure extends Document {
  employee: mongoose.Types.ObjectId;
  annualPay: number;
  monthlyPay: number;
  
  // Earnings
  basicPay: number;
  hra: number;
  otherAllowances: number;
  
  // Deductions
  employeePF: number;
  employerPF: number;
  professionalTax: number;
  incomeTax: number;
  otherDeductions: number;
  
  // Computed Net
  netSalary: number;
  
  effectiveDate: Date;
  remarks?: string;
  isActive: boolean;
  
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const salaryStructureSchema = new Schema<ISalaryStructure>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    annualPay: { type: Number, required: true },
    monthlyPay: { type: Number, required: true },
    
    basicPay: { type: Number, required: true },
    hra: { type: Number, default: 0 },
    otherAllowances: { type: Number, default: 0 },
    
    employeePF: { type: Number, default: 0 },
    employerPF: { type: Number, default: 0 },
    professionalTax: { type: Number, default: 0 },
    incomeTax: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },
    
    netSalary: { type: Number, required: true },
    
    effectiveDate: { type: Date, required: true },
    remarks: { type: String },
    isActive: { type: Boolean, default: true },
    
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

// Only one active salary structure per employee
salaryStructureSchema.index({ employee: 1, isActive: 1 });

if (mongoose.models.SalaryStructure) {
  delete mongoose.models.SalaryStructure;
}

const SalaryStructure: Model<ISalaryStructure> = mongoose.model<ISalaryStructure>("SalaryStructure", salaryStructureSchema);

export default SalaryStructure;
