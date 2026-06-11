import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors';
import { ResponseFactory } from '../utils/response.factory';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    const { status, body } = ResponseFactory.error(err.message, err.statusCode, err.code);
    res.status(status).json(body);
    return;
  }

  if (err instanceof ZodError) {
    const { status, body } = ResponseFactory.error('Validation error', 400, err.message);
    res.status(status).json(body);
    return;
  }

  console.error('Unhandled error:', err);
  const { status, body } = ResponseFactory.error('Internal server error', 500);
  res.status(status).json(body);
}
