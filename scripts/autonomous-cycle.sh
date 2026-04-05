#!/bin/bash
# GameTan Harness — KAIROS-inspired Continuous Daemon
#
# Architecture (based on Claude Code KAIROS + autoDream):
# 1. DAEMON MODE: persistent loop, never exits
# 2. ACTIVE PHASE: Observe→Decide→Act/Skip→Record (pipeline)
# 3. DREAM PHASE: memory consolidation, strategy reflection, data analysis
# 4. Self-pacing: pipeline decides its own next interval
# 5. Lock file: single instance guarantee

cd C:/Users/eashe/x/agent-p
HARNESS_DIR=".harness"
HISTORY="$HARNESS_DIR/history/pipeline.jsonl"
DREAM_LOG="$HARNESS_DIR/history/dream.jsonl"
LOOP_LOG="$HOME/.gametan/notifications/loop.log"
LOCK="$HOME/.gametan/harness.lock"
mkdir -p "$HARNESS_DIR/history" "$HOME/.gametan/notifications"

# Single instance lock
if [ -f "$LOCK" ]; then
  OLD_PID=$(cat "$LOCK" 2>/dev/null)
  if kill -0 "$OLD_PID" 2>/dev/null; then
    echo "[$(date)] Already running (PID $OLD_PID). Exiting." >> "$LOOP_LOG"
    exit 0
  fi
fi
echo $$ > "$LOCK"
trap "rm -f $LOCK" EXIT

echo "[$(date)] Harness daemon starting (PID $$)" >> "$LOOP_LOG"

#############################################
# DREAM PHASE — runs between pipeline cycles
# Lightweight: no claude CLI, just data analysis + file writes
#############################################
dream_phase() {
  local NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  local LAST_DREAM=$(tail -1 "$DREAM_LOG" 2>/dev/null | grep -o '"ts":"[^"]*"' | cut -d'"' -f4)
  local HISTORY_COUNT=$(wc -l < "$HISTORY" 2>/dev/null || echo 0)
  local SINCE_DREAM=""

  # autoDream trigger conditions (adapted from CC leak):
  # 1. At least 4 hours since last dream
  # 2. At least 3 new pipeline entries since last dream
  # 3. No other dream running (lock file handles this)
  # 4. At least 10 minutes since last pipeline

  if [ -n "$LAST_DREAM" ]; then
    LAST_DREAM_TS=$(date -d "$LAST_DREAM" +%s 2>/dev/null || echo 0)
    NOW_TS=$(date +%s)
    SINCE_DREAM=$(( (NOW_TS - LAST_DREAM_TS) / 3600 ))
    if [ "$SINCE_DREAM" -lt 4 ]; then
      return 0  # Too soon for dream
    fi
  fi

  if [ "$HISTORY_COUNT" -lt 3 ]; then
    return 0  # Not enough data to dream about
  fi

  echo "[$(date)] Dream phase starting" >> "$LOOP_LOG"

  # Collect observations without claude CLI (pure data)
  local TRAFFIC=$(curl -s 'https://gametan.ai/api/admin/traffic' -H "Authorization: Bearer prod-cron-x7k9m2w5q8j1v4n6p3r0" 2>/dev/null)
  local STATS=$(curl -s 'https://gametan.ai/api/admin/stats' -H "Authorization: Bearer prod-cron-x7k9m2w5q8j1v4n6p3r0" 2>/dev/null)
  local RECENT_ACTIONS=$(tail -5 "$HISTORY" 2>/dev/null)

  # Write dream input for next pipeline to consume
  cat > "$HARNESS_DIR/dream-input.json" << DREAMINPUT
{
  "timestamp": "$NOW",
  "traffic": $TRAFFIC,
  "stats": $STATS,
  "recentPipeline": [$(echo "$RECENT_ACTIONS" | paste -sd',' -)],
  "questions": [
    "Are recent actions producing measurable results?",
    "Should we change strategy based on traffic trends?",
    "What contradictions exist in our observations?",
    "What should the next pipeline focus on?"
  ]
}
DREAMINPUT

  # Run dream consolidation via claude (lightweight, focused prompt)
  claude -p "$(cat <<'DREAMPROMPT'
你是 GameTan 的 Dream Agent。你在后台做记忆整合和策略反思。

读这些文件：
```bash
cd C:/Users/eashe/x/agent-p
cat .harness/dream-input.json
cat .harness/history/pipeline.jsonl
cat .harness/state.json
cat .harness/last-eval.json 2>/dev/null
```

## 你的工作（autoDream 逻辑）

1. **合并重复观察**: pipeline.jsonl 里有没有重复的发现？合并。
2. **消除矛盾**: 有没有互相矛盾的结论？解决。
3. **确认事实**: 之前是猜测的东西，现在数据能证实/证伪了吗？
4. **策略反思**: 最近的策略有没有在产出结果？如果没有，建议什么？
5. **生成洞察**: 有没有数据揭示的、之前没注意到的模式？

## 输出

写 .harness/dream-output.json：
```json
{
  "timestamp": "ISO",
  "mergedObservations": ["合并后的关键观察"],
  "contradictionsResolved": ["解决了什么矛盾"],
  "factsConfirmed": ["确认了什么事实"],
  "strategyReflection": "当前策略是否有效，建议什么",
  "nextFocus": "下次 pipeline 应该关注什么"
}
```

然后更新 .harness/state.json 中的数据快照。
git add .harness/dream-output.json .harness/state.json && git commit -m "dream: memory consolidation" && git push

## 原则
- 不写代码，不改产品
- 只做思考、整合、反思
- 输出给下次 Pipeline 的 DECIDE 阶段消费
DREAMPROMPT
)" --max-turns 15 2>&1 | tail -3 >> "$LOOP_LOG"

  # Log dream entry
  echo "{\"ts\":\"$NOW\",\"type\":\"dream\",\"historyCount\":$HISTORY_COUNT}" >> "$DREAM_LOG"
  echo "[$(date)] Dream phase complete" >> "$LOOP_LOG"
}

