export const PROJECTS_MESSAGES = {
    ERRORS: {
      PROJECT_EXISTS: 'A project with this name already exists',
      PROJECT_NOT_FOUND: 'Project not found',
      USER_NOT_FOUND: (userId: string) => `User with ID ${userId} does not exist`,
      USER_ALREADY_COLLABORATOR: 'User is already a collaborator',
      NOT_A_COLLABORATOR: 'User is not a collaborator',
      UNAUTHORIZED_ACTION: 'Only admins can perform this action',
    },
    INFO: {
      PROJECT_CREATED: (projectName: string) =>
        `A new project "${projectName}" has been created.`,
      PROJECT_UPDATED: (projectName: string) =>
        `The project "${projectName}" has been updated.`,
      PROJECT_ARCHIVED: (projectName: string) =>
        `The project "${projectName}" has been archived.`,
      COLLABORATOR_ADDED: (role: string, projectName: string) =>
        `You have been added as a "${role}" to the project "${projectName}".`,
      ROLE_UPDATED: (newRole: string, projectName: string) =>
        `Your role in the project "${projectName}" has been updated to "${newRole}".`,
    },
  };
  