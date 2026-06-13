import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors';
import { ResponseFactory } from '../utils/response.factory';
import { Sentry } from '../lib/sentry.client';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    // 4xx AppErrors are filtered out of Sentry by setupExpressErrorHandler.
    // Add a breadcrumb so the trace still shows what happened leading to a 5xx.
    Sentry.addBreadcrumb({
      category: 'app.error',
      message: `${err.code}: ${err.message}`,
      level: 'warning',
      data: { statusCode: err.statusCode, path: req.path, method: req.method },
    });
    const { status, body } = ResponseFactory.error(err.message, err.statusCode, err.code);
    res.status(status).json(body);
    return;
  }

  if (err instanceof ZodError) {
    Sentry.addBreadcrumb({
      category: 'app.error',
      message: 'Validation error',
      level: 'warning',
      data: { path: req.path, issues: err.issues.map((i) => i.message) },
    });
    const { status, body } = ResponseFactory.error('Validation error', 400, err.message);
    res.status(status).json(body);
    return;
  }

  console.error('Unhandled error:', err);
  const { status, body } = ResponseFactory.error('Internal server error', 500);
  res.status(status).json(body);
}
