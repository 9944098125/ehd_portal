import { NextRequest, NextResponse } from "next/server";
import { AuthenticatedRequest, withAuth } from "@/middleware/auth";
import { apiResponse } from "@/utils/apiResponse";
import connectToDatabase from "@/lib/db";
import Notification from "@/models/Notification";
import User from "@/models/User";

const getNotificationsHandler = async (req: AuthenticatedRequest) => {
  try {
    await connectToDatabase();

    const currentUser = await User.findById(req.user?.userId);
    if (!currentUser) return apiResponse.notFound("User not found");

    // Fetch personal notifications and broadcast notifications
    const notifications = await Notification.find({
      $or: [
        { recipient: currentUser._id },
        { recipient: null } // Broadcast
      ]
    }).sort({ createdAt: -1 }).limit(50);

    return apiResponse.success("Notifications retrieved", { notifications });
  } catch (error: any) {
    return apiResponse.error(error.message);
  }
};

export const GET = withAuth(getNotificationsHandler as any);
