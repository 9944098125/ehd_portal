import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import TimeEntry from "@/models/TimeEntry";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import User from "@/models/User";

async function getTeamTicketsHandler(req: AuthenticatedRequest) {
  try {
    await connectToDatabase();

    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    
    if (!userId || !startDateParam || !endDateParam) {
      return apiResponse.error("userId, startDate, and endDate are required", 400);
    }
    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);
    endDate.setHours(23, 59, 59, 999);

    const reqUser = req.user;
    if (!reqUser || reqUser.role === "Employee") {
      return apiResponse.unauthorized("Authentication required or access denied");
    }

    if (reqUser.role === "Admin" && reqUser.userId !== userId) {
      const targetUser = await User.findById(userId).select("createdBy").lean();
      if (!targetUser || targetUser.createdBy?.toString() !== reqUser.userId) {
         return apiResponse.forbidden("You do not have permission to view this user's data");
      }
    }

    const timeEntryMatch: any = { 
      user: new mongoose.Types.ObjectId(userId),
      date: { $gte: startDate, $lte: endDate }
    };

    const timeStats = await TimeEntry.aggregate([
      { $match: timeEntryMatch },
      {
        $group: {
          _id: {
            ticketId: "$ticket",
            dayOfWeek: { $isoDayOfWeek: "$date" }
          },
          hours: { $sum: "$hours" }
        }
      },
      {
        $group: {
          _id: "$_id.ticketId",
          totalHours: { $sum: "$hours" },
          days: {
            $push: {
              day: "$_id.dayOfWeek",
              hours: "$hours"
            }
          }
        }
      },
      {
        $lookup: {
          from: "tickets",
          localField: "_id",
          foreignField: "_id",
          as: "ticketDetails"
        }
      },
      { $unwind: "$ticketDetails" },
      {
        $lookup: {
          from: "projects",
          localField: "ticketDetails.project",
          foreignField: "_id",
          as: "projectDetails"
        }
      },
      { $unwind: { path: "$projectDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          title: "$ticketDetails.title",
          status: "$ticketDetails.status",
          projectTitle: "$projectDetails.title",
          totalHours: 1,
          days: 1
        }
      }
    ]);

    const formattedTickets = timeStats.map(t => {
      const dailyBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
      t.days.forEach((d: any) => {
        (dailyBreakdown as any)[d.day] = Number(d.hours.toFixed(2));
      });
      return {
        _id: t._id,
        title: t.title,
        status: t.status,
        projectTitle: t.projectTitle || "Unknown Project",
        totalHours: Number(t.totalHours.toFixed(2)),
        dailyBreakdown
      };
    });

    return apiResponse.success("Tickets retrieved successfully", {
      tickets: formattedTickets
    });
  } catch (error: any) {
    console.error("GET Team Tickets API Error:", error);
    return apiResponse.error("Internal Server Error", 500, { details: error.message });
  }
}

export const GET = withAuth(getTeamTicketsHandler as any);
