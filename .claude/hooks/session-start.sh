#!/bin/bash
# Runs at the start of every Claude Code session in this repo.
#
# Two jobs, both about starting a window in a known state:
#   1. Install dependencies, so `npm test` and `npm run ctc-decoder` work in the
#      first turn. There is no build step; `npm install` is the whole setup.
#   2. Report where the window is starting from, because CLAUDE.md asks every
#      window to begin at the tip of origin/main and the working branch is
#      reused across tickets, so it drifts silently otherwise.
#
# It reports; it never moves the branch. Checking out over someone's uncommitted
# work is not a thing a hook should decide to do.
set -euo pipefail

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

# Only the web container starts empty every time; a local checkout installs when
# its owner chooses to. `install`, not `ci`: it reuses what the cached container
# already holds, where `ci` deletes node_modules and refetches every time.
if [ "${CLAUDE_CODE_REMOTE:-}" = "true" ]; then
  npm install --no-fund --no-audit
fi

git fetch origin main --quiet 2>/dev/null || true

branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)
ahead=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo 0)
behind=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo 0)
dirty=$(git status --porcelain 2>/dev/null | grep -c . || true)

if [ "$ahead" = "0" ] && [ "$behind" = "0" ] && [ "$dirty" = "0" ]; then
  echo "On ${branch}, level with origin/main, tree clean."
else
  echo "On ${branch}: ${ahead} commit(s) ahead of origin/main, ${behind} behind, ${dirty} file(s) uncommitted."
  echo "CLAUDE.md asks a new window to start from main. Once nothing here is unfinished:"
  echo "  git fetch origin main && git checkout -B ${branch} origin/main"
fi
