import mongoose, { Document, Model, Schema } from "mongoose";

export interface ILeaveBalance extends Document {
  employee: mongoose.Types.ObjectId;
  year: number;
  totalCasual: number;
  usedCasual: number;
  totalSick: number;
  usedSick: number;
  usedLOP: number;
  createdAt: Date;
  updatedAt: Date;
}

const leaveBalanceSchema = new Schema<ILeaveBalance>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    year: {
      type: Number,
      required: true,
      index: true,
    },
    totalCasual: {
      type: Number,
      required: true,
      default: 10,
    },
    usedCasual: {
      type: Number,
      required: true,
      default: 0,
    },
    totalSick: {
      type: Number,
      required: true,
      default: 10,
    },
    usedSick: {
      type: Number,
      required: true,
      default: 0,
    },
    usedLOP: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for employee and year to ensure one record per employee per year
leaveBalanceSchema.index({ employee: 1, year: 1 }, { unique: true });

if (mongoose.models.LeaveBalance) {
  delete mongoose.models.LeaveBalance;
}

const LeaveBalance: Model<ILeaveBalance> = mongoose.model<ILeaveBalance>("LeaveBalance", leaveBalanceSchema);

export default LeaveBalance;
