import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Project extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  owner: string; // User ID of the project owner
  
  @Prop({ type: [String], default: [] }) // Default to an empty array if no collaborators
  collaborators: string[];

  @Prop({
    type: Map,
    of: String, // Role-based permissions: userId -> role (e.g., 'admin', 'editor', 'viewer')
    default: {}, // Default to an empty map
  })
  roles: Map<string, string>;

  @Prop({ default: false })
  isArchived: boolean;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
