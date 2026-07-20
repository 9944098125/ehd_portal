import { NextRequest } from "next/server";
import connectToDatabase from "@/lib/db";
import Project from "@/models/Project";
import Ticket from "@/models/Ticket";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { updateProjectSchema } from "@/validations/project";
import { z } from "zod";
import mongoose from "mongoose";

async function getProjectByIdHandler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const role = req.user?.role;
    if (role !== "Admin" && role !== "Super Admin") {
      return apiResponse.error("Forbidden: Insufficient permissions", 403);
    }

    await connectToDatabase();
    
    // Await params if using Next.js 15+
    const resolvedParams = await params;
    const projectId = resolvedParams.id;

    const pipeline: any[] = [
      { $match: { _id: new mongoose.Types.ObjectId(projectId) } },
      
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
      { $project: { createdByDetails: 0 } },
      
      {
        $lookup: {
          from: "users",
          localField: "updatedBy",
          foreignField: "_id",
          pipeline: [
            { $project: { firstName: 1, lastName: 1 } }
          ],
          as: "updatedByDetails"
        }
      },
      {
        $addFields: {
          updatedBy: { $arrayElemAt: ["$updatedByDetails", 0] }
        }
      },
      { $project: { updatedByDetails: 0 } }
    ];

    const projects = await Project.aggregate(pipeline);
    
    if (!projects || projects.length === 0) {
      return apiResponse.error("Project not found", 404);
    }

    const project = projects[0];
    const TimeEntry = require("@/models/TimeEntry").default;
    const timeStats = await TimeEntry.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(projectId) } },
      { $group: { _id: null, totalTime: { $sum: "$hours" } } }
    ]);
    
    project.totalTimeLogged = timeStats.length > 0 ? timeStats[0].totalTime : 0;

    return apiResponse.success("Project retrieved successfully", project);
  } catch (error: any) {
    console.error("GET Project By Id API Error:", error);
    return apiResponse.error("Internal Server Error", 500, { details: error.message });
  }
}

async function updateProjectHandler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const role = req.user?.role;
    if (role !== "Admin" && role !== "Super Admin") {
      return apiResponse.error("Forbidden: Insufficient permissions", 403);
    }

    await connectToDatabase();
    
    const resolvedParams = await params;
    const projectId = resolvedParams.id;

    const body = await req.json();
    const validatedData = updateProjectSchema.parse(body);

    const existingProject = await Project.findById(projectId);
    if (!existingProject) {
      return apiResponse.error("Project not found", 404);
    }

    // Check for duplicate code or name
    if (validatedData.name || validatedData.code) {
      const duplicateQuery: any = { _id: { $ne: projectId }, $or: [] };
      if (validatedData.name) duplicateQuery.$or.push({ name: validatedData.name });
      if (validatedData.code) duplicateQuery.$or.push({ code: validatedData.code });
      
      const duplicate = await Project.findOne(duplicateQuery);
      if (duplicate) {
        if (duplicate.name === validatedData.name) {
          return apiResponse.error("Project with this name already exists", 400);
        }
        if (duplicate.code === validatedData.code) {
          return apiResponse.error("Project with this code already exists", 400);
        }
      }
    }

    const userId = req.user?.userId;
    
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { ...validatedData, updatedBy: userId },
      { new: true }
    )
      .populate({ path: "team", model: "User", select: "firstName lastName email profileImage department role" })
      .populate({ path: "teamLead", model: "User", select: "firstName lastName email profileImage department role" })
      .populate({ path: "createdBy", model: "User", select: "firstName lastName" })
      .populate({ path: "updatedBy", model: "User", select: "firstName lastName" })
      .lean();
      
    // Fetch tickets to calculate progress for updated project
    const totalTickets = await Ticket.countDocuments({ projectId });
    const completedTickets = await Ticket.countDocuments({ 
      projectId, 
      status: { $in: ["COMPLETED", "CLOSED"] } 
    });
    
    const result = {
      ...updatedProject,
      totalTickets,
      completedTickets,
      progress: totalTickets === 0 ? 0 : (completedTickets / totalTickets) * 100
    };

    return apiResponse.success("Project updated successfully", result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return apiResponse.validationError("Validation failed", (error as any).errors);
    }
    console.error("PUT Project API Error:", error);
    return apiResponse.error("Internal Server Error", 500, { details: error.message });
  }
}

async function deleteProjectHandler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const role = req.user?.role;
    if (role !== "Admin" && role !== "Super Admin") {
      return apiResponse.error("Forbidden: Insufficient permissions", 403);
    }

    await connectToDatabase();
    
    const resolvedParams = await params;
    const projectId = resolvedParams.id;

    const project = await Project.findByIdAndDelete(projectId);
    if (!project) {
      return apiResponse.error("Project not found", 404);
    }

    return apiResponse.success("Project deleted successfully", null);
  } catch (error: any) {
    console.error("DELETE Project API Error:", error);
    return apiResponse.error("Internal Server Error", 500, { details: error.message });
  }
}

export const GET = withAuth(getProjectByIdHandler as any);
export const PUT = withAuth(updateProjectHandler as any);
export const DELETE = withAuth(deleteProjectHandler as any);
