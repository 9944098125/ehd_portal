import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAuditLog extends Document {
  action: string;
  entityType: "Payroll" | "SalaryStructure" | "User" | "Project" | "Ticket";
  entityId: mongoose.Types.ObjectId;
  performedBy: mongoose.Types.ObjectId;
  details?: any;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    details: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.AuditLog) {
  delete mongoose.models.AuditLog;
}

const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>("AuditLog", auditLogSchema);

export default AuditLog;
