bun install
bun run precheck

rm -rf dist && bun run build-klaude.ts

# bun run build.ts

rm -rf dist/*.map
