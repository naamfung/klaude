import { afterAll, describe, test, expect, mock, beforeEach } from 'bun:test'
import { homedir } from 'node:os'
import { join } from 'node:path'

// ── Mock infrastructure ─────────────────────────────────────────────────────
// All mock.module calls must precede the import of the module under test.
// mock.module is process-global; mocks here must cover all exported names used
// transitively so sibling test files are not broken by an incomplete mock.
//
// To prevent cross-file pollution (providers.test.ts, model.test.ts, skill
// prefetch / skillLearning smoke), keep the mock factory inline (don't
// pre-import real modules — that triggers heavy transitive deps and hangs
// some test combinations). The flag below switches off the suite-specific
// override after this file's tests finish.
let useMockForMagicDocs = true
afterAll(() => {
  useMockForMagicDocs = false
})

// Inline a minimum env-driven default-model resolver so other test files
// (getDefaultOpusModel.test.ts) which assert env-var precedence still work
// even after our flag is off. The real getDefaultOpusModel reads provider
// env vars; we mirror that minimal logic here. Keep aligned with
// src/utils/model/model.ts's getDefaultOpusModel().
function resolveDefaultOpusModelForTests(): string {
  // Highest priority: provider-specific env override.
  if (process.env.KLAUDE_CODE_USE_OPENAI === '1') {
    if (process.env.OPENAI_DEFAULT_OPUS_MODEL)
      return process.env.OPENAI_DEFAULT_OPUS_MODEL
  }
  if (process.env.KLAUDE_CODE_USE_GEMINI === '1') {
    if (process.env.GEMINI_DEFAULT_OPUS_MODEL)
      return process.env.GEMINI_DEFAULT_OPUS_MODEL
  }
  // Cross-provider override.
  if (process.env.ANTHROPIC_DEFAULT_OPUS_MODEL)
    return process.env.ANTHROPIC_DEFAULT_OPUS_MODEL
  // Provider-specific Opus 4.7 IDs (must match
  // src/utils/model/configs.ts KLAUDE_OPUS_4_7_CONFIG).
  if (process.env.KLAUDE_CODE_USE_BEDROCK === '1')
    return 'us.anthropic.klaude-opus-4-7-v1'
  if (process.env.KLAUDE_CODE_USE_VERTEX === '1') return 'klaude-opus-4-7'
  if (process.env.KLAUDE_CODE_USE_FOUNDRY === '1') return 'klaude-opus-4-7'
  return 'klaude-opus-4-7'
}

const mockGetMainLoopModel = mock(() => 'klaude-opus-4-7')
const mockGetDisplayedEffortLevel = mock((): string => 'high')

const realIsEnvTruthy = (v: string | boolean | undefined): boolean => {
  if (!v) return false
  if (typeof v === 'boolean') return v
  return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase().trim())
}

// Inline the real firstPartyNameToCanonical logic so its semantics survive
// even after this suite's mock wins the registration race. Pre-importing
// model.ts hangs the test process due to heavy transitive deps, so we
// duplicate just this one pure function. Keep in sync with
// src/utils/model/model.ts.
function realFirstPartyNameToCanonical(name: string): string {
  name = name.toLowerCase()
  // Normalize 3P provider format: replace klaude- with klaude-
  name = name.replace(/klaude-/g, 'klaude-')
  if (name.includes('klaude-opus-4-7')) return 'klaude-opus-4-7'
  if (name.includes('klaude-opus-4-6')) return 'klaude-opus-4-6'
  if (name.includes('klaude-opus-4-5')) return 'klaude-opus-4-5'
  if (name.includes('klaude-opus-4-1')) return 'klaude-opus-4-1'
  if (name.includes('klaude-opus-4')) return 'klaude-opus-4'
  if (name.includes('klaude-sonnet-4-6')) return 'klaude-sonnet-4-6'
  if (name.includes('klaude-sonnet-4-5')) return 'klaude-sonnet-4-5'
  if (name.includes('klaude-sonnet-4')) return 'klaude-sonnet-4'
  if (name.includes('klaude-haiku-4-5')) return 'klaude-haiku-4-5'
  if (name.includes('klaude-3-7-sonnet')) return 'klaude-3-7-sonnet'
  if (name.includes('klaude-3-5-sonnet')) return 'klaude-3-5-sonnet'
  if (name.includes('klaude-3-5-haiku')) return 'klaude-3-5-haiku'
  if (name.includes('klaude-3-opus')) return 'klaude-3-opus'
  if (name.includes('klaude-3-sonnet')) return 'klaude-3-sonnet'
  if (name.includes('klaude-3-haiku')) return 'klaude-3-haiku'
  const m = name.match(/(klaude-(\d+-\d+-)?\w+)/)
  if (m && m[1]) return m[1]
  return name
}

