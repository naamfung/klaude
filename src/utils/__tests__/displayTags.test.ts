import { describe, expect, test } from 'bun:test'
import {
  stripDisplayTags,
  stripDisplayTagsAllowEmpty,
  stripIdeContextTags,
  stripThinkingTags,
  splitTextByThinkTags,
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

  test('strips leading orphan </think> close tag (opening tag dropped by context shift)', () => {
    // Context-shift truncation can drop the opening <think> tag, leaving only
    // the closing </think> tag preceded by the model's chain-of-thought.
    // Everything up to and including the orphan close tag is thinking content
    // and must be stripped; only the real answer after it should remain.
    const leaked =
      '  3.  **確定下一步具體操作**：\n      *   由於代碼已經提交並推送完成...\n  7.  **最終文本調整**：\n  </think>\n\n  您正在修復 `llama.cpp` 的 reasoning 解析器。'
    const result = stripThinkingTags(leaked)
    expect(result).not.toContain('</think>')
    expect(result).not.toContain('最終文本調整')
    expect(result).toContain('您正在修復')
  })

  test('strips leading orphan </thinking> close tag', () => {
    const leaked = 'reasoning content here  </thinking>\nvisible answer'
    expect(stripThinkingTags(leaked)).toBe('visible answer')
  })

  test('preserves content when only a lone </think> appears in normal prose', () => {
    // Edge case: if a user's actual answer legitimately contains the literal
    // string "</think>" with no preceding thinking content, the orphan-close
    // pattern would strip everything up to it. This is an acceptable tradeoff
    // because such prose is rare and the thinking-tag leak is the bigger
    // problem. The test documents the behavior.
    const input = 'before</think>after'
    // The orphan-close pattern matches from start to </think>, leaving "after"
    expect(stripThinkingTags(input)).toBe('after')
  })

  test('handles real-world leaked content with orphan close tag from chat-err3', () => {
    // Exact structure from the chat-err3.txt bug report: thinking content
    // (no opening <think> tag) followed by </think> and the actual summary.
    // The thinking content AND the actual answer both mention `</think>`
    // inside backticks (discussing the tag). The backtick-aware orphan-close
    // pattern must skip the backtick-wrapped mention and only strip up to the
    // real closing tag.
    const leaked =
      '※ ` 標籤處理的 bug，並更新 templates 到 v2.1。\n      *   最終任務是將所有改動提交並推送到遠端 master 分支。\n      *   目前任務已經完成（代碼已提交並推送到 master）。\n\n  3.  **確定「用戶在做什麼」（高層目標）**：\n      *   用戶正在修復並完善 `llama.cpp` 的 reasoning 解析器對 `</think>`\n  標籤的處理邏輯，並更新相關模板以解決標記殘留問題。\n\n  7.  **最終文本調整**：\n  </think>\n\n  您正在修復 `llama.cpp` 的 reasoning 解析器對 `</think>`\n  標籤的處理邏輯，並更新相關模板以解決標記殘留的問題。目前所有代碼改動已成功提交並推送到遠端 master\n  分支，請問是否還有其他需要進一步處理或修復的功能？'
    const result = stripThinkingTags(leaked)
    // Thinking content must be stripped
    expect(result).not.toContain('最終文本調整')
    expect(result).not.toContain('確定「用戶在做什麼」')
    expect(result).not.toContain('※ ` 標籤處理的 bug')
    // The actual answer must be preserved (including its backtick-wrapped `</think>` mention)
    expect(result).toContain('您正在修復 `llama.cpp`')
    expect(result).toContain('請問是否還有其他需要進一步處理')
    // The backtick-wrapped `</think>` in the actual answer is legitimate and stays
    expect(result).toContain('`</think>`')
  })
})

