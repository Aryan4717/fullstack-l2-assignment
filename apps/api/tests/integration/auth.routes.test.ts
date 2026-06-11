import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '@repo/database';
import * as hashUtil from '../../src/utils/hash.util';
import { Role } from '@repo/database';

const app = createApp();

const mockUser = {
  id: 'user-1',
  email: 'test@platform.com',
  passwordHash: 'hashed_password',
  role: Role.MODERATOR,
  createdAt: new Date(),
};

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 and tokens on valid credentials', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    vi.spyOn(hashUtil, 'comparePassword').mockResolvedValue(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@platform.com', password: 'correct' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it('returns 401 on wrong password', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
    vi.spyOn(hashUtil, 'comparePassword').mockResolvedValue(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@platform.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 when user does not exist', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'pass' });

    expect(res.status).toBe(401);
  });

  it('returns 400 on missing email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'pass' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/submissions (auth guard)', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/submissions');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
