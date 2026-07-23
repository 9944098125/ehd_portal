import mongoose, { Document, Model, Schema } from "mongoose";

export interface INotification extends Document {
  recipient?: mongoose.Types.ObjectId; // null means broadcast
  type: "LEAVE_REQUESTED" | "LEAVE_APPROVED" | "LEAVE_REJECTED" | "LEAVE_CANCELLED" | "ORGANIZATION_LEAVE_ANNOUNCEMENT";
  message: string;
  isRead: boolean;
  relatedLeave?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },
    type: {
      type: String,
      enum: ["LEAVE_REQUESTED", "LEAVE_APPROVED", "LEAVE_REJECTED", "LEAVE_CANCELLED", "ORGANIZATION_LEAVE_ANNOUNCEMENT"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    relatedLeave: {
      type: Schema.Types.ObjectId,
      ref: "Leave",
    },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.Notification) {
  delete mongoose.models.Notification;
}

const Notification: Model<INotification> = mongoose.model<INotification>("Notification", notificationSchema);

export default Notification;
