export const TASKS_MESSAGES = {
    ERRORS: {
      TASK_NOT_FOUND: 'Task not found.',
      UNAUTHORIZED_CREATE: 'You do not have permission to create tasks in this project.',
      UNAUTHORIZED_UPDATE: 'You do not have permission to update tasks in this project.',
      UNAUTHORIZED_DELETE: 'Only admins and editors can delete tasks in this project.',
      UNAUTHORIZED_VIEW: 'You are not a collaborator on this project.',
    },
    INFO: {
      TASK_CREATED: (taskTitle: string) => `A new task "${taskTitle}" has been created.`,
      TASK_UPDATED: (taskTitle: string) => `The task "${taskTitle}" has been updated.`,
      TASK_DELETED: (taskTitle: string) => `The task "${taskTitle}" has been deleted.`,
      TASK_ASSIGNED: (taskTitle: string) => `A new task "${taskTitle}" has been assigned to you.`,
      TASK_FILTERED: 'Tasks have been successfully filtered.',
      ACTIVITY_LOGGED: 'Activity has been successfully logged.',
    },
  };
  