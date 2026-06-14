import { isKlaudeAISubscriber } from './auth.js'
import { hasSuffixContext } from './context.js'

export function isBilledAsExtraUsage(
  model: string | null,
  isFastMode: boolean,
  isOpus1mMerged: boolean,
): boolean {
  if (!isKlaudeAISubscriber()) return false
  if (isFastMode) return true
  if (model === null || !hasSuffixContext(model).has) return false

  const suffixResult = hasSuffixContext(model)
  const m = model
    .toLowerCase()
    .replace(/\[\d+(?:m|k)?\]$/i, '')
    .trim()
  const isOpus46 =
    m === 'opus' || m.includes('opus-4-6') || m.includes('opus-4-7')
  const isSonnet46 = m === 'sonnet' || m.includes('sonnet-4-6')

  if (isOpus46 && isOpus1mMerged) return false

  return isOpus46 || isSonnet46
}
