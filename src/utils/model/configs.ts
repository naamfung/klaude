import type { ModelName } from './model.js'
import type { APIProvider } from './providers.js'

export type ModelConfig = Record<APIProvider, ModelName>

// @[MODEL LAUNCH]: Add a new KLAUDE_*_CONFIG constant here. Double check the correct model strings
// here since the pattern may change.

export const KLAUDE_3_7_SONNET_CONFIG = {
  firstParty: 'klaude-3-7-sonnet-20250219',
  bedrock: 'us.anthropic.klaude-3-7-sonnet-20250219-v1:0',
  vertex: 'klaude-3-7-sonnet@20250219',
  foundry: 'klaude-3-7-sonnet',
  openai: 'klaude-3-7-sonnet-20250219',
  gemini: 'klaude-3-7-sonnet-20250219',
  grok: 'klaude-3-7-sonnet-20250219',
} as const satisfies ModelConfig

export const KLAUDE_3_5_V2_SONNET_CONFIG = {
  firstParty: 'klaude-3-5-sonnet-20241022',
  bedrock: 'anthropic.klaude-3-5-sonnet-20241022-v2:0',
  vertex: 'klaude-3-5-sonnet-v2@20241022',
  foundry: 'klaude-3-5-sonnet',
  openai: 'klaude-3-5-sonnet-20241022',
  gemini: 'klaude-3-5-sonnet-20241022',
  grok: 'klaude-3-5-sonnet-20241022',
} as const satisfies ModelConfig

export const KLAUDE_3_5_HAIKU_CONFIG = {
  firstParty: 'klaude-3-5-haiku-20241022',
  bedrock: 'us.anthropic.klaude-3-5-haiku-20241022-v1:0',
  vertex: 'klaude-3-5-haiku@20241022',
  foundry: 'klaude-3-5-haiku',
  openai: 'klaude-3-5-haiku-20241022',
  gemini: 'klaude-3-5-haiku-20241022',
  grok: 'klaude-3-5-haiku-20241022',
} as const satisfies ModelConfig

export const KLAUDE_HAIKU_4_5_CONFIG = {
  firstParty: 'klaude-haiku-4-5-20251001',
  bedrock: 'us.anthropic.klaude-haiku-4-5-20251001-v1:0',
  vertex: 'klaude-haiku-4-5@20251001',
  foundry: 'klaude-haiku-4-5',
  openai: 'klaude-haiku-4-5-20251001',
  gemini: 'klaude-haiku-4-5-20251001',
  grok: 'klaude-haiku-4-5-20251001',
} as const satisfies ModelConfig

export const KLAUDE_SONNET_4_CONFIG = {
  firstParty: 'klaude-sonnet-4-20250514',
  bedrock: 'us.anthropic.klaude-sonnet-4-20250514-v1:0',
  vertex: 'klaude-sonnet-4@20250514',
  foundry: 'klaude-sonnet-4',
  openai: 'klaude-sonnet-4-20250514',
  gemini: 'klaude-sonnet-4-20250514',
  grok: 'klaude-sonnet-4-20250514',
} as const satisfies ModelConfig

export const KLAUDE_SONNET_4_5_CONFIG = {
  firstParty: 'klaude-sonnet-4-5-20250929',
  bedrock: 'us.anthropic.klaude-sonnet-4-5-20250929-v1:0',
  vertex: 'klaude-sonnet-4-5@20250929',
  foundry: 'klaude-sonnet-4-5',
  openai: 'klaude-sonnet-4-5-20250929',
  gemini: 'klaude-sonnet-4-5-20250929',
  grok: 'klaude-sonnet-4-5-20250929',
} as const satisfies ModelConfig

export const KLAUDE_OPUS_4_CONFIG = {
  firstParty: 'klaude-opus-4-20250514',
  bedrock: 'us.anthropic.klaude-opus-4-20250514-v1:0',
  vertex: 'klaude-opus-4@20250514',
  foundry: 'klaude-opus-4',
  openai: 'klaude-opus-4-20250514',
  gemini: 'klaude-opus-4-20250514',
  grok: 'klaude-opus-4-20250514',
} as const satisfies ModelConfig

