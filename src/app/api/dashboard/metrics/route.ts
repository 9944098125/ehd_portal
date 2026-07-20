import { NextRequest } from "next/server";
import connectToDatabase from "@/lib/db";
import TimeEntry from "@/models/TimeEntry";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import mongoose from "mongoose";

async function getDashboardMetricsHandler(req: AuthenticatedRequest) {
  try {
    await connectToDatabase();

    const role = req.user?.role;
    const userId = req.user?.userId;
    
    let matchQuery: any = {};
    if (role === "Employee") {
      matchQuery.user = new mongoose.Types.ObjectId(userId);
    }

    const timeStats = await TimeEntry.aggregate([
      { $match: matchQuery },
      { $group: { _id: null, totalTime: { $sum: "$hours" } } }
    ]);

    const totalTimeLogged = timeStats.length > 0 ? timeStats[0].totalTime : 0;

    return apiResponse.success("Dashboard metrics retrieved", { 
      totalTimeLogged 
    });
  } catch (error: any) {
    console.error("GET Dashboard Metrics API Error:", error);
    return apiResponse.error("Internal Server Error", 500, { details: error.message });
  }
}

export const GET = withAuth(getDashboardMetricsHandler as any);
