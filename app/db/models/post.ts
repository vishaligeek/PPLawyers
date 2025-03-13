import mongoose, { Schema, Document } from "mongoose";
import { PostStatus } from "../../types/postTypes";

interface IPost extends Document {
  name: string;
  date: Date;
  title: string;
  tag: string[];
  description: string;
  status: PostStatus;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema<IPost>(
  {
    name: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    tag: {
      type: [String],
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: Object.values(PostStatus),
      default: PostStatus.PUBLISHED,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

PostSchema.virtual("media", {
  ref: "Media",
  localField: "_id",
  foreignField: "post",
  justOne: false,
});

PostSchema.set("toObject", { virtuals: true });
PostSchema.set("toJSON", { virtuals: true });

const Post = mongoose.model<IPost>("Post", PostSchema);
export default Post;
