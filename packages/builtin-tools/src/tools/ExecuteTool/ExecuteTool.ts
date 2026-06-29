import { z } from 'zod/v4'
import {
  buildTool,
  findToolByName,
  type Tool,
  type ToolDef,
  type ToolUseContext,
  type ToolResult,
  type Tools,
} from 'src/Tool.js'
import { lazySchema } from 'src/utils/lazySchema.js'
import { createUserMessage } from 'src/utils/messages.js'
import {
  extractDiscoveredToolNames,
  isSearchExtraToolsEnabledOptimistic,
  isSearchExtraToolsToolAvailable,
} from 'src/utils/searchExtraTools.js'
import { DESCRIPTION, getPrompt } from './prompt.js'
import { EXECUTE_TOOL_NAME } from './constants.js'
import { isDeferredTool } from '../SearchExtraToolsTool/prompt.js'

export const inputSchema = lazySchema(() =>
  z.object({
    tool_name: z
      .string()
      .describe(
        'The exact name of the target tool to execute (e.g., "CronCreate", "mcp__server__action")',
      ),
    params: z
      .record(z.string(), z.unknown())
      .describe(
        'The parameters to pass to the target tool. Must match the target tool\'s input schema exactly (e.g., {"status": "complete"}, not {"status": {"type": "complete"}}). Only primitive values and arrays of primitives are allowed unless the target tool\'s schema explicitly allows objects.',
      ),
  }),
)
type InputSchema = ReturnType<typeof inputSchema>

export const outputSchema = lazySchema(() =>
  z.object({
    result: z.unknown(),
    tool_name: z.string(),
  }),
)
type OutputSchema = ReturnType<typeof outputSchema>

export type Output = z.infer<OutputSchema>

function validateParams(params: Record<string, unknown>): string | null {
  for (const key of Object.keys(params)) {
    const value = params[key]
    const type = typeof value
    if (
      type !== 'string' &&
      type !== 'number' &&
      type !== 'boolean' &&
      type !== 'bigint' &&
      type !== 'symbol' &&
      type !== 'undefined' &&
      value !== null
    ) {
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          const nestedErr = validateParams({ [`[${i}]`]: value[i] } as Record<
            string,
            unknown
          >)
          if (nestedErr) return nestedErr
        }
      } else {
        return `Parameter "${key}" contains a nested object. Only primitive values (string, number, boolean, null) and arrays of primitives are allowed. Received object of type "${type}".`
      }
    }
  }
  return null
}

