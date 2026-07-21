import { NextRequest } from "next/server";
import connectToDatabase from "@/lib/db";
import Ticket from "@/models/Ticket";
import "@/models/Project";
import "@/models/User";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { updateTicketSchema } from "@/validations/ticket";
import { z } from "zod";

async function getTicketByIdHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    
    // In Next.js 15+ App router, params is a promise
    const { id } = await params;

    const ticket = await Ticket.findById(id)
      .populate({ path: "owner", model: "User", select: "firstName lastName email profileImage role" })
      .populate({ path: "assignees", model: "User", select: "firstName lastName email profileImage role department" })
      .populate({ path: "projectId", model: "Project", select: "name code color" });

    if (!ticket) {
      return apiResponse.error("Ticket not found", 404);
    }

    return apiResponse.success("Ticket retrieved successfully", ticket);
  } catch (error: any) {
    console.error("GET Ticket By ID API Error:", error);
    return apiResponse.error("Internal Server Error", 500, { details: error.message });
  }
}

async function updateTicketHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();

    const { id } = await params;
    const body = await req.json();

    const validatedData = updateTicketSchema.parse(body);
    const userId = req.user?.userId;

    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return apiResponse.error("Ticket not found", 404);
    }

    // Check if status changed
    if (validatedData.status && validatedData.status !== ticket.status) {
      ticket.statusUpdatedAt = new Date() as any;
    }

    // Apply updates
    Object.assign(ticket, validatedData);
    ticket.updatedBy = userId as any;

    await ticket.save();

    await ticket.populate({ path: "owner", model: "User", select: "firstName lastName email profileImage role" });
    await ticket.populate({ path: "assignees", model: "User", select: "firstName lastName email profileImage role department" });
    await ticket.populate({ path: "projectId", model: "Project", select: "name code color" });

    return apiResponse.success("Ticket updated successfully", ticket);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return apiResponse.validationError("Validation failed", (error as any).errors);
    }
    console.error("PUT Ticket API Error:", error);
    return apiResponse.error("Internal Server Error", 500, { details: error.message });
  }
}

async function deleteTicketHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();

    const { id } = await params;
    const userId = req.user?.userId;

    const ticket = await Ticket.findById(id);

    if (!ticket) {
      return apiResponse.error("Ticket not found", 404);
    }

    // Only owner can delete
    if (ticket.owner.toString() !== userId) {
      return apiResponse.forbidden("Only the ticket owner can delete this ticket");
    }

    await Ticket.findByIdAndDelete(id);

    return apiResponse.success("Ticket deleted successfully", null);
  } catch (error: any) {
    console.error("DELETE Ticket API Error:", error);
    return apiResponse.error("Internal Server Error", 500, { details: error.message });
  }
}

export const GET = withAuth(getTicketByIdHandler as any);
export const PUT = withAuth(updateTicketHandler as any);
export const DELETE = withAuth(deleteTicketHandler as any);
