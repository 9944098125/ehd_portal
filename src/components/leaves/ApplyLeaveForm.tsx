"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLeaveStore } from "@/store/leaveStore";
import { useLeaveBalanceStore } from "@/store/leaveBalanceStore";
import { useAuthStore } from "@/store/authStore";

const formSchema = z.object({
  fromDate: z.date({
    message: "Start date is required",
  }),
  toDate: z.date({
    message: "End date is required",
  }),
  leaveType: z.enum(["Casual Leave", "Sick Leave", "LOP"], {
    message: "Please select a leave type",
  }),
  fromHalf: z.enum(["FIRST_HALF", "SECOND_HALF", "FULL_DAY"]),
  toHalf: z.enum(["FIRST_HALF", "SECOND_HALF", "FULL_DAY"]),
  reason: z.string().min(10, {
    message: "Reason must be at least 10 characters.",
  }).max(1000, {
    message: "Reason must not be longer than 1000 characters.",
  }),
  contactNumber: z.string().min(10, {
    message: "Contact number is required and must be valid.",
  }),
}).superRefine((data, ctx) => {
  if (data.toDate < data.fromDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "End date cannot be before start date",
      path: ["toDate"],
    });
  }
  if (data.fromHalf === "FULL_DAY") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please select First Half or Second Half",
      path: ["fromHalf"],
    });
  }
  if (data.toHalf === "FULL_DAY") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please select First Half or Second Half",
      path: ["toHalf"],
    });
  }
});

