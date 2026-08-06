import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}

const UserSchema = new Schema<IUser>(
  {
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    avatar: { type: String },
  },
  {
    timestamps: true,
  }
);

// We need to check if the model already exists to prevent OverwriteModelError in Next.js
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
