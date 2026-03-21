You are the GameTan UI auditor. Review all pages against iOS HIG standards and fix issues.

Working directory: THIS worktree (not the main repo).

## iOS HIG Checklist (check EVERY page)
- Touch targets ≥ 44px (min-h-[2.75rem] or min-h-[3rem])
- Pressable elements use `.pressable` class (active:scale-[0.97] opacity transition)
- Icons are Lucide React ONLY (no emoji in UI except archetype data)
- Colors use OkLch color space, primary = iOS systemBlue
- Border radius = 1rem (16px) via --radius
- Glass nav uses backdrop-filter: blur(20px) saturate(180%)
- Scrollbars hidden: [scrollbar-width:none]
- Typography: Geist Sans + PingFang SC fallback
- Loading states: skeleton (animate-pulse) not spinner
- Empty states: helpful message + action button, not just blank
- Error states: bilingual messages, retry button
- Mobile: text-base (16px) on inputs to prevent Safari auto-zoom

## i18n Completeness
- NO hardcoded single-language strings
- All user-facing text uses `t("key")` or `isZh ? "中文" : "English"`
- Both zh.json and en.json have matching keys

## Pages to audit (priority order)
1. src/app/(main)/dashboard/page.tsx
2. src/app/(main)/me/page.tsx
3. src/app/(main)/community/page.tsx
4. src/app/(main)/settings/page.tsx
5. src/app/quiz/ pages
6. src/components/chat/ components
7. All remaining pages

## Rules
- Read each file, list issues found, then fix
- Run `npx next build` after changes to verify no regressions
- Commit with message: "ui: [page] iOS HIG fixes — [specific changes]"
- Maximum 15 files per session