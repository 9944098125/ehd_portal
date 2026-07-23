"use client";

import { useEffect } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { useLeaveStore } from "@/store/leaveStore";
import { useAuthStore } from "@/store/authStore";

export function LeaveHistoryTable() {
  const { historyLeaves: leaves, fetchAllHistoryLeaves, cancelLeave, isLoading } = useLeaveStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchAllHistoryLeaves();
  }, [fetchAllHistoryLeaves]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
      case "CANCELLED":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Cancelled</Badge>;
      case "PENDING":
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
    }
  };

  const showEmployee = user?.role === "Admin" || user?.role === "Super Admin";

  if (isLoading && leaves.length === 0) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (leaves.length === 0) {
    return (
      <div className="text-center p-8 border rounded-md border-dashed text-muted-foreground">
        No leave history found.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {showEmployee && <TableHead>Employee</TableHead>}
            <TableHead>Leave Type</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Applied Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaves.map((leave) => (
            <TableRow key={leave._id}>
              {showEmployee && (
                <TableCell>
                  <div className="font-medium">
                    {leave.employee?.firstName} {leave.employee?.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground">{leave.employee?.email}</div>
                </TableCell>
              )}
              <TableCell className="font-medium">{leave.leaveType}</TableCell>
              <TableCell>
                {leave.totalDays} day(s) 
                <span className="text-muted-foreground text-xs block mt-1">
                  From: {leave.fromHalf === "FIRST_HALF" ? "First Half" : leave.fromHalf === "SECOND_HALF" ? "Second Half" : "Full Day"}
                  <br/>
                  To: {leave.toHalf === "FIRST_HALF" ? "First Half" : leave.toHalf === "SECOND_HALF" ? "Second Half" : "Full Day"}
                </span>
              </TableCell>
              <TableCell>
                {format(new Date(leave.fromDate), "dd MMM yyyy")}
                {new Date(leave.fromDate).getTime() !== new Date(leave.toDate).getTime() && (
                   <> - {format(new Date(leave.toDate), "dd MMM yyyy")}</>
                )}
              </TableCell>
              <TableCell>{getStatusBadge(leave.status)}</TableCell>
              <TableCell>{format(new Date(leave.createdAt), "dd MMM yyyy")}</TableCell>
              <TableCell className="text-right">
                {leave.status === "PENDING" && leave.employee?._id === user?._id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => cancelLeave(leave._id)}
                    title="Cancel Leave Request"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
