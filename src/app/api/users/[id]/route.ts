import { NextRequest } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { apiResponse } from "@/utils/apiResponse";
import { withRole, AuthenticatedRequest } from "@/middleware/auth";
import { updateUserSchema } from "@/validations/user";
import { z } from "zod";
import bcrypt from "bcryptjs";

async function getUserByIdHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    
    const user = await User.findById(id).lean();
    if (!user) {
      return apiResponse.error("User not found", 404);
    }
    
    return apiResponse.success("User retrieved successfully", user);
  } catch (error: any) {
    return apiResponse.error("Internal Server Error", 500, { details: error.message });
  }
}

async function updateUserHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const validatedData = updateUserSchema.parse(body);

    const user = await User.findById(id);
    if (!user) {
      return apiResponse.error("User not found", 404);
    }

    // Role check logic based on current user
    const currentUserRole = req.user?.role;
    if (currentUserRole === "Admin" && user.role !== "Employee") {
      return apiResponse.forbidden("Admins can only update Employees");
    }
    
    if (validatedData.role && currentUserRole === "Admin" && validatedData.role !== "Employee") {
      return apiResponse.forbidden("Admins cannot assign non-Employee roles");
    }

    if (validatedData.password) {
      validatedData.password = await bcrypt.hash(validatedData.password, 10);
    }

    Object.assign(user, validatedData);
    user.updatedBy = req.user?.userId as any;

    await user.save();
    
    const userObj = user.toObject();
    const { password: _, ...userWithoutPassword } = userObj as any;

    return apiResponse.success("User updated successfully", userWithoutPassword);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return apiResponse.validationError("Validation failed", (error as any).errors);
    }
    return apiResponse.error("Internal Server Error", 500, { details: error.message });
  }
}

async function deleteUserHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    
    const user = await User.findById(id);
    if (!user) {
      return apiResponse.error("User not found", 404);
    }

    // Role check logic based on current user
    const currentUserRole = req.user?.role;
    if (currentUserRole === "Admin" && user.role !== "Employee") {
      return apiResponse.forbidden("Admins can only delete Employees");
    }
    
    if (currentUserRole === "Super Admin" && user.role !== "Admin" && user.role !== "Employee") {
       return apiResponse.forbidden("Super Admins can only delete Admins and Employees");
    }

    await User.findByIdAndDelete(id);

    return apiResponse.success("User deleted successfully", null);
  } catch (error: any) {
    return apiResponse.error("Internal Server Error", 500, { details: error.message });
  }
}

export const GET = withRole(["Super Admin", "Admin"], getUserByIdHandler as any);
export const PUT = withRole(["Super Admin", "Admin"], updateUserHandler as any);
export const DELETE = withRole(["Super Admin", "Admin"], deleteUserHandler as any);
