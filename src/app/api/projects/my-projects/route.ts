import { NextRequest } from "next/server";
import connectToDatabase from "@/lib/db";
import Project from "@/models/Project";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import mongoose from "mongoose";

async function getMyProjectsHandler(req: AuthenticatedRequest) {
  try {
    await connectToDatabase();

    const role = req.user?.role;
    const userId = req.user?.userId;

    const query: any = {};

    if (role === "Employee") {
      query.status = "ACTIVE";
      query.team = new mongoose.Types.ObjectId(userId);
    }

    const pipeline: any[] = [
      { $match: query },
      { $sort: { name: 1 } },
      
      {
        $lookup: {
          from: "tickets",
          localField: "_id",
          foreignField: "projectId",
          as: "projectTickets",
        }
      },
      {
        $addFields: {
          totalTickets: { $size: "$projectTickets" },
          completedTickets: {
            $size: {
              $filter: {
                input: "$projectTickets",
                as: "ticket",
                cond: { $in: ["$$ticket.status", ["COMPLETED", "CLOSED"]] }
              }
            }
          }
        }
      },
      {
        $addFields: {
          progress: {
            $cond: [
              { $eq: ["$totalTickets", 0] },
              0,
              { $multiply: [{ $divide: ["$completedTickets", "$totalTickets"] }, 100] }
            ]
          }
        }
      },
      { $project: { projectTickets: 0 } },
      
      {
        $lookup: {
          from: "users",
          localField: "team",
          foreignField: "_id",
          pipeline: [
            { $project: { firstName: 1, lastName: 1, email: 1, profileImage: 1, department: 1, role: 1 } }
          ],
          as: "team"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "teamLead",
          foreignField: "_id",
          pipeline: [
            { $project: { firstName: 1, lastName: 1, email: 1, profileImage: 1, department: 1, role: 1 } }
          ],
          as: "teamLeadDetails"
        }
      },
      {
        $addFields: {
          teamLead: { $arrayElemAt: ["$teamLeadDetails", 0] }
        }
      },
      { $project: { teamLeadDetails: 0 } },
      {
        $project: {
          name: 1,
          code: 1,
          description: 1,
          status: 1,
          team: 1,
          teamLead: 1,
          color: 1,
          icon: 1,
          totalTickets: 1,
          completedTickets: 1,
          progress: 1
        }
      }
    ];

    const projects = await Project.aggregate(pipeline);

    const projectIds = projects.map((p: any) => p._id);
    const TimeEntry = require("@/models/TimeEntry").default;

    const timeStats = await TimeEntry.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: "$project", totalTime: { $sum: "$hours" } } }
    ]);
    
    const timeMap = new Map(timeStats.map((stat: any) => [stat._id.toString(), stat.totalTime]));
    
    const projectsWithTime = projects.map((p: any) => ({
      ...p,
      totalTimeLogged: timeMap.get(p._id.toString()) || 0
    }));

    return apiResponse.success("My Projects retrieved successfully", projectsWithTime);
  } catch (error: any) {
    console.error("GET My Projects API Error:", error);
    return apiResponse.error("Internal Server Error", 500, { details: error.message });
  }
}

export const GET = withAuth(getMyProjectsHandler as any);