export function ApplyLeaveForm({ onSuccess }: { onSuccess?: () => void }) {
  const { applyLeave, isLoading } = useLeaveStore();
  const { balance } = useLeaveBalanceStore();
  const { user } = useAuthStore();
  
  const [error, setError] = useState<string | null>(null);
  
  // Popover state
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [fromError, setFromError] = useState("");
  const [toError, setToError] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      leaveType: "Casual Leave",
      fromHalf: "FULL_DAY", // Invalid by default to force selection
      toHalf: "FULL_DAY", // Invalid by default to force selection
      reason: "",
      contactNumber: user?.phone || "",
    },
  });

  const watchFromDate = form.watch("fromDate");
  const watchToDate = form.watch("toDate");
  const watchFromHalf = form.watch("fromHalf");
  const watchToHalf = form.watch("toHalf");
  
  let computedTotalDays = 0;
  if (watchFromDate && watchToDate && watchToDate >= watchFromDate) {
    const diffTime = Math.abs(watchToDate.getTime() - watchFromDate.getTime());
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    if (watchFromDate.getTime() === watchToDate.getTime()) {
      if (watchFromHalf === "FIRST_HALF" || watchFromHalf === "SECOND_HALF") {
        diffDays -= 0.5;
      }
    } else {
      if (watchFromHalf === "SECOND_HALF") diffDays -= 0.5;
      if (watchToHalf === "FIRST_HALF") diffDays -= 0.5;
    }
    
    computedTotalDays = diffDays > 0 ? diffDays : 0.5;
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    try {
      await applyLeave({
        fromDate: values.fromDate.toISOString(),
        toDate: values.toDate.toISOString(),
        leaveType: values.leaveType,
        fromHalf: values.fromHalf,
        toHalf: values.toHalf,
        reason: values.reason,
        contactNumber: values.contactNumber,
      });
      form.reset();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to apply leave");
    }
  }

  // Calculate potential LOP warning
  let isLOPWarning = false;
  if (balance && computedTotalDays > 0) {
      const type = form.watch("leaveType");
      if (type === "Casual Leave" && (balance.totalCasual - balance.usedCasual) < computedTotalDays) {
          isLOPWarning = true;
      } else if (type === "Sick Leave" && (balance.totalSick - balance.usedSick) < computedTotalDays) {
          isLOPWarning = true;
      }
  }

  const handleFromChoose = () => {
    if (watchFromHalf === "FULL_DAY") {
      setFromError("Please select First Half or Second Half");
      return;
    }
    if (!watchFromDate) {
      setFromError("Please select a date");
      return;
    }
    setFromError("");
    setFromOpen(false);
  };

  const handleToChoose = () => {
    if (watchToHalf === "FULL_DAY") {
      setToError("Please select First Half or Second Half");
      return;
    }
    if (!watchToDate) {
      setToError("Please select a date");
      return;
    }
    setToError("");
    setToOpen(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}
        
        {isLOPWarning && (
            <div className="p-3 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md">
                Paid leave balance exhausted for selected type. This request will be submitted as Loss Of Pay (LOP).
            </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fromDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>From Date</FormLabel>
                <Popover open={fromOpen} onOpenChange={setFromOpen}>
                  <PopoverTrigger render={
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal h-11",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  } />
                  <PopoverContent className="w-auto p-4" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setFromError("");
                      }}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      className="p-0 mb-4"
                    />
                    
                    <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="from_first_half" 
                            checked={watchFromHalf === "FIRST_HALF"} 
                            onCheckedChange={(checked) => {
                              if (checked) {
                                form.setValue("fromHalf", "FIRST_HALF");
                                setFromError("");
                              } else if (watchFromHalf === "FIRST_HALF") {
                                form.setValue("fromHalf", "FULL_DAY");
                              }
                            }}
                          />
                          <label htmlFor="from_first_half" className="text-sm font-medium leading-none cursor-pointer">
                            First Half
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="from_second_half" 
                            checked={watchFromHalf === "SECOND_HALF"} 
                            onCheckedChange={(checked) => {
                              if (checked) {
                                form.setValue("fromHalf", "SECOND_HALF");
                                setFromError("");
                              } else if (watchFromHalf === "SECOND_HALF") {
                                form.setValue("fromHalf", "FULL_DAY");
                              }
                            }}
                          />
                          <label htmlFor="from_second_half" className="text-sm font-medium leading-none cursor-pointer">
                            Second Half
                          </label>
                        </div>
                      </div>

                      {fromError && (
                        <p className="text-sm text-red-500 font-medium">{fromError}</p>
                      )}

                      <Button type="button" onClick={handleFromChoose} className="w-full h-11">
                        Choose
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="toDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>To Date</FormLabel>
                <Popover open={toOpen} onOpenChange={setToOpen}>
                  <PopoverTrigger render={
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal h-11",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  } />
                  <PopoverContent className="w-auto p-4" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setToError("");
                      }}
                      disabled={(date) =>
                        date < (watchFromDate || new Date(new Date().setHours(0, 0, 0, 0)))
                      }
                      className="p-0 mb-4"
                    />
                    
                    <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="to_first_half" 
                            checked={watchToHalf === "FIRST_HALF"} 
                            onCheckedChange={(checked) => {
                              if (checked) {
                                form.setValue("toHalf", "FIRST_HALF");
                                setToError("");
                              } else if (watchToHalf === "FIRST_HALF") {
                                form.setValue("toHalf", "FULL_DAY");
                              }
                            }}
                          />
                          <label htmlFor="to_first_half" className="text-sm font-medium leading-none cursor-pointer">
                            First Half
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="to_second_half" 
                            checked={watchToHalf === "SECOND_HALF"} 
                            onCheckedChange={(checked) => {
                              if (checked) {
                                form.setValue("toHalf", "SECOND_HALF");
                                setToError("");
                              } else if (watchToHalf === "SECOND_HALF") {
                                form.setValue("toHalf", "FULL_DAY");
                              }
                            }}
                          />
                          <label htmlFor="to_second_half" className="text-sm font-medium leading-none cursor-pointer">
                            Second Half
                          </label>
                        </div>
                      </div>

                      {toError && (
                        <p className="text-sm text-red-500 font-medium">{toError}</p>
                      )}

                      <Button type="button" onClick={handleToChoose} className="w-full h-11">
                        Choose
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {computedTotalDays > 0 && (
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border rounded-lg flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Calculated Duration</span>
            <span className="text-sm font-semibold">
              {computedTotalDays} day{computedTotalDays !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="leaveType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Leave Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Casual Leave">Casual Leave</SelectItem>
                    <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                    <SelectItem value="LOP">Loss Of Pay (LOP)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emergency Contact</FormLabel>
                <FormControl>
                  <Input placeholder="Enter contact number" className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>



        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason for Leave</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Please provide a detailed reason..." 
                  className="resize-none min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting Request...
            </>
          ) : (
            "Submit Leave Request"
          )}
        </Button>
      </form>
    </Form>
  );
}
