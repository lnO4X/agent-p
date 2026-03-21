#!/bin/bash
# GameTan Agent Runner — 在 worktree 中启动 Claude Code agent
# Usage: bash scripts/agents/run-agent.sh <agent-name> [interactive|batch]
#
# Agents: test, ui, data, feature, review, ops
# Modes:  interactive (default) = 你可以对话; batch = 跑完自动退出
#
# Examples:
#   bash scripts/agents/run-agent.sh test          # 交互式测试 agent
#   bash scripts/agents/run-agent.sh ui batch      # 批处理 UI 审计
#   bash scripts/agents/run-agent.sh feature       # 交互式功能开发
#   bash scripts/agents/run-agent.sh ops           # 运维检查 (不建 worktree)

set -e
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
AGENT_NAME="${1:?Usage: run-agent.sh <test|ui|data|feature|review|ops> [interactive|batch]}"
MODE="${2:-interactive}"
PROMPT_FILE="$REPO_ROOT/scripts/agents/prompts/${AGENT_NAME}.md"

if [ ! -f "$PROMPT_FILE" ]; then
  echo "ERROR: Unknown agent '$AGENT_NAME'. Available: test, ui, data, feature, review, ops"
  exit 1
fi

PROMPT=$(cat "$PROMPT_FILE")

# Ops agent doesn't need worktree (read-only)
if [ "$AGENT_NAME" = "ops" ]; then
  echo "🔴 Starting Ops agent (no worktree, read-only)..."
  if [ "$MODE" = "batch" ]; then
    cd "$REPO_ROOT" && claude -p "$PROMPT"
  else
    cd "$REPO_ROOT" && claude -n "gametan-ops" --resume
  fi
  exit 0
fi

# All other agents use worktrees
WORKTREE_NAME="auto-${AGENT_NAME}"
WORKTREE_PATH="$REPO_ROOT/.claude/worktrees/$WORKTREE_NAME"
BRANCH_NAME="worktree-$WORKTREE_NAME"

echo "🚀 Starting ${AGENT_NAME} agent in worktree..."
echo "   Worktree: $WORKTREE_PATH"
echo "   Branch:   $BRANCH_NAME"
echo ""

# Create worktree if it doesn't exist
if [ -d "$WORKTREE_PATH" ]; then
  echo "♻️  Reusing existing worktree ($WORKTREE_NAME)"
else
  echo "📁 Creating new worktree..."
  cd "$REPO_ROOT"
  git worktree add -b "$BRANCH_NAME" "$WORKTREE_PATH" main 2>/dev/null || \
  git worktree add "$WORKTREE_PATH" "$BRANCH_NAME" 2>/dev/null || \
  (echo "ERROR: Failed to create worktree. Check git status." && exit 1)
fi

# Run Claude in the worktree
if [ "$MODE" = "batch" ]; then
  echo "⚡ Batch mode — agent will run autonomously and exit"
  cd "$WORKTREE_PATH" && claude -p "$PROMPT"

  # Auto-merge if there are commits
  cd "$WORKTREE_PATH"
  if git log main.."$BRANCH_NAME" --oneline | grep -q .; then
    echo ""
    echo "📦 Agent made commits. Merging to main..."
    cd "$REPO_ROOT"
    git merge "$BRANCH_NAME" --no-edit 2>&1 && \
      echo "✅ Merged successfully" || \
      echo "⚠️  Merge conflict — resolve manually: git merge $BRANCH_NAME"
  else
    echo "ℹ️  No commits made"
  fi
else
  echo "💬 Interactive mode — you can guide the agent"
  echo "   When done: type /exit, then run:"
  echo "   cd $REPO_ROOT && git merge $BRANCH_NAME"
  echo ""
  cd "$WORKTREE_PATH" && claude -n "gametan-${AGENT_NAME}" --resume
fi
