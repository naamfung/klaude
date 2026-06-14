import React, { useState } from 'react';
import { type OptionWithDescription, Select } from '../../components/CustomSelect/select.js';
import { Dialog } from '@anthropic/ink';
import { Box, Text } from '@anthropic/ink';
import { useAppState } from '../../state/AppState.js';
import { isKlaudeAISubscriber } from '../../utils/auth.js';
import { openBrowser } from '../../utils/browser.js';
import { KLAUDE_IN_CHROME_MCP_SERVER_NAME, openInChrome } from '../../utils/klaudeInChrome/common.js';
import { isChromeExtensionInstalled } from '../../utils/klaudeInChrome/setup.js';
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js';
import { env } from '../../utils/env.js';
import { isRunningOnHomespace } from '../../utils/envUtils.js';

const CHROME_EXTENSION_URL = 'https://klaude.ai/chrome';
const CHROME_PERMISSIONS_URL = 'https://clau.de/chrome/permissions';
const CHROME_RECONNECT_URL = 'https://clau.de/chrome/reconnect';

type MenuAction = 'install-extension' | 'reconnect' | 'manage-permissions' | 'toggle-default';

type Props = {
  onDone: (result?: string) => void;
  isExtensionInstalled: boolean;
  configEnabled: boolean | undefined;
  isKlaudeAISubscriber: boolean;
  isWSL: boolean;
};

function KlaudeInChromeMenu({
  onDone,
  isExtensionInstalled: installed,
  configEnabled,
  isKlaudeAISubscriber,
  isWSL,
}: Props): React.ReactNode {
  const mcpClients = useAppState(s => s.mcp.clients);
  const [selectKey, setSelectKey] = useState(0);
  const [enabledByDefault, setEnabledByDefault] = useState(configEnabled ?? false);
  const [showInstallHint, setShowInstallHint] = useState(false);
  const [isExtensionInstalled, setIsExtensionInstalled] = useState(installed);

  const isHomespace = process.env.USER_TYPE === 'ant' && isRunningOnHomespace();

  const chromeClient = mcpClients.find(c => c.name === KLAUDE_IN_CHROME_MCP_SERVER_NAME);
  const isConnected = chromeClient?.type === 'connected';

  function openUrl(url: string): void {
    if (isHomespace) {
      void openBrowser(url);
    } else {
      void openInChrome(url);
    }
  }

  function handleAction(action: MenuAction): void {
    switch (action) {
      case 'install-extension':
        setSelectKey(k => k + 1);
        setShowInstallHint(true);
        openUrl(CHROME_EXTENSION_URL);
        break;
      case 'reconnect':
        setSelectKey(k => k + 1);
        void isChromeExtensionInstalled().then(installed => {
          setIsExtensionInstalled(installed);
          if (installed) {
            setShowInstallHint(false);
          }
        });
        openUrl(CHROME_RECONNECT_URL);
        break;
      case 'manage-permissions':
        setSelectKey(k => k + 1);
        openUrl(CHROME_PERMISSIONS_URL);
        break;
      case 'toggle-default': {
        const newValue = !enabledByDefault;
        saveGlobalConfig(current => ({
          ...current,
          klaudeInChromeDefaultEnabled: newValue,
        }));
        setEnabledByDefault(newValue);
        break;
      }
    }
  }

  const options: OptionWithDescription<MenuAction>[] = [];
  const requiresExtensionSuffix = isExtensionInstalled ? '' : ' (requires extension)';

  if (!isExtensionInstalled && !isHomespace) {
    options.push({
      label: 'Install Chrome extension',
      value: 'install-extension',
    });
  }

  options.push(
    {
      label: (
        <>
          <Text>Manage permissions</Text>
          <Text dimColor>{requiresExtensionSuffix}</Text>
        </>
      ),
      value: 'manage-permissions',
    },
    {
      label: (
        <>
          <Text>Reconnect extension</Text>
          <Text dimColor>{requiresExtensionSuffix}</Text>
        </>
      ),
      value: 'reconnect',
    },
    {
      label: `Enabled by default: ${enabledByDefault ? 'Yes' : 'No'}`,
      value: 'toggle-default',
    },
  );

  const isDisabled = isWSL || ((process.env.USER_TYPE as string) !== 'ant' && !isKlaudeAISubscriber);

  return (
    <Dialog title="Klaude in Chrome (Beta)" onCancel={() => onDone()} color="chromeYellow">
      <Box flexDirection="column" gap={1}>
        <Text>
          Klaude in Chrome works with the Chrome extension to let you control your browser directly from Klaude Code.
          Navigate websites, fill forms, capture screenshots, record GIFs, and debug with console logs and network
          requests.
        </Text>

        {isWSL && <Text color="error">Klaude in Chrome is not supported in WSL at this time.</Text>}

        {(process.env.USER_TYPE as string) !== 'ant' && !isKlaudeAISubscriber && (
          <Text color="error">Klaude in Chrome requires a klaude.ai subscription.</Text>
        )}

        {!isDisabled && (
          <>
            {!isHomespace && (
              <Box flexDirection="column">
                <Text>
                  Status: {isConnected ? <Text color="success">Enabled</Text> : <Text color="inactive">Disabled</Text>}
                </Text>
                <Text>
                  Extension:{' '}
                  {isExtensionInstalled ? (
                    <Text color="success">Installed</Text>
                  ) : (
                    <Text color="warning">Not detected</Text>
                  )}
                </Text>
              </Box>
            )}
            <Select key={selectKey} options={options} onChange={handleAction} hideIndexes />

            {showInstallHint && (
              <Text color="warning">Once installed, select {'"Reconnect extension"'} to connect.</Text>
            )}

            <Text>
              <Text dimColor>Usage: </Text>
              <Text>klaude --chrome</Text>
              <Text dimColor> or </Text>
              <Text>klaude --no-chrome</Text>
            </Text>

            <Text dimColor>
              Site-level permissions are inherited from the Chrome extension. Manage permissions in the Chrome extension
              settings to control which sites Klaude can browse, click, and type on.
            </Text>
          </>
        )}
        <Text dimColor>Learn more: https://code.klaude.com/docs/en/chrome</Text>
      </Box>
    </Dialog>
  );
}

export const call = async function (onDone: (result?: string) => void): Promise<React.ReactNode> {
  const isExtensionInstalled = await isChromeExtensionInstalled();
  const config = getGlobalConfig();
  const isSubscriber = isKlaudeAISubscriber();
  const isWSL = env.isWslEnvironment();

  return (
    <KlaudeInChromeMenu
      onDone={onDone}
      isExtensionInstalled={isExtensionInstalled}
      configEnabled={config.klaudeInChromeDefaultEnabled}
      isKlaudeAISubscriber={isSubscriber}
      isWSL={isWSL}
    />
  );
};
