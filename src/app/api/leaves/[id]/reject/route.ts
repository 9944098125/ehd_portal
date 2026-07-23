import { NextRequest, NextResponse } from "next/server";
import { AuthenticatedRequest, withAuth } from "@/middleware/auth";
import { apiResponse } from "@/utils/apiResponse";
import connectToDatabase from "@/lib/db";
import Leave from "@/models/Leave";
import LeaveBalance from "@/models/LeaveBalance";
import Notification from "@/models/Notification";
import User from "@/models/User";

const rejectLeaveHandler = async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    
    let remarks = "";
    try {
      const body = await req.json();
      remarks = body.remarks;
    } catch(e) {}

    const currentUser = await User.findById(req.user?.userId);
    if (!currentUser) return apiResponse.notFound("User not found");

    const leave = await Leave.findById(id).populate("employee", "firstName lastName");
    if (!leave) return apiResponse.notFound("Leave request not found");

    if (leave.status !== "PENDING") {
      return apiResponse.badRequest("Only pending leave requests can be rejected");
    }

    // Role based access control
    if (currentUser.role === "Employee") {
      return apiResponse.forbidden("Employees cannot reject leaves");
    }

    if (currentUser.role === "Admin") {
      const employee = await User.findById(leave.employee._id);
      if (!employee) return apiResponse.notFound("Employee not found");
      
      if (employee.role === "Admin" || employee.role === "Super Admin") {
         return apiResponse.forbidden("Admin cannot reject leave for another Admin or Super Admin");
      }
      
      if (!employee.createdBy?.equals(currentUser._id)) {
         return apiResponse.forbidden("You can only reject leaves for employees you created");
      }

      if (leave.employee.equals(currentUser._id)) {
         return apiResponse.forbidden("You cannot reject your own leave");
      }
    }

    leave.status = "REJECTED";
    leave.rejectedAt = new Date();
    leave.approvedBy = currentUser._id; // We'll use approvedBy to store who took the action
    if (remarks) leave.remarks = remarks;

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

    // Create Notification
    await Notification.create({
      recipient: leave.employee._id,
      type: "LEAVE_REJECTED",
      message: `Your leave request from ${leave.fromDate.toLocaleDateString()} to ${leave.toDate.toLocaleDateString()} was rejected.`,
      isRead: false,
      relatedLeave: leave._id,
    });

    const populatedLeave = await Leave.findById(leave._id).populate("employee", "firstName lastName email department").populate("approver", "firstName lastName").populate("approvedBy", "firstName lastName");

    return apiResponse.success("Leave rejected successfully", { leave: populatedLeave });
  } catch (error: any) {
    return apiResponse.error(error.message);
  }
};

export const PATCH = withAuth(rejectLeaveHandler as any);
