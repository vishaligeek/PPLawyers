import mongoose, { Schema, Document } from "mongoose";


interface IMedia extends Document {
  post: mongoose.Types.ObjectId; 
  url: string; 
  type: 'image' | 'video';
  createdAt : Date 
}

const MediaSchema: Schema = new Schema<IMedia>({
  post: {
    type: Schema.Types.ObjectId,
    ref: "Post", 
    required: true,
  },
  url: {
    type: String,
    required: false,
  },
  type: {
    type: String,
    enum: ['mp4', 'jpeg', 'png', 'jpg'], 
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now, 
  },
},{ toJSON: { versionKey: false } });

const Media = mongoose.model<IMedia>("Media", MediaSchema);
export default Media;
