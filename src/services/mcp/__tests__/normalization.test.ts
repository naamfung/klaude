import { describe, expect, test } from 'bun:test'
import { normalizeNameForMCP } from '../normalization'

describe('normalizeNameForMCP', () => {
  test('returns simple valid name unchanged', () => {
    expect(normalizeNameForMCP('my-server')).toBe('my-server')
  })

  test('replaces dots with underscores', () => {
    expect(normalizeNameForMCP('my.server.name')).toBe('my_server_name')
  })

  test('replaces spaces with underscores', () => {
    expect(normalizeNameForMCP('my server')).toBe('my_server')
  })

  test('replaces special characters with underscores', () => {
    expect(normalizeNameForMCP('server@v2!')).toBe('server_v2_')
  })

  test('returns already valid name unchanged', () => {
    expect(normalizeNameForMCP('valid_name-123')).toBe('valid_name-123')
  })

  test('returns empty string for empty input', () => {
    expect(normalizeNameForMCP('')).toBe('')
  })

  test('handles klaude.ai prefix: collapses consecutive underscores and strips edges', () => {
    // "klaude.ai My Server" -> replace invalid -> "klaude_ai_My_Server"
    // starts with "klaude.ai " so collapse + strip -> "klaude_ai_My_Server"
    expect(normalizeNameForMCP('klaude.ai My Server')).toBe(
      'klaude_ai_My_Server',
    )
  })

  test('handles klaude.ai prefix with consecutive invalid chars', () => {
    // "klaude.ai ...test..." -> replace invalid -> "klaude_ai____test___"
    // collapse consecutive _ -> "klaude_ai_test_"
    // strip leading/trailing _ -> "klaude_ai_test"
    expect(normalizeNameForMCP('klaude.ai ...test...')).toBe('klaude_ai_test')
  })

  test('non-klaude.ai name preserves consecutive underscores', () => {
    // "a..b" -> "a__b", no klaude.ai prefix so no collapse
    expect(normalizeNameForMCP('a..b')).toBe('a__b')
  })

  test('non-klaude.ai name preserves trailing underscores', () => {
    expect(normalizeNameForMCP('name!')).toBe('name_')
  })

  test('handles klaude.ai prefix that results in only underscores', () => {
    // "klaude.ai ..." -> replace invalid -> "klaude_ai____"
    // collapse -> "klaude_ai_"
    // strip trailing -> "klaude_ai"
    expect(normalizeNameForMCP('klaude.ai ...')).toBe('klaude_ai')
  })
})
