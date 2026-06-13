// TEMPORARY — remove this file and its registration in app.ts after verifying Sentry.
import { Router } from 'express';
import { SentryTestController } from '../controllers/sentry-test.controller';

const router = Router();
const sentryTestController = new SentryTestController();

router.get('/', sentryTestController.basicTest);
router.get('/advanced', sentryTestController.advancedTest);

export default router;