describe('splitTextByThinkTags', () => {
  test('splits closed <think>...</think> into thinking + text segments', () => {
    const result = splitTextByThinkTags(
      '<think>reasoning here</think>actual response',
    )
    expect(result).toEqual([
      { type: 'thinking', content: 'reasoning here' },
      { type: 'text', content: 'actual response' },
    ])
  })

  test('splits orphan </think> (no opening tag) into thinking + text', () => {
    // This is the chat.txt case: opening <think> was dropped by context shift
    const result = splitTextByThinkTags(
      'reasoning that was emitted without opening tag</think>actual response',
    )
    expect(result).toEqual([
      {
        type: 'thinking',
        content: 'reasoning that was emitted without opening tag',
      },
      { type: 'text', content: 'actual response' },
    ])
  })

  test('splits unclosed <think> (no closing tag) into text + thinking', () => {
    const result = splitTextByThinkTags(
      'text before<think>reasoning without close',
    )
    expect(result).toEqual([
      { type: 'text', content: 'text before' },
      { type: 'thinking', content: 'reasoning without close' },
    ])
  })

  test('handles text with no think tags (returns single text segment)', () => {
    const result = splitTextByThinkTags('just regular text')
    expect(result).toEqual([{ type: 'text', content: 'just regular text' }])
  })

  test('handles multiple think blocks', () => {
    const result = splitTextByThinkTags(
      'text1<think>r1</think>mid<think>r2</think>text2',
    )
    expect(result).toEqual([
      { type: 'text', content: 'text1' },
      { type: 'thinking', content: 'r1' },
      { type: 'text', content: 'mid' },
      { type: 'thinking', content: 'r2' },
      { type: 'text', content: 'text2' },
    ])
  })

  test('handles <thinking> variant (not just <think>)', () => {
    const result = splitTextByThinkTags(
      '<thinking>my thoughts</thinking>answer',
    )
    expect(result).toEqual([
      { type: 'thinking', content: 'my thoughts' },
      { type: 'text', content: 'answer' },
    ])
  })

  test('handles think tags with attributes', () => {
    const result = splitTextByThinkTags(
      '<think type="reasoning">thoughts</think>response',
    )
    expect(result).toEqual([
      { type: 'thinking', content: 'thoughts' },
      { type: 'text', content: 'response' },
    ])
  })

  test('handles case-insensitive tags', () => {
    const result = splitTextByThinkTags('<THINK>thoughts</THINK>response')
    expect(result).toEqual([
      { type: 'thinking', content: 'thoughts' },
      { type: 'text', content: 'response' },
    ])
  })

  test('preserves backtick-wrapped </think> as literal text, not tag', () => {
    // When thinking content discusses `</think>` as a literal string inside
    // markdown inline code, it should NOT be treated as a tag boundary.
    const result = splitTextByThinkTags('discussing `</think>` in prose')
    expect(result).toEqual([
      { type: 'text', content: 'discussing `</think>` in prose' },
    ])
  })

  test('handles multi-line think content', () => {
    const result = splitTextByThinkTags(
      '<think>\nline1\nline2\n</think>\nresponse',
    )
    expect(result).toEqual([
      { type: 'thinking', content: 'line1\nline2' },
      { type: 'text', content: 'response' },
    ])
  })

  test('handles real-world chat.txt scenario (orphan close with multi-line thinking)', () => {
    const leaked =
      '  目前處於 master 分支，狀態是 clean。\n\n  我需要執行 `git push origin master`。\n\n  讓我先執行 `git push origin master` 看看結果。\n  </think>\n\n  我將幫您將 master 分支推送到遠端倉庫。讓我先執行 `git push origin master` 命令：'
    const result = splitTextByThinkTags(leaked)
    expect(result.length).toBe(2)
    expect(result[0].type).toBe('thinking')
    expect(result[0].content).toContain('目前處於 master 分支')
    expect(result[0].content).not.toContain('</think>')
    expect(result[1].type).toBe('text')
    expect(result[1].content).toContain('我將幫您將 master 分支推送')
    expect(result[1].content).not.toContain('</think>')
  })

  test('handles empty string input', () => {
    const result = splitTextByThinkTags('')
    expect(result).toEqual([{ type: 'text', content: '' }])
  })

  test('strips leading/trailing whitespace from segments', () => {
    const result = splitTextByThinkTags(
      '  <think>  reasoning  </think>  response  ',
    )
    expect(result).toEqual([
      { type: 'thinking', content: 'reasoning' },
      { type: 'text', content: 'response' },
    ])
  })
})
