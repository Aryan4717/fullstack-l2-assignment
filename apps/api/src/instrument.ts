// Loaded via --require BEFORE server.ts so Sentry can patch Node.js,
// Express, and Prisma before those modules are first imported.
import { initSentry } from './lib/sentry.client';
initSentry();
