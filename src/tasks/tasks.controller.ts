import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards, Request, Req } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('tasks')
@UseGuards(AuthGuard('jwt'))
export class TasksController {
  constructor(private readonly tasksService: TasksService) { }

  @Post()
  async createTask(
    @Request() req,
    @Body() body: { title: string; description?: string; status?: string; priority?: string; dueDate: Date; projectId: string; assignedTo?: string },
  ) {
    return this.tasksService.createTask(req.user.userId, body);
  }

  @Get()
  async getTasksByProject(@Request() req, @Query('projectId') projectId: string) {
    return this.tasksService.getTasksByProject(req.user.userId, projectId);
  }

  @Patch(':id')
  async updateTask(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { title?: string; description?: string; status?: string; priority?: string; dueDate?: Date },
  ) {
    return this.tasksService.updateTask(req.user.userId, id, body);
  }

  @Delete(':id')
  async deleteTask(@Request() req, @Param('id') id: string) {
    return this.tasksService.deleteTask(req.user.userId, id);
  }

  @Get('filter')
  async filterTasks(@Req() req, @Query() query) {
    const userId = req.user.userId;
    return this.tasksService.filterTasks(userId, query);
  }

  @Get(':taskId/activities')
  async getActivities(@Param('taskId') taskId: string) {
    return this.tasksService.getTaskActivities(taskId);
  }

}
