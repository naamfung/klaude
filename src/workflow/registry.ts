import { AgentAdapterRegistry } from '@klaude-code/workflow-engine'
import { klaudeCodeBackend } from './backends/klaudeCodeBackend.js'

/**
 * Build a multi-backend registry. v1 (depth B) only registers a single
 * klaude-code adapter as default, without prefilling routing rules — add
 * .route(...) when extending with a second provider adapter.
 */
export function buildRegistry(): AgentAdapterRegistry {
  const reg = new AgentAdapterRegistry()
  reg.register(klaudeCodeBackend).default('klaude-code')
  return reg
}
