import { Router } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
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

// 20 analysis requests per user per hour — protects against OpenAI cost abuse
const analysisRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id ?? ipKeyGenerator(req.ip ?? ''),
  message: { success: false, message: 'Analysis rate limit exceeded. Maximum 20 analyses per hour.' },
});

router.post('/:id', authenticate, analysisRateLimit, analysisController.analyze);

export default router;
