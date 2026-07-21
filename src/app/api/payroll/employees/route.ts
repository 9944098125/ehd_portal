import { NextRequest } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import SalaryStructure from "@/models/SalaryStructure";
import Payroll from "@/models/Payroll";
import { apiResponse } from "@/utils/apiResponse";
import { withRole, AuthenticatedRequest } from "@/middleware/auth";
import mongoose from "mongoose";

async function getEmployeesForPayroll(req: AuthenticatedRequest) {
  try {
    await connectToDatabase();
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    
    // Determine the current month/year for payroll status
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    let query: any = {};
    
    // Super Admin sees all. Admin sees only those they created (and NOT themselves)
    if (req.user?.role === "Admin") {
      query = { 
        createdBy: req.user.userId, 
        _id: { $ne: req.user.userId },
        role: { $nin: ["Super Admin", "Admin"] }
      };
    } else if (req.user?.role !== "Super Admin") {
      return apiResponse.forbidden("Access denied");
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (page - 1) * limit;
    
    // We fetch users, then attach salary structure and payroll status
    const users = await User.find(query)
      .select("firstName lastName employeeId department designation profilePicture")
      .sort({ firstName: 1 })
      .skip(skip)
      .limit(limit)
      .lean();
      
    const totalCount = await User.countDocuments(query);
    const userIds = users.map(u => u._id);

    // Fetch active salary structures
    const structures = await SalaryStructure.find({
      employee: { $in: userIds },
      isActive: true
    }).lean();

    // Fetch payrolls for current month
    const payrolls = await Payroll.find({
      employee: { $in: userIds },
      month: currentMonth,
      year: currentYear
    }).lean();

    const result = users.map(user => {
      const structure = structures.find(s => String(s.employee) === String(user._id));
      const payroll = payrolls.find(p => String(p.employee) === String(user._id));
      
      return {
        ...user,
        salaryStructure: structure || null,
        payrollStatus: payroll ? payroll.status : "NOT_GENERATED",
        currentPayroll: payroll || null
      };
    });

    return apiResponse.success("Employees retrieved", {
      employees: result,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error: any) {
    return apiResponse.error("Error fetching employees", 500, { details: error.message });
  }
}

export const GET = withRole(["Super Admin", "Admin"], getEmployeesForPayroll as any);
