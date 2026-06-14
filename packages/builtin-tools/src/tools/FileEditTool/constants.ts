// In its own file to avoid circular dependencies
export const FILE_EDIT_TOOL_NAME = 'Edit'

// Permission pattern for granting session-level access to the project's .klaude/ folder
export const KLAUDE_FOLDER_PERMISSION_PATTERN = '/.klaude/**'

// Permission pattern for granting session-level access to the global ~/.klaude/ folder
export const GLOBAL_KLAUDE_FOLDER_PERMISSION_PATTERN = '~/.klaude/**'

export const FILE_UNEXPECTEDLY_MODIFIED_ERROR =
  'File has been unexpectedly modified. Read it again before attempting to write it.'
