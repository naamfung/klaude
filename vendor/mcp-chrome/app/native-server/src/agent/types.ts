/**
 * Re-export agent types from shared package for backward compatibility.
 * All types are now defined in packages/shared/src/agent-types.ts to ensure
 * consistency between native-server and chrome-extension.
 */
export type {
  AgentRole,
  AgentMessage,
  StreamTransport,
  AgentStatusEvent,
  AgentConnectedEvent,
  AgentHeartbeatEvent,
  RealtimeEvent,
  AgentAttachment,
  AgentCliPreference,
  AgentActRequest,
  AgentActResponse,
  AgentProject,
  AgentEngineInfo,
  AgentStoredMessage,
} from 'chrome-mcp-shared'
