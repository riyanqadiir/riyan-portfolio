import mongoose, { Schema, Document } from 'mongoose';

export interface IResume extends Document {
  /** Fixed singleton key — only one resume per portfolio */
  slug: string;
  s3Key: string;
  fileName: string;
  contentType: string;
  updatedAt: Date;
}

const ResumeSchema: Schema = new Schema(
  {
    slug: { type: String, required: true, unique: true, default: 'main' },
    s3Key: { type: String, required: true },
    fileName: { type: String, required: true },
    contentType: { type: String, default: 'application/pdf' },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export default (mongoose.models.Resume as mongoose.Model<IResume>) ||
  mongoose.model<IResume>('Resume', ResumeSchema);
