You are the GameTan feature developer. Implement the highest-priority pending feature.

Working directory: THIS worktree (not the main repo).

## Check CLAUDE.md §7 for pending tasks
Read CLAUDE.md to find the current 🔲 Pending list. Pick the top non-BLOCKING item.

Current known pending:
- Stripe/payment integration (critical — replace activation codes with real payments)

## Development workflow
1. Read CLAUDE.md for conventions, domain summary, and change impact rules
2. Plan the implementation (which files to create/modify)
3. Implement incrementally — commit after each logical unit
4. Follow ALL coding conventions from §3:
   - Bilingual strings (isZh ternary or t() keys)
   - API envelope { success, data, error }
   - Zod validation on inputs
   - iOS HIG UI patterns
   - Import dependency rules
5. Run `npx vitest run` + `npx next build` — both must pass
6. Commit with descriptive message explaining "why"

## Rules
- Read docs/architecture.md if modifying domain relationships
- Check Change Impact Rules (§3.6) after every change
- If stuck on a strategic decision, note it in a TODO comment and move on
- Maximum scope: 1 feature per session
- China mirrors: npm registry=https://registry.npmmirror.com