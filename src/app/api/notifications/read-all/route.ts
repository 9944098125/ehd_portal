import { NextRequest, NextResponse } from "next/server";
import { AuthenticatedRequest, withAuth } from "@/middleware/auth";
import { apiResponse } from "@/utils/apiResponse";
import connectToDatabase from "@/lib/db";
import Notification from "@/models/Notification";
import User from "@/models/User";

const markAllNotificationsReadHandler = async (req: AuthenticatedRequest) => {
  try {
    await connectToDatabase();

    const currentUser = await User.findById(req.user?.userId);
    if (!currentUser) return apiResponse.notFound("User not found");

    await Notification.updateMany(
      { 
        $or: [
          { recipient: currentUser._id },
          { recipient: null }
        ],
        isRead: false 
      },
      { $set: { isRead: true } }
    );

    return apiResponse.success("All notifications marked as read", {});
  } catch (error: any) {
    return apiResponse.error(error.message);
  }
};

export const PATCH = withAuth(markAllNotificationsReadHandler as any);
