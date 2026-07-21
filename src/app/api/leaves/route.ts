import { NextRequest } from "next/server";
import connectToDatabase from "@/lib/db";
import Leave from "@/models/Leave";
import { apiResponse } from "@/utils/apiResponse";
import { withRole, AuthenticatedRequest } from "@/middleware/auth";

async function getLeaves(req: AuthenticatedRequest) {
  try {
    await connectToDatabase();
    // Admins see all leaves, employees handled in /leaves/my
    const leaves = await Leave.find().populate("employee", "firstName lastName employeeId").sort({ createdAt: -1 }).lean();
    return apiResponse.success("Leaves retrieved", { leaves });
  } catch (error: any) {
    return apiResponse.error("Error fetching leaves", 500, { details: error.message });
  }
}

async function requestLeave(req: AuthenticatedRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    const leave = new Leave({
      ...body,
      employee: req.user?.userId,
      createdBy: req.user?.userId,
      updatedBy: req.user?.userId
    });
    await leave.save();
    return apiResponse.success("Leave requested", leave, 201);
  } catch (error: any) {
    return apiResponse.error("Error requesting leave", 500, { details: error.message });
  }
}

export const GET = withRole(["Super Admin", "Admin"], getLeaves as any);
export const POST = withRole(["Super Admin", "Admin", "Employee"], requestLeave as any);
