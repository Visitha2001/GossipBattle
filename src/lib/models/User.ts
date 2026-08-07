import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
  handle?: string;
  handleColor?: string;
}

const UserSchema = new Schema<IUser>(
  {
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    avatar: { type: String },
    handle: { type: String, unique: true, sparse: true },
    handleColor: { type: String },
  },
  {
    timestamps: true,
  }
);

// Delete the existing model to prevent HMR issues where old schema is used
if (mongoose.models.User) {
  delete mongoose.models.User;
}

export const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
