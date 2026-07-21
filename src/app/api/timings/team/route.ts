import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import TimeEntry from "@/models/TimeEntry";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";

async function getTeamTimingsHandler(req: AuthenticatedRequest) {
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
    const search = searchParams.get("search");
    const department = searchParams.get("department");
    const role = searchParams.get("role");
    const project = searchParams.get("project");

    const reqUser = req.user;
    if (!reqUser) return apiResponse.unauthorized("Authentication required");

    // Employees have no team to view
    if (reqUser.role === "Employee") {
      return apiResponse.forbidden("Access denied");
    }

    const userMatch: any = {};
    if (reqUser.role === "Admin") {
      userMatch.$or = [
        { _id: new mongoose.Types.ObjectId(reqUser.userId) },
        { createdBy: new mongoose.Types.ObjectId(reqUser.userId) },
      ];
    }
    
    if (department) userMatch.department = department;
    if (role) userMatch.role = role;
    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      const searchOr = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
      ];
      if (userMatch.$or) {
        userMatch.$and = [{ $or: userMatch.$or }, { $or: searchOr }];
        delete userMatch.$or;
      } else {
        userMatch.$or = searchOr;
      }
    }

    if (cursor) {
      if (userMatch.$and) {
        userMatch.$and.push({ _id: { $lt: new mongoose.Types.ObjectId(cursor) } });
      } else {
        userMatch._id = { ...userMatch._id, $lt: new mongoose.Types.ObjectId(cursor) };
      }
    }

    const users = await User.find(userMatch)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .select("firstName lastName email role department profileImage")
      .lean();

    const hasMore = users.length > limit;
    const paginatedUsers = hasMore ? users.slice(0, limit) : users;
    const nextCursor = hasMore ? paginatedUsers[paginatedUsers.length - 1]._id.toString() : null;

    if (paginatedUsers.length === 0) {
      return apiResponse.success("No users found", { users: [], nextCursor: null, hasMore: false });
    }

    const userIds = paginatedUsers.map((u) => u._id);
    const timeEntryMatch: any = { 
      user: { $in: userIds },
      date: { $gte: startDate, $lte: endDate }
    };
    if (project) {
      timeEntryMatch.project = new mongoose.Types.ObjectId(project);
    }

    const timeStats = await TimeEntry.aggregate([
      { $match: timeEntryMatch },
      {
        $group: {
          _id: {
            userId: "$user",
            dayOfWeek: { $isoDayOfWeek: "$date" }
          },
          hours: { $sum: "$hours" }
        }
      },
      {
        $group: {
          _id: "$_id.userId",
          totalHours: { $sum: "$hours" },
          days: {
            $push: {
              day: "$_id.dayOfWeek",
              hours: "$hours"
            }
          }
        }
      }
    ]);

    const statsMap = new Map();
    timeStats.forEach(stat => {
      const dailyBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
      stat.days.forEach((d: any) => {
        (dailyBreakdown as any)[d.day] = Number(d.hours.toFixed(2));
      });
      statsMap.set(stat._id.toString(), {
        totalHours: Number(stat.totalHours.toFixed(2)),
        dailyBreakdown
      });
    });

    const finalUsers = paginatedUsers.map((u) => {
      const stats = statsMap.get(u._id.toString()) || { 
        totalHours: 0, 
        dailyBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 } 
      };

      return {
        _id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        role: u.role,
        department: u.department,
        profileImage: u.profileImage,
        totalHours: stats.totalHours,
        dailyBreakdown: stats.dailyBreakdown,
      };
    });

    return apiResponse.success("Team Timings retrieved successfully", {
      users: finalUsers,
      nextCursor,
      hasMore,
    });
  } catch (error: any) {
    console.error("GET Team Timings API Error:", error);
    return apiResponse.error("Internal Server Error", 500, { details: error.message });
  }
}

export const GET = withAuth(getTeamTimingsHandler as any);
