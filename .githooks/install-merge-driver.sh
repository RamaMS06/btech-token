#!/usr/bin/env sh
# Register the custom merge driver for pnpm-lock.yaml.
#
# Git merge drivers live in .git/config (per-repo, per-clone). They cannot
# be committed directly — each developer needs to register the driver on
# their machine. This script is invoked by `prepare` in root package.json
# so it runs automatically on `pnpm install`.
#
# What it does:
#   On merge conflict in pnpm-lock.yaml, git invokes this driver with the
#   ancestor/ours/theirs versions. We discard all three and regenerate the
#   lockfile from the merged package.json(s) — which is the only correct
#   resolution for a deterministic generated file.
#
# Idempotent: re-running has no effect if already registered.

set -e

git config merge.pnpm-lock.name "pnpm lockfile auto-regenerate"
git config merge.pnpm-lock.driver "pnpm install --lockfile-only --no-frozen-lockfile >/dev/null 2>&1 && cp pnpm-lock.yaml %A"

echo "✓ pnpm-lock.yaml merge driver registered (conflicts now auto-resolve)."
