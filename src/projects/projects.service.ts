
import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from './project.schema';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { NotificationsGateway } from '../notifications/notifications.gateway'; // Import NotificationsGateway
import { AddCollaboratorDto } from './dto/add-collaborator.dto';
import { User } from '../users/user.schema'; // Import User schema


@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(User.name) private userModel: Model<User>, // Inject User model
    private readonly notificationsGateway: NotificationsGateway, // Inject NotificationsGateway
  ) { }

  // Create a new project
  async createProject(createProjectDto: CreateProjectDto, owner: string) {
    const { name, description } = createProjectDto;

    // Check if the project with the same name already exists
    const existingProject = await this.projectModel.findOne({ name }).exec();
    if (existingProject) {
      throw new BadRequestException('A project with this name already exists');
    }

    // Create a new project document
    const project = new this.projectModel({
      name,
      description,
      owner,
      collaborators: [owner],
      roles: { [owner]: 'admin' },  // Owner gets admin role by default
    });

    // Save the new project
    const savedProject = await project.save();

    // Send a notification to all collaborators (including the owner)
    this.notificationsGateway.notifyProjectCollaborators(savedProject.collaborators, {
      type: 'project_created',
      projectId: savedProject._id,
      message: `A new project "${savedProject.name}" has been created.`,
    });

    return savedProject;
  }

  // Get a specific project by ID
  async getProjectById(projectId: string) {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
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
      // collaborators,
      // collaborators: collaborators.map((collaborator) => collaborator._id.toString()), // Extract user IDs
      collaborators: collaborators.map((collaborator): { id: string; name: string } => ({
        id: collaborator._id.toString(),
        name: collaborator.email,
      })),
      roles: Object.fromEntries(project.roles), // Ensure roles are included in the returned project data
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
      throw new NotFoundException('Project not found');
    }

    // Send a notification to all collaborators (including the owner)
    this.notificationsGateway.notifyProjectCollaborators(project.collaborators, {
      type: 'project_updated',
      projectId: project._id,
      message: `The project "${project.name}" has been updated.`,
    });

    return project;
  }

  // Archive a project by marking it as archived
  async archiveProject(projectId: string) {
    const project = await this.projectModel.findByIdAndUpdate(projectId, { isArchived: true }, { new: true }).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Send a notification to all collaborators (including the owner)
    this.notificationsGateway.notifyProjectCollaborators(project.collaborators, {
      type: 'project_archived',
      projectId: project._id,
      message: `The project "${project.name}" has been archived.`,
    });

    return project;
  }

  async addCollaborator(projectId: string, ownerId: string, addCollaboratorDto: AddCollaboratorDto) {
    const { userId, role } = addCollaboratorDto;

    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Ensure the requesting user is the owner or an admin of the project
    const userRole = project.roles.get(ownerId);
    if (userRole !== 'admin') {
      throw new UnauthorizedException('Only admins can add collaborators');
    }

    // Check if the user exists in the system
    const userExists = await this.userModel.findById(userId).exec();
    if (!userExists) {
      throw new NotFoundException(`User with ID ${userId} does not exist`);
    }

    // Check if the user is already a collaborator
    if (project.collaborators.includes(userId)) {
      throw new BadRequestException('User is already a collaborator');
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
      message: `You have been added as a "${role}" to the project "${project.name}".`,
    });

    return project;
  }



  async updateCollaboratorRole(projectId: string, ownerId: string, userId: string, newRole: string) {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Ensure the requesting user is the owner or an admin of the project
    const userRole = project.roles.get(ownerId);
    if (userRole !== 'admin') {
      throw new UnauthorizedException('Only admins can update collaborator roles');
    }

    // Check if the user is a collaborator
    if (!project.collaborators.includes(userId)) {
      throw new BadRequestException('User is not a collaborator');
    }

    // Update the user's role
    project.roles.set(userId, newRole);
    await project.save();

    // Notify the collaborator about the role change
    this.notificationsGateway.notifyUser(userId, {
      type: 'role_updated',
      projectId: project._id,
      message: `Your role in the project "${project.name}" has been updated to "${newRole}".`,
    });

    return project;
  }


}
