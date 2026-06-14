// Content for the klaude-api bundled skill.
// Each .md file is inlined as a string at build time via Bun's text loader.

import csharpKlaudeApi from './klaude-api/csharp/klaude-api.md'
import curlExamples from './klaude-api/curl/examples.md'
import goKlaudeApi from './klaude-api/go/klaude-api.md'
import javaKlaudeApi from './klaude-api/java/klaude-api.md'
import phpKlaudeApi from './klaude-api/php/klaude-api.md'
import pythonAgentSdkPatterns from './klaude-api/python/agent-sdk/patterns.md'
import pythonAgentSdkReadme from './klaude-api/python/agent-sdk/README.md'
import pythonKlaudeApiBatches from './klaude-api/python/klaude-api/batches.md'
import pythonKlaudeApiFilesApi from './klaude-api/python/klaude-api/files-api.md'
import pythonKlaudeApiReadme from './klaude-api/python/klaude-api/README.md'
import pythonKlaudeApiStreaming from './klaude-api/python/klaude-api/streaming.md'
import pythonKlaudeApiToolUse from './klaude-api/python/klaude-api/tool-use.md'
import rubyKlaudeApi from './klaude-api/ruby/klaude-api.md'
import skillPrompt from './klaude-api/SKILL.md'
import sharedErrorCodes from './klaude-api/shared/error-codes.md'
import sharedLiveSources from './klaude-api/shared/live-sources.md'
import sharedModels from './klaude-api/shared/models.md'
import sharedPromptCaching from './klaude-api/shared/prompt-caching.md'
import sharedToolUseConcepts from './klaude-api/shared/tool-use-concepts.md'
import typescriptAgentSdkPatterns from './klaude-api/typescript/agent-sdk/patterns.md'
import typescriptAgentSdkReadme from './klaude-api/typescript/agent-sdk/README.md'
import typescriptKlaudeApiBatches from './klaude-api/typescript/klaude-api/batches.md'
import typescriptKlaudeApiFilesApi from './klaude-api/typescript/klaude-api/files-api.md'
import typescriptKlaudeApiReadme from './klaude-api/typescript/klaude-api/README.md'
import typescriptKlaudeApiStreaming from './klaude-api/typescript/klaude-api/streaming.md'
import typescriptKlaudeApiToolUse from './klaude-api/typescript/klaude-api/tool-use.md'

// @[MODEL LAUNCH]: Update the model IDs/names below. These are substituted into {{VAR}}
// placeholders in the .md files at runtime before the skill prompt is sent.
// After updating these constants, manually update the two files that still hardcode models:
//   - klaude-api/SKILL.md (Current Models pricing table)
//   - klaude-api/shared/models.md (full model catalog with legacy versions and alias mappings)
export const SKILL_MODEL_VARS = {
  OPUS_ID: 'klaude-opus-4-7',
  OPUS_NAME: 'Klaude Opus 4.7',
  SONNET_ID: 'klaude-sonnet-4-6',
  SONNET_NAME: 'Klaude Sonnet 4.6',
  HAIKU_ID: 'klaude-haiku-4-5',
  HAIKU_NAME: 'Klaude Haiku 4.5',
  // Previous Sonnet ID — used in "do not append date suffixes" example in SKILL.md.
  PREV_SONNET_ID: 'klaude-sonnet-4-5',
} satisfies Record<string, string>

export const SKILL_PROMPT: string = skillPrompt

export const SKILL_FILES: Record<string, string> = {
  'csharp/klaude-api.md': csharpKlaudeApi,
  'curl/examples.md': curlExamples,
  'go/klaude-api.md': goKlaudeApi,
  'java/klaude-api.md': javaKlaudeApi,
  'php/klaude-api.md': phpKlaudeApi,
  'python/agent-sdk/README.md': pythonAgentSdkReadme,
  'python/agent-sdk/patterns.md': pythonAgentSdkPatterns,
  'python/klaude-api/README.md': pythonKlaudeApiReadme,
  'python/klaude-api/batches.md': pythonKlaudeApiBatches,
  'python/klaude-api/files-api.md': pythonKlaudeApiFilesApi,
  'python/klaude-api/streaming.md': pythonKlaudeApiStreaming,
  'python/klaude-api/tool-use.md': pythonKlaudeApiToolUse,
  'ruby/klaude-api.md': rubyKlaudeApi,
  'shared/error-codes.md': sharedErrorCodes,
  'shared/live-sources.md': sharedLiveSources,
  'shared/models.md': sharedModels,
  'shared/prompt-caching.md': sharedPromptCaching,
  'shared/tool-use-concepts.md': sharedToolUseConcepts,
  'typescript/agent-sdk/README.md': typescriptAgentSdkReadme,
  'typescript/agent-sdk/patterns.md': typescriptAgentSdkPatterns,
  'typescript/klaude-api/README.md': typescriptKlaudeApiReadme,
  'typescript/klaude-api/batches.md': typescriptKlaudeApiBatches,
  'typescript/klaude-api/files-api.md': typescriptKlaudeApiFilesApi,
  'typescript/klaude-api/streaming.md': typescriptKlaudeApiStreaming,
  'typescript/klaude-api/tool-use.md': typescriptKlaudeApiToolUse,
}
