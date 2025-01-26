import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Project extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  owner: string;
  
  @Prop({ type: [String], default: [] }) 
  collaborators: string[];

  @Prop({
    type: Map,
    of: String, // Role-based permissions: userId -> role (e.g., 'admin', 'editor', 'viewer')
    default: {}, 
  })
  roles: Map<string, string>;

  @Prop({ default: false })
  isArchived: boolean;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
