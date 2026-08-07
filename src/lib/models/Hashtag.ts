import mongoose, { Document, Model, Schema } from "mongoose";

export interface IHashtag extends Document {
  name: string;
  count: number;
  createdAt: Date;
  updatedAt: Date;
}

const HashtagSchema = new Schema<IHashtag>(
  {
    name: { type: String, required: true, unique: true, lowercase: true },
    count: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.Hashtag) {
  delete mongoose.models.Hashtag;
}

export const Hashtag: Model<IHashtag> = mongoose.model<IHashtag>("Hashtag", HashtagSchema);
