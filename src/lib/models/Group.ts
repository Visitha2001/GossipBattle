import mongoose, { Document, Model, Schema } from "mongoose";

export interface IGroup extends Document {
  name: string;
  bio?: string;
  category?: string;
  coverImage?: string;
  profileImage?: string;
  admin: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true },
    bio: { type: String },
    category: { type: String },
    coverImage: { type: String },
    profileImage: { type: String },
    admin: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.Group) {
  delete mongoose.models.Group;
}

export const Group: Model<IGroup> = mongoose.model<IGroup>("Group", GroupSchema);
