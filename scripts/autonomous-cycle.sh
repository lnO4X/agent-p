#!/bin/bash
# GameTan Harness — Continuous Loop
# Pipeline 完成后根据结果决定等多久再跑下一次
# 不是固定间隔，是自适应的

cd C:/Users/eashe/x/agent-p
LOG="$HOME/.gametan/notifications/loop.log"
mkdir -p "$(dirname "$LOG")"

while true; do
  START=$(date +%s)
  echo "[$(date)] Pipeline starting" >> "$LOG"

  # Run the pipeline via claude -p
  claude -p "$(cat <<'PROMPT'
你是 GameTan 的 Harness Agent。执行一次完整 pipeline。

## OBSERVE
```bash
cd C:/Users/eashe/x/agent-p
curl -s 'https://gametan.ai/api/admin/traffic' -H "Authorization: Bearer prod-cron-x7k9m2w5q8j1v4n6p3r0" > /tmp/gt-traffic.json
curl -s 'https://gametan.ai/api/admin/stats' -H "Authorization: Bearer prod-cron-x7k9m2w5q8j1v4n6p3r0" > /tmp/gt-stats.json
curl -s -o /dev/null -w "%{http_code}" https://gametan.ai > /tmp/gt-health.txt
cat .harness/history/pipeline.jsonl | tail -5
cat .harness/sprint-spec.json
```
写 .harness/observations.json。

## DECIDE
读 observations + pipeline.jsonl 历史。应用产品原则(简单≠简陋、深度、新人友好)。
连续3+次同类改动但指标没变 → 换策略。
决定 ACT 或 SKIP。写 .harness/sprint-spec.json。

## BUILD + EVALUATE (只在 ACT 时)
只做 spec 里写的 → build → test → commit → push → curl 验证。

## RECORD (每次都做)
追加 pipeline.jsonl。更新 state.json。git add .harness/ → commit → push。

## 输出下次等待时间
最后一行必须输出一个数字（分钟），表示下次 pipeline 应该等多久：
- 如果 ACT 且还有后续工作 → 输出 5（立即继续）
- 如果 ACT 且暂时做完了 → 输出 60
- 如果 SKIP（等数据）→ 输出 240
- 如果修了紧急 bug → 输出 15（快速验证）
只输出数字，不要加其他文字。

通知: bash scripts/notify.sh "Pipeline完成 | 动作:XXX | 下次:N分钟后"

死命令: 不自动化x.com, Creem not LemonSqueezy, gametan.ai not weda.ai
PROMPT
)" --max-turns 30 2>&1 | tee -a "$LOG"

  # Extract wait time from last line of output
  WAIT=$(tail -1 "$LOG" | grep -oE '^[0-9]+$' || echo "240")

  # Sanity bounds: min 5 min, max 480 min (8h)
  if [ "$WAIT" -lt 5 ] 2>/dev/null; then WAIT=5; fi
  if [ "$WAIT" -gt 480 ] 2>/dev/null; then WAIT=480; fi

  END=$(date +%s)
  DURATION=$(( (END - START) / 60 ))
  echo "[$(date)] Pipeline done in ${DURATION}min. Sleeping ${WAIT}min." >> "$LOG"

  sleep "${WAIT}m"
done
