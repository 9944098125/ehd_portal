import { NextRequest, NextResponse } from "next/server";
import { AuthenticatedRequest, withAuth } from "@/middleware/auth";
import { apiResponse } from "@/utils/apiResponse";
import connectToDatabase from "@/lib/db";
import Leave from "@/models/Leave";
import LeaveBalance from "@/models/LeaveBalance";
import Notification from "@/models/Notification";
import User from "@/models/User";

const cancelLeaveHandler = async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    await connectToDatabase();
    const { id } = await context.params;

    const currentUser = await User.findById(req.user?.userId);
    if (!currentUser) return apiResponse.notFound("User not found");

    const leave = await Leave.findById(id).populate("employee", "firstName lastName");
    if (!leave) return apiResponse.notFound("Leave request not found");

    if (leave.status !== "PENDING") {
      return apiResponse.badRequest("Only pending leave requests can be cancelled");
    }

    if (!leave.employee._id.equals(currentUser._id)) {
      return apiResponse.forbidden("You can only cancel your own leave requests");
    }

    leave.status = "CANCELLED";

    // Refund leave balance
    const year = leave.fromDate.getFullYear();
    const balance = await LeaveBalance.findOne({ employee: leave.employee._id, year });
    if (balance) {
      if (leave.leaveType === "Casual Leave") {
        balance.usedCasual -= leave.totalDays;
      } else if (leave.leaveType === "Sick Leave") {
        balance.usedSick -= leave.totalDays;
      } else if (leave.leaveType === "LOP") {
        balance.usedLOP -= leave.totalDays;
      }
      await balance.save();
    }

    await leave.save();

    // Create Notification for the approver
    if (leave.approver) {
      await Notification.create({
        recipient: leave.approver,
        type: "LEAVE_CANCELLED",
        message: `${currentUser.firstName} ${currentUser.lastName} cancelled their leave request for ${leave.fromDate.toLocaleDateString()} to ${leave.toDate.toLocaleDateString()}.`,
        isRead: false,
        relatedLeave: leave._id,
      });
    }

    const populatedLeave = await Leave.findById(leave._id).populate("employee", "firstName lastName email department").populate("approver", "firstName lastName").populate("approvedBy", "firstName lastName");

    return apiResponse.success("Leave cancelled successfully", { leave: populatedLeave });
  } catch (error: any) {
    return apiResponse.error(error.message);
  }
};

export const PATCH = withAuth(cancelLeaveHandler as any);
