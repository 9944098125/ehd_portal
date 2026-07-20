import mongoose, { Document, Schema, Model } from "mongoose";

export interface ITicket extends Document {
  title: string;
  content: string;
  projectId: mongoose.Types.ObjectId;
  status: "IN_PROGRESS" | "IN_REVIEW" | "COMPLETED" | "CLOSED";
  images: string[];
  owner: mongoose.Types.ObjectId;
  department?: string;
  assignees: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  estimatedHours?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  statusUpdatedAt: Date;
}

const TicketSchema = new Schema<ITicket>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    status: {
      type: String,
      enum: ["IN_PROGRESS", "IN_REVIEW", "COMPLETED", "CLOSED"],
      default: "IN_PROGRESS",
    },
    images: [
      {
        type: String,
      },
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    department: {
      type: String,
      enum: [
        "Human Resource",
        "Information Technology",
        "Finance",
        "Administration",
        "Research & Development",
        "Legal",
        "Security",
      ],
    },
    assignees: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
    },
    estimatedHours: {
      type: Number,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    statusUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Clear Mongoose cache for hot-reloading in dev
if (mongoose.models.Ticket) {
  delete mongoose.models.Ticket;
}

const Ticket: Model<ITicket> = mongoose.model<ITicket>("Ticket", TicketSchema);

export default Ticket;
