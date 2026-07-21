import { NextRequest } from "next/server";
import connectToDatabase from "@/lib/db";
import SalaryStructure from "@/models/SalaryStructure";
import AuditLog from "@/models/AuditLog";
import User from "@/models/User";
import { apiResponse } from "@/utils/apiResponse";
import { withRole, AuthenticatedRequest } from "@/middleware/auth";

async function createOrUpdateSalaryStructure(req: AuthenticatedRequest) {
  try {
    await connectToDatabase();
    const data = await req.json();
    
    if (!data.employee) {
      return apiResponse.badRequest("Employee ID is required");
    }

    // Admin check
    if (req.user?.role === "Admin") {
      const emp = await User.findById(data.employee);
      if (!emp || String(emp.createdBy) !== req.user.userId) {
        return apiResponse.forbidden("Access denied to this employee");
      }
    }

    // Deactivate previous structure
    await SalaryStructure.updateMany(
      { employee: data.employee, isActive: true },
      { isActive: false, updatedBy: req.user?.userId }
    );

    const newStructure = await SalaryStructure.create({
      ...data,
      createdBy: req.user?.userId,
      isActive: true
    });

    await AuditLog.create({
      action: "SALARY_STRUCTURE_CREATED",
      entityType: "SalaryStructure",
      entityId: newStructure._id,
      performedBy: req.user?.userId
    });

    return apiResponse.success("Salary structure created", { structure: newStructure });
  } catch (error: any) {
    return apiResponse.error("Error creating salary structure", 500, { details: error.message });
  }
}

export const POST = withRole(["Super Admin", "Admin"], createOrUpdateSalaryStructure as any);
