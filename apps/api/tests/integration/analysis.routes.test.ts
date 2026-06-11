import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma, Sentiment, Recommendation, Role } from '@repo/database';
import * as jwtUtil from '../../src/utils/jwt.util';

const app = createApp();

function makeToken(): string {
  return jwtUtil.signAccessToken({ sub: 'user-1', email: 'mod@test.com', role: Role.MODERATOR });
}

const mockAnalysis = {
  id: 'ana-1',
  submissionId: 'sub-1',
  toxicityScore: 1,
  sentiment: Sentiment.POSITIVE,
  summary: 'Safe article.',
  recommendation: Recommendation.APPROVE,
  rawPrompt: null,
  errorFlag: false,
  createdAt: new Date(),
};

describe('POST /api/analyse/:id', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 with cached analysis on second call', async () => {
    vi.mocked(prisma.aIAnalysis.findUnique).mockResolvedValue(mockAnalysis);

    const res = await request(app)
      .post('/api/analyse/sub-1')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.errorFlag).toBe(false);
    expect(res.body.data.toxicityScore).toBe(1);
  });

  it('returns 404 when submission does not exist', async () => {
    vi.mocked(prisma.aIAnalysis.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.submission.findUnique).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/analyse/nonexistent')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/analyse/sub-1');
    expect(res.status).toBe(401);
  });
});
