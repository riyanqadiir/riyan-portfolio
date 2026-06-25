import mongoose, { Schema, Document } from 'mongoose';

export interface IProfilePhoto extends Document {
  /** Fixed singleton key — only one profile photo per portfolio */
  slug: string;
  s3Key: string;
  fileName: string;
  contentType: string;
  updatedAt: Date;
}

const ProfilePhotoSchema: Schema = new Schema(
  {
    slug: { type: String, required: true, unique: true, default: 'main' },
    s3Key: { type: String, required: true },
    fileName: { type: String, required: true },
    contentType: { type: String, default: 'image/jpeg' },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export default (mongoose.models.ProfilePhoto as mongoose.Model<IProfilePhoto>) ||
  mongoose.model<IProfilePhoto>('ProfilePhoto', ProfilePhotoSchema);
