import * as Sentry from '@sentry/node';
import { env } from '../config/env';

let initialized = false;

export function initSentry(): void {
  if (initialized || !env.SENTRY_DSN) return;

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT,
    release: env.SENTRY_RELEASE,
    // Sample 20% of transactions in production to stay within free tier
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.2 : 1.0,
    integrations: [
      Sentry.httpIntegration(),      // Instruments outgoing HTTP requests
      Sentry.expressIntegration(),   // Instruments Express routes + transactions
      Sentry.prismaIntegration(),    // Instruments Prisma queries as DB spans
    ],
    beforeSend(event) {
      // Never ship cookies or auth headers to Sentry
      if (event.request?.cookies) delete event.request.cookies;
      if (event.request?.headers?.['authorization']) {
        event.request.headers['authorization'] = '[Filtered]';
      }
      if (event.request?.headers?.['cookie']) {
        event.request.headers['cookie'] = '[Filtered]';
      }
      return event;
    },
  });

  initialized = true;
}

export { Sentry };
