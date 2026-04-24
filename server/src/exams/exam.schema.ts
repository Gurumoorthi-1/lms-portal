import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Exam extends Document {
  createdAt: Date;
  updatedAt: Date;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  topic: string;

  @Prop({ required: true })
  duration: number; // in minutes

  @Prop({ required: true })
  questionCount: number;

  @Prop({ required: true, type: [{ type: Object }] })
  questions: any[];

  @Prop({ default: 0 })
  score: number;

  @Prop({ required: true, enum: ['pending', 'completed', 'disqualified'], default: 'pending' })
  status: string;

  @Prop({ default: false })
  isAI: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ type: Object, default: {} })
  userAnswers: Record<string, any>;

  @Prop({ default: 0 })
  timeSpent: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Exam' })
  baseExamId: MongooseSchema.Types.ObjectId;

  @Prop({ type: [{ type: Object }], default: [] })
  violations: { reason: string, timestamp: Date, count: number }[];
}

export const ExamSchema = SchemaFactory.createForClass(Exam);

// Prevent duplicates: Same title/topic for same user/template
ExamSchema.index(
  { title: 1, topic: 1, userId: 1, baseExamId: 1 }, 
  { unique: true }
);
