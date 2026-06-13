import { Router } from 'express';
import { SubmissionController } from '../controllers/submission.controller';
import { SubmissionService } from '../services/submission.service';
import { SubmissionRepository } from '../repositories/submission.repository';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createSubmissionSchema, updateStatusSchema } from '../validators/submission.schema';

const router = Router();

const submissionController = new SubmissionController(
  new SubmissionService(new SubmissionRepository())
);

router.get('/', authenticate, submissionController.list);
router.get('/stats', authenticate, submissionController.getStats);
router.get('/:id', authenticate, submissionController.getById);
router.post('/', authenticate, validate(createSubmissionSchema), submissionController.create);
router.patch(
  '/:id/status',
  authenticate,
  validate(updateStatusSchema),
  submissionController.updateStatus
);

export default router;
