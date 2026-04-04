#!/bin/bash
# GameTan Autonomous Dev Cycle — called by Windows Task Scheduler
# This script launches claude -p to do one dev iteration

cd C:/Users/eashe/x/agent-p

PROMPT='你是 GameTan 自主开发 agent。执行一轮开发循环：
1. curl -s https://gametan.ai/api/admin/stats -H "Authorization: Bearer prod-cron-x7k9m2w5q8j1v4n6p3r0" 获取数据
2. 读 CLAUDE.md 了解项目现状
3. 做一个高杠杆改动（SEO/内容/分享优化）
4. npx next build && npx vitest run 验证
5. git add && git commit && git push 部署
6. bash scripts/notify.sh "自主循环完成 | 改动：XXX"
所有决策自己做。只做1个改动。'

# Run claude in non-interactive mode
claude -p "$PROMPT" --max-turns 30 2>&1 | tail -5

