import mongoose, { Document, Model, Schema } from "mongoose";

export interface ILeave extends Document {
  employee: mongoose.Types.ObjectId;
  approver?: mongoose.Types.ObjectId;
  fromDate: Date;
  toDate: Date;
  leaveType: "Casual Leave" | "Sick Leave" | "LOP";
  fromHalf: "FIRST_HALF" | "SECOND_HALF" | "FULL_DAY";
  toHalf: "FIRST_HALF" | "SECOND_HALF" | "FULL_DAY";
  totalDays: number;
  reason: string;
  contactNumber: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  approvedAt?: Date;
  rejectedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  remarks?: string;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
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
    approver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    fromDate: {
      type: Date,
      required: true,
      index: true,
    },
    toDate: {
      type: Date,
      required: true,
      index: true,
    },
    leaveType: {
      type: String,
      enum: ["Casual Leave", "Sick Leave", "LOP"],
      required: true,
    },
  fromHalf: {
    type: String,
    enum: ["FULL_DAY", "FIRST_HALF", "SECOND_HALF"],
    required: true,
  },
  toHalf: {
    type: String,
    enum: ["FULL_DAY", "FIRST_HALF", "SECOND_HALF"],
    required: true,
  },
  totalDays: {
      type: Number,
      required: true,
      min: 0.5,
    },
    reason: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    contactNumber: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
    approvedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
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
