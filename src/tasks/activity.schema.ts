import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Activity extends Document {
  @Prop({ required: true })
  taskId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  description: string;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);