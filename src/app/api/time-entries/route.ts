import { NextRequest } from "next/server";
import connectToDatabase from "@/lib/db";
import TimeEntry from "@/models/TimeEntry";
import Ticket from "@/models/Ticket";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { createTimeEntrySchema } from "@/validations/timeEntry";
import { z } from "zod";

async function getTimeEntriesHandler(req: AuthenticatedRequest) {
  try {
    await connectToDatabase();

    const searchParams = req.nextUrl.searchParams;
    const ticketId = searchParams.get("ticketId");
    const projectId = searchParams.get("projectId");
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const query: any = {};
    if (ticketId) query.ticket = ticketId;
    if (projectId) query.project = projectId;
    if (userId) query.user = userId;

    const skip = (page - 1) * limit;

    const entries = await TimeEntry.find(query)
      .populate({ path: "user", select: "firstName lastName email profileImage" })
      .populate({ path: "ticket", select: "title priority status" })
      .populate({ path: "project", select: "name code color" })
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await TimeEntry.countDocuments(query);

    return apiResponse.success("Time entries retrieved successfully", {
      entries,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET TimeEntries API Error:", error);
    return apiResponse.error("Internal Server Error", 500, { details: error.message });
  }
}

async function createTimeEntryHandler(req: AuthenticatedRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const validatedData = createTimeEntrySchema.parse(body);
    const userId = req.user?.userId;

    const ticket = await Ticket.findById(validatedData.ticket).select("projectId");
    if (!ticket) {
      return apiResponse.error("Ticket not found", 404);
    }

    const timeEntry = new TimeEntry({
      ...validatedData,
      user: userId,
      project: ticket.projectId, // Derived from ticket
      date: validatedData.date ? new Date(validatedData.date) : new Date(),
      createdBy: userId,
      updatedBy: userId,
    });

    await timeEntry.save();

    await timeEntry.populate({ path: "user", select: "firstName lastName email profileImage" });
    await timeEntry.populate({ path: "ticket", select: "title priority status" });
    await timeEntry.populate({ path: "project", select: "name code color" });

    // Optional: Log Audit Event here if an Audit model exists

    return apiResponse.success("Time entry logged successfully", timeEntry, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return apiResponse.validationError("Validation failed", (error as any).errors);
    }
    console.error("POST TimeEntry API Error:", error);
    return apiResponse.error("Internal Server Error", 500, { details: error.message });
  }
}

export const GET = withAuth(getTimeEntriesHandler as any);
export const POST = withAuth(createTimeEntryHandler as any);
