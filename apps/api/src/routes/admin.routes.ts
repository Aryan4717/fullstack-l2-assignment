import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { SubmissionRepository } from '../repositories/submission.repository';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { Role } from '@repo/database';

const router = Router();

const adminController = new AdminController(new SubmissionRepository());

router.post('/seed', authenticate, authorize(Role.ADMIN), adminController.seed);

export default router;
