import { NextRequest } from "next/server";
import connectToDatabase from "@/lib/db";
import Attendance from "@/models/Attendance";
import { apiResponse } from "@/utils/apiResponse";
import { withRole, AuthenticatedRequest } from "@/middleware/auth";

async function getAttendance(req: AuthenticatedRequest) {
  try {
    await connectToDatabase();
    const searchParams = req.nextUrl.searchParams;
    const dateStr = searchParams.get("date");
    const query: any = {};
    if (dateStr) {
      query.date = new Date(dateStr);
    }
    const attendance = await Attendance.find(query).populate("employee", "firstName lastName employeeId").sort({ date: -1 }).lean();
    return apiResponse.success("Attendance retrieved", { attendance });
  } catch (error: any) {
    return apiResponse.error("Error fetching attendance", 500, { details: error.message });
  }
}

async function markAttendance(req: AuthenticatedRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    const existing = await Attendance.findOne({ employee: body.employee, date: new Date(body.date) });
    if (existing) {
      Object.assign(existing, body);
      existing.updatedBy = req.user?.userId as any;
      await existing.save();
      return apiResponse.success("Attendance updated", existing);
    }
    
    const attendance = new Attendance({
      ...body,
      createdBy: req.user?.userId as any,
      updatedBy: req.user?.userId as any
    });
    await attendance.save();
    return apiResponse.success("Attendance marked", attendance, 201);
  } catch (error: any) {
    return apiResponse.error("Error marking attendance", 500, { details: error.message });
  }
}

export const GET = withRole(["Super Admin", "Admin", "Employee"], getAttendance as any);
export const POST = withRole(["Super Admin", "Admin", "Employee"], markAttendance as any);
