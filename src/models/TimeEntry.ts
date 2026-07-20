import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITimeEntry extends Document {
  ticket: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  hours: number;
  description?: string;
  date: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const timeEntrySchema = new Schema<ITimeEntry>(
  {
    ticket: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    hours: {
      type: Number,
      required: true,
      min: 0.01,
      max: 24,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
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

if (mongoose.models.TimeEntry) {
  delete mongoose.models.TimeEntry;
}

const TimeEntry: Model<ITimeEntry> = mongoose.model<ITimeEntry>("TimeEntry", timeEntrySchema);

export default TimeEntry;
