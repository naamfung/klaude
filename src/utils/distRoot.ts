import { fileURLToPath } from 'url'
import * as path from 'path'

/**
 * Resolve the dist root directory from the current module's location.
 *
 * Works across all build layouts:
 * - Single-file: dist/cli.js → dist/
 * - Code-split:  dist/chunks/chunk-xxx.js → dist/
 * - Dev mode:    src/utils/distRoot.ts → <project_root>/
 * - Moved dist:  C:/any/path/ → C:/any/path/ (falls back to parent)
 */
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const distRoot = (() => {
  const parts = __dirname.split(path.sep)
  // Dev mode: from src/utils/ → project root
  const srcIdx = parts.indexOf('src')
  if (srcIdx !== -1) {
    return parts.slice(0, srcIdx).join(path.sep)
  }
  // Runtime: parent of current module dir (works regardless of dist name)
  return path.dirname(__dirname)
})()

export { distRoot }