mock.module('src/utils/model/model.js', () => ({
  getMainLoopModel: mockGetMainLoopModel,
  getSmallFastModel: mock(() => 'klaude-haiku'),
  getUserSpecifiedModelSetting: mock(() => undefined),
  getBestModel: mock(() => 'klaude-opus-4-7'),
  // Read env at call time so getDefaultOpusModel.test.ts (running in the same
  // process) sees env-driven semantics. While useMockForMagicDocs is true
  // (during this suite) we still want a stable default; otherwise we mirror
  // the real env-precedence logic.
  getDefaultOpusModel: mock(() =>
    useMockForMagicDocs ? 'klaude-opus-4-7' : resolveDefaultOpusModelForTests(),
  ),
  getDefaultSonnetModel: mock(() => 'klaude-sonnet-4-6'),
  getDefaultHaikuModel: mock(() => 'klaude-haiku-3-5'),
  getRuntimeMainLoopModel: mock(() => 'klaude-opus-4-7'),
  getDefaultMainLoopModelSetting: mock(() => 'klaude-opus-4-7'),
  getDefaultMainLoopModel: mock(() => 'klaude-opus-4-7'),
  // Real semantics inlined for firstPartyNameToCanonical so model.test.ts
  // (which only checks pure-function input/output) passes without needing
  // the heavy real-module load.
  firstPartyNameToCanonical: mock((n: string) =>
    realFirstPartyNameToCanonical(n),
  ),
  getCanonicalName: mock((n: string) => n),
  getKlaudeAiUserDefaultModelDescription: mock(() => ''),
  renderDefaultModelSetting: mock(() => ''),
  getOpusPricingSuffix: mock(() => ''),
  isOpus1mMergeEnabled: mock(() => false),
  renderModelSetting: mock((s: string) => s),
  getPublicModelDisplayName: mock(() => null),
  renderModelName: mock((n: string) => n),
  getPublicModelName: mock((n: string) => n),
  parseUserSpecifiedModel: mock((m: string) => m),
  resolveSkillModelOverride: mock(() => undefined),
  isLegacyModelRemapEnabled: mock(() => false),
  modelDisplayString: mock(() => ''),
  getMarketingNameForModel: mock(() => undefined),
  normalizeModelStringForAPI: mock((m: string) => m),
  isNonCustomOpusModel: mock(() => false),
}))

mock.module('src/utils/effort.js', () => ({
  getDisplayedEffortLevel: mockGetDisplayedEffortLevel as (
    _m: string,
    _e: unknown,
  ) => string,
  getEffortEnvOverride: mock(() => undefined),
  resolveAppliedEffort: mock(() => 'high'),
  getInitialEffortSetting: mock(() => undefined),
  parseEffortValue: mock(() => undefined),
  toPersistableEffort: mock(() => undefined),
  modelSupportsEffort: mock(() => true),
  modelSupportsMaxEffort: mock(() => true),
  modelSupportsXhighEffort: mock(() => false),
  isEffortLevel: mock(() => true),
  getEffortSuffix: mock(() => ''),
  convertEffortValueToLevel: mock(() => 'high'),
  getDefaultEffortForModel: mock(() => undefined),
  getEffortLevelDescription: mock(() => ''),
  getEffortValueDescription: mock(() => ''),
  getOpusDefaultEffortConfig: mock(() => ({
    enabled: true,
    dialogTitle: '',
    dialogDescription: '',
  })),
  resolvePickerEffortPersistence: mock(() => undefined),
  isValidNumericEffort: mock(() => false),
  EFFORT_LEVELS: ['low', 'medium', 'high', 'xhigh', 'max'],
}))

