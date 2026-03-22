import { vi } from "vitest";

/**
 * Creates a chainable mock for Drizzle ORM queries.
 * Usage: mockDbChain([user1, user2]) → db.select().from().where().limit() resolves to [user1, user2]
 */
export function mockDbChain(resolvedValue: unknown[] = []) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(resolvedValue),
    orderBy: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue(undefined),
    returning: vi.fn().mockResolvedValue(resolvedValue),
  };
  return chain;
}

export function createMockDb() {
  return {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}
