import { NextRequest } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { comparePassword } from "@/lib/bcrypt";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import { apiResponse } from "@/utils/apiResponse";

export async function POST(req: NextRequest) {
	try {
		// Connect to the MongoDB database
		await connectToDatabase();

		const body = await req.json();
		const { identifier, password } = body;

		// The identifier could be an email or a phone number
		if (!identifier || !password) {
			return apiResponse.validationError(
				"Identifier (Email or Phone) and password are required",
			);
		}

		// Find user by either email (case-insensitive) or phone number
		// We must explicitly use `.select("+password")` because the schema has `select: false` for password
		const user = await User.findOne({
			$or: [{ email: identifier.toLowerCase() }, { phone: identifier }],
		}).select("+password");

		if (!user) {
			return apiResponse.unauthorized("Invalid credentials");
		}

		// Ensure the account isn't inactive or suspended
		if (user.status !== "Active" || !user.isActive) {
			return apiResponse.forbidden(
				"Your account is currently inactive or suspended. Please contact support.",
			);
		}

		// Compare the provided password with the hashed password in the database
		const isPasswordMatch = await comparePassword(password, user.password);
		if (!isPasswordMatch) {
			return apiResponse.unauthorized("Invalid credentials");
		}

		// Generate JWT access and refresh tokens
		const tokenPayload = {
			userId: user._id.toString(),
			role: user.role,
		};

		const accessToken = generateAccessToken(tokenPayload);
		const refreshToken = generateRefreshToken(tokenPayload);

		// Update the last login time
		user.lastLogin = new Date();
		await user.save();

		// Prepare the user object to return (omitting the password)
		const userObj = user.toObject();
		const { password: _, ...userWithoutPassword } = userObj;

		// Return structured success response using the helper
		return apiResponse.success("Login successful", {
			accessToken,
			refreshToken,
			user: userWithoutPassword,
		});
	} catch (error: unknown) {
		console.error("Login API Error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "An unknown error occurred";
		return apiResponse.error("Internal Server Error", 500, {
			details: errorMessage,
		});
	}
}
