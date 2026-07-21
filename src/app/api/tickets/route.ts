import { NextRequest } from "next/server";
import connectToDatabase from "@/lib/db";
import Ticket from "@/models/Ticket";
import "@/models/Project";
import "@/models/User";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { ticketSchema } from "@/validations/ticket";
import { z } from "zod";

async function getTicketsHandler(req: AuthenticatedRequest) {
  try {
    await connectToDatabase();


    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const projectId = searchParams.get("projectId");
    const priority = searchParams.get("priority");
    const sortField = searchParams.get("sortField") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

    const query: any = {};

    const role = req.user?.role;
    const userId = req.user?.userId;

    if (projectId) query.projectId = projectId;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const skip = (page - 1) * limit;

    const tickets = await Ticket.find(query)
      .populate({ path: "owner", model: "User", select: "firstName lastName email profileImage role" })
      .populate({ path: "assignees", model: "User", select: "firstName lastName email profileImage role department" })
      .populate({ path: "projectId", model: "Project", select: "name code color" })
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    const ticketIds = tickets.map((t: any) => t._id);
    const TimeEntry = require("@/models/TimeEntry").default;
    
    // Dynamically calculate total tracked time for these tickets
    const timeStats = await TimeEntry.aggregate([
      { $match: { ticket: { $in: ticketIds } } },
      { $group: { _id: "$ticket", totalTime: { $sum: "$hours" } } }
    ]);
    
    const timeMap = new Map(timeStats.map((stat: any) => [stat._id.toString(), stat.totalTime]));
    
    const ticketsWithTime = tickets.map((t: any) => ({
      ...t,
      totalTime: timeMap.get(t._id.toString()) || 0
    }));

    const total = await Ticket.countDocuments(query);

    return apiResponse.success("Tickets retrieved successfully", {
      tickets: ticketsWithTime,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET Tickets API Error:", error);
    return apiResponse.error("Internal Server Error", 500, { details: error.message });
  }
}

async function createTicketHandler(req: AuthenticatedRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    
    // Validate request body
    const validatedData = ticketSchema.parse(body);

    const userId = req.user?.userId;

    const ticket = new Ticket({
      ...validatedData,
      owner: userId,
      createdBy: userId,
      updatedBy: userId,
    });

    await ticket.save();

    await ticket.populate({ path: "owner", model: "User", select: "firstName lastName email profileImage role" });
    await ticket.populate({ path: "assignees", model: "User", select: "firstName lastName email profileImage role department" });
    await ticket.populate({ path: "projectId", model: "Project", select: "name code color" });

    return apiResponse.success("Ticket created successfully", ticket, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return apiResponse.validationError("Validation failed", (error as any).errors);
    }
    console.error("POST Ticket API Error:", error);
    return apiResponse.error("Internal Server Error", 500, { details: error.message });
  }
}

export const GET = withAuth(getTicketsHandler as any);
export const POST = withAuth(createTicketHandler as any);
