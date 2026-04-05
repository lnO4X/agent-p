# GameTan Harness — Anthropic Pipeline Architecture

Based on: https://www.anthropic.com/engineering/harness-design-long-running-apps

## Architecture: Observe → Plan → Build → Evaluate

One pipeline, 4 personas, file-based handoff between phases.
Separation happens at the PERSONA level, not the scheduling level.

```
OBSERVE (data collector, no opinions)
    ↓ writes observations.json
PLAN (product designer, applies principles)
    ↓ writes sprint-spec.json
BUILD (engineer, implements spec ONLY)
    ↓ deploys, writes build-result.json
EVALUATE (QA, skeptical, scores 1-5)
    ↓ writes last-eval.json → feedback loops to PLAN
```

## Product Principles (Planner must follow)

1. 简单 ≠ 简陋: 抓住核心，砍掉没有数据证明吸引力的东西
2. 深度: 专业电竞俱乐部也能用来评估选手天赋
3. 新人友好: 3分钟内获得价值，零门槛
4. 数据驱动: 没有数据时用原则猜测，有数据后用数据决策

## Files

- state.json        — System state (data snapshot)
- observations.json — Observer's raw findings (no opinions)
- sprint-spec.json  — Planner's product spec for next change
- last-eval.json    — Evaluator's feedback + scores
- bootstrap-test.json — Meta's self-check results

## Dead Commands (absolute rules)
- NEVER automate x.com via browser
- Payment = Creem, NOT LemonSqueezy
- Email domain = gametan.ai, NOT weda.ai
