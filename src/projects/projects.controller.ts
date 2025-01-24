
import { Controller, Post, Get, Patch, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { AddCollaboratorDto } from './dto/add-collaborator.dto';


@Controller('projects')
@UseGuards(AuthGuard('jwt'))
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) { }

  @Post()
  async createProject(
    @Body() createProjectDto: CreateProjectDto,
    @Request() req,
  ) {
    // const { name, description } = createProjectDto;
    return this.projectsService.createProject(createProjectDto, req.user.userId);
  }

  @Get()
  async getUserProjects(@Request() req) {
    // console.log("checking the user id at getUserProjects in Project controller nvvvvvvvvvv", req.user.userId);
    return this.projectsService.getProjectsByUser(req.user.userId);
  }

  @Get(':id')
  async getProjectById(@Param('id') id: string) {
    return this.projectsService.getProjectById(id);
  }

  @Patch(':id')
  async updateProject(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.updateProject(id, updateProjectDto);
  }

  @Patch(':id/archive')
  async archiveProject(@Param('id') id: string) {
    return this.projectsService.archiveProject(id);
  }

  @Patch(':id/add-collaborator')
  async addCollaborator(
    @Param('id') projectId: string,
    @Body() addCollaboratorDto: AddCollaboratorDto,
    @Request() req,
  ) {
    return this.projectsService.addCollaborator(projectId, req.user.userId, addCollaboratorDto);
  }

  @Put(':projectId/collaborators/:userId/role')
  async updateCollaboratorRole(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
    @Body('ownerId') ownerId: string,
    @Body('newRole') newRole: string,
  ) {
    return this.projectsService.updateCollaboratorRole(projectId, ownerId, userId, newRole);
  }

}
