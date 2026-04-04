# GameTan Harness State

This directory contains structured handoff artifacts for the autonomous agent system.
Each task reads state.json before running, and writes back after completing.

Based on: https://www.anthropic.com/engineering/harness-design-long-running-apps

## Files
- state.json — Current system state (data, last actions, pending work)
- last-eval.json — Last evaluator assessment
- bootstrap-test.json — Last bootstrap verification result

## Design Principles
1. Generator and Evaluator are SEPARATE agents (GAN-inspired)
2. Each run reads state.json first (structured handoff, not memory)
3. Evaluator is tuned to be skeptical, not generous
4. Assumptions about what agent can/can't do are stress-tested periodically