// Use REAL semantics for non-overridden envUtils exports — this mock is
// process-global, so envUtils.test.ts and other consumers running in the
// same process must see correct behavior for hasNodeOption, isBareMode,
// parseEnvVars, getVertexRegionForModel, etc. Only getKlaudeConfigHomeDir
// is overridden to '/mock/home/.klaude' while this suite runs.
const realIsEnvDefinedFalsy = (v: string | boolean | undefined): boolean => {
  if (v === undefined) return false
  if (typeof v === 'boolean') return !v
  if (!v) return false
  return ['0', 'false', 'no', 'off'].includes(v.toLowerCase().trim())
}
const realDefaultVertexRegion = (): string =>
  process.env.CLOUD_ML_REGION || 'us-east5'
const VERTEX_REGION_OVERRIDES: ReadonlyArray<[string, string]> = [
  ['klaude-haiku-4-5', 'VERTEX_REGION_KLAUDE_HAIKU_4_5'],
  ['klaude-3-5-haiku', 'VERTEX_REGION_KLAUDE_3_5_HAIKU'],
  ['klaude-3-5-sonnet', 'VERTEX_REGION_KLAUDE_3_5_SONNET'],
  ['klaude-3-7-sonnet', 'VERTEX_REGION_KLAUDE_3_7_SONNET'],
  ['klaude-opus-4-1', 'VERTEX_REGION_KLAUDE_4_1_OPUS'],
  ['klaude-opus-4', 'VERTEX_REGION_KLAUDE_4_0_OPUS'],
  ['klaude-sonnet-4-6', 'VERTEX_REGION_KLAUDE_4_6_SONNET'],
  ['klaude-sonnet-4-5', 'VERTEX_REGION_KLAUDE_4_5_SONNET'],
  ['klaude-sonnet-4', 'VERTEX_REGION_KLAUDE_4_0_SONNET'],
]

// Real getKlaudeConfigHomeDir is memoized via lodash, so consumers may call
// `.cache.clear()` on it. Provide a no-op .cache stub.
const mockedGetKlaudeConfigHomeDirMD: (() => string) & {
  cache: { clear: () => void; get: (k: unknown) => unknown }
} = Object.assign(
  () =>
    useMockForMagicDocs
      ? '/mock/home/.klaude'
      : (process.env.KLAUDE_CONFIG_DIR ?? join(homedir(), '.klaude')).normalize(
          'NFC',
        ),
  { cache: { clear: () => {}, get: (_k: unknown) => undefined } },
)

