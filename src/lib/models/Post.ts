import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPost extends Document {
  content: string;
  imageUrl?: string;
  author: mongoose.Types.ObjectId;
  views: number;
  likes: mongoose.Types.ObjectId[];
  shares: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    content: { type: String, required: true },
    imageUrl: { type: String },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    views: { type: Number, default: 0 },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    shares: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.Post) {
  delete mongoose.models.Post;
}

export const Post: Model<IPost> = mongoose.model<IPost>("Post", PostSchema);
