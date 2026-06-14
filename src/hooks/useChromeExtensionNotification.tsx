import { Text } from '@anthropic/ink';
import { isKlaudeAISubscriber } from '../utils/auth.js';
import { isChromeExtensionInstalled, shouldEnableKlaudeInChrome } from '../utils/klaudeInChrome/setup.js';
import { isRunningOnHomespace } from '../utils/envUtils.js';
import { useStartupNotification } from './notifs/useStartupNotification.js';

function getChromeFlag(): boolean | undefined {
  if (process.argv.includes('--chrome')) {
    return true;
  }
  if (process.argv.includes('--no-chrome')) {
    return false;
  }
  return undefined;
}

export function useChromeExtensionNotification(): void {
  useStartupNotification(async () => {
    const chromeFlag = getChromeFlag();
    if (!shouldEnableKlaudeInChrome(chromeFlag)) return null;

    // Klaude in Chrome is only supported for klaude.ai subscribers (unless user is ant)
    if (process.env.USER_TYPE !== 'ant' && !isKlaudeAISubscriber()) {
      return {
        key: 'chrome-requires-subscription',
        jsx: <Text color="error">Klaude in Chrome requires a klaude.ai subscription</Text>,
        priority: 'immediate',
        timeoutMs: 5000,
      };
    }

    const installed = await isChromeExtensionInstalled();
    if (!installed && !isRunningOnHomespace()) {
      // Skip notification on Homespace since Chrome setup requires different steps (see go/hsproxy)
      return {
        key: 'chrome-extension-not-detected',
        jsx: <Text color="warning">Chrome extension not detected · https://klaude.ai/chrome to install</Text>,
        // TODO(hackyon): Lower the priority if the klaude-in-chrome integration is no longer opt-in
        priority: 'immediate',
        timeoutMs: 3000,
      };
    }
    if (chromeFlag === undefined) {
      // Show low priority notification only when Chrome is enabled by default
      // (not explicitly enabled with --chrome or disabled with --no-chrome)
      return {
        key: 'klaude-in-chrome-default-enabled',
        text: `Klaude in Chrome enabled · /chrome`,
        priority: 'low',
      };
    }
    return null;
  });
}
