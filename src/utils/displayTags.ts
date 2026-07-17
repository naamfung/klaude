/**
 * Matches any XML-like `<tag>…</tag>` block (lowercase tag names, optional
 * attributes, multi-line content). Used to strip system-injected wrapper tags
 * from display titles — IDE context, slash-command markers, hook output,
 * task notifications, channel messages, etc. A generic pattern avoids
 * maintaining an ever-growing allowlist that falls behind as new notification
 * types are added.
 *
 * Only matches lowercase tag names (`[a-z][\w-]*`) so user prose mentioning
 * JSX/HTML components ("fix the <Button> layout", "<!DOCTYPE html>") passes
 * through — those start with uppercase or `!`. The non-greedy body with a
 * backreferenced closing tag keeps adjacent blocks separate; unpaired angle
 * brackets ("when x < y") don't match.
 */
const XML_TAG_BLOCK_PATTERN = /<([a-z][\w-]*)(?:\s[^>]*)?>[\s\S]*?<\/\1>\n?/g

/**
 * Strip XML-like tag blocks from text for use in UI titles (/rewind, /resume,
 * bridge session titles). System-injected context — IDE metadata, hook output,
 * task notifications — arrives wrapped in tags and should never surface as a
 * title.
 *
 * If stripping would result in empty text, returns the original unchanged
 * (better to show something than nothing).
 */
export function stripDisplayTags(text: string): string {
  const result = text.replace(XML_TAG_BLOCK_PATTERN, '').trim()
  return result || text
}

/**
 * Like stripDisplayTags but returns empty string when all content is tags.
 * Used by getLogDisplayTitle to detect command-only prompts (e.g. /clear)
 * so they can fall through to the next title fallback, and by extractTitleText
 * to skip pure-XML messages during bridge title derivation.
 */
export function stripDisplayTagsAllowEmpty(text: string): string {
  return text.replace(XML_TAG_BLOCK_PATTERN, '').trim()
}

const IDE_CONTEXT_TAGS_PATTERN =
  /<(ide_opened_file|ide_selection)(?:\s[^>]*)?>[\s\S]*?<\/\1>\n?/g

/**
 * Strip only IDE-injected context tags (ide_opened_file, ide_selection).
 * Used by textForResubmit so UP-arrow resubmit preserves user-typed content
 * including lowercase HTML like `<code>foo</code>` while dropping IDE noise.
 */
export function stripIdeContextTags(text: string): string {
  return text.replace(IDE_CONTEXT_TAGS_PATTERN, '').trim()
}

/**
 * Pattern for model-emitted thinking tags. Some third-party models and local
 * LLM servers (llama.cpp with Qwen-Agentic / DeepSeek chat templates) emit
 * chain-of-thought inline as `<think>…</think>` or `<thinking>…</thinking>`
 * directly inside the text content (rather than via a separate
 * `reasoning_content` field that the OpenAI stream adapter routes into
 * Anthropic `thinking` blocks). When that happens the raw thinking leaks into
 * background-summary text shown to the user.
 *
 * Three variants are matched:
 *   1. Closed: `<think>…</think>` / `<thinking>…</thinking>`
 *   2. Trailing-unclosed: `<think>…` / `<thinking>…` (streaming interruption,
 *      truncated response, or context-shift corruption that drops the closing
 *      tag). Matched non-greedily to the end of string.
 *   3. Leading-orphan-close: `…</think>` / `…</thinking>` where the opening
 *      tag is missing (the opening tag was dropped by context-shift truncation
 *      or never emitted). Everything from the start of the text up to and
 *      including the orphan closing tag is treated as thinking content and
 *      stripped; only the content after the closing tag is kept.
 *
 * The orphan-close variant uses negative lookbehind/lookahead for backticks
 * so that `` `</think>` `` (the tag mentioned as a literal string inside
 * markdown inline code) is NOT treated as the actual closing tag. This is
 * critical when the thinking content discusses `</think>` tags themselves.
 */
const THINKING_TAG_PATTERN =
  /<think(?:ing)?(?:\s[^>]*)?>[\s\S]*?<\/think(?:ing)?>\n?/gi
const THINKING_TAG_UNCLOSED_PATTERN = /<think(?:ing)?(?:\s[^>]*)?>[\s\S]*$/gi
const THINKING_TAG_ORPHAN_CLOSE_PATTERN =
  /^[\s\S]*?(?<!`)<\/think(?:ing)?>(?!`)\n?/gi

