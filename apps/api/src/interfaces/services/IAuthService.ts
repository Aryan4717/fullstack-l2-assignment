export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export interface IAuthService {
  login(dto: LoginDto): Promise<{ user: AuthUser; tokens: AuthTokens }>;
}
