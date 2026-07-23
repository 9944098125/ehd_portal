export type LeaveType = "Casual Leave" | "Sick Leave" | "LOP";
export type LeaveDuration = "FULL_DAY" | "FIRST_HALF" | "SECOND_HALF";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface LeaveUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
}

export interface Leave {
  _id: string;
  employee: LeaveUser;
  approver?: LeaveUser;
  fromDate: string;
  toDate: string;
  leaveType: LeaveType;
  fromHalf: "FULL_DAY" | "FIRST_HALF" | "SECOND_HALF";
  toHalf: "FULL_DAY" | "FIRST_HALF" | "SECOND_HALF";
  totalDays: number;
  reason: string;
  contactNumber: string;
  status: LeaveStatus;
  approvedAt?: string;
  rejectedAt?: string;
  approvedBy?: LeaveUser;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  _id: string;
  employee: string;
  year: number;
  totalCasual: number;
  usedCasual: number;
  totalSick: number;
  usedSick: number;
  usedLOP: number;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  recipient?: string;
  type: "LEAVE_REQUESTED" | "LEAVE_APPROVED" | "LEAVE_REJECTED" | "LEAVE_CANCELLED" | "ORGANIZATION_LEAVE_ANNOUNCEMENT";
  message: string;
  isRead: boolean;
  relatedLeave?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequest {
  fromDate: string;
  toDate: string;
  leaveType: LeaveType;
  fromHalf: "FULL_DAY" | "FIRST_HALF" | "SECOND_HALF";
  toHalf: "FULL_DAY" | "FIRST_HALF" | "SECOND_HALF";
  reason: string;
  contactNumber: string;
}

export interface LeaveFilters {
  status?: string;
  leaveType?: string;
  department?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}
