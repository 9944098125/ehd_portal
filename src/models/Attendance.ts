import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAttendance extends Document {
  employee: mongoose.Types.ObjectId;
  date: Date;
  status: "Present" | "Absent" | "Half Day" | "On Leave" | "Holiday";
  checkIn?: Date;
  checkOut?: Date;
  workingHours?: number;
  remarks?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["Present", "Absent", "Half Day", "On Leave", "Holiday"],
      required: true,
      default: "Present",
    },
    checkIn: {
      type: Date,
    },
    checkOut: {
      type: Date,
    },
    workingHours: {
      type: Number,
      default: 0,
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

// Ensure only one attendance record per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

if (mongoose.models.Attendance) {
  delete mongoose.models.Attendance;
}

const Attendance: Model<IAttendance> = mongoose.model<IAttendance>("Attendance", attendanceSchema);

export default Attendance;
