import type { Request, Response, NextFunction } from 'express';
import { Sentry } from '../lib/sentry.client';
import { ResponseFactory } from '../utils/response.factory';

export class SentryTestController {
  /**
   * GET /sentry-test
   * Basic test: captures a test exception and returns the Sentry event ID.
   */
  basicTest = (_req: Request, res: Response, next: NextFunction): void => {
    try {
      Sentry.setUser({ id: 'test-user-001', email: 'sentry-test@platform.com', role: 'ADMIN' });
      Sentry.setTag('test.type', 'basic');
      Sentry.setTag('feature', 'sentry-verification');

      const eventId = Sentry.captureException(
        new Error('[SENTRY TEST] Basic integration check — safe to ignore')
      );

      console.info(`[sentry-test] Basic event captured. eventId=${eventId}`);

      const { status, body } = ResponseFactory.success(
        { eventId, sentryEnabled: !!process.env['SENTRY_DSN'] },
        'Sentry basic test event sent — check Sentry Issues dashboard'
      );
      res.status(status).json(body);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /sentry-test/advanced
   * Advanced test: verifies error capture, user context, tags, breadcrumbs,
   * custom context, and stack trace in a single event.
   */
  advancedTest = (_req: Request, res: Response, next: NextFunction): void => {
    try {
      // 1. User context
      Sentry.setUser({ id: 'test-user-002', email: 'advanced-test@platform.com', role: 'MODERATOR' });

      // 2. Custom tags (searchable in Sentry)
      Sentry.setTag('test.type', 'advanced');
      Sentry.setTag('feature', 'sentry-verification');
      Sentry.setTag('environment.check', 'true');

      // 3. Custom context (extra structured data attached to the event)
      Sentry.setContext('test.metadata', {
        triggeredAt: new Date().toISOString(),
        node: process.version,
        platform: process.platform,
        memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      });

      // 4. Breadcrumbs — simulate a realistic request trail
      Sentry.addBreadcrumb({
        category: 'auth',
        message: 'User authenticated via Bearer token',
        level: 'info',
        data: { userId: 'test-user-002', role: 'MODERATOR' },
      });
      Sentry.addBreadcrumb({
        category: 'db.query',
        message: 'submission.findMany called',
        level: 'info',
        data: { filter: 'status=PENDING', page: 1 },
      });
      Sentry.addBreadcrumb({
        category: 'ai.analysis',
        message: 'OpenAI moderation call initiated',
        level: 'info',
        data: { model: 'gpt-4o-mini', submissionId: 'test-sub-001' },
      });
      Sentry.addBreadcrumb({
        category: 'app.error',
        message: 'Intentional test error about to be thrown',
        level: 'warning',
      });

      // 5. Throw a real error so Sentry captures an actual stack trace
      const testError = new Error(
        '[SENTRY TEST] Advanced integration check — breadcrumbs + context + tags verified'
      );
      testError.name = 'SentryAdvancedTestError';

      const eventId = Sentry.captureException(testError, {
        tags: { 'test.step': 'advanced-capture' },
        extra: {
          description: 'This event verifies the full Sentry integration pipeline',
          checksCompleted: ['user-context', 'tags', 'custom-context', 'breadcrumbs', 'stack-trace'],
        },
      });

      console.info(`[sentry-test] Advanced event captured. eventId=${eventId}`);
      console.info(`[sentry-test] View at: https://sentry.io/organizations/<your-org>/issues/?query=${eventId}`);

      const { status, body } = ResponseFactory.success(
        {
          eventId,
          sentryEnabled: !!process.env['SENTRY_DSN'],
          checksVerified: ['error-capture', 'user-context', 'tags', 'custom-context', 'breadcrumbs', 'stack-trace'],
        },
        'Sentry advanced test event sent — check Sentry Issues dashboard'
      );
      res.status(status).json(body);
    } catch (err) {
      next(err);
    }
  };
}
