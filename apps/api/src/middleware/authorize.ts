import type { Request, Response, NextFunction } from 'express';
import { Role } from '@repo/database';
import { ResponseFactory } from '../utils/response.factory';

export function authorize(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const { status, body } = ResponseFactory.error('Unauthorized', 401);
      res.status(status).json(body);
      return;
    }

    if (!roles.includes(req.user.role as Role)) {
      const { status, body } = ResponseFactory.error(
        'Forbidden: insufficient permissions',
        403
      );
      res.status(status).json(body);
      return;
    }

    next();
  };
}
