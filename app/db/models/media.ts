import mongoose, { Schema, Document } from "mongoose";

interface IMedia extends Document {
  post: mongoose.Types.ObjectId;
  imageName: string;
  type: "image" | "video";
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema: Schema = new Schema<IMedia>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    imageName: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      enum: ["image/jpeg", "image/png", "image/jpg", "video/mp4"],
      required: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { toJSON: { versionKey: false } }
);

const Media = mongoose.model<IMedia>("Media", MediaSchema);
export default Media;
