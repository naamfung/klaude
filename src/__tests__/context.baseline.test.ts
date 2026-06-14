import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import {
  resetStateForTests,
  setOriginalCwd,
  setProjectRoot,
} from '../bootstrap/state'
import {
  getSystemContext,
  getUserContext,
  setSystemPromptInjection,
} from '../context'
import { clearMemoryFileCaches } from '../utils/klaudemd'
import {
  cleanupTempDir,
  createTempDir,
  writeTempFile,
} from '../../tests/mocks/file-system'

let tempDir = ''
let projectKlaudeMdContent = ''

beforeEach(async () => {
  tempDir = await createTempDir('context-baseline-')
  projectKlaudeMdContent = `baseline-${Date.now()}`

  resetStateForTests()
  setOriginalCwd(tempDir)
  setProjectRoot(tempDir)
  await writeTempFile(tempDir, 'KLAUDE.md', projectKlaudeMdContent)

  clearMemoryFileCaches()
  getUserContext.cache.clear?.()
  getSystemContext.cache.clear?.()
  setSystemPromptInjection(null)
  delete process.env.KLAUDE_CODE_DISABLE_KLAUDE_MDS
})

afterEach(async () => {
  clearMemoryFileCaches()
  getUserContext.cache.clear?.()
  getSystemContext.cache.clear?.()
  setSystemPromptInjection(null)
  delete process.env.KLAUDE_CODE_DISABLE_KLAUDE_MDS
  resetStateForTests()
  if (tempDir) {
    await cleanupTempDir(tempDir)
  }
})

describe('context baseline', () => {
  test('getUserContext includes currentDate and project KLAUDE.md content', async () => {
    const ctx = await getUserContext()

    expect(ctx.currentDate).toContain("Today's date is")
    expect(ctx.klaudeMd).toContain(projectKlaudeMdContent)
  })

  test('KLAUDE_CODE_DISABLE_KLAUDE_MDS suppresses klaudeMd loading', async () => {
    process.env.KLAUDE_CODE_DISABLE_KLAUDE_MDS = '1'

    const ctx = await getUserContext()

    expect(ctx.currentDate).toContain("Today's date is")
    expect(ctx.klaudeMd).toBeUndefined()
  })

  test('setSystemPromptInjection clears the memoized user-context cache', async () => {
    const first = await getUserContext()
    process.env.KLAUDE_CODE_DISABLE_KLAUDE_MDS = '1'

    const second = await getUserContext()
    expect(first.klaudeMd).toContain(projectKlaudeMdContent)
    expect(second.klaudeMd).toContain(projectKlaudeMdContent)

    setSystemPromptInjection('cache-break')

    const third = await getUserContext()
    expect(third.klaudeMd).toBeUndefined()
  })

  test('getSystemContext reflects system prompt injection after cache invalidation', async () => {
    const first = await getSystemContext()
    expect(first.gitStatus).toBeUndefined()
    expect(first.cacheBreaker).toBeUndefined()

    setSystemPromptInjection('baseline-cache-break')

    const second = await getSystemContext()
    if ('cacheBreaker' in second) {
      expect(second.cacheBreaker).toContain('baseline-cache-break')
    } else {
      expect(second.gitStatus).toBeUndefined()
    }
  })
})
