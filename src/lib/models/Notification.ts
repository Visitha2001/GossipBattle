import mongoose, { Document, Model, Schema } from "mongoose";

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  actor: mongoose.Types.ObjectId;
  type: "mention" | "like" | "comment" | "battle" | "follow" | "share" | "group_invite";
  post?: mongoose.Types.ObjectId;
  comment?: mongoose.Types.ObjectId;
  group?: mongoose.Types.ObjectId;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["mention", "like", "comment", "battle", "follow", "share", "group_invite"], required: true },
    post: { type: Schema.Types.ObjectId, ref: "Post" },
    comment: { type: Schema.Types.ObjectId, ref: "Comment" },
    group: { type: Schema.Types.ObjectId, ref: "Group" },
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
