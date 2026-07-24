"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useLeaveBalanceStore } from "@/store/leaveBalanceStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ApplyLeaveForm } from "@/components/leaves/ApplyLeaveForm";
import { LeaveHistoryTable } from "@/components/leaves/LeaveHistoryTable";
import { PendingLeavesTable } from "@/components/leaves/PendingLeavesTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LeavesPage() {
  const { user } = useAuthStore();
  const { balance, fetchBalance } = useLeaveBalanceStore();
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground mt-1">Manage your leaves and approvals.</p>
        </div>
        <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
          <DialogTrigger render={
            <Button className="gap-2 h-11 px-6">
              <Plus className="w-4 h-4" /> {user?.role === "Super Admin" ? "Confirm Leave" : "Apply Leave"}
            </Button>
          } />
          <DialogContent className="sm:max-w-[500px]" onInteractionOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>{user?.role === "Super Admin" ? "Confirm Leave" : "Apply for Leave"}</DialogTitle>
            </DialogHeader>
            <ApplyLeaveForm onSuccess={() => setIsApplyOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Casual Leave Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balance ? balance.totalCasual - balance.usedCasual : "-"} / {balance?.totalCasual || "-"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Used: {balance?.usedCasual || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sick Leave Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balance ? balance.totalSick - balance.usedSick : "-"} / {balance?.totalSick || "-"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Used: {balance?.usedSick || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Loss Of Pay (LOP)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {balance?.usedLOP || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total LOP days this year</p>
          </CardContent>
        </Card>
      </div>

      {(user?.role === "Admin" || user?.role === "Super Admin") && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Pending Approvals</h2>
            <p className="text-sm text-muted-foreground mb-4">Leave requests waiting for your approval.</p>
          </div>
          <PendingLeavesTable />
        </div>
      )}

      <div className="space-y-4 pt-4 border-t">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">My Leave History</h2>
          <p className="text-sm text-muted-foreground mb-4">A complete record of your leave applications.</p>
        </div>
        <LeaveHistoryTable />
      </div>
    </div>
  );
}
