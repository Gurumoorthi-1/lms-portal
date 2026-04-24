import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, type: String })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, type: String })
  password: string;

  @Prop({ default: 0 })
  xp: number;

  @Prop({ default: 1 })
  level: number;

  @Prop({ default: 'student', type: String })
  role: string;

  @Prop({ default: 0 })
  streak: number;

  @Prop({ type: Object, default: {} })
  preferences: {
    notifications?: any;
    ai?: any;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);
