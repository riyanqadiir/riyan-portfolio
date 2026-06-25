import mongoose, { Schema, Document } from 'mongoose';

/**
 * TypeScript interface for a Portfolio Project document.
 */
export interface IProject extends Document {
  title: string;
  description: string;
  /** URL to the project screenshot — either an S3 URL or a public path */
  image: string;
  /** Live URL of the deployed project or GitHub repository */
  link: string;
  /** Display order (lower = shown first) */
  order: number;
  createdAt: Date;
}

const ProjectSchema: Schema = new Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    image:       { type: String, required: true },
    link:        { type: String, required: true },
    order:       { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

/**
 * Guard against Mongoose OverwriteModelError on serverless warm re-invocations.
 * Mongoose caches compiled models in `mongoose.models`; we reuse the existing
 * one rather than re-compiling the schema every time.
 */
export default (mongoose.models.Project as mongoose.Model<IProject>) ||
  mongoose.model<IProject>('Project', ProjectSchema);
