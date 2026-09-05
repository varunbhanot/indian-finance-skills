#!/bin/bash
# Installs this repo's dependencies when a Claude Code session starts on the web,
# so `npm run lint`, `npm run typecheck`, `npm test` and `npm run ctc-decoder`
# work in the first turn. There is no build step; `npm install` is the whole setup
# (CONTRIBUTING.md).
set -euo pipefail

# Local sessions install when their owner chooses to; only the web container
# starts empty every time.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

# `install`, not `ci`: it reuses what the cached container already holds, where
# `ci` deletes node_modules and refetches every time.
npm install --no-fund --no-audit
