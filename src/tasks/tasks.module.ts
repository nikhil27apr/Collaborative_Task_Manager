import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task, TaskSchema } from './task.schema';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { ProjectsModule } from 'src/projects/projects.module';
import { ProjectsService } from 'src/projects/projects.service';
import { Project, ProjectSchema } from 'src/projects/project.schema'; 
import { UsersModule } from 'src/users/users.module';
import { Activity, ActivitySchema } from '../activities/activity.schema'; 
import { NotificationsGateway } from 'src/notifications/notifications.gateway';

@Module({
  imports: [
  MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
  MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
  MongooseModule.forFeature([{ name: Activity.name, schema: ActivitySchema }]), 
  NotificationsModule,
  ProjectsModule,
  UsersModule,
],
  controllers: [TasksController],
  providers: [TasksService, ProjectsService, NotificationsGateway],
})
export class TasksModule {}
