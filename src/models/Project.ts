import mongoose, { Document, Schema, Model } from "mongoose";

export interface IProject extends Document {
  name: string;
  code: string;
  description: string;
  status: "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  team: mongoose.Types.ObjectId[];
  teamLead?: mongoose.Types.ObjectId;
  startDate?: Date;
  expectedEndDate?: Date;
  actualEndDate?: Date;
  color: string;
  icon?: string;
  tags?: string[];
  repository?: string;
  jiraBoard?: string;
  documentation?: string;
  attachments?: string[];
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"],
      default: "ACTIVE",
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },
    team: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    teamLead: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    startDate: {
      type: Date,
    },
    expectedEndDate: {
      type: Date,
    },
    actualEndDate: {
      type: Date,
    },
    color: {
      type: String,
      default: "#2563EB",
    },
    icon: {
      type: String,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    repository: {
      type: String,
    },
    jiraBoard: {
      type: String,
    },
    documentation: {
      type: String,
    },
    attachments: [
      {
        type: String,
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
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

ProjectSchema.index({ name: 1 });
ProjectSchema.index({ code: 1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ priority: 1 });
ProjectSchema.index({ team: 1 });

if (mongoose.models.Project) {
  delete mongoose.models.Project;
}

const Project: Model<IProject> = mongoose.model<IProject>("Project", ProjectSchema);

export default Project;
