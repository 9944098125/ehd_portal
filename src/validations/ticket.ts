import { z } from "zod";

export const ticketSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  projectId: z.string().min(1, "Project is required"),
  status: z.enum(["IN_PROGRESS", "IN_REVIEW", "COMPLETED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  estimatedHours: z.number().min(0, "Must be positive").optional(),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string().url("Must be valid URL")).optional(),
  department: z.string().optional(),
  assignees: z.array(z.string()).optional(),
});

export const updateTicketSchema = ticketSchema.partial();
