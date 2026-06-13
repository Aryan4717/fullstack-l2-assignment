import express, { type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import submissionRoutes from './routes/submission.routes';
import analysisRoutes from './routes/analysis.routes';
import adminRoutes from './routes/admin.routes';
import statsRoutes from './routes/stats.routes';
import sentryTestRoutes from './routes/sentry-test.routes'; // TEMPORARY — remove after verification
import { errorHandler } from './middleware/error-handler';
import { ResponseFactory } from './utils/response.factory';
import { AppError } from './errors';
import { Sentry } from './lib/sentry.client';

export function createApp(): express.Application {
  const app = express();

  // ─── Security middleware ────────────────────────────────────────────────────
  app.use(helmet());
  app.use(
    cors({
      origin: (process.env['FRONTEND_URL'] ?? 'http://localhost:3000')
        .split(',')
        .map((o) => o.trim()),
      credentials: true,
    })
  );

  // ─── Body parsers ───────────────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // ─── Health check ───────────────────────────────────────────────────────────
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ─── Routes ─────────────────────────────────────────────────────────────────
  app.use('/api/auth', authRoutes);
  app.use('/api/submissions', submissionRoutes);
  app.use('/api/analyse', analysisRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/sentry-test', sentryTestRoutes); // TEMPORARY — remove after verification

  // ─── 404 handler ────────────────────────────────────────────────────────────
  app.use((_req: Request, res: Response) => {
    const { status, body } = ResponseFactory.error('Route not found', 404);
    res.status(status).json(body);
  });

  // ─── Sentry error handler ───────────────────────────────────────────────────
  // v10 API: takes the app object directly, not via app.use(). Must be after
  // routes, before our custom error handler.
  Sentry.setupExpressErrorHandler(app, {
    shouldHandleError(error) {
      // Skip known 4xx AppErrors (auth, validation, not-found) — noise, not bugs.
      if (error instanceof AppError && error.statusCode < 500) return false;
      return true;
    },
  });

  // ─── Global error handler ───────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
