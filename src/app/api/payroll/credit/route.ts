import { NextRequest } from "next/server";
import connectToDatabase from "@/lib/db";
import SalaryStructure from "@/models/SalaryStructure";
import Payroll from "@/models/Payroll";
import AuditLog from "@/models/AuditLog";
import User from "@/models/User";
import { apiResponse } from "@/utils/apiResponse";
import { withRole, AuthenticatedRequest } from "@/middleware/auth";

async function creditSalary(req: AuthenticatedRequest) {
  try {
    await connectToDatabase();
    const { employeeId, month, year } = await req.json();
    
    if (!employeeId || !month || !year) {
      return apiResponse.badRequest("Missing required parameters");
    }

    // Admin check
    if (req.user?.role === "Admin") {
      const emp = await User.findById(employeeId);
      if (!emp || String(emp.createdBy) !== req.user.userId) {
        return apiResponse.forbidden("Access denied to this employee");
      }
    }

    // Check if payroll already exists
    const existing = await Payroll.findOne({ employee: employeeId, month, year });
    if (existing) {
      return apiResponse.badRequest("Payroll already generated for this month");
    }

    // Get active salary structure
    const structure = await SalaryStructure.findOne({ employee: employeeId, isActive: true });
    if (!structure) {
      return apiResponse.badRequest("No active salary structure found for this employee");
    }

    // Create Payroll Record
    const payroll = await Payroll.create({
      employee: employeeId,
      salaryStructure: structure._id,
      month,
      year,
      grossSalary: structure.monthlyPay,
      basicPay: structure.basicPay,
      hra: structure.hra,
      otherAllowances: structure.otherAllowances,
      employeePF: structure.employeePF,
      employerPF: structure.employerPF,
      professionalTax: structure.professionalTax,
      incomeTax: structure.incomeTax,
      otherDeductions: structure.otherDeductions,
      netSalary: structure.netSalary,
      status: "GENERATED",
      generatedBy: req.user?.userId
    });

    await AuditLog.create({
      action: "PAYROLL_GENERATED",
      entityType: "Payroll",
      entityId: payroll._id,
      performedBy: req.user?.userId,
      details: { month, year }
    });

    return apiResponse.success("Salary credited successfully", { payroll });
  } catch (error: any) {
    return apiResponse.error("Error crediting salary", 500, { details: error.message });
  }
}

export const POST = withRole(["Super Admin", "Admin"], creditSalary as any);
