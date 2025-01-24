
import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task } from './task.schema';
import { ProjectsService } from '../projects/projects.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
// import { Activity } from './activity.schema'; // Import Activity schema



@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
    private readonly notificationsGateway: NotificationsGateway, // Inject NotificationsGateway
    private readonly projectsService: ProjectsService, // Inject ProjectsService to access project details
  ) { }

  // private async logActivity(taskId: string, userId: string, description: string) {
  //   const activity = new this.activityModel({ taskId, userId, description });
  //   await activity.save();
  // }

  async createTask(userId: string, taskData: Partial<Task>) {
    const { projectId } = taskData;

    // Check user's role in the project
    const project = await this.projectsService.getProjectById(projectId);
    const userRole = project.roles[userId];

    // Add logging to verify the user's role and project data
    console.log(`User ID: ${userId}`);
    console.log(`User Role: ${userRole}`);
    console.log(`Project Data: ${JSON.stringify(project)}`);


    if (!userRole || userRole === 'viewer') {
      throw new UnauthorizedException('You do not have permission to create tasks in this project.');
    }

    const task = new this.taskModel(taskData);
    const savedTask = await task.save();

    // await this.logActivity(savedTask._id, userId, 'Task created');


    // Notify the assigned user
    if (savedTask.assignedTo) {
      this.notificationsGateway.notifyUser(savedTask.assignedTo, {
        type: 'task_created',
        taskId: savedTask._id,
        message: `A new task "${savedTask.title}" has been assigned to you.`,
      });
    }

    // Notify all collaborators of the project
    this.notificationsGateway.notifyProjectCollaborators(
      project.collaborators.map((collaborator) => collaborator.id), // Extract IDs
      {
        type: 'task_created',
        taskId: savedTask._id,
        message: `A new task "${savedTask.title}" has been created in the project "${project.name}".`,
      });

    return savedTask;
  }

  async getTasksByProject(userId: string, projectId: string) {
    const project = await this.projectsService.getProjectById(projectId);

    // Check if the user is a collaborator
    // if (!project.collaborators.includes(userId)) 
    if (!project.collaborators.map((collaborator) => collaborator.id).includes(userId)) {
      throw new UnauthorizedException('You are not a collaborator on this project.');
    }

    return this.taskModel.find({ projectId, isArchived: false }).exec();
  }

  async updateTask(userId: string, taskId: string, updates: Partial<Task>) {
    const task = await this.taskModel.findById(taskId).exec();
    if (!task) throw new NotFoundException('Task not found');

    // Check user's role in the project
    const project = await this.projectsService.getProjectById(task.projectId);
    const userRole = project.roles[userId];
    if (!userRole || (userRole !== 'admin' && userRole !== 'editor')) {
      throw new UnauthorizedException('You do not have permission to update tasks in this project.');
    }

    Object.assign(task, updates);
    const updatedTask = await task.save();

    // await this.logActivity(updatedTask._id, userId, 'Task updated');

    // Notify the assigned user
    if (updatedTask.assignedTo) {
      this.notificationsGateway.notifyUser(updatedTask.assignedTo, {
        type: 'task_updated',
        taskId: updatedTask._id,
        message: `The task "${updatedTask.title}" has been updated.`,
      });
    }

    // Notify all collaborators of the project
    this.notificationsGateway.notifyProjectCollaborators(
      project.collaborators.map((collaborator) => collaborator.id), // Extract IDs
      {
        type: 'task_updated',
        taskId: updatedTask._id,
        message: `The task "${updatedTask.title}" has been updated in the project "${project.name}".`,
      });

    return updatedTask;
  }

  async deleteTask(userId: string, taskId: string) {
    const task = await this.taskModel.findById(taskId).exec();
    if (!task) throw new NotFoundException('Task not found');

    // Check user's role in the project
    const project = await this.projectsService.getProjectById(task.projectId);
    const userRole = project.roles[userId];
    if (!userRole || (userRole !== 'admin' && userRole !== 'editor')) {
      throw new UnauthorizedException('Only admins and editors can delete tasks in this project.');
    }

    // Actually delete the task
    await this.taskModel.findByIdAndDelete(taskId).exec();

    // Notify the assigned user
    if (task.assignedTo) {
      this.notificationsGateway.notifyUser(task.assignedTo, {
        type: 'task_deleted',
        taskId: task._id,
        message: `The task "${task.title}" has been deleted.`,
      });
    }

    // Notify all collaborators of the project
    this.notificationsGateway.notifyProjectCollaborators(
      project.collaborators.map((collaborator) => collaborator.id),
      {
        type: 'task_deleted',
        taskId: task._id,
        message: `The task "${task.title}" has been deleted.`,
      });

    return { message: 'Task deleted successfully' };
  }


  async filterTasks(userId: string, filters: any) {
    const { projectId, status, dueDateFrom, dueDateTo, assignedTo, priority } = filters;

    const project = await this.projectsService.getProjectById(projectId);
    if (!project.collaborators.map((collaborator) => collaborator.id).includes(userId)) {
      throw new UnauthorizedException('You are not a collaborator on this project.');
    }

    const query: any = { projectId, isArchived: false };

    if (status) query.status = status;
    if (dueDateFrom || dueDateTo) query.dueDate = {};
    if (dueDateFrom) query.dueDate.$gte = new Date(dueDateFrom);
    if (dueDateTo) query.dueDate.$lte = new Date(dueDateTo);
    if (assignedTo) query.assignedTo = assignedTo;
    if (priority) query.priority = priority;

    return this.taskModel.find(query).exec();
  }


}
