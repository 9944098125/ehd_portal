import { NextRequest, NextResponse } from "next/server";
import { AuthenticatedRequest, withAuth } from "@/middleware/auth";
import { apiResponse } from "@/utils/apiResponse";
import connectToDatabase from "@/lib/db";
import Leave from "@/models/Leave";
import User from "@/models/User";

const getMyLeavesHandler = async (req: AuthenticatedRequest) => {
  try {
    await connectToDatabase();
    
    const currentUser = await User.findById(req.user?.userId);
    if (!currentUser) return apiResponse.notFound("User not found");

    const leaves = await Leave.find({ employee: currentUser._id })
      .populate("employee", "firstName lastName email department")
      .populate("approver", "firstName lastName")
      .populate("approvedBy", "firstName lastName")
      .sort({ createdAt: -1 });

    return apiResponse.success("My leaves retrieved", { leaves, total: leaves.length });
  } catch (error: any) {
    return apiResponse.error(error.message);
  }
};

export const GET = withAuth(getMyLeavesHandler as any);
