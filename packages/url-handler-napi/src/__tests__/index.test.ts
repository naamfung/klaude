import { afterEach, describe, expect, test } from 'bun:test'
import { waitForUrlEvent } from '../index'

const originalEnv = {
  KLAUDE_CODE_URL_EVENT: process.env.KLAUDE_CODE_URL_EVENT,
  KLAUDE_CODE_DEEP_LINK_URL: process.env.KLAUDE_CODE_DEEP_LINK_URL,
  KLAUDE_CODE_URL: process.env.KLAUDE_CODE_URL,
}
const originalArgv = process.argv.slice()

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
  process.argv = originalArgv.slice()
})

describe('waitForUrlEvent', () => {
  test('resolves to null without a timeout', async () => {
    await expect(waitForUrlEvent()).resolves.toBeNull()
  })

  test('resolves to null with an explicit timeout', async () => {
    await expect(waitForUrlEvent(1)).resolves.toBeNull()
  })

  test('returns a Klaude URL from environment variables', async () => {
    process.env.KLAUDE_CODE_URL_EVENT = 'klaude-cli://prompt?q=hello'

    await expect(waitForUrlEvent()).resolves.toBe('klaude-cli://prompt?q=hello')
  })

  test('returns a Klaude URL from argv', async () => {
    process.argv = [...originalArgv, 'klaude://prompt?q=hello']

    await expect(waitForUrlEvent()).resolves.toBe('klaude://prompt?q=hello')
  })

  test('rejects URLs exceeding the maximum length', async () => {
    process.env.KLAUDE_CODE_URL_EVENT = `klaude-cli://${'x'.repeat(2048)}`

    await expect(waitForUrlEvent()).resolves.toBeNull()
  })
})
