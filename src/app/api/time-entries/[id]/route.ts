import { NextRequest } from "next/server";
import connectToDatabase from "@/lib/db";
import TimeEntry from "@/models/TimeEntry";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { updateTimeEntrySchema } from "@/validations/timeEntry";
import { z } from "zod";

async function updateTimeEntryHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();

    const { id } = await params;
    const body = await req.json();
    const validatedData = updateTimeEntrySchema.parse(body);
    const userId = req.user?.userId;

    const timeEntry = await TimeEntry.findById(id);
    if (!timeEntry) {
      return apiResponse.error("Time entry not found", 404);
    }

    // STRICT OWNER CHECK: Only the user who created it can edit it.
    if (timeEntry.user.toString() !== userId) {
      return apiResponse.forbidden("You are not authorized to edit this time entry. Only the owner can edit.");
    }

    if (validatedData.hours !== undefined) timeEntry.hours = validatedData.hours;
    if (validatedData.description !== undefined) timeEntry.description = validatedData.description;
    timeEntry.updatedBy = userId as any;

    await timeEntry.save();
    
    await timeEntry.populate({ path: "user", select: "firstName lastName email profileImage" });
    await timeEntry.populate({ path: "ticket", select: "title priority status" });
    await timeEntry.populate({ path: "project", select: "name code color" });

    return apiResponse.success("Time entry updated successfully", timeEntry);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return apiResponse.validationError("Validation failed", (error as any).errors);
    }
    console.error("PUT TimeEntry API Error:", error);
    return apiResponse.error("Internal Server Error", 500, { details: error.message });
  }
}

async function deleteTimeEntryHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();

    const { id } = await params;
    const userId = req.user?.userId;

    const timeEntry = await TimeEntry.findById(id);
    if (!timeEntry) {
      return apiResponse.error("Time entry not found", 404);
    }

    // STRICT OWNER CHECK: Only the user who created it can delete it.
    if (timeEntry.user.toString() !== userId) {
      return apiResponse.forbidden("You are not authorized to delete this time entry. Only the owner can delete.");
    }

    await timeEntry.deleteOne();

    return apiResponse.success("Time entry deleted successfully", null);
  } catch (error: any) {
    console.error("DELETE TimeEntry API Error:", error);
    return apiResponse.error("Internal Server Error", 500, { details: error.message });
  }
}

export const PUT = withAuth(updateTimeEntryHandler as any);
export const DELETE = withAuth(deleteTimeEntryHandler as any);