export const ExecuteTool = buildTool({
  name: EXECUTE_TOOL_NAME,
  searchHint: 'execute run invoke call a deferred tool by name with parameters',
  maxResultSizeChars: 100_000,
  isConcurrencySafe() {
    return false
  },
  get inputSchema(): InputSchema {
    return inputSchema()
  },
  get outputSchema(): OutputSchema {
    return outputSchema()
  },
  async description() {
    return DESCRIPTION
  },
  async prompt() {
    return getPrompt()
  },
  async call(input, context, canUseTool, parentMessage, onProgress) {
    const tools: Tools = context.options.tools ?? []

    const targetTool = findToolByName(tools, input.tool_name)
    if (!targetTool) {
      return {
        data: {
          result: null,
          tool_name: input.tool_name,
        },
        newMessages: [
          createUserMessage({
            content: `Tool "${input.tool_name}" not found. Use SearchExtraTools to discover available tools.`,
          }),
        ],
      }
    }

    // Validate input using targetTool's inputSchema if available — provides specific, model-friendly error messages
    if (targetTool.inputSchema) {
      try {
        const schema = targetTool.inputSchema as any
        const parseResult =
          schema.safeParse?.(input.params) || schema.safeParse(input.params)
        if (parseResult && !parseResult.success) {
          // Convert zod validation errors to model-friendly messages
          const errorMessages = parseResult.error.issues.map((issue: any) => {
            const path = issue.path?.length ? issue.path.join('.') : 'root'
            // For type/enum errors, make them more explicit for the model
            if (issue.code === 'invalid_enum_value') {
              const expected = issue.options
                ?.map((o: any) => `"${o}"`)
                .join(' or ')
              const received =
                issue.received === 'undefined'
                  ? 'undefined (missing field)'
                  : typeof issue.received === 'object'
                    ? 'an object (e.g., {"type": "..."}). Did you confuse the JSON schema description with the actual value?'
                    : JSON.stringify(issue.received)
              return `Field '${path}': Invalid enum value. Expected ${expected}, but received ${received}.`
            }
            if (issue.code === 'invalid_type') {
              const expected = issue.expected
              const received =
                typeof issue.received === 'object'
                  ? 'an object. Did you confuse the JSON schema description (e.g., {"status": {"type": "complete"}}) with the actual value (e.g., {"status": "complete"})?'
                  : typeof issue.received
              return `Field '${path}': Expected type ${expected}, but received ${received}.`
            }
            return `Field '${path}': ${issue.message}`
          })

          return {
            data: {
              result: null,
              tool_name: input.tool_name,
            },
            newMessages: [
              createUserMessage({
                content: `Invalid parameters for tool "${input.tool_name}": ${errorMessages.join(
                  '; ',
                )}. Please ensure parameters match the tool's expected schema exactly (e.g., {"status": "complete"}, not {"status": {"type": "complete"}}).`,
              }),
            ],
          }
        }
      } catch (err) {
        // If schema validation fails unexpectedly, fall back to validateParams or targetTool.validateInput
        // eslint-disable-next-line no-console
        console.error('ExecuteTool schema validation error:', err)
      }
    }

    // Fallback validateParams for cases where targetTool.inputSchema is not available or passed
    const paramError = validateParams(input.params)
    if (paramError) {
      return {
        data: {
          result: null,
          tool_name: input.tool_name,
        },
        newMessages: [
          createUserMessage({
            content: `Parameter validation failed: ${paramError}. Ensure all params are primitive values (strings, numbers, booleans, null) or arrays of primitives.`,
          }),
        ],
      }
    }

    // Guard: block execution of undiscovered deferred tools.
    // When tool search is active, deferred tools must be discovered via
    // SearchExtraTools first so the model has seen their schemas and knows
    // the correct parameters.  Executing an undiscovered tool almost always
    // fails with parameter validation errors.
    if (
      isSearchExtraToolsEnabledOptimistic() &&
      isSearchExtraToolsToolAvailable(tools) &&
      isDeferredTool(targetTool)
    ) {
      const discovered = extractDiscoveredToolNames(context.messages)
      if (!discovered.has(input.tool_name)) {
        return {
          data: {
            result: null,
            tool_name: input.tool_name,
          },
          newMessages: [
            createUserMessage({
              content: `Tool "${input.tool_name}" has not been discovered yet. You must first use SearchExtraTools to discover this tool before executing it.\n\nUsage: SearchExtraTools("select:${input.tool_name}")`,
            }),
          ],
        }
      }
    }

    // Check if the target tool is currently enabled
    if (!targetTool.isEnabled()) {
      return {
        data: {
          result: null,
          tool_name: input.tool_name,
        },
        newMessages: [
          createUserMessage({
            content: `工具 "${input.tool_name}" 当前不可用：Remote Control 未连接。`,
          }),
        ],
      }
    }

    // Validate input before delegating — prevents crashes when the model
    // omits required params (e.g. TeamCreate without team_name →
    // sanitizeName(undefined).replace() TypeError).
    if (targetTool.validateInput) {
      const validation = await targetTool.validateInput(
        input.params as Record<string, unknown>,
        context,
      )
      if (!validation.result) {
        return {
          data: {
            result: null,
            tool_name: input.tool_name,
          },
          newMessages: [
            createUserMessage({
              content: `Invalid parameters for tool "${input.tool_name}": ${validation.message}`,
            }),
          ],
        }
      }
    }

    // Check permissions on the target tool
    const permResult = await targetTool.checkPermissions?.(
      input.params as Record<string, unknown>,
      context,
    )
    if (permResult && permResult.behavior === 'deny') {
      return {
        data: {
          result: null,
          tool_name: input.tool_name,
        },
        newMessages: [
          createUserMessage({
            content: `Permission denied for tool "${input.tool_name}": ${permResult.message ?? 'Permission denied'}`,
          }),
        ],
      }
    }

    // Delegate execution to the target tool
    const targetResult: ToolResult<unknown> = await targetTool.call(
      input.params as Record<string, unknown>,
      context,
      canUseTool,
      parentMessage,
      onProgress,
    )

    return {
      ...targetResult,
      data: {
        result: targetResult.data,
        tool_name: input.tool_name,
      },
    }
  },
  async checkPermissions() {
    return {
      behavior: 'passthrough',
      message: 'ExecuteExtraTool delegates permission to the target tool.',
    }
  },
  renderToolUseMessage(input) {
    return `${input.tool_name}`
  },
  userFacingName() {
    return 'ExecuteExtraTool'
  },
  mapToolResultToToolResultBlockParam(content, toolUseID) {
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: JSON.stringify(content),
    }
  },
} satisfies ToolDef<InputSchema, Output>)
