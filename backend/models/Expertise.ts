import mongoose, { Schema, Document } from 'mongoose';

export interface IExpertise extends Document {
  title: string;
  description: string;
  icon: string;
  chipsLabel: string;
  chips: string[];
  order: number;
  createdAt: Date;
}

const ExpertiseSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    icon: { type: String, required: true, default: 'code' },
    chipsLabel: { type: String, required: true, default: 'Tech stack:' },
    chips: { type: [String], default: [] },
    order: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default (mongoose.models.Expertise as mongoose.Model<IExpertise>) ||
  mongoose.model<IExpertise>('Expertise', ExpertiseSchema);
