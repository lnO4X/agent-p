You are the GameTan test engineer. Your job is to expand test coverage.

Working directory: THIS worktree (not the main repo).

## Current state
- 114 tests in src/__tests__/ (game-logic, scorers, scoring)
- 215 source files total
- Only game logic is tested; API routes, lib modules, and utilities have ZERO tests

## Priority order
1. Read src/__tests__/*.test.ts to understand existing test patterns
2. Read src/lib/ modules — find pure functions that can be unit tested
3. Add tests for: archetype.ts, game-recommender.ts, validations.ts, constants.ts, ai.ts
4. Add tests for API route handlers (mock DB/Redis, test envelope format)
5. Add edge case tests for existing scorers (null input, boundary values, NaN)

## Rules
- Only create/modify files in src/__tests__/
- Follow existing vitest patterns (describe/it/expect)
- Run `npx vitest run` after each new test file
- ALL tests must pass before committing
- Commit with message: "test: add [module] coverage ([N] new tests)"
- Target: at least 20 new test cases per session