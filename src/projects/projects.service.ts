import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from './project.schema';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { AddCollaboratorDto } from './dto/add-collaborator.dto';
import { User } from '../users/user.schema';
import { PROJECTS_MESSAGES } from './constants/projects.constants';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly notificationsGateway: NotificationsGateway,
  ) { }

  // Create a new project
  async createProject(createProjectDto: CreateProjectDto, owner: string) {
    const { name, description } = createProjectDto;

    // Check if the project with the same name already exists
    const existingProject = await this.projectModel.findOne({ name }).exec();
    if (existingProject) {
      throw new BadRequestException(PROJECTS_MESSAGES.ERRORS.PROJECT_EXISTS);
    }

    // Create a new project document
    const project = new this.projectModel({
      name,
      description,
      owner,
      collaborators: [owner],
      roles: { [owner]: 'admin' },
    });

    // Save the new project
    const savedProject = await project.save();

    // Send a notification to all collaborators (including the owner)
    this.notificationsGateway.notifyProjectCollaborators(savedProject.collaborators, {
      type: 'project_created',
      projectId: savedProject._id,
      message: PROJECTS_MESSAGES.INFO.PROJECT_CREATED(savedProject.name),
    });

    return savedProject;
  }

  // Get a specific project by ID
  async getProjectById(projectId: string) {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new NotFoundException(PROJECTS_MESSAGES.ERRORS.PROJECT_NOT_FOUND);
    }

    // Populate owner and collaborators
    const owner = await this.userModel.findById(project.owner).exec();
    const collaborators = await this.userModel.find({ _id: { $in: project.collaborators } }).exec();

    return {
      ...project.toObject(),
      owner: owner ?
        {
          id: owner._id,
          name: owner.email,
        } : null,

      collaborators: collaborators.map((collaborator): { id: string; name: string } => ({
        id: collaborator._id.toString(),
        name: collaborator.email,
      })),
      roles: Object.fromEntries(project.roles),
    };
  }

  // Get all projects associated with a specific user (collaborator)
  async getProjectsByUser(userId: string) {
    return this.projectModel.find({ collaborators: userId, isArchived: false }).exec();
  }

  // Update a project with new data
  async updateProject(projectId: string, updateProjectDto: UpdateProjectDto) {
    const project = await this.projectModel.findByIdAndUpdate(projectId, updateProjectDto, { new: true }).exec();
    if (!project) {
      throw new NotFoundException(PROJECTS_MESSAGES.ERRORS.PROJECT_NOT_FOUND);
    }

    // Send a notification to all collaborators (including the owner)
    this.notificationsGateway.notifyProjectCollaborators(project.collaborators, {
      type: 'project_updated',
      projectId: project._id,
      message: PROJECTS_MESSAGES.INFO.PROJECT_UPDATED(project.name),
    });

    return project;
  }

  // Archive a project by marking it as archived
  async archiveProject(projectId: string) {
    const project = await this.projectModel.findByIdAndUpdate(projectId, { isArchived: true }, { new: true }).exec();
    if (!project) {
      throw new NotFoundException(PROJECTS_MESSAGES.ERRORS.PROJECT_NOT_FOUND);
    }

    // Send a notification to all collaborators (including the owner)
    this.notificationsGateway.notifyProjectCollaborators(project.collaborators, {
      type: 'project_archived',
      projectId: project._id,
      message: PROJECTS_MESSAGES.INFO.PROJECT_ARCHIVED(project.name),
    });

    return project;
  }

  async addCollaborator(projectId: string, ownerId: string, addCollaboratorDto: AddCollaboratorDto) {
    const { userId, role } = addCollaboratorDto;

    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new NotFoundException(PROJECTS_MESSAGES.ERRORS.PROJECT_NOT_FOUND);
    }

    // Ensure the requesting user is the owner or an admin of the project
    const userRole = project.roles.get(ownerId);
    if (userRole !== 'admin') {
      throw new UnauthorizedException(PROJECTS_MESSAGES.ERRORS.UNAUTHORIZED_ACTION);
    }

    // Check if the user exists in the system
    const userExists = await this.userModel.findById(userId).exec();
    if (!userExists) {
      throw new NotFoundException(PROJECTS_MESSAGES.ERRORS.USER_NOT_FOUND(userId));
    }

    // Check if the user is already a collaborator
    if (project.collaborators.includes(userId)) {
      throw new BadRequestException(PROJECTS_MESSAGES.ERRORS.USER_ALREADY_COLLABORATOR);
    }

    // Add the user as a collaborator with the specified role
    project.collaborators.push(userId);
    project.roles.set(userId, role);

    // Save the project
    await project.save();

    // Notify the new collaborator
    this.notificationsGateway.notifyUser(userId, {
      type: 'collaborator_added',
      projectId: project._id,
      message: PROJECTS_MESSAGES.INFO.COLLABORATOR_ADDED(role, project.name),
    });

    return project;
  }

  async updateCollaboratorRole(projectId: string, ownerId: string, userId: string, newRole: string) {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new NotFoundException(PROJECTS_MESSAGES.ERRORS.PROJECT_NOT_FOUND);
    }

    // Ensure the requesting user is the owner or an admin of the project
    const userRole = project.roles.get(ownerId);
    if (userRole !== 'admin') {
      throw new UnauthorizedException(PROJECTS_MESSAGES.ERRORS.UNAUTHORIZED_ACTION);
    }

    // Check if the user is a collaborator
    if (!project.collaborators.includes(userId)) {
      throw new BadRequestException(PROJECTS_MESSAGES.ERRORS.NOT_A_COLLABORATOR);
    }

    // Update the user's role
    project.roles.set(userId, newRole);
    await project.save();

    // Notify the collaborator about the role change
    this.notificationsGateway.notifyUser(userId, {
      type: 'role_updated',
      projectId: project._id,
      message: PROJECTS_MESSAGES.INFO.ROLE_UPDATED(newRole, project.name),
    });

    return project;
  }
}
