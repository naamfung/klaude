import { homedir } from 'os';
import { basename, join, sep } from 'path';
import { type ReactNode } from 'react';
import { getOriginalCwd } from '../../../bootstrap/state.js';
import { Text } from '@anthropic/ink';
import { getShortcutDisplay } from '../../../keybindings/shortcutFormat.js';
import type { ToolPermissionContext } from '../../../Tool.js';
import { expandPath, getDirectoryForPath } from '../../../utils/path.js';
import { normalizeCaseForComparison, pathInAllowedWorkingPath } from '../../../utils/permissions/filesystem.js';
import type { OptionWithDescription } from '../../CustomSelect/select.js';
/**
 * Check if a path is within the project's .klaude/ folder.
 * This is used to determine whether to show the special ".klaude folder" permission option.
 */
export function isInKlaudeFolder(filePath: string): boolean {
  const absolutePath = expandPath(filePath);
  const klaudeFolderPath = expandPath(`${getOriginalCwd()}/.klaude`);

  // Check if the path is within the project's .klaude folder
  const normalizedAbsolutePath = normalizeCaseForComparison(absolutePath);
  const normalizedKlaudeFolderPath = normalizeCaseForComparison(klaudeFolderPath);

  // Path must start with the .klaude folder path (and be inside it, not just the folder itself)
  return (
    normalizedAbsolutePath.startsWith(normalizedKlaudeFolderPath + sep.toLowerCase()) ||
    // Also match case where sep is / on posix systems
    normalizedAbsolutePath.startsWith(normalizedKlaudeFolderPath + '/')
  );
}

/**
 * Check if a path is within the global ~/.klaude/ folder.
 * This is used to determine whether to show the special ".klaude folder" permission option
 * for files in the user's home directory.
 */
export function isInGlobalKlaudeFolder(filePath: string): boolean {
  const absolutePath = expandPath(filePath);
  const globalKlaudeFolderPath = join(homedir(), '.klaude');

  const normalizedAbsolutePath = normalizeCaseForComparison(absolutePath);
  const normalizedGlobalKlaudeFolderPath = normalizeCaseForComparison(globalKlaudeFolderPath);

  return (
    normalizedAbsolutePath.startsWith(normalizedGlobalKlaudeFolderPath + sep.toLowerCase()) ||
    normalizedAbsolutePath.startsWith(normalizedGlobalKlaudeFolderPath + '/')
  );
}

export type PermissionOption =
  | { type: 'accept-once' }
  | { type: 'accept-session'; scope?: 'klaude-folder' | 'global-klaude-folder' }
  | { type: 'reject' };

export type PermissionOptionWithLabel = OptionWithDescription<string> & {
  option: PermissionOption;
};

export type FileOperationType = 'read' | 'write' | 'create';

export function getFilePermissionOptions({
  filePath,
  toolPermissionContext,
  operationType = 'write',
  onRejectFeedbackChange,
  onAcceptFeedbackChange,
  yesInputMode = false,
  noInputMode = false,
}: {
  filePath: string;
  toolPermissionContext: ToolPermissionContext;
  operationType?: FileOperationType;
  onRejectFeedbackChange?: (value: string) => void;
  onAcceptFeedbackChange?: (value: string) => void;
  yesInputMode?: boolean;
  noInputMode?: boolean;
}): PermissionOptionWithLabel[] {
  const options: PermissionOptionWithLabel[] = [];
  const modeCycleShortcut = getShortcutDisplay('chat:cycleMode', 'Chat', 'shift+tab');

  // When in input mode, show input field
  if (yesInputMode && onAcceptFeedbackChange) {
    options.push({
      type: 'input',
      label: 'Yes',
      value: 'yes',
      placeholder: 'and tell Klaude what to do next',
      onChange: onAcceptFeedbackChange,
      allowEmptySubmitToCancel: true,
      option: { type: 'accept-once' },
    });
  } else {
    options.push({
      label: 'Yes',
      value: 'yes',
      option: { type: 'accept-once' },
    });
  }

  const inAllowedPath = pathInAllowedWorkingPath(filePath, toolPermissionContext);

  // Check if this is a .klaude/ folder path (project or global)
  const inKlaudeFolder = isInKlaudeFolder(filePath);
  const inGlobalKlaudeFolder = isInGlobalKlaudeFolder(filePath);

  // Option 2: For .klaude/ folder, show special option instead of generic session option
  // Note: Session-level options are always shown since they only affect in-memory state,
  // not persisted settings. The allowManagedPermissionRulesOnly setting only restricts
  // persisted permission rules.
  if ((inKlaudeFolder || inGlobalKlaudeFolder) && operationType !== 'read') {
    options.push({
      label: 'Yes, allow edits to .klaude/ config for this session',
      value: 'yes-klaude-folder',
      option: {
        type: 'accept-session',
        scope: inGlobalKlaudeFolder ? 'global-klaude-folder' : 'klaude-folder',
      },
    });
  } else {
    // Option 2: Allow all changes/reads during session
    let sessionLabel: ReactNode;

    if (inAllowedPath) {
      // Inside working directory
      if (operationType === 'read') {
        sessionLabel = 'Yes, during this session';
      } else {
        sessionLabel = (
          <Text>
            Yes, allow all edits during this session <Text bold>({modeCycleShortcut})</Text>
          </Text>
        );
      }
    } else {
      // Outside working directory - include directory name
      const dirPath = getDirectoryForPath(filePath);
      const dirName = basename(dirPath) || 'this directory';

      if (operationType === 'read') {
        sessionLabel = (
          <Text>
            Yes, allow reading from <Text bold>{dirName}/</Text> during this session
          </Text>
        );
      } else {
        sessionLabel = (
          <Text>
            Yes, allow all edits in <Text bold>{dirName}/</Text> during this session{' '}
            <Text bold>({modeCycleShortcut})</Text>
          </Text>
        );
      }
    }

    options.push({
      label: sessionLabel,
      value: 'yes-session',
      option: { type: 'accept-session' },
    });
  }

  // When in input mode, show input field for reject
  if (noInputMode && onRejectFeedbackChange) {
    options.push({
      type: 'input',
      label: 'No',
      value: 'no',
      placeholder: 'and tell Klaude what to do differently',
      onChange: onRejectFeedbackChange,
      allowEmptySubmitToCancel: true,
      option: { type: 'reject' },
    });
  } else {
    // Not in input mode - simple option
    options.push({
      label: 'No',
      value: 'no',
      option: { type: 'reject' },
    });
  }

  return options;
}
