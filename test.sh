#!/bin/bash
bun test --path-ignore-patterns "vendor/mcp-chrome/app/chrome-extension/tests/**" --path-ignore-patterns "vendor/mcp-chrome/app/native-server/**"
