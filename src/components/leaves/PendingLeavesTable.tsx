"use client";

import { useEffect, useState } from "react";
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
import { Loader2, Check, X } from "lucide-react";
import { useLeaveStore } from "@/store/leaveStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function PendingLeavesTable() {
  const { pendingLeaves: leaves, fetchPendingLeaves, approveLeave, rejectLeave, isLoading } = useLeaveStore();
  const [selectedLeave, setSelectedLeave] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | null>(null);
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPendingLeaves();
  }, [fetchPendingLeaves]);

  const handleAction = async () => {
    if (!selectedLeave || !actionType) return;
    
    setIsSubmitting(true);
    try {
      if (actionType === "APPROVE") {
        await approveLeave(selectedLeave, remarks);
      } else {
        await rejectLeave(selectedLeave, remarks);
      }
      setSelectedLeave(null);
      setActionType(null);
      setRemarks("");
      fetchPendingLeaves();
    } catch (error) {
      console.error("Failed to process leave action", error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        No pending leave requests.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Leave Type</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Applied On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaves.map((leave) => (
              <TableRow key={leave._id}>
                <TableCell>
                  <div className="font-medium">
                    {leave.employee.firstName} {leave.employee.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground">{leave.employee.email}</div>
                </TableCell>
                <TableCell>{leave.employee.department}</TableCell>
                <TableCell>
                  <Badge variant="outline">{leave.leaveType}</Badge>
                </TableCell>
                <TableCell>
                  {leave.totalDays} day(s)
                </TableCell>
                <TableCell>
                  {format(new Date(leave.fromDate), "dd MMM")}
                  {new Date(leave.fromDate).getTime() !== new Date(leave.toDate).getTime() && (
                     <> - {format(new Date(leave.toDate), "dd MMM")}</>
                  )}
                </TableCell>
                <TableCell>{format(new Date(leave.createdAt), "dd MMM yyyy")}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => {
                        setSelectedLeave(leave._id);
                        setActionType("APPROVE");
                      }}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setSelectedLeave(leave._id);
                        setActionType("REJECT");
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog 
        open={!!selectedLeave} 
        onOpenChange={(open) => {
          if (!open) {
             setSelectedLeave(null);
             setActionType(null);
          }
        }}
      >
        <DialogContent onInteractionOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              {actionType === "APPROVE" ? "Approve Leave Request" : "Reject Leave Request"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {actionType?.toLowerCase()} this leave request? You can optionally add remarks below.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Add remarks (optional)..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedLeave(null);
                setActionType(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === "APPROVE" ? "default" : "destructive"}
              onClick={handleAction}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm {actionType === "APPROVE" ? "Approval" : "Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
