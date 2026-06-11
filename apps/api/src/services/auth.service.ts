import type { IAuthService, LoginDto, AuthUser, AuthTokens } from '../interfaces/services/IAuthService';
import type { IUserRepository } from '../interfaces/repositories/IUserRepository';
import { comparePassword } from '../utils/hash.util';
import { signAccessToken, signRefreshToken } from '../utils/jwt.util';
import { UnauthorizedError } from '../errors';

export class AuthService implements IAuthService {
  constructor(private readonly userRepo: IUserRepository) {}

  async login(dto: LoginDto): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const user = await this.userRepo.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValid = await comparePassword(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const tokens: AuthTokens = {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken({ sub: user.id }),
    };

    const authUser: AuthUser = { id: user.id, email: user.email, role: user.role };
    return { user: authUser, tokens };
  }
}
