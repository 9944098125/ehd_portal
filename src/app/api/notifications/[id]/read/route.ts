import { NextRequest, NextResponse } from "next/server";
import { AuthenticatedRequest, withAuth } from "@/middleware/auth";
import { apiResponse } from "@/utils/apiResponse";
import connectToDatabase from "@/lib/db";
import Notification from "@/models/Notification";
import User from "@/models/User";

const markNotificationReadHandler = async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    await connectToDatabase();
    const { id } = await context.params;

    const currentUser = await User.findById(req.user?.userId);
    if (!currentUser) return apiResponse.notFound("User not found");

    const notification = await Notification.findById(id);
    if (!notification) return apiResponse.notFound("Notification not found");

    if (notification.recipient && !notification.recipient.equals(currentUser._id)) {
       return apiResponse.forbidden("You do not have permission to modify this notification");
    }

    notification.isRead = true;
    await notification.save();

    return apiResponse.success("Notification marked as read", { notification });
  } catch (error: any) {
    return apiResponse.error(error.message);
  }
};

export const PATCH = withAuth(markNotificationReadHandler as any);
