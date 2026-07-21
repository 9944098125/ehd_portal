import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import TimeEntry from "@/models/TimeEntry";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";

async function getMyTimingsHandler(req: AuthenticatedRequest) {
  try {
    await connectToDatabase();

    const searchParams = req.nextUrl.searchParams;
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    
    if (!startDateParam || !endDateParam) {
      return apiResponse.error("startDate and endDate are required", 400);
    }
    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);
    endDate.setHours(23, 59, 59, 999);

    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const project = searchParams.get("project");

    const reqUser = req.user;
    if (!reqUser) return apiResponse.unauthorized("Authentication required");

    const timeEntryMatch: any = { 
      user: new mongoose.Types.ObjectId(reqUser.userId),
      date: { $gte: startDate, $lte: endDate }
    };
    if (project) {
      timeEntryMatch.project = new mongoose.Types.ObjectId(project);
    }

    const distinctTicketsAgg = await TimeEntry.aggregate([
      { $match: timeEntryMatch },
      { $group: { _id: "$ticket" } },
      { $sort: { _id: -1 } }
    ]);
    const allTicketIds = distinctTicketsAgg.map(t => t._id);

    let paginatedTicketIds = allTicketIds;
    if (cursor) {
      const cursorIndex = allTicketIds.findIndex(id => id.toString() === cursor);
      if (cursorIndex !== -1) {
        paginatedTicketIds = allTicketIds.slice(cursorIndex + 1);
      }
    }
    
    const hasMore = paginatedTicketIds.length > limit;
    paginatedTicketIds = paginatedTicketIds.slice(0, limit);
    const nextCursor = hasMore ? paginatedTicketIds[paginatedTicketIds.length - 1].toString() : null;

    if (paginatedTicketIds.length === 0) {
      return apiResponse.success("No records found", { tickets: [], nextCursor: null, hasMore: false });
    }

    const timeStats = await TimeEntry.aggregate([
      { 
        $match: { 
          ...timeEntryMatch,
          ticket: { $in: paginatedTicketIds }
        } 
      },
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

    const orderedTickets = paginatedTicketIds.map(id => formattedTickets.find(t => t._id.toString() === id.toString())).filter(Boolean);

    return apiResponse.success("My timings retrieved successfully", {
      tickets: orderedTickets,
      nextCursor,
      hasMore,
    });
  } catch (error: any) {
    console.error("GET My Timings API Error:", error);
    return apiResponse.error("Internal Server Error", 500, { details: error.message });
  }
}

export const GET = withAuth(getMyTimingsHandler as any);
