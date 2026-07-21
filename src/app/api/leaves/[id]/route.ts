import { NextRequest } from "next/server";
import connectToDatabase from "@/lib/db";
import Leave from "@/models/Leave";
import { apiResponse } from "@/utils/apiResponse";
import { withRole, AuthenticatedRequest } from "@/middleware/auth";

async function updateLeaveStatus(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { id } = params;
    const body = await req.json();
    
    const leave = await Leave.findById(id);
    if (!leave) return apiResponse.notFound("Leave not found");
    
    leave.status = body.status;
    leave.approvedBy = req.user?.userId as any;
    leave.updatedBy = req.user?.userId as any;
    
    await leave.save();
    return apiResponse.success("Leave status updated", leave);
  } catch (error: any) {
    return apiResponse.error("Error updating leave", 500, { details: error.message });
  }
}

export const PATCH = withRole(["Super Admin", "Admin"], updateLeaveStatus as any);