mock.module('src/utils/envUtils.js', () => ({
  getKlaudeConfigHomeDir: mockedGetKlaudeConfigHomeDirMD,
  isEnvTruthy: realIsEnvTruthy,
  getEnvBool: () => false,
  getEnvNumber: () => undefined,
  getVertexRegionForModel: (model: string | undefined) => {
    if (model) {
      const match = VERTEX_REGION_OVERRIDES.find(([prefix]) =>
        model.startsWith(prefix),
      )
      if (match) {
        return process.env[match[1]] || realDefaultVertexRegion()
      }
    }
    return realDefaultVertexRegion()
  },
  getTeamsDir: () =>
    join(
      useMockForMagicDocs
        ? '/mock/home/.klaude'
        : (process.env.KLAUDE_CONFIG_DIR ?? join(homedir(), '.klaude')),
      'teams',
    ),
  hasNodeOption: (flag: string) => {
    const opts = process.env.NODE_OPTIONS
    return !!opts && opts.split(/\s+/).includes(flag)
  },
  isEnvDefinedFalsy: realIsEnvDefinedFalsy,
  isBareMode: () =>
    realIsEnvTruthy(process.env.KLAUDE_CODE_SIMPLE) ||
    process.argv.includes('--bare'),
  parseEnvVars: (rawEnvArgs: string[] | undefined) => {
    const parsed: Record<string, string> = {}
    if (rawEnvArgs) {
      for (const envStr of rawEnvArgs) {
        const [key, ...valueParts] = envStr.split('=')
        if (!key || valueParts.length === 0) {
          throw new Error(
            `Invalid environment variable format: ${envStr}, environment variables should be added as: -e KEY1=value1 -e KEY2=value2`,
          )
        }
        parsed[key] = valueParts.join('=')
      }
    }
    return parsed
  },
  getAWSRegion: () =>
    process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
  getDefaultVertexRegion: realDefaultVertexRegion,
  shouldMaintainProjectWorkingDir: () =>
    realIsEnvTruthy(process.env.KLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR),
  isRunningOnHomespace: () =>
    process.env.USER_TYPE === 'ant' &&
    realIsEnvTruthy(process.env.COO_RUNNING_ON_HOMESPACE),
  isInProtectedNamespace: () => false,
}))

// Mock the file system so loadMagicDocsPrompt() returns our controlled template
const mockReadFile = mock(
  async (_path: string, _opts?: unknown): Promise<string> => {
    throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
  },
)

// IMPORTANT: this file used to mock fsOperations wholesale (readdir → [],
// exists → false, …), which silently broke sibling tests that walk
// .klaude/skills (skill prefetch, skillLearning smoke). After this suite
// finishes (useMockForMagicDocs flips to false), construct a minimal real
// fs adapter inline using node:fs/promises so cross-file consumers see real
// disk state — without pre-importing the heavy fsOperations module (its
// transitive deps stall bun:test). Avoid require()ing the real module
// inside the factory: that re-enters the same mock and infinite-loops.
import { promises as nodeFs, existsSync as nodeExistsSync } from 'node:fs'

const realFsAdapter = {
  cwd: () => process.cwd(),
  existsSync: (p: string) => nodeExistsSync(p),
  stat: (p: string) => nodeFs.stat(p),
  lstat: (p: string) => nodeFs.lstat(p),
  readdir: (p: string) => nodeFs.readdir(p, { withFileTypes: true }),
  unlink: (p: string) => nodeFs.unlink(p),
  rmdir: (p: string) => nodeFs.rmdir(p),
  rm: (p: string, options?: { recursive?: boolean; force?: boolean }) =>
    nodeFs.rm(p, options),
  mkdir: (p: string, options?: { recursive?: boolean }) =>
    nodeFs.mkdir(p, options),
  readFile: (
    p: string,
    options?: BufferEncoding | { encoding?: BufferEncoding },
  ) => {
    const encoding =
      typeof options === 'string' ? options : (options?.encoding ?? undefined)
    return nodeFs.readFile(p, encoding)
  },
  writeFile: (p: string, data: string | Uint8Array) =>
    nodeFs.writeFile(p, data),
  rename: (oldPath: string, newPath: string) => nodeFs.rename(oldPath, newPath),
  open: (p: string, flags: string | number) => nodeFs.open(p, flags),
  realpath: (p: string) => nodeFs.realpath(p),
}

mock.module('src/utils/fsOperations.js', () => ({
  getFsImplementation: () =>
    useMockForMagicDocs
      ? ({
          readFile: mockReadFile,
          writeFile: mock(async () => {}),
          exists: mock(async () => false),
          mkdir: mock(async () => {}),
          readdir: mock(async () => []),
          stat: mock(async () => ({})),
          unlink: mock(async () => {}),
        } as unknown)
      : (realFsAdapter as unknown),
}))

