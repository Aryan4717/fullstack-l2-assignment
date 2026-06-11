import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma, ContentType, SubmissionStatus, Role } from '@repo/database';
import * as jwtUtil from '../../src/utils/jwt.util';

const app = createApp();

function makeToken(role = Role.MODERATOR): string {
  return jwtUtil.signAccessToken({ sub: 'user-1', email: 'mod@test.com', role });
}

const mockSubmission = {
  id: 'sub-1',
  title: 'Test Article',
  body: 'Body content',
  authorName: 'Author',
  type: ContentType.ARTICLE,
  status: SubmissionStatus.PENDING,
  submittedAt: new Date(),
};

describe('Submission routes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('POST /api/submissions creates a new submission', async () => {
    vi.mocked(prisma.submission.create).mockResolvedValue(mockSubmission);

    const res = await request(app)
      .post('/api/submissions')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({
        title: 'Test Article',
        body: 'Body content',
        authorName: 'Author',
        type: 'ARTICLE',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Test Article');
  });

  it('GET /api/submissions returns paginated list', async () => {
    vi.mocked(prisma.submission.findMany).mockResolvedValue([mockSubmission]);
    vi.mocked(prisma.submission.count).mockResolvedValue(1);

    const res = await request(app)
      .get('/api/submissions')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination.total).toBe(1);
  });

  it('PATCH /api/submissions/:id/status returns 400 for already-approved submission', async () => {
    vi.mocked(prisma.submission.findUnique).mockResolvedValue({
      ...mockSubmission,
      status: SubmissionStatus.APPROVED,
    });

    const res = await request(app)
      .patch('/api/submissions/sub-1/status')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ status: 'REJECTED' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/admin/seed returns 403 for moderator role', async () => {
    const res = await request(app)
      .post('/api/admin/seed')
      .set('Authorization', `Bearer ${makeToken(Role.MODERATOR)}`);

    expect(res.status).toBe(403);
  });
});