/**
 * Strip model-emitted `<think>` / `<thinking>` chain-of-thought tags (closed,
 * trailing-unclosed, and leading-orphan-close variants) from text before it
 * is surfaced to the user. Used by background silent requests (away summary,
 * agent summary, prompt suggestion) whose responses from third-party thinking
 * models may contain inline reasoning that must not be displayed.
 *
 * Returns the cleaned text trimmed. If stripping removes everything, the
 * original text is returned unchanged (better to show something than nothing).
 */
export function stripThinkingTags(text: string): string {
  const result = text
    .replace(THINKING_TAG_PATTERN, '')
    .replace(THINKING_TAG_UNCLOSED_PATTERN, '')
    .replace(THINKING_TAG_ORPHAN_CLOSE_PATTERN, '')
    .trim()
  return result || text
}

export type ThinkSegment = {
  type: 'thinking' | 'text'
  content: string
}

const THINK_TAG_BOUNDARY_PATTERN =
  /(?<!`)(<think(?:ing)?(?:\s[^>]*)?>|<\/think(?:ing)?>)(?!`)/gi

/**
 * Split text that contains model-emitted `<think>` / `<thinking>` tags into
 * a sequence of thinking and text segments. Unlike `stripThinkingTags` (which
 * discards thinking content), this function PRESERVES the thinking content as
 * separate segments so it can be routed into Anthropic `thinking` content
 * blocks and rendered with the proper grey/collapsible "∴ Thinking" UI.
 *
 * Handles all variants:
 *   - Closed: `<think>…</think>`
 *   - Orphan close: `…</think>` (opening tag dropped by context shift)
 *   - Unclosed: `<think>…` (closing tag dropped)
 *   - Multiple blocks in one text
 *
 * Backtick-wrapped mentions like `` `</think>` `` are NOT treated as tag
 * boundaries (the tag is being discussed as a literal string, not emitted
 * as a thinking marker).
 *
 * Used by the OpenAI-compatible API path to post-process text blocks whose
 * content was emitted inline by local LLM servers (llama.cpp + Qwen-Agentic
 * / DeepSeek chat templates) that don't separate thinking into a
 * `reasoning_content` field.
 */
export function splitTextByThinkTags(text: string): ThinkSegment[] {
  const segments: ThinkSegment[] = []

  let lastIndex = 0
  let inThink = false
  THINK_TAG_BOUNDARY_PATTERN.lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = THINK_TAG_BOUNDARY_PATTERN.exec(text)) !== null) {
    const tag = match[0]
    const tagStart = match.index
    const tagEnd = tagStart + tag.length

    const content = text.slice(lastIndex, tagStart)

    if (tag.startsWith('</')) {
      // Closing tag — content before it is thinking, regardless of whether
      // we saw an opening tag (orphan close case).
      if (content.trim()) {
        segments.push({ type: 'thinking', content: content.trim() })
      }
      inThink = false
    } else {
      // Opening tag — content before it is text.
      if (content.trim()) {
        segments.push({ type: 'text', content: content.trim() })
      }
      inThink = true
    }

    lastIndex = tagEnd
  }

  // Remaining content after the last tag
  const remaining = text.slice(lastIndex)
  if (remaining.trim()) {
    segments.push({
      type: inThink ? 'thinking' : 'text',
      content: remaining.trim(),
    })
  }

  return segments.length > 0 ? segments : [{ type: 'text', content: text }]
}

/**
 * Post-process content blocks to split inline `<think>`/`<thinking>` tags
 * from text blocks into proper thinking + text blocks.
 *
 * Used by API paths (streaming and non-streaming) to handle local LLM
 * servers (llama.cpp with Qwen-Agentic / DeepSeek chat templates) that
 * emit chain-of-thought inline in text content rather than via a separate
 * thinking block. Blocks without think tags are passed through unchanged.
 */
export function splitThinkTagsInContentBlocks(blocks: unknown[]): unknown[] {
  const result: unknown[] = []
  for (const block of blocks) {
    if (
      block &&
      typeof block === 'object' &&
      (block as Record<string, unknown>).type === 'text' &&
      typeof (block as Record<string, unknown>).text === 'string'
    ) {
      const text = (block as Record<string, unknown>).text as string
      if (/<\/?think(?:ing)?(?:\s[^>]*)?>/i.test(text)) {
        const segments = splitTextByThinkTags(text)
        for (const seg of segments) {
          if (seg.type === 'thinking') {
            result.push({
              type: 'thinking',
              thinking: seg.content,
              signature: '',
            })
          } else {
            result.push({ type: 'text', text: seg.content })
          }
        }
        continue
      }
    }
    result.push(block)
  }
  return result
}
