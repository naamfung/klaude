import { describe, expect, test } from 'bun:test'
import {
  stripDisplayTags,
  stripDisplayTagsAllowEmpty,
  stripIdeContextTags,
  stripThinkingTags,
} from '../displayTags'

describe('stripDisplayTags', () => {
  test('strips a single system tag and returns remaining text', () => {
    expect(
      stripDisplayTags('<system-reminder>secret stuff</system-reminder>text'),
    ).toBe('text')
  })

  test('strips multiple tags and preserves text between them', () => {
    const input =
      '<hook-output>data</hook-output>hello <task-info>info</task-info>world'
    expect(stripDisplayTags(input)).toBe('hello world')
  })

  test('preserves uppercase JSX component names', () => {
    expect(stripDisplayTags('fix the <Button> layout')).toBe(
      'fix the <Button> layout',
    )
  })

  test('preserves angle brackets in prose (when x < y)', () => {
    expect(stripDisplayTags('when x < y')).toBe('when x < y')
  })

  test('preserves DOCTYPE declarations', () => {
    expect(stripDisplayTags('<!DOCTYPE html>')).toBe('<!DOCTYPE html>')
  })

  test('returns original text when stripping would result in empty', () => {
    const input = '<system-reminder>all tags</system-reminder>'
    expect(stripDisplayTags(input)).toBe(input)
  })

  test('strips tags with attributes', () => {
    expect(stripDisplayTags('<context type="ide">data</context>hello')).toBe(
      'hello',
    )
  })

  test('handles multi-line tag content', () => {
    const input = '<info>\nline1\nline2\n</info>remaining'
    expect(stripDisplayTags(input)).toBe('remaining')
  })

  test('returns trimmed result', () => {
    expect(stripDisplayTags('  <tag>content</tag>  hello  ')).toBe('hello')
  })

  test('handles empty string input', () => {
    // Empty string is falsy, so stripDisplayTags returns original
    expect(stripDisplayTags('')).toBe('')
  })

  test('handles whitespace-only input', () => {
    // After trim, result is empty string which is falsy, returns original
    expect(stripDisplayTags('   ')).toBe('   ')
  })
})

describe('stripDisplayTagsAllowEmpty', () => {
  test('returns empty string when all content is tags', () => {
    expect(
      stripDisplayTagsAllowEmpty('<system-reminder>stuff</system-reminder>'),
    ).toBe('')
  })

  test('strips tags and returns remaining text', () => {
    expect(stripDisplayTagsAllowEmpty('<tag>content</tag>hello')).toBe('hello')
  })

  test('returns empty string for empty input', () => {
    expect(stripDisplayTagsAllowEmpty('')).toBe('')
  })

  test('returns empty string for whitespace-only content after strip', () => {
    expect(stripDisplayTagsAllowEmpty('<tag>content</tag>  ')).toBe('')
  })
})

describe('stripIdeContextTags', () => {
  test('strips ide_opened_file tags', () => {
    expect(
      stripIdeContextTags(
        '<ide_opened_file>path/to/file.ts</ide_opened_file>hello',
      ),
    ).toBe('hello')
  })

  test('strips ide_selection tags', () => {
    expect(
      stripIdeContextTags('<ide_selection>selected code</ide_selection>world'),
    ).toBe('world')
  })

  test('strips ide tags with attributes', () => {
    expect(
      stripIdeContextTags(
        '<ide_opened_file path="foo.ts">content</ide_opened_file>text',
      ),
    ).toBe('text')
  })

  test('preserves other lowercase tags', () => {
    expect(
      stripIdeContextTags('<system-reminder>data</system-reminder>hello'),
    ).toBe('<system-reminder>data</system-reminder>hello')
  })

  test('preserves user-typed HTML like <code>', () => {
    expect(stripIdeContextTags('use <code>foo</code> here')).toBe(
      'use <code>foo</code> here',
    )
  })

  test('strips only IDE tags while preserving other tags and text', () => {
    const input =
      '<ide_opened_file>f.ts</ide_opened_file><system-reminder>x</system-reminder>text'
    expect(stripIdeContextTags(input)).toBe(
      '<system-reminder>x</system-reminder>text',
    )
  })
})

describe('stripThinkingTags', () => {
  test('strips closed <think> tags and preserves remaining text', () => {
    expect(
      stripThinkingTags('<think>internal reasoning</think>actual response'),
    ).toBe('actual response')
  })

  test('strips closed <thinking> tags and preserves remaining text', () => {
    expect(
      stripThinkingTags(
        '<thinking>internal reasoning</thinking>actual response',
      ),
    ).toBe('actual response')
  })

  test('strips unclosed trailing <think> tag (streaming interruption)', () => {
    // When the entire content is an unclosed think tag (no actual response
    // after it), the original text is returned as a fallback.
    expect(stripThinkingTags('<think>reasoning that never closes')).toBe(
      '<think>reasoning that never closes',
    )
  })

  test('strips unclosed trailing <think> tag, preserving preceding content', () => {
    // When there is actual content before the unclosed think tag, only the
    // think tag is stripped and the preceding content is returned.
    expect(
      stripThinkingTags('actual response<think>reasoning that never closes'),
    ).toBe('actual response')
  })

  test('strips unclosed trailing <thinking> tag', () => {
    // After removing the unclosed tag, result is empty, so original is returned
    expect(stripThinkingTags('<thinking>reasoning unclosed')).toBe(
      '<thinking>reasoning unclosed',
    )
  })

  test('handles multi-line think content', () => {
    const input = '<think>\nline1\nline2\nline3\n</think>\nvisible output'
    expect(stripThinkingTags(input)).toBe('visible output')
  })

  test('handles think tags with attributes', () => {
    expect(
      stripThinkingTags('<think type="reasoning">reasoning</think>response'),
    ).toBe('response')
  })

  test('handles multiple think blocks', () => {
    const input = '<think>first</think>middle<think>second</think>end'
    expect(stripThinkingTags(input)).toBe('middleend')
  })

  test('preserves text when no think tags present', () => {
    expect(stripThinkingTags('just regular text')).toBe('just regular text')
  })

  test('returns original text when stripping would result in empty', () => {
    const input = '<think>only thinking, no answer</think>'
    expect(stripThinkingTags(input)).toBe(input)
  })

  test('handles case-insensitive tag names', () => {
    expect(stripThinkingTags('<THINK>reasoning</THINK>response')).toBe(
      'response',
    )
  })

  test('handles mixed think and thinking tags', () => {
    const input =
      '<think>first reasoning</think>visible<thinking>second reasoning</thinking>output'
    expect(stripThinkingTags(input)).toBe('visibleoutput')
  })

  test('trims whitespace around result', () => {
    expect(stripThinkingTags('  <think>reasoning</think>  response  ')).toBe(
      'response',
    )
  })

  test('handles empty string input', () => {
    expect(stripThinkingTags('')).toBe('')
  })

  test('handles real-world leaked away-summary content', () => {
    // Simulates the actual leaked content from the bug report: model outputs
    // chain-of-thought inside <think> tags followed by the actual summary.
    const leaked =
      '<think>\n  1. **分析用户请求**：用户希望...\n  2. **回顾上下文**：之前已经...\n  6. **最終輸出生成**。\n  </think>\n\n  您正在調查壓縮上下文結束後出現異常符號並可能引發模型遞歸生成死循環的問題，並懷疑服務端的上下文截斷邏輯存在缺陷。'
    const result = stripThinkingTags(leaked)
    expect(result).not.toContain('<think>')
    expect(result).not.toContain('</think>')
    expect(result).toContain('您正在調查壓縮上下文')
  })
})
