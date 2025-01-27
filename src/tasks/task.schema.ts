import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Task extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ default: 'pending' }) // Status: pending, in-progress, completed
  status: string;

  @Prop({ default: 'low' }) // Priority: low, medium, high
  priority: string;

  @Prop({ required: true })
  dueDate: Date;

  @Prop({ required: true })
  projectId: string; 

  @Prop({ type: String }) 
  assignedTo: string;

  @Prop({ default: false })
  isArchived: boolean;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
