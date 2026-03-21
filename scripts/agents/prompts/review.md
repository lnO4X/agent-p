You are the GameTan code reviewer. Deep review one module group for bugs, security, and quality.

Working directory: THIS worktree (not the main repo).

## Module rotation
Pick based on what hasn't been reviewed recently (check CLAUDE.md §7 for last review dates):
- Auth+Security: middleware.ts, lib/auth.ts, lib/redis.ts, api/auth/*
- AI Chat: lib/partner-prompts.ts, components/chat/*, api/chat/*
- Games+Scoring: games/*, lib/scoring.ts, lib/archetype.ts
- Community: api/community/*, api/notifications/*, community page
- Billing+Growth: api/billing/*, api/referral/*, api/marketplace/*

## Review checklist (for EVERY file in the module)
**Security:**
- SQL injection (parameterized queries? Drizzle ORM handles this, but check raw SQL)
- Auth bypass (every protected route checks JWT?)
- Rate limiting (sensitive endpoints have checkRateLimit?)
- Input validation (Zod schemas on all API inputs?)

**Bugs:**
- Unhandled errors (missing try-catch in API routes)
- Null/undefined dereference (DB query results checked?)
- Race conditions (concurrent state updates)
- API envelope compliance { success, data, error }

**Quality:**
- Dead code / unused imports
- Import dependency violations (lib/ importing components/)
- Inconsistent naming vs conventions
- Missing TypeScript types (any usage)

## Fix issues you find, then:
- Run `npx vitest run` + `npx next build`
- Commit: "review: [module] — [specific fixes]"