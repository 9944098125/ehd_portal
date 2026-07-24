import { z } from "zod";

const projectBaseSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name must be at most 100 characters").trim(),
  code: z.string().min(1, "Code is required").toUpperCase().trim(),
  description: z.string().min(10, "Description must be at least 10 characters").max(3000, "Description must be at most 3000 characters"),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  team: z.array(z.string()).optional(),
  teamLead: z.string().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  expectedEndDate: z.coerce.date().optional().nullable(),
  actualEndDate: z.coerce.date().optional().nullable(),
  color: z.string().optional(),
  icon: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  repository: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  jiraBoard: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  documentation: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  attachments: z.array(z.string().url("Must be a valid URL")).optional(),
});

const teamLeadRefinement = (data: any) => {
  if (data.teamLead && (!data.team || !data.team.includes(data.teamLead))) {
    return false;
  }
  return true;
};

export const createProjectSchema = projectBaseSchema.refine(teamLeadRefinement, {
  message: "Team Lead must be a member of the project team",
  path: ["teamLead"],
});

export const updateProjectSchema = projectBaseSchema.partial().refine(teamLeadRefinement, {
  message: "Team Lead must be a member of the project team",
  path: ["teamLead"],
});
