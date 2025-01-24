import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project, ProjectSchema } from './project.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from 'src/users/users.module';


@Module({
  imports: [MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
  NotificationsModule,
  UsersModule,
],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
