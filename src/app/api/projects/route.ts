import { NextRequest } from "next/server";
import connectToDatabase from "@/lib/db";
import Project from "@/models/Project";
import Ticket from "@/models/Ticket";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { createProjectSchema } from "@/validations/project";
import { z } from "zod";
import mongoose from "mongoose";

async function getProjectsHandler(req: AuthenticatedRequest) {
  try {
    const role = req.user?.role;
    if (role !== "Admin" && role !== "Super Admin") {
      return apiResponse.error("Forbidden: Insufficient permissions", 403);
    }

    await connectToDatabase();

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const teamLead = searchParams.get("teamLead");
    
    // Default sorting based on updated specs
    const sortField = searchParams.get("sortField") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (teamLead) query.teamLead = teamLead;

    const skip = (page - 1) * limit;

    // Use aggregation to join the tickets and calculate stats
    const pipeline: any[] = [
      { $match: query },
      { $sort: { [sortField]: sortOrder } },
      { $skip: skip },
      { $limit: limit },
      
      // Lookup Tickets for progress calculation
      {
        $lookup: {
          from: "tickets", // Mongoose pluralizes Ticket -> tickets
          localField: "_id",
          foreignField: "projectId",
          as: "projectTickets",
        }
      },
      
      // Calculate ticket totals
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
      
      // Calculate progress percentage
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
      
      // Remove raw tickets array to save bandwidth
      { $project: { projectTickets: 0 } },
      
      // Lookup relations (team, teamLead, createdBy)
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
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          pipeline: [
            { $project: { firstName: 1, lastName: 1 } }
          ],
          as: "createdByDetails"
        }
      },
      {
        $addFields: {
          createdBy: { $arrayElemAt: ["$createdByDetails", 0] }
        }
      },
      { $project: { createdByDetails: 0 } }
    ];

    const projects = await Project.aggregate(pipeline);
    const total = await Project.countDocuments(query);

    return apiResponse.success("Projects retrieved successfully", {
      projects,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET Projects API Error:", error);
    return apiResponse.error("Internal Server Error", 500, { details: error.message });
  }
}

async function createProjectHandler(req: AuthenticatedRequest) {
  try {
    const role = req.user?.role;
    if (role !== "Admin" && role !== "Super Admin") {
      return apiResponse.error("Forbidden: Insufficient permissions", 403);
    }

    await connectToDatabase();

    const body = await req.json();
    const validatedData = createProjectSchema.parse(body);

    // Check for duplicate code or name
    const existingProject = await Project.findOne({
      $or: [{ name: validatedData.name }, { code: validatedData.code }]
    });

    if (existingProject) {
      if (existingProject.name === validatedData.name) {
        return apiResponse.error("Project with this name already exists", 400);
      }
      if (existingProject.code === validatedData.code) {
        return apiResponse.error("Project with this code already exists", 400);
      }
    }

    const userId = req.user?.userId;

    const project = new Project({
      ...validatedData,
      createdBy: userId,
      updatedBy: userId,
    });

    await project.save();
    
    // Return empty stats for newly created projects
    const result = {
      ...project.toObject(),
      totalTickets: 0,
      completedTickets: 0,
      progress: 0,
    };

    return apiResponse.success("Project created successfully", result, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return apiResponse.validationError("Validation failed", (error as any).errors);
    }
    console.error("POST Project API Error:", error);
    return apiResponse.error("Internal Server Error", 500, { details: error.message });
  }
}

export const GET = withAuth(getProjectsHandler as any);
export const POST = withAuth(createProjectHandler as any);
