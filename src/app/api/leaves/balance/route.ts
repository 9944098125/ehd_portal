import { NextRequest, NextResponse } from "next/server";
import { AuthenticatedRequest, withAuth } from "@/middleware/auth";
import { apiResponse } from "@/utils/apiResponse";
import connectToDatabase from "@/lib/db";
import LeaveBalance from "@/models/LeaveBalance";
import User from "@/models/User";

const getLeaveBalanceHandler = async (req: AuthenticatedRequest) => {
  try {
    await connectToDatabase();

    const currentUser = await User.findById(req.user?.userId);
    if (!currentUser) return apiResponse.notFound("User not found");

    const year = new Date().getFullYear();
    let balance = await LeaveBalance.findOne({ employee: currentUser._id, year });
    
    if (!balance) {
      balance = await LeaveBalance.create({ employee: currentUser._id, year });
    }

    return apiResponse.success("Leave balance retrieved", { balance });
  } catch (error: any) {
    return apiResponse.error(error.message);
  }
};

export const GET = withAuth(getLeaveBalanceHandler as any);
