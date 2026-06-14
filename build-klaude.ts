import { readdir, readFile, writeFile, cp } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { getMacroDefines } from './scripts/defines.ts'
import { DEFAULT_BUILD_FEATURES } from './scripts/defines.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outdir = join(__dirname, 'dist')
const exeName = 'klaude.exe'
const exePath = join(outdir, exeName)

// Step 1: Clean output directory
const { rmSync } = await import('fs')
rmSync(outdir, { recursive: true, force: true })

// Collect FEATURE_* env vars → Bun.build features
const envFeatures = Object.keys(process.env)
  .filter(k => k.startsWith('FEATURE_'))
  .map(k => k.replace('FEATURE_', ''))
const features = [...new Set([...DEFAULT_BUILD_FEATURES, ...envFeatures])]

console.log('Compiling to standalone executable...')
console.log(`Target: windows-x64`)
console.log(`Features: ${features.length} enabled`)

// Step 2: Compile to standalone executable with embedded files
const result = await Bun.build({
  entrypoints: ['src/entrypoints/cli.tsx'],
  outdir,
  target: 'bun-windows-x64',
  compile: true,
  splitting: true,
  sourcemap: 'linked',
  define: {
    ...getMacroDefines(),
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  features,
  // Pre-compile Go and Zig native modules before Bun build
  precompile: ['scripts/pre-compile-native.ts'],
})

if (!result.success) {
  console.error('Compile failed:')
  for (const log of result.logs) {
    console.error(log)
  }
  process.exit(1)
}

// Step 2.5: Rename output executable to desired name
const defaultExePath = join(outdir, 'cli.exe')
try {
  const { renameSync } = await import('fs')
  renameSync(defaultExePath, exePath)
} catch (e) {
  console.warn(`Warning: Could not rename executable: ${e}`)
}

// Copy audio-capture.node to dist/ (same level as klaude.exe) — only when FEATURE_AUDIO_CAPTURE=1
const { existsSync } = await import('fs')
const hasAudioCapture = process.env.FEATURE_AUDIO_CAPTURE === '1'
const acSource = join(
  __dirname,
  'vendor',
  'audio-capture',
  `${process.arch}-${process.platform}`,
  'audio-capture.node',
)
const acDest = join(outdir, 'audio-capture.node')
if (hasAudioCapture) {
  if (!existsSync(acSource)) {
    console.error(`ERROR: audio-capture source not found at ${acSource}`)
    process.exit(1)
  }
  await writeFile(acDest, await readFile(acSource))
  console.log(`Copied audio-capture.node → ${acDest}`)
}

// Copy rg.exe to dist/ (same level as klaude.exe) for fallback mode.
// Embedded ripgrep is compiled into Bun; this binary is only used when
// bundled mode is active and the embedded path is unavailable.
const rgSource = join(
  __dirname,
  'src',
  'utils',
  'vendor',
  'ripgrep',
  `${process.arch}-${process.platform}`,
  'rg.exe',
)
const rgDest = join(outdir, 'rg.exe')
if (!existsSync(rgSource)) {
  console.error(`ERROR: ripgrep source not found at ${rgSource}`)
  process.exit(1)
}
await writeFile(rgDest, await readFile(rgSource))
console.log(`Copied rg.exe → ${rgDest}`)

// Verify rg.exe is present after copy
if (!existsSync(rgDest)) {
  console.error(`ERROR: ripgrep binary not found at ${rgDest}`)
  process.exit(1)
}
console.log(`Verified ripgrep binary: ${rgDest}`)

console.log(`\n✅ Compiled ${result.outputs.length} files`)
console.log(`📦 Executable: ${exePath}`)
console.log(`\nUsage: ${exePath} [options]`)
