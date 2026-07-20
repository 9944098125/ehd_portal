import { NextRequest } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { apiResponse } from "@/utils/apiResponse";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { z } from "zod";

const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().min(10, "Phone number should be at least 10 digits").optional(),
  profileImage: z.string().url("Must be valid URL").optional().or(z.literal("")),
});

async function updateProfileHandler(req: AuthenticatedRequest) {
  try {
    await connectToDatabase();
    
    if (!req.user || !req.user.userId) {
      return apiResponse.unauthorized("Authentication required");
    }
    
    const userId = req.user.userId;
    const body = await req.json();

    const validatedData = updateProfileSchema.parse(body);

    const user = await User.findById(userId);
    if (!user) {
      return apiResponse.error("User not found", 404);
    }

    // Only allow updating specific fields
    if (validatedData.firstName) user.firstName = validatedData.firstName;
    if (validatedData.lastName) user.lastName = validatedData.lastName;
    if (validatedData.email) user.email = validatedData.email;
    if (validatedData.phone) user.phone = validatedData.phone;
    if (validatedData.profileImage !== undefined) user.profileImage = validatedData.profileImage;

    user.updatedBy = userId as any;

    await user.save();
    
    const userObj = user.toObject();
    const { password: _, ...userWithoutPassword } = userObj as any;

    return apiResponse.success("Profile updated successfully", userWithoutPassword);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return apiResponse.validationError("Validation failed", (error as any).errors);
    }
    return apiResponse.error("Internal Server Error", 500, { details: error.message });
  }
}

export const PATCH = withAuth(updateProfileHandler as any);
