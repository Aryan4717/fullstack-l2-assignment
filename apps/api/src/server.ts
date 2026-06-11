import './config/env'; // Validate env variables before anything else
import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

app.listen(env.PORT, () => {
  console.info(`🚀  API server running on http://localhost:${env.PORT}`);
  console.info(`   Environment: ${env.NODE_ENV}`);
});
