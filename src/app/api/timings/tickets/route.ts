import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import TimeEntry from "@/models/TimeEntry";
import User from "@/models/User";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";

async function getTimingEntriesHandler(req: AuthenticatedRequest) {
  try {
    await connectToDatabase();

    const searchParams = req.nextUrl.searchParams;
    const ticketId = searchParams.get("ticketId");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    if (!ticketId || !startDateParam || !endDateParam) {
      return apiResponse.error("ticketId, startDate, and endDate are required", 400);
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);
    endDate.setHours(23, 59, 59, 999);

    const reqUser = req.user;
    if (!reqUser) return apiResponse.unauthorized("Authentication required");

    let allowedUserIds: mongoose.Types.ObjectId[] = [];
    const userMatch: any = {};
    if (reqUser.role === "Employee") {
      userMatch._id = new mongoose.Types.ObjectId(reqUser.userId);
    } else if (reqUser.role === "Admin") {
      userMatch.$or = [
        { _id: new mongoose.Types.ObjectId(reqUser.userId) },
        { createdBy: new mongoose.Types.ObjectId(reqUser.userId) },
      ];
    }
    const matchedUsers = await User.find(userMatch).select("_id").lean();
    allowedUserIds = matchedUsers.map(u => u._id);

    if (allowedUserIds.length === 0) {
      return apiResponse.success("No records found", { entries: [] });
    }

    const entries = await TimeEntry.find({
      ticket: new mongoose.Types.ObjectId(ticketId),
      user: { $in: allowedUserIds },
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 }).lean();

    const formattedEntries = entries.map(e => ({
      _id: e._id,
      hours: Number(e.hours.toFixed(2)),
      description: e.description || "Time entry",
      dayOfWeek: e.date.getDay() === 0 ? 7 : e.date.getDay() // Convert Sunday (0) to 7, Monday is 1
    }));

    return apiResponse.success("Entries retrieved successfully", { entries: formattedEntries });
  } catch (error: any) {
    console.error("GET Timings Entries API Error:", error);
    return apiResponse.error("Internal Server Error", 500, { details: error.message });
  }
}

export const GET = withAuth(getTimingEntriesHandler as any);
