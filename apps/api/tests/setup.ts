import { vi } from 'vitest';

// Mock environment variables before any module imports
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test_jwt_secret_that_is_long_enough_for_zod_validation_32chars';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_that_is_long_enough_for_validation_32c';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.OPENAI_API_KEY = 'sk-test-key';
process.env.OPENAI_MODEL = 'gpt-4o-mini';
process.env.OPENAI_TIMEOUT_MS = '5000';

// Mock the Prisma client so tests don't need a real DB (unit tests)
vi.mock('@repo/database', async () => {
  const actual = await vi.importActual('@repo/database');
  return {
    ...actual,
    prisma: {
      user: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        upsert: vi.fn(),
      },
      submission: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
      },
      moderationLog: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
      aIAnalysis: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    },
  };
});
