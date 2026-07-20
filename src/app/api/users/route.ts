import { NextRequest } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { apiResponse } from "@/utils/apiResponse";
import { withRole, AuthenticatedRequest } from "@/middleware/auth";
import { createUserSchema } from "@/validations/user";
import { z } from "zod";

async function getUsersHandler(req: AuthenticatedRequest) {
  try {
    await connectToDatabase();

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role");

    const query: any = {};

    // Don't expose Super Admins to normal Admins if needed, but per requirements they can see Employees.
    // We'll just filter by role if provided.
    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const userIds = users.map((u: any) => u._id);
    const TimeEntry = require("@/models/TimeEntry").default;
    
    const timeStats = await TimeEntry.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: "$user", totalTime: { $sum: "$hours" } } }
    ]);
    
    const timeMap = new Map(timeStats.map((stat: any) => [stat._id.toString(), stat.totalTime]));
    
    const usersWithTime = users.map((u: any) => ({
      ...u,
      totalTimeLogged: timeMap.get(u._id.toString()) || 0
    }));

    const total = await User.countDocuments(query);

    return apiResponse.success("Users retrieved successfully", {
      users: usersWithTime,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET Users API Error:", error);
    return apiResponse.error("Internal Server Error", 500, { details: error.message });
  }
}

async function createUserHandler(req: AuthenticatedRequest) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const validatedData = createUserSchema.parse(body);
    const currentUserRole = req.user?.role;

    // Role assignment based on logged-in user
    let assignedRole = validatedData.role || "Employee";
    
    // Admins cannot create Super Admins or Admins
    if (currentUserRole === "Admin" && (assignedRole === "Super Admin" || assignedRole === "Admin")) {
      return apiResponse.forbidden("Admins can only create Employees");
    }
    
    // Super Admins cannot create other Super Admins if you want to restrict it (optional), 
    // but we will allow it if they really want to, or just restrict it.
    if (currentUserRole === "Super Admin" && assignedRole === "Super Admin") {
      // Assuming we allow it, or change it to Admin if not. Let's allow it for Super Admins.
    }

    // Check if email or employeeId already exists
    const existingUser = await User.findOne({
      $or: [{ email: validatedData.email }, { employeeId: validatedData.employeeId }],
    });

    if (existingUser) {
      return apiResponse.error("User with this email or Employee ID already exists", 400);
    }

    // In a real app we'd hash the password here, assuming it's done via a pre-save hook in User model or here.
    // Wait, let's hash it here since the User model might not have a pre-save hook.
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const user = new User({
      ...validatedData,
      password: hashedPassword,
      role: assignedRole,
      createdBy: req.user?.userId,
      updatedBy: req.user?.userId,
    });

    await user.save();

    const userObj = user.toObject();
    const { password: _, ...userWithoutPassword } = userObj as any;

    return apiResponse.success("User created successfully", userWithoutPassword, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return apiResponse.validationError("Validation failed", (error as any).errors);
    }
    console.error("POST User API Error:", error);
    return apiResponse.error("Internal Server Error", 500, { details: error.message });
  }
}

// Only Super Admin and Admin can access employee/admin management APIs
export const GET = withRole(["Super Admin", "Admin"], getUsersHandler as any);
export const POST = withRole(["Super Admin", "Admin"], createUserHandler as any);
