import { NextRequest } from "next/server";
import connectToDatabase from "@/lib/db";
import SalaryStructure from "@/models/SalaryStructure";
import User from "@/models/User";
import { apiResponse } from "@/utils/apiResponse";
import { withRole, AuthenticatedRequest } from "@/middleware/auth";

async function getSalaryStructure(req: AuthenticatedRequest, { params }: { params: Promise<{ employeeId: string }> }) {
  try {
    await connectToDatabase();
    const resolvedParams = await params;
    
    // Admin check: Ensure this employee belongs to the admin
    if (req.user?.role === "Admin") {
      const emp = await User.findById(resolvedParams.employeeId);
      if (!emp || String(emp.createdBy) !== req.user.userId) {
        return apiResponse.forbidden("Access denied to this employee");
      }
    }
    
    const structure = await SalaryStructure.findOne({
      employee: resolvedParams.employeeId,
      isActive: true
    }).populate("employee", "firstName lastName employeeId").lean();
    
    return apiResponse.success("Salary structure retrieved", { structure });
  } catch (error: any) {
    return apiResponse.error("Error fetching salary structure", 500, { details: error.message });
  }
}

export const GET = withRole(["Super Admin", "Admin"], getSalaryStructure as any);
