# GameTan Harness — 3-Agent Pipeline

Strict implementation of https://www.anthropic.com/engineering/harness-design-long-running-apps

## Architecture

```
Agent 1: OBSERVER    Agent 2: PLANNER    Agent 3: EXECUTOR    Agent 4: EVALUATOR
   │                    │                    │                    │
   │ collect data       │ read obs           │ read spec          │ test live site
   │ no opinions        │ product decisions  │ implement only     │ skeptical scoring
   │                    │                    │                    │
   ▼                    ▼                    ▼                    ▼
observations.json → sprint-spec.json → build-result.json → last-eval.json
                                                                  │
                                                    ┌─────────────┘
                                                    ▼
                                              next PLANNER reads
                                              eval feedback
```

## Key Design Principles

1. **Agent separation is REAL** — each is a separate `claude -p` call
2. **File-based handoff ONLY** — no agent sees another's conversation
3. **Evaluator is skeptical** — default score 2/5, must confirm before higher
4. **3+ consecutive SKIP = must ACT** — cannot indefinitely defer
5. **Evaluator finds residual problems** — not just spec compliance

## Files

- observations.json    ← OBSERVER writes (raw data)
- sprint-spec.json     ← PLANNER writes (ACT/SKIP + spec)
- build-result.json    ← EXECUTOR writes (commit, files changed)
- last-eval.json       ← EVALUATOR writes (scores, issues, residualProblems)
- state.json           ← System snapshot
- history/
  - pipeline.jsonl     ← Every cycle appended (evolution data)

## System-Level

- Windows Task Scheduler: `GameTan-Autonomous` (continuous loop)
- Windows Task Scheduler: `GameTan-Watchdog` (pure PowerShell curl, 30min)
- Claude Code: `gametan-autonomous` (every 4h safety net)
- Claude Code: `gametan-human-tasks` (daily 9am, only when needed)
