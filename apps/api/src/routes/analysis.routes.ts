import { Router } from 'express';
import { AnalysisController } from '../controllers/analysis.controller';
import { AnalysisService } from '../services/analysis.service';
import { AnalysisRepository } from '../repositories/analysis.repository';
import { SubmissionRepository } from '../repositories/submission.repository';
import { OpenAIProvider } from '../providers/openai.provider';
import { authenticate } from '../middleware/authenticate';

const router = Router();

const analysisController = new AnalysisController(
  new AnalysisService(new OpenAIProvider(), new AnalysisRepository(), new SubmissionRepository())
);

router.post('/:id', authenticate, analysisController.analyze);

export default router;
