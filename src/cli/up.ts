import { readFileSync } from 'fs'
import { join } from 'path'
import { spawnSync } from 'child_process'
import { findGitRoot } from '../utils/git.js'

/**
 * `klaude up` — run the "# klaude up" section from the nearest KLAUDE.md.
 *
 * Walks up from CWD looking for KLAUDE.md files, extracts the section
 * under the `# klaude up` heading, and executes it as a shell script.
 *
 * ANT-only command (USER_TYPE === "ant").
 */
export async function up(): Promise<void> {
  const cwd = process.cwd()
  const gitRoot = findGitRoot(cwd)
  const searchDirs = gitRoot ? [gitRoot, cwd] : [cwd]

  let upSection: string | null = null

  for (const dir of searchDirs) {
    const klaudeMdPath = join(dir, 'KLAUDE.md')
    try {
      const content = readFileSync(klaudeMdPath, 'utf-8')
      upSection = extractUpSection(content)
      if (upSection) {
        console.log(`Found "# klaude up" in ${klaudeMdPath}`)
        break
      }
    } catch {
      // File not found — continue searching
    }
  }

  if (!upSection) {
    console.log(
      'No "# klaude up" section found in KLAUDE.md.\n' +
        'Add a section like:\n\n' +
        '  # klaude up\n' +
        '  ```bash\n' +
        '  npm install\n' +
        '  npm run build\n' +
        '  ```',
    )
    return
  }

  console.log('Running:\n')
  console.log(upSection)
  console.log()

  const result = spawnSync('bash', ['-c', upSection], {
    cwd,
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    console.error(`\nklaude up failed with exit code ${result.status}`)
    process.exitCode = result.status ?? 1
  } else {
    console.log('\nklaude up completed successfully.')
  }
}

/**
 * Extract the content under "# klaude up" heading from markdown.
 * Returns the text between `# klaude up` and the next `#` heading (or EOF).
 * Strips fenced code block markers if present.
 */
function extractUpSection(markdown: string): string | null {
  const lines = markdown.split('\n')
  let inSection = false
  const sectionLines: string[] = []

  for (const line of lines) {
    if (/^#\s+klaude\s+up\b/i.test(line)) {
      inSection = true
      continue
    }
    if (inSection && /^#\s/.test(line)) {
      break
    }
    if (inSection) {
      sectionLines.push(line)
    }
  }

  if (sectionLines.length === 0) return null

  // Strip fenced code block markers
  let text = sectionLines.join('\n').trim()
  text = text.replace(/^```\w*\n?/, '').replace(/\n?```\s*$/, '')

  return text.trim() || null
}
