import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../src/services/auth.service';
import type { IUserRepository } from '../../src/interfaces/repositories/IUserRepository';
import * as hashUtil from '../../src/utils/hash.util';
import { UnauthorizedError } from '../../src/errors';
import { Role } from '@repo/database';

const mockUser = {
  id: 'user-1',
  email: 'test@test.com',
  passwordHash: 'hashed',
  role: Role.MODERATOR,
  createdAt: new Date(),
};

describe('AuthService', () => {
  let userRepo: IUserRepository;
  let authService: AuthService;

  beforeEach(() => {
    userRepo = { findByEmail: vi.fn(), findById: vi.fn() };
    authService = new AuthService(userRepo);
  });

  it('returns user and tokens on valid credentials', async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(mockUser);
    vi.spyOn(hashUtil, 'comparePassword').mockResolvedValue(true);

    const result = await authService.login({ email: mockUser.email, password: 'pass' });

    expect(result.user.email).toBe(mockUser.email);
    expect(result.tokens.accessToken).toBeTruthy();
    expect(result.tokens.refreshToken).toBeTruthy();
  });

  it('throws UnauthorizedError for wrong password', async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(mockUser);
    vi.spyOn(hashUtil, 'comparePassword').mockResolvedValue(false);

    await expect(
      authService.login({ email: mockUser.email, password: 'wrong' })
    ).rejects.toThrow(UnauthorizedError);
  });

  it('throws UnauthorizedError when user not found', async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(null);

    await expect(
      authService.login({ email: 'nobody@test.com', password: 'pass' })
    ).rejects.toThrow(UnauthorizedError);
  });
});
