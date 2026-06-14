// Sentry is initialised via --require ./instrument.ts (see package.json dev
// script and Dockerfile CMD) so it patches Node.js/Express/Prisma before
// any modules load. Do not import sentry.client here.
import './config/env'; // Validate env variables before anything else
import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

app.listen(env.PORT, () => {
  console.info(`API server running on http://localhost:${env.PORT}`);
  console.info(`   Environment: ${env.NODE_ENV}`);
});
