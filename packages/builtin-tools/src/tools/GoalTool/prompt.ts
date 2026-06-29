export const DESCRIPTION =
  'Get or update the active goal status. The model may only mark a goal as "complete" or "blocked".'

export function generatePrompt(): string {
  return `Use this tool to interact with the active thread goal.

## Actions

### get
Returns the current goal state (objective, status, token usage, elapsed time, turns executed).
No input required beyond \`action: "get"\`.

### update
Transition the goal to a terminal status. Only two values are accepted:
- **complete** — All requirements are verified (see Completion Audit below).
- **blocked** — An insurmountable obstacle has persisted for 3+ consecutive turns (see Blocked Audit below).

When marking complete, provide a brief \`reason\` summarising what was achieved.
When marking blocked, provide a \`reason\` describing the specific blocker.

## Completion Audit (required before marking complete)
1. Derive concrete requirements from the objective.
2. Preserve the original scope — do not redefine success around existing work.
3. For every requirement, identify authoritative evidence (test output, file content, command result).
4. Treat tests and manifests as evidence only after confirming they cover the requirement.
5. Treat uncertain or indirect evidence as "not achieved".
6. The audit must PROVE completion, not merely fail to find remaining work.

## Blocked Audit (required before marking blocked)
1. The same blocking condition must persist across at least 3 consecutive continuation turns.
2. "Difficult", "slow", or "partially incomplete" is NOT blocked.
3. Only genuinely insurmountable obstacles qualify (missing credentials, external service down, etc.).

## Important
- You cannot pause, resume, or clear a goal — only the user can do that via \`/goal\`.
- If no goal is active, \`get\` returns a message saying so; \`update\` returns an error.
- On completion, the tool result includes a usage report (tokens, time, turns).

## Parameter Format Examples (Crucial)

When updating a goal's status via ExecuteExtraTool or direct tool call, use **primitive values only**:

✅ **Correct:**
- To mark complete: \`{"status": "complete", "reason": "all tasks verified and tests pass"}\`
- To mark blocked: \`{"status": "blocked", "reason": "external service unavailable"}\`

❌ **Incorrect (DO NOT generate these):**
- \`{"status": {"type": "complete"}}\` — Do not generate JSON schema descriptions as values.
- \`{"status": {"enum": ["complete", "blocked"]}}\` — Do not copy schema structure into parameters.
- \`{"status": {"type": "string", "enum": ["complete"]}}\` — Only the actual primitive value is allowed.

The \`status\` field must be a direct string value: \`"complete"\` or \`"blocked"\`.
The \`reason\` field must be a direct string value or omitted (for complete status).
The \`action\` field, if used, must be \`"get"\` or \`"update"\`.

Do NOT wrap values in nested objects or schema descriptions. Only generate the actual parameter values.
`
}
