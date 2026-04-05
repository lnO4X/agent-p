# GameTan KAIROS Harness

Inspired by Claude Code's leaked KAIROS + autoDream architecture.
Ref: https://www.anthropic.com/engineering/harness-design-long-running-apps

## Architecture: Persistent Daemon with Dream Phase

```
┌─ KAIROS Daemon (continuous loop) ─────────────────┐
│                                                    │
│  ┌─ Health Check (15s budget) ──┐                  │
│  │ curl gametan.ai → 200?       │                  │
│  │ != 200 → emergency pipeline  │                  │
│  └──────────────────────────────┘                  │
│           │                                        │
│  ┌─ DREAM Phase (autoDream) ────┐                  │
│  │ Triggers:                    │                  │
│  │  • 4h since last dream       │                  │
│  │  • 3+ pipeline entries       │                  │
│  │ Actions:                     │                  │
│  │  • Merge duplicate obs       │                  │
│  │  • Resolve contradictions    │                  │
│  │  • Confirm/deny guesses      │                  │
│  │  • Strategy reflection       │                  │
│  │  • Generate insights         │                  │
│  │ Output: dream-output.json    │                  │
│  └──────────────────────────────┘                  │
│           │                                        │
│  ┌─ ACTIVE Pipeline ───────────┐                   │
│  │ OBSERVE → DECIDE → ACT/SKIP │                   │
│  │ → EVALUATE → RECORD          │                  │
│  │                              │                  │
│  │ DECIDE reads dream-output    │                  │
│  │ Self-pacing: 5-240 min       │                  │
│  └──────────────────────────────┘                  │
│           │                                        │
│  sleep(self-decided interval)                      │
│  └─→ loop back to Health Check                     │
│                                                    │
└────────────────────────────────────────────────────┘
```

## Files

- observations.json    ← OBSERVE raw data
- dream-input.json     ← Data collected for dream phase
- dream-output.json    ← Dream's insights + strategy suggestions
- sprint-spec.json     ← DECIDE's ACT/SKIP + rationale
- last-eval.json       ← EVALUATE scores + direction audit
- state.json           ← System snapshot
- history/
  - pipeline.jsonl     ← Every pipeline run (self-evolution data)
  - dream.jsonl        ← Every dream run (consolidation log)

## Self-Pacing (not fixed intervals)

Pipeline output decides next interval:
- ACT + more work → 5 min
- ACT + done → 30 min
- SKIP (waiting for data) → 120 min
- Emergency fix → 10 min

## System-Level (Windows Task Scheduler)

- GameTan-Autonomous: starts continuous loop, 4h safety restart, lock file prevents duplicates
- GameTan-Watchdog: pure PowerShell curl every 30min, no Claude CLI

## Dead Commands

- NEVER automate x.com via browser
- Payment = Creem (Live), NOT LemonSqueezy
- Email = gametan.ai, NOT weda.ai
