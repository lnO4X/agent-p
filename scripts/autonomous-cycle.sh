#!/bin/bash
# GameTan Harness — 3-Agent Pipeline with File Handoff
#
# Architecture (strict Anthropic harness design):
#   Agent 1: OBSERVER   — collect data, write observations.json (no opinions)
#   Agent 2: PLANNER    — read observations, write sprint-spec.json (product decisions)
#   Agent 3: EXECUTOR   — read spec, implement+test+deploy, write build-result.json
#   Agent 4: EVALUATOR  — test live site independently, write last-eval.json
#
# Each agent is a SEPARATE claude -p call.
# Communication is ONLY through .harness/ files.
# No agent sees another agent's conversation.

cd C:/Users/eashe/x/agent-p
HARNESS=".harness"
HISTORY="$HARNESS/history/pipeline.jsonl"
LOG="$HOME/.gametan/notifications/loop.log"
LOCK="$HOME/.gametan/harness.lock"
mkdir -p "$HARNESS/history" "$HOME/.gametan/notifications"

# Single instance
if [ -f "$LOCK" ]; then
  OLD_PID=$(cat "$LOCK" 2>/dev/null)
  if kill -0 "$OLD_PID" 2>/dev/null; then
    echo "[$(date)] Already running (PID $OLD_PID)" >> "$LOG"
    exit 0
  fi
fi
echo $$ > "$LOCK"
trap "rm -f $LOCK" EXIT

echo "[$(date)] === Harness starting ===" >> "$LOG"

while true; do
  CYCLE_START=$(date +%s)

  # ─── Health Check (15s budget) ───
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 https://gametan.ai 2>/dev/null || echo "000")
  if [ "$HTTP" != "200" ]; then
    echo "[$(date)] ALERT: site $HTTP" >> "$LOG"
    bash scripts/notify.sh "🚨 gametan.ai 返回 $HTTP"
  fi

  # ─── Agent 1: OBSERVER (data only, no opinions) ───
  echo "[$(date)] Agent 1: OBSERVER" >> "$LOG"
  claude -p 'You are a neutral data collector. Collect data and write it to a file. No opinions, no recommendations.

```bash
cd C:/Users/eashe/x/agent-p
TRAFFIC=$(curl -s "https://gametan.ai/api/admin/traffic" -H "Authorization: Bearer prod-cron-x7k9m2w5q8j1v4n6p3r0")
STATS=$(curl -s "https://gametan.ai/api/admin/stats" -H "Authorization: Bearer prod-cron-x7k9m2w5q8j1v4n6p3r0")
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://gametan.ai)
COMMITS=$(git log --oneline -5)
HISTORY=$(cat .harness/history/pipeline.jsonl | tail -5)
PREV_EVAL=$(cat .harness/last-eval.json 2>/dev/null || echo "{}")
```

Write ALL raw data to .harness/observations.json as valid JSON. Include: traffic, stats, health code, recent commits, pipeline history, previous eval. No analysis. Just data.' --max-turns 10 2>&1 | tail -3 >> "$LOG"

  # ─── Agent 2: PLANNER (product decisions) ───
  echo "[$(date)] Agent 2: PLANNER" >> "$LOG"
  claude -p 'You are a product designer for GameTan (gametan.ai), an esports talent testing website.

Read these files:
```bash
cd C:/Users/eashe/x/agent-p
cat .harness/observations.json
cat .harness/history/pipeline.jsonl | tail -5
cat .harness/last-eval.json 2>/dev/null
cat CLAUDE.md | head -30
```

Product principles:
- 简单≠简陋: grab core, cut everything without data-proven attraction
- 深度: pro esports clubs can use it for player assessment
- 新人友好: 3 min zero barrier to value

Decision rules:
1. If evaluator found issues → spec: fix them (priority 1)
2. If site is down → spec: fix
3. If 3+ consecutive SKIPs with same rationale → MUST change strategy, not SKIP again
4. If product has residual problems (stale UI, broken flows, inconsistent copy) → spec: fix
5. If 0 organic traffic → spec: SEO/distribution improvement (create content, fix meta, internal linking)
6. If traffic but no conversion → spec: funnel optimization
7. Only SKIP if genuinely nothing can be improved

CRITICAL: "SKIP because waiting for data" is NOT acceptable after 3 consecutive SKIPs.
If you have SKIPped 3+ times, you MUST find something to improve — review the product yourself.

