import mongoose, { Schema, Document } from 'mongoose';

export interface ITimeline extends Document {
  title: string;
  subtitle: string;
  description: string;
  date: string;
  type: 'work' | 'education';
  order: number;
  createdAt: Date;
}

const TimelineSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    date: { type: String, required: true, trim: true },
    type: { type: String, enum: ['work', 'education'], default: 'work' },
    order: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default (mongoose.models.Timeline as mongoose.Model<ITimeline>) ||
  mongoose.model<ITimeline>('Timeline', TimelineSchema);
