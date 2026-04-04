#!/bin/bash
# GameTan Autonomous Dev Cycle — Windows Task Scheduler entry point
# Self-bootstrapping: reads current state before deciding what to do

cd C:/Users/eashe/x/agent-p

PROMPT='你是 GameTan 的自主开发 agent。遵循自举协议：

## 自举（先做）
1. cat CLAUDE.md 的 §7 Current Status 了解当前阶段
2. curl -s https://gametan.ai/api/admin/stats -H "Authorization: Bearer prod-cron-x7k9m2w5q8j1v4n6p3r0" 获取实时数据
3. git log --oneline -5 看最近做了什么
4. curl -s -o /dev/null -w "%{http_code}" https://gametan.ai 确认网站正常

## 决策（根据数据）
- 网站挂了 → 修复
- 用户 < 50 → SEO/内容/分享（获客）
- 用户 50-500 且付费=0 → 转化优化（变现）
- 有付费用户 → 留存/扩展
- 都不是 → 读 CLAUDE.md pending 做最顶部的

## 执行（只做1个改动）
- 读相关文件理解代码
- 做改动
- npx next build && npx vitest run 必须通过
- git add && git commit && git push
- bash scripts/notify.sh "自主循环 | 用户:N 付费:M | 改动:XXX"

## 自检
- 部署后确认网站 200
- 如果挂了: git revert HEAD && git push

所有决策自己做，不问用户。'

claude -p "$PROMPT" --max-turns 30 2>&1 | tail -5
