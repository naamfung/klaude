import { readdir, readFile, writeFile, cp } from 'fs/promises'
import { join } from 'path'
import { getMacroDefines } from './scripts/defines.ts'
import { DEFAULT_BUILD_FEATURES } from './scripts/defines.ts'

const outdir = 'dist'

// Step 1: Clean output directory
const { rmSync } = await import('fs')
rmSync(outdir, { recursive: true, force: true })

// Collect FEATURE_* env vars → Bun.build features
const envFeatures = Object.keys(process.env)
  .filter(k => k.startsWith('FEATURE_'))
  .map(k => k.replace('FEATURE_', ''))
const features = [...new Set([...DEFAULT_BUILD_FEATURES, ...envFeatures])]

// Step 2: Bundle with splitting
const result = await Bun.build({
  entrypoints: ['src/entrypoints/cli.tsx'],
  outdir,
  target: 'bun',
  splitting: true,
  sourcemap: 'linked',
  define: {
    ...getMacroDefines(),
    // React production mode — eliminates _debugStack Error objects
    // (6,889 objects × ~1.7KB = 12MB in development builds) and removes
    // prop-type / key warnings not useful in a production CLI tool.
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  features,
})

if (!result.success) {
  console.error('Build failed:')
  for (const log of result.logs) {
    console.error(log)
  }
  process.exit(1)
}

// Step 3: Post-process — replace Bun-only `import.meta.require` with Node.js compatible version
const files = await readdir(outdir)
const IMPORT_META_REQUIRE = 'var __require = import.meta.require;'
const COMPAT_REQUIRE = `var __require = typeof import.meta.require === "function" ? import.meta.require : (await import("module")).createRequire(import.meta.url);`

let patched = 0
for (const file of files) {
  if (!file.endsWith('.js')) continue
  const filePath = join(outdir, file)
  const content = await readFile(filePath, 'utf-8')
  if (content.includes(IMPORT_META_REQUIRE)) {
    await writeFile(
      filePath,
      content.replace(IMPORT_META_REQUIRE, COMPAT_REQUIRE),
    )
    patched++
  }
}

// Also patch unguarded globalThis.Bun destructuring from third-party deps
// (e.g. @anthropic-ai/sandbox-runtime) so Node.js doesn't crash at import time.
let bunPatched = 0
const BUN_DESTRUCTURE = /var \{([^}]+)\} = globalThis\.Bun;?/g
const BUN_DESTRUCTURE_SAFE =
  'var {$1} = typeof globalThis.Bun !== "undefined" ? globalThis.Bun : {};'
for (const file of files) {
  if (!file.endsWith('.js')) continue
  const filePath = join(outdir, file)
  const content = await readFile(filePath, 'utf-8')
  if (BUN_DESTRUCTURE.test(content)) {
    await writeFile(
      filePath,
      content.replace(BUN_DESTRUCTURE, BUN_DESTRUCTURE_SAFE),
    )
    bunPatched++
  }
}
BUN_DESTRUCTURE.lastIndex = 0

console.log(
  `Bundled ${result.outputs.length} files to ${outdir}/ (patched ${patched} for import.meta.require, ${bunPatched} for Bun destructure)`,
)

// Step 4: Copy native .node addon files (audio-capture) and vendored binaries (ripgrep)
// Copy audio-capture.node to dist/ (same level as cli.js) — only when FEATURE_AUDIO_CAPTURE=1
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

// Copy rg.exe to dist/ (same level as cli.js) for fallback mode.
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

// Step 5: Generate cli-bun and cli-node executable entry points
const cliBun = join(outdir, 'cli-bun.js')
const cliNode = join(outdir, 'cli-node.js')

await writeFile(cliBun, '#!/usr/bin/env bun\nimport "./cli.js"\n')

await writeFile(cliNode, '#!/usr/bin/env node\nimport "./cli.js"\n')

// Make both executable
const { chmodSync } = await import('fs')
chmodSync(cliBun, 0o755)
chmodSync(cliNode, 0o755)

console.log(`Generated ${cliBun} (shebang: bun) and ${cliNode} (shebang: node)`)
