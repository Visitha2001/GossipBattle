import mongoose, { Document, Model, Schema } from "mongoose";

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  actor: mongoose.Types.ObjectId;
  type: "mention" | "like" | "comment" | "battle" | "follow";
  post?: mongoose.Types.ObjectId;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["mention", "like", "comment", "battle", "follow"], required: true },
    post: { type: Schema.Types.ObjectId, ref: "Post" },
    read: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.Notification) {
  delete mongoose.models.Notification;
}

export const Notification: Model<INotification> = mongoose.model<INotification>("Notification", NotificationSchema);
