import type { Request, Response, NextFunction } from 'express';
import type { IAuthService } from '../interfaces/services/IAuthService';
import { ResponseFactory } from '../utils/response.factory';
import { env } from '../config/env';
import { getAuditService, AuditAction } from '../services/audit.service';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
};

export class AuthController {
  constructor(private readonly authService: IAuthService) {}

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user, tokens } = await this.authService.login(req.body);

      getAuditService().log({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: AuditAction.LOGIN,
        success: true,
        req,
      });

      res.cookie('accessToken', tokens.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000,
      });
      res.cookie('refreshToken', tokens.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const { status, body } = ResponseFactory.success({ user, accessToken: tokens.accessToken }, 'Login successful');
      res.status(status).json(body);
    } catch (err) {
      getAuditService().log({
        userEmail: (req.body as { email?: string })?.email,
        action: AuditAction.LOGIN_FAILED,
        success: false,
        req,
      });
      next(err);
    }
  };

  logout = (req: Request, res: Response): void => {
    getAuditService().log({
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action: AuditAction.LOGOUT,
      success: true,
      req,
    });

    res.clearCookie('accessToken', COOKIE_OPTIONS);
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    const { status, body } = ResponseFactory.success(null, 'Logged out successfully');
    res.status(status).json(body);
  };
}
