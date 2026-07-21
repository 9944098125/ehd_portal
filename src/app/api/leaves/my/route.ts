import { NextRequest } from "next/server";
import connectToDatabase from "@/lib/db";
import Leave from "@/models/Leave";
import { apiResponse } from "@/utils/apiResponse";
import { withRole, AuthenticatedRequest } from "@/middleware/auth";

async function getMyLeaves(req: AuthenticatedRequest) {
  try {
    await connectToDatabase();
    const leaves = await Leave.find({ employee: req.user?.userId }).sort({ createdAt: -1 }).lean();
    return apiResponse.success("My leaves retrieved", { leaves });
  } catch (error: any) {
    return apiResponse.error("Error fetching leaves", 500, { details: error.message });
  }
}

export const GET = withRole(["Super Admin", "Admin", "Employee"], getMyLeaves as any);
