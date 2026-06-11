import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { ResponseFactory } from '../utils/response.factory';

export function validate(schema: ZodSchema, source: 'body' | 'query' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(source === 'body' ? req.body : req.query);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const { status, body } = ResponseFactory.error(
        'Validation failed',
        400,
        JSON.stringify(errors)
      );
      res.status(status).json(body);
      return;
    }

    if (source === 'body') {
      req.body = result.data;
    }
    next();
  };
}
