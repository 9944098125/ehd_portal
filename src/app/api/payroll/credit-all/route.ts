import { NextRequest } from "next/server";
import connectToDatabase from "@/lib/db";
import SalaryStructure from "@/models/SalaryStructure";
import Payroll from "@/models/Payroll";
import AuditLog from "@/models/AuditLog";
import User from "@/models/User";
import { apiResponse } from "@/utils/apiResponse";
import { withRole, AuthenticatedRequest } from "@/middleware/auth";

async function creditAllSalaries(req: AuthenticatedRequest) {
  try {
    await connectToDatabase();
    const { month, year } = await req.json();
    
    if (!month || !year) {
      return apiResponse.badRequest("Missing required parameters");
    }

    let query: any = {};
    if (req.user?.role === "Admin") {
      query = { createdBy: req.user.userId, _id: { $ne: req.user.userId } };
    }

    const eligibleUsers = await User.find(query).select('_id').lean();
    const userIds = eligibleUsers.map(u => u._id);

    // Get all active structures
    const structures = await SalaryStructure.find({
      employee: { $in: userIds },
      isActive: true
    }).lean();

    // Get all existing payrolls for this month
    const existingPayrolls = await Payroll.find({
      employee: { $in: userIds },
      month,
      year
    }).lean();
    const existingEmpIds = new Set(existingPayrolls.map(p => String(p.employee)));

    const newPayrolls = [];
    let skippedCount = 0;

    for (const struct of structures) {
      const empIdStr = String(struct.employee);
      if (existingEmpIds.has(empIdStr)) {
        skippedCount++;
        continue;
      }
      
      newPayrolls.push({
        employee: struct.employee,
        salaryStructure: struct._id,
        month,
        year,
        grossSalary: struct.monthlyPay,
        basicPay: struct.basicPay,
        hra: struct.hra,
        otherAllowances: struct.otherAllowances,
        employeePF: struct.employeePF,
        employerPF: struct.employerPF,
        professionalTax: struct.professionalTax,
        incomeTax: struct.incomeTax,
        otherDeductions: struct.otherDeductions,
        netSalary: struct.netSalary,
        status: "GENERATED",
        generatedBy: req.user?.userId
      });
    }

    if (newPayrolls.length > 0) {
      await Payroll.insertMany(newPayrolls);
      await AuditLog.create({
        action: "PAYROLL_GENERATED_BULK",
        entityType: "Payroll",
        entityId: req.user?.userId, // using user id as entity for bulk
        performedBy: req.user?.userId,
        details: { month, year, count: newPayrolls.length }
      });
    }

    return apiResponse.success("Bulk salary credit completed", {
      totalEmployees: structures.length,
      successCount: newPayrolls.length,
      skippedCount
    });
  } catch (error: any) {
    return apiResponse.error("Error bulk crediting salaries", 500, { details: error.message });
  }
}

export const POST = withRole(["Super Admin", "Admin"], creditAllSalaries as any);