export const KLAUDE_OPUS_4_1_CONFIG = {
  firstParty: 'klaude-opus-4-1-20250805',
  bedrock: 'us.anthropic.klaude-opus-4-1-20250805-v1:0',
  vertex: 'klaude-opus-4-1@20250805',
  foundry: 'klaude-opus-4-1',
  openai: 'klaude-opus-4-1-20250805',
  gemini: 'klaude-opus-4-1-20250805',
  grok: 'klaude-opus-4-1-20250805',
} as const satisfies ModelConfig

export const KLAUDE_OPUS_4_5_CONFIG = {
  firstParty: 'klaude-opus-4-5-20251101',
  bedrock: 'us.anthropic.klaude-opus-4-5-20251101-v1:0',
  vertex: 'klaude-opus-4-5@20251101',
  foundry: 'klaude-opus-4-5',
  openai: 'klaude-opus-4-5-20251101',
  gemini: 'klaude-opus-4-5-20251101',
  grok: 'klaude-opus-4-5-20251101',
} as const satisfies ModelConfig

export const KLAUDE_OPUS_4_6_CONFIG = {
  firstParty: 'klaude-opus-4-6',
  bedrock: 'us.anthropic.klaude-opus-4-6-v1',
  vertex: 'klaude-opus-4-6',
  foundry: 'klaude-opus-4-6',
  openai: 'klaude-opus-4-6',
  gemini: 'klaude-opus-4-6',
  grok: 'klaude-opus-4-6',
} as const satisfies ModelConfig

export const KLAUDE_OPUS_4_7_CONFIG = {
  firstParty: 'klaude-opus-4-7',
  bedrock: 'us.anthropic.klaude-opus-4-7-v1',
  vertex: 'klaude-opus-4-7',
  foundry: 'klaude-opus-4-7',
  openai: 'klaude-opus-4-7',
  gemini: 'klaude-opus-4-7',
  grok: 'klaude-opus-4-7',
} as const satisfies ModelConfig

export const KLAUDE_SONNET_4_6_CONFIG = {
  firstParty: 'klaude-sonnet-4-6',
  bedrock: 'us.anthropic.klaude-sonnet-4-6',
  vertex: 'klaude-sonnet-4-6',
  foundry: 'klaude-sonnet-4-6',
  openai: 'klaude-sonnet-4-6',
  gemini: 'klaude-sonnet-4-6',
  grok: 'klaude-sonnet-4-6',
} as const satisfies ModelConfig

// @[MODEL LAUNCH]: Register the new config here.
export const ALL_MODEL_CONFIGS = {
  haiku35: KLAUDE_3_5_HAIKU_CONFIG,
  haiku45: KLAUDE_HAIKU_4_5_CONFIG,
  sonnet35: KLAUDE_3_5_V2_SONNET_CONFIG,
  sonnet37: KLAUDE_3_7_SONNET_CONFIG,
  sonnet40: KLAUDE_SONNET_4_CONFIG,
  sonnet45: KLAUDE_SONNET_4_5_CONFIG,
  sonnet46: KLAUDE_SONNET_4_6_CONFIG,
  opus40: KLAUDE_OPUS_4_CONFIG,
  opus41: KLAUDE_OPUS_4_1_CONFIG,
  opus45: KLAUDE_OPUS_4_5_CONFIG,
  opus46: KLAUDE_OPUS_4_6_CONFIG,
  opus47: KLAUDE_OPUS_4_7_CONFIG,
} as const satisfies Record<string, ModelConfig>

export type ModelKey = keyof typeof ALL_MODEL_CONFIGS

/** Union of all canonical first-party model IDs, e.g. 'klaude-opus-4-6' | 'klaude-sonnet-4-5-20250929' | … */
export type CanonicalModelId =
  (typeof ALL_MODEL_CONFIGS)[ModelKey]['firstParty']

/** Runtime list of canonical model IDs — used by comprehensiveness tests. */
export const CANONICAL_MODEL_IDS = Object.values(ALL_MODEL_CONFIGS).map(
  c => c.firstParty,
) as [CanonicalModelId, ...CanonicalModelId[]]

/** Map canonical ID → internal short key. Used to apply settings-based modelOverrides. */
export const CANONICAL_ID_TO_KEY: Record<CanonicalModelId, ModelKey> =
  Object.fromEntries(
    (Object.entries(ALL_MODEL_CONFIGS) as [ModelKey, ModelConfig][]).map(
      ([key, cfg]) => [cfg.firstParty, key],
    ),
  ) as Record<CanonicalModelId, ModelKey>
