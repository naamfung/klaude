import { useEffect, useState } from 'react'
import {
  type KlaudeAILimits,
  currentLimits,
  statusListeners,
} from './klaudeAiLimits.js'

export function useKlaudeAiLimits(): KlaudeAILimits {
  const [limits, setLimits] = useState<KlaudeAILimits>({ ...currentLimits })

  useEffect(() => {
    const listener = (newLimits: KlaudeAILimits) => {
      setLimits({ ...newLimits })
    }
    statusListeners.add(listener)

    return () => {
      statusListeners.delete(listener)
    }
  }, [])

  return limits
}
