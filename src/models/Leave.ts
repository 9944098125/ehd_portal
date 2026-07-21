import mongoose, { Document, Model, Schema } from "mongoose";

export interface ILeave extends Document {
  employee: mongoose.Types.ObjectId;
  leaveType: "Sick" | "Casual" | "Earned" | "Maternity" | "Paternity" | "Unpaid";
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
  approvedBy?: mongoose.Types.ObjectId;
  remarks?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const leaveSchema = new Schema<ILeave>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    leaveType: {
      type: String,
      enum: ["Sick", "Casual", "Earned", "Maternity", "Paternity", "Unpaid"],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    days: {
      type: Number,
      required: true,
      min: 0.5,
    },
    reason: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled"],
      default: "Pending",
      index: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    remarks: {
      type: String,
      maxlength: 500,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.Leave) {
  delete mongoose.models.Leave;
}

const Leave: Model<ILeave> = mongoose.model<ILeave>("Leave", leaveSchema);

export default Leave;
