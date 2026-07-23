import { NextRequest, NextResponse } from "next/server";
import { AuthenticatedRequest, withAuth } from "@/middleware/auth";
import { apiResponse } from "@/utils/apiResponse";
import connectToDatabase from "@/lib/db";
import Leave from "@/models/Leave";
import Notification from "@/models/Notification";
import User from "@/models/User";

const approveLeaveHandler = async (req: AuthenticatedRequest, context: { params: Promise<{ id: string }> }) => {
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
      return apiResponse.badRequest("Only pending leave requests can be approved");
    }

    // Role based access control
    if (currentUser.role === "Employee") {
      return apiResponse.forbidden("Employees cannot approve leaves");
    }

    if (currentUser.role === "Admin") {
      // Admin can only approve leaves of employees they created, and not other Admins
      const employee = await User.findById(leave.employee._id);
      if (!employee) return apiResponse.notFound("Employee not found");
      
      if (employee.role === "Admin" || employee.role === "Super Admin") {
         return apiResponse.forbidden("Admin cannot approve leave for another Admin or Super Admin");
      }
      
      if (!employee.createdBy?.equals(currentUser._id)) {
         return apiResponse.forbidden("You can only approve leaves for employees you created");
      }

      if (leave.employee.equals(currentUser._id)) {
         return apiResponse.forbidden("You cannot approve your own leave");
      }
    }

    leave.status = "APPROVED";
    leave.approvedAt = new Date();
    leave.approvedBy = currentUser._id;
    if (remarks) leave.remarks = remarks;

    await leave.save();

    // Create Notification
    await Notification.create({
      recipient: undefined, // Broadcast to everyone
      type: "LEAVE_APPROVED",
      message: `${(leave.employee as any).firstName} ${(leave.employee as any).lastName} is on leave from ${leave.fromDate.toLocaleDateString()} to ${leave.toDate.toLocaleDateString()}.`,
      isRead: false,
      relatedLeave: leave._id,
    });

    const populatedLeave = await Leave.findById(leave._id).populate("employee", "firstName lastName email department").populate("approver", "firstName lastName").populate("approvedBy", "firstName lastName");

    return apiResponse.success("Leave approved successfully", { leave: populatedLeave });
  } catch (error: any) {
    return apiResponse.error(error.message);
  }
};

export const PATCH = withAuth(approveLeaveHandler as any);