Write .harness/sprint-spec.json:
{
  "action": "ACT" | "SKIP",
  "rationale": "why (based on what data/eval feedback)",
  "spec": "exactly what to do (1 change)",
  "files": ["files to modify"],
  "testCriteria": ["how to verify after deployment"],
  "doNotDo": "what NOT to do"
}' --max-turns 10 2>&1 | tail -3 >> "$LOG"

  # ─── Check if SKIP ───
  ACTION=$(cat "$HARNESS/sprint-spec.json" 2>/dev/null | python -c "import sys,json; print(json.load(sys.stdin).get('action','SKIP'))" 2>/dev/null || echo "SKIP")

  if [ "$ACTION" = "ACT" ]; then
    # ─── Agent 3: EXECUTOR (implement spec ONLY) ───
    echo "[$(date)] Agent 3: EXECUTOR" >> "$LOG"
    claude -p 'You are an engineer. Read the spec and implement EXACTLY what it says. Nothing more.

```bash
cd C:/Users/eashe/x/agent-p
cat .harness/sprint-spec.json
```

Rules:
- Only modify files listed in the spec
- Do not add features not in the spec
- npx next build MUST pass
- npx vitest run MUST pass
- git add + commit + push when done
- If build fails, fix the build error only, do not add unrelated changes

After deployment, write .harness/build-result.json:
{"built": true, "commit": "<short hash>", "filesChanged": [...]}' --max-turns 25 2>&1 | tail -3 >> "$LOG"

    # Wait for Vercel deployment
    sleep 45

    # ─── Agent 4: EVALUATOR (independent skeptical testing) ───
    echo "[$(date)] Agent 4: EVALUATOR" >> "$LOG"
    claude -p 'You are an independent QA tester. You are SKEPTICAL by default. Score 2/5 unless you confirm something works.

Read what was supposed to be built:
```bash
cd C:/Users/eashe/x/agent-p
cat .harness/sprint-spec.json
cat .harness/build-result.json 2>/dev/null
```

Now TEST the live site against the spec testCriteria:
```bash
# Basic health
curl -s -o /dev/null -w "%{http_code}" https://gametan.ai

# Test specific criteria from sprint-spec
# (read testCriteria and run appropriate curl commands)

# Check for residual problems while you are at it:
# - Any page returning non-200?
# - i18n keys: diff zh.json vs en.json key count
# - Any Weda/weda references remaining?
# - Blog pages accessible?
```

Score 1-5 (default 2, only give higher if confirmed):
1. Did the spec change actually work?
2. Did it introduce any regressions?
3. Are there residual problems you noticed?
4. Product quality: does the site feel polished or has rough edges?

Write .harness/last-eval.json:
{
  "timestamp": "ISO",
  "specAction": "what was built",
  "scores": {"specImplemented": N, "noRegressions": N, "productQuality": N},
  "issues": ["specific problems found"],
  "residualProblems": ["things not related to this spec but need fixing"],
  "recommendation": "what should the next cycle focus on"
}

git add .harness/last-eval.json && git commit -m "eval: cycle results" && git push' --max-turns 15 2>&1 | tail -3 >> "$LOG"
  fi

  # ─── Record + Notify ───
  CYCLE_END=$(date +%s)
  DURATION=$(( (CYCLE_END - CYCLE_START) / 60 ))
  TRAFFIC=$(cat "$HARNESS/observations.json" 2>/dev/null | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('traffic',{}).get('24h',{}).get('pageViews',0))" 2>/dev/null || echo "?")
  USERS=$(cat "$HARNESS/observations.json" 2>/dev/null | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('stats',{}).get('totalUsers',0))" 2>/dev/null || echo "?")
  SPEC=$(cat "$HARNESS/sprint-spec.json" 2>/dev/null | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('spec','?')[:60])" 2>/dev/null || echo "?")

  echo "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"action\":\"$ACTION\",\"spec\":\"$SPEC\",\"traffic_24h\":$TRAFFIC,\"users\":$USERS,\"duration_min\":$DURATION}" >> "$HISTORY"

  if [ "$ACTION" = "ACT" ]; then
    bash scripts/notify.sh "🔧 Harness | $ACTION | 访客:$TRAFFIC 用户:$USERS | $SPEC"
  fi

  # ─── Decide next interval ───
  if [ "$ACTION" = "ACT" ]; then
    WAIT=30  # Did work, check again in 30 min
  else
    WAIT=120 # Skipped, wait 2 hours
  fi

  echo "[$(date)] Cycle done (${DURATION}min). Next in ${WAIT}min." >> "$LOG"
  sleep "${WAIT}m"
done
