import mongoose, { Document, Model, Schema } from "mongoose";

export interface IComment extends Document {
  content: string;
  imageUrl?: string;
  author: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  side: "none" | "left" | "right";
  isBattle: boolean;
  isHidden: boolean;
  upvotes: mongoose.Types.ObjectId[];
  downvotes: mongoose.Types.ObjectId[];
  parentComment?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    content: { type: String, required: false },
    imageUrl: { type: String },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    side: { type: String, enum: ["none", "left", "right"], default: "none" },
    isBattle: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
    upvotes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    downvotes: [{ type: Schema.Types.ObjectId, ref: "User" }],
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
