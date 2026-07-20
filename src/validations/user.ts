import { z } from "zod";

export const createUserSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number should be at least 10 digits"),
  password: z.string().min(6, "Password should be at least 6 characters"),
  department: z.enum([
    "Human Resource",
    "Information Technology",
    "Finance",
    "Administration",
    "Research & Development",
    "Legal",
    "Security",
  ]),
  designation: z.string().min(1, "Designation is required"),
  status: z.enum(["Active", "Inactive", "Suspended"]).optional(),
  profileImage: z.string().url("Must be valid URL").optional().or(z.literal("")),
  role: z.enum(["Super Admin", "Admin", "Employee"]).optional(),
});

export const updateUserSchema = createUserSchema.partial().extend({
  password: z.string().min(6).optional(),
});
