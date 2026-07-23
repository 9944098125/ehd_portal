import { NextRequest } from "next/server";
import connectToDatabase from "@/lib/db";
import Payroll from "@/models/Payroll";
import "@/models/SalaryStructure";
import { apiResponse } from "@/utils/apiResponse";
import { withRole, AuthenticatedRequest } from "@/middleware/auth";

async function getMyPayslips(req: AuthenticatedRequest) {
  try {
    await connectToDatabase();
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    
    const skip = (page - 1) * limit;
    
    const payslips = await Payroll.find({ employee: req.user?.userId })
      .populate("salaryStructure")
      .sort({ year: -1, month: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
      
    const totalCount = await Payroll.countDocuments({ employee: req.user?.userId });
    
    return apiResponse.success("Payslips retrieved", {
      payslips,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error: any) {
    return apiResponse.error("Error fetching payslips", 500, { details: error.message });
  }
}

export const GET = withRole(["Super Admin", "Admin", "Employee"], getMyPayslips as any);
