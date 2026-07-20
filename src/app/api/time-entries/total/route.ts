import { NextRequest } from "next/server";
import connectToDatabase from "@/lib/db";
import TimeEntry from "@/models/TimeEntry";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import mongoose from "mongoose";

async function getTotalTimeHandler(req: AuthenticatedRequest) {
  try {
    await connectToDatabase();

    const userId = req.user?.userId;
    if (!userId) return apiResponse.unauthorized("Authentication required");

    const timeStats = await TimeEntry.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, totalTime: { $sum: "$hours" } } }
    ]);

    const totalTimeLogged = timeStats.length > 0 ? timeStats[0].totalTime : 0;

    return apiResponse.success("Total time retrieved", { totalTimeLogged });
  } catch (error: any) {
    console.error("GET TotalTime API Error:", error);
    return apiResponse.error("Internal Server Error", 500, { details: error.message });
  }
}

export const GET = withAuth(getTotalTimeHandler as any);
