import { z } from "zod";

export const createTimeEntrySchema = z.object({
  ticket: z.string().min(24).max(24, "Invalid Ticket ID"),
  hours: z
    .number()
    .min(0.01, "Minimum time log is 0.01 hours")
    .max(24, "Maximum time log is 24 hours"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
  date: z.string().datetime().optional(), // ISO string for frontend date selection
});

export const updateTimeEntrySchema = z.object({
  hours: z
    .number()
    .min(0.01, "Minimum time log is 0.01 hours")
    .max(24, "Maximum time log is 24 hours")
    .optional(),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
});

export type CreateTimeEntryPayload = z.infer<typeof createTimeEntrySchema>;
export type UpdateTimeEntryPayload = z.infer<typeof updateTimeEntrySchema>;
