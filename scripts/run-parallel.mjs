import { spawn, execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const scripts = process.argv.slice(2)
if (scripts.length === 0) {
  process.exit(0)
}

// Pre-build mcp-chrome-bridge (native-server) so its dist files exist
// for postinstall scripts to reference.
const scriptDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(scriptDir, '..')
const nativeServerDir = join(
  projectRoot,
  'vendor',
  'mcp-chrome',
  'app',
  'native-server',
)
if (existsSync(nativeServerDir)) {
  try {
    execSync('bun x tsc', { cwd: nativeServerDir, stdio: 'inherit' })
  } catch (e) {
    console.warn(
      `[run-parallel] WARNING: failed to build mcp-chrome-bridge: ${e.message}`,
    )
  }
}

for (const script of scripts) {
  spawn(process.execPath, [script], { stdio: 'inherit', shell: false })
}