#############################################
# ACTIVE PHASE — full pipeline via claude -p
#############################################
active_phase() {
  echo "[$(date)] Active phase (pipeline) starting" >> "$LOOP_LOG"

  local RESULT=$(claude -p "$(cat <<'PIPELINE'
你是 GameTan 的 Harness Agent。执行一次完整 pipeline。

## 自举
```bash
cd C:/Users/eashe/x/agent-p
cat .harness/dream-output.json 2>/dev/null
cat .harness/observations.json 2>/dev/null
cat .harness/history/pipeline.jsonl | tail -5
cat .harness/sprint-spec.json
```

如果 dream-output.json 存在且有 nextFocus → 优先考虑 dream 的建议。

## OBSERVE
```bash
curl -s 'https://gametan.ai/api/admin/traffic' -H "Authorization: Bearer prod-cron-x7k9m2w5q8j1v4n6p3r0"
curl -s 'https://gametan.ai/api/admin/stats' -H "Authorization: Bearer prod-cron-x7k9m2w5q8j1v4n6p3r0"
curl -s -o /dev/null -w "%{http_code}" https://gametan.ai
git log --oneline -5
```
写 .harness/observations.json。

## DECIDE
读 observations + pipeline history + dream output。
产品原则: 简单≠简陋、深度（俱乐部级评估）、新人友好。
自进化: 连续3+次同类改动但指标没变 → 换策略。
写 .harness/sprint-spec.json (ACT 或 SKIP)。

## BUILD + EVALUATE (ACT only)
只做 spec 里写的 → build → test → commit → push → curl 验证。
写 .harness/last-eval.json。

## RECORD
追加 pipeline.jsonl。更新 state.json。git add .harness/ → commit → push。
通知: bash scripts/notify.sh "Pipeline | 访客:X 用户:N | 动作:XXX"

## 输出下次等待时间（最后一行，只输出数字）
- ACT 且有后续 → 5
- ACT 完成 → 30
- SKIP 等数据 → 120
- 修紧急 bug → 10

死命令: 不自动化x.com, Creem not LemonSqueezy, gametan.ai not weda.ai
PIPELINE
)" --max-turns 30 2>&1)

  echo "$RESULT" | tail -5 >> "$LOOP_LOG"

  # Extract wait time from last line
  local WAIT=$(echo "$RESULT" | tail -1 | grep -oE '^[0-9]+$' || echo "60")
  echo "$WAIT"
}

#############################################
# MAIN DAEMON LOOP
#############################################
CYCLE=0
while true; do
  CYCLE=$((CYCLE + 1))
  echo "[$(date)] === Cycle $CYCLE ===" >> "$LOOP_LOG"

  # Health check first (15-second budget, like KAIROS)
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 https://gametan.ai 2>/dev/null || echo "000")
  if [ "$HTTP" != "200" ]; then
    echo "[$(date)] ALERT: site returned $HTTP" >> "$LOOP_LOG"
    bash scripts/notify.sh "🚨 gametan.ai 返回 $HTTP"
    # Don't sleep, run pipeline immediately to fix
    active_phase > /dev/null
    sleep 300  # Wait 5 min after emergency fix
    continue
  fi

  # Try dream phase first (lightweight, no claude if conditions not met)
  dream_phase

  # Run active pipeline
  WAIT=$(active_phase)

  # Bounds: min 5, max 240
  if [ "$WAIT" -lt 5 ] 2>/dev/null; then WAIT=5; fi
  if [ "$WAIT" -gt 240 ] 2>/dev/null; then WAIT=240; fi

  echo "[$(date)] Sleeping ${WAIT}min before next cycle" >> "$LOOP_LOG"
  sleep "${WAIT}m"
done