// ── Import module under test (after all mock.module calls) ──────────────────
import { buildMagicDocsUpdatePrompt } from '../prompts.js'

// ── Tests ───────────────────────────────────────────────────────────────────

describe('buildMagicDocsUpdatePrompt – dynamic variable substitution', () => {
  beforeEach(() => {
    mockGetMainLoopModel.mockReturnValue('klaude-opus-4-7')
    mockGetDisplayedEffortLevel.mockReturnValue('high')
    mockReadFile.mockImplementation(async () => {
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })
  })

  test('substitutes {{KLAUDE_MODEL}} with the current model', async () => {
    mockReadFile.mockImplementation(async () => 'Model: {{KLAUDE_MODEL}}')
    mockGetMainLoopModel.mockReturnValue('klaude-opus-4-7')

    const result = await buildMagicDocsUpdatePrompt(
      'contents',
      '/doc.md',
      'Title',
    )
    expect(result).toContain('Model: klaude-opus-4-7')
    expect(result).not.toContain('{{KLAUDE_MODEL}}')
  })

  test('substitutes {{KLAUDE_EFFORT}} with the current effort level', async () => {
    mockReadFile.mockImplementation(async () => 'Effort: {{KLAUDE_EFFORT}}')
    mockGetDisplayedEffortLevel.mockReturnValue('high')

    const result = await buildMagicDocsUpdatePrompt(
      'contents',
      '/doc.md',
      'Title',
    )
    expect(result).toContain('Effort: high')
    expect(result).not.toContain('{{KLAUDE_EFFORT}}')
  })

  test('substitutes {{KLAUDE_CWD}} with process.cwd()', async () => {
    mockReadFile.mockImplementation(async () => 'CWD: {{KLAUDE_CWD}}')

    const result = await buildMagicDocsUpdatePrompt(
      'contents',
      '/doc.md',
      'Title',
    )
    expect(result).toContain(`CWD: ${process.cwd()}`)
    expect(result).not.toContain('{{KLAUDE_CWD}}')
  })

  test('substitutes all three dynamic variables in one template', async () => {
    mockReadFile.mockImplementation(
      async () =>
        'effort={{KLAUDE_EFFORT}} model={{KLAUDE_MODEL}} cwd={{KLAUDE_CWD}}',
    )
    mockGetMainLoopModel.mockReturnValue('klaude-sonnet-4-6')
    mockGetDisplayedEffortLevel.mockReturnValue('medium')

    const result = await buildMagicDocsUpdatePrompt(
      'contents',
      '/doc.md',
      'Title',
    )
    expect(result).toContain('effort=medium')
    expect(result).toContain('model=klaude-sonnet-4-6')
    expect(result).toContain(`cwd=${process.cwd()}`)
  })

  test('leaves unknown template variables unchanged', async () => {
    mockReadFile.mockImplementation(
      async () => '{{UNKNOWN_VAR}} {{KLAUDE_MODEL}}',
    )
    mockGetMainLoopModel.mockReturnValue('klaude-opus-4-7')

    const result = await buildMagicDocsUpdatePrompt(
      'contents',
      '/doc.md',
      'Title',
    )
    expect(result).toContain('{{UNKNOWN_VAR}}')
    expect(result).toContain('klaude-opus-4-7')
  })

  test('existing substitution variables still work alongside new ones', async () => {
    mockReadFile.mockImplementation(
      async () =>
        '{{docTitle}} effort={{KLAUDE_EFFORT}} model={{KLAUDE_MODEL}}',
    )
    mockGetMainLoopModel.mockReturnValue('klaude-haiku')
    mockGetDisplayedEffortLevel.mockReturnValue('low')

    const result = await buildMagicDocsUpdatePrompt(
      'contents',
      '/doc.md',
      'My Doc',
    )
    expect(result).toContain('My Doc')
    expect(result).toContain('effort=low')
    expect(result).toContain('model=klaude-haiku')
  })
})
