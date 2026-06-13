import { Router } from 'express';
import { SubmissionController } from '../controllers/submission.controller';
import { SubmissionService } from '../services/submission.service';
import { SubmissionRepository } from '../repositories/submission.repository';
import { authenticate } from '../middleware/authenticate';

const router = Router();

const submissionController = new SubmissionController(
  new SubmissionService(new SubmissionRepository())
);

router.get('/', authenticate, submissionController.getStats);

export default router;
