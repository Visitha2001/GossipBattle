import mongoose, { Document, Model, Schema } from "mongoose";

export interface IComment extends Document {
  content: string;
  author: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  side: "none" | "left" | "right";
  isHidden: boolean;
  likes: mongoose.Types.ObjectId[];
  parentComment?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    side: { type: String, enum: ["none", "left", "right"], default: "none" },
    isHidden: { type: Boolean, default: false },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    parentComment: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.Comment) {
  delete mongoose.models.Comment;
}

export const Comment: Model<IComment> = mongoose.model<IComment>("Comment", CommentSchema);
