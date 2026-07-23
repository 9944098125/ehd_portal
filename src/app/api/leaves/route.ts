import { NextRequest, NextResponse } from "next/server";
import { AuthenticatedRequest, withAuth } from "@/middleware/auth";
import { apiResponse } from "@/utils/apiResponse";
import connectToDatabase from "@/lib/db";
import Leave from "@/models/Leave";
import LeaveBalance from "@/models/LeaveBalance";
import Notification from "@/models/Notification";
import User from "@/models/User";
import mongoose from "mongoose";

const calculateTotalDays = (fromDate: Date, toDate: Date, fromHalf: string, toHalf: string) => {
  const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
  let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  if (fromDate.getTime() === toDate.getTime()) {
    // Single day leave
    if (fromHalf === "FIRST_HALF" || fromHalf === "SECOND_HALF") {
      diffDays -= 0.5;
    }
  } else {
    // Multi day leave
    if (fromHalf === "SECOND_HALF") diffDays -= 0.5;
    if (toHalf === "FIRST_HALF") diffDays -= 0.5;
  }

  return diffDays > 0 ? diffDays : 0.5;
};

const getLeavesHandler = async (req: AuthenticatedRequest) => {
  try {
    await connectToDatabase();
    const url = new URL(req.url);
    const search = url.searchParams.get("search");
    const status = url.searchParams.get("status");
    const leaveType = url.searchParams.get("leaveType");
    const department = url.searchParams.get("department");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    const query: any = {};

    // Role based access
    const currentUser = await User.findById(req.user?.userId);
    if (!currentUser) return apiResponse.notFound("User not found");

    if (currentUser.role === "Admin") {
      // Admins can see leaves of employees they created, and their own leaves
      const employeesCreatedByAdmin = await User.find({ createdBy: currentUser._id }).select("_id");
      const employeeIds = employeesCreatedByAdmin.map(e => e._id);
      query.$or = [{ employee: { $in: employeeIds } }, { employee: currentUser._id }];
    } else if (currentUser.role === "Employee") {
      // Employees only see their own leaves
      query.employee = currentUser._id;
    }
    // Super Admin sees everything

    if (status) query.status = status;
    if (leaveType) query.leaveType = leaveType;
    if (from && to) {
      query.fromDate = { $gte: new Date(from) };
      query.toDate = { $lte: new Date(to) };
    }

    let employeeQuery: any = {};
    if (search) {
      employeeQuery.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
      ];
    }
    if (department) {
      employeeQuery.department = department;
    }

    if (Object.keys(employeeQuery).length > 0) {
      const matchingEmployees = await User.find(employeeQuery).select("_id");
      const matchingEmployeeIds = matchingEmployees.map(e => e._id);
      
      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          { employee: { $in: matchingEmployeeIds } }
        ];
        delete query.$or;
      } else if (query.employee) {
        if (!matchingEmployeeIds.some(id => id.equals(query.employee))) {
           return apiResponse.success("No match", { leaves: [], total: 0 }); // No match
        }
      } else {
        query.employee = { $in: matchingEmployeeIds };
      }
    }

    const total = await Leave.countDocuments(query);
    const leaves = await Leave.find(query)
      .populate("employee", "firstName lastName email department")
      .populate("approver", "firstName lastName")
      .populate("approvedBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return apiResponse.success("Leaves retrieved", { leaves, total });
  } catch (error: any) {
    return apiResponse.error(error.message);
  }
};

  const createLeaveHandler = async (req: AuthenticatedRequest) => {
    try {
      await connectToDatabase();
      const body = await req.json();
      const { fromDate, toDate, leaveType, fromHalf, toHalf, reason, contactNumber } = body;
      
      if (!fromDate || !toDate || !leaveType || !fromHalf || !toHalf || !reason || !contactNumber) {
        return apiResponse.badRequest("Missing required fields");
      }
  
      const from = new Date(fromDate);
      const to = new Date(toDate);
  
      if (to < from) {
        return apiResponse.badRequest("To Date cannot be before From Date");
      }
  
      const currentUser = await User.findById(req.user?.userId);
      if (!currentUser) return apiResponse.notFound("User not found");
  
      const totalDays = calculateTotalDays(from, to, fromHalf, toHalf);
      const year = from.getFullYear();
  
      let balance = await LeaveBalance.findOne({ employee: currentUser._id, year });
      if (!balance) {
        balance = await LeaveBalance.create({ employee: currentUser._id, year });
      }
  
      let finalLeaveType = leaveType;
  
      if (leaveType !== "LOP") {
        const remainingCasual = balance.totalCasual - balance.usedCasual;
        const remainingSick = balance.totalSick - balance.usedSick;
  
        if (leaveType === "Casual Leave" && remainingCasual < totalDays) {
          finalLeaveType = "LOP";
        } else if (leaveType === "Sick Leave" && remainingSick < totalDays) {
          finalLeaveType = "LOP";
        }
      }
  
      let approverId = null;
      if (currentUser.role === "Admin" || currentUser.role === "Employee") {
        // Find Super Admin or creator Admin
        if (currentUser.createdBy) {
           approverId = currentUser.createdBy;
        } else {
           const superAdmin = await User.findOne({ role: "Super Admin" });
           if (superAdmin) approverId = superAdmin._id;
        }
      }
  
      const isSuperAdmin = currentUser.role === "Super Admin";
  
      const leave = new Leave({
        employee: currentUser._id,
        approver: approverId,
        fromDate: from,
        toDate: to,
        leaveType: finalLeaveType,
        fromHalf,
        toHalf,
        totalDays,
        reason,
        contactNumber,
        status: isSuperAdmin ? "APPROVED" : "PENDING",
        approvedAt: isSuperAdmin ? new Date() : undefined,
        approvedBy: isSuperAdmin ? currentUser._id : undefined,
      });

    if (finalLeaveType === "Casual Leave") {
        balance.usedCasual += totalDays;
        await balance.save();
    } else if (finalLeaveType === "Sick Leave") {
        balance.usedSick += totalDays;
        await balance.save();
    } else if (finalLeaveType === "LOP") {
        balance.usedLOP += totalDays;
        await balance.save();
    }

    await leave.save();

    // Create Notification
    if (isSuperAdmin) {
      await Notification.create({
        type: "ORGANIZATION_LEAVE_ANNOUNCEMENT",
        message: `${currentUser.firstName} ${currentUser.lastName} is on leave from ${from.toLocaleDateString()} to ${to.toLocaleDateString()}.`,
        isRead: false,
        relatedLeave: leave._id,
      });
    } else if (approverId) {
      await Notification.create({
        recipient: approverId,
        type: "LEAVE_REQUESTED",
        message: `${currentUser.firstName} ${currentUser.lastName} requested leave ${from.toLocaleDateString()} -> ${to.toLocaleDateString()}.`,
        isRead: false,
        relatedLeave: leave._id,
      });
    }

    const populatedLeave = await Leave.findById(leave._id).populate("employee", "firstName lastName email department");

    return apiResponse.success(finalLeaveType === "LOP" && leaveType !== "LOP" ? "Paid leave balance exhausted. Request submitted as Loss Of Pay." : "Leave submitted successfully", { leave: populatedLeave });
  } catch (error: any) {
    return apiResponse.error(error.message);
  }
};

export const GET = withAuth(getLeavesHandler as any);
export const POST = withAuth(createLeaveHandler as any);
