#!/bin/bash
# Merge all completed worktree branches back to main
# Usage: bash scripts/agents/merge-all.sh

set -e
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

echo "=== GameTan Agent Merge ==="
echo ""

# List all worktree branches with commits ahead of main
BRANCHES=$(git branch --list 'worktree-auto-*' 2>/dev/null)

if [ -z "$BRANCHES" ]; then
  echo "No agent worktree branches found. Nothing to merge."
  exit 0
fi

MERGED=0
FAILED=0

for branch in $BRANCHES; do
  branch=$(echo "$branch" | tr -d ' *')
  AHEAD=$(git log main.."$branch" --oneline 2>/dev/null | wc -l)

  if [ "$AHEAD" -eq 0 ]; then
    echo "⏭️  $branch — no new commits, skipping"
    continue
  fi

  echo ""
  echo "📦 $branch — $AHEAD commit(s) ahead of main:"
  git log main.."$branch" --oneline | head -5

  echo -n "   Merging... "
  if git merge "$branch" --no-edit 2>/dev/null; then
    echo "✅ OK"
    MERGED=$((MERGED + 1))

    # Cleanup: remove worktree and branch
    WORKTREE_PATH="$REPO_ROOT/.claude/worktrees/$(echo "$branch" | sed 's/worktree-//')"
    if [ -d "$WORKTREE_PATH" ]; then
      git worktree remove "$WORKTREE_PATH" 2>/dev/null || true
    fi
    git branch -d "$branch" 2>/dev/null || true
    echo "   🧹 Cleaned up worktree + branch"
  else
    echo "⚠️  CONFLICT"
    git merge --abort 2>/dev/null
    FAILED=$((FAILED + 1))
    echo "   ↳ Resolve manually: git merge $branch"
  fi
done

echo ""
echo "=== Summary: $MERGED merged, $FAILED conflicts ==="

if [ "$MERGED" -gt 0 ]; then
  echo ""
  echo "🚀 Run 'docker compose build app && docker compose up -d app' to deploy"
fi
