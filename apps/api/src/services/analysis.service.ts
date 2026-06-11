import type { AIAnalysis } from '@repo/database';
import { Sentiment, Recommendation } from '@repo/database';
import type { IAnalysisService } from '../interfaces/services/IAnalysisService';
import type { IAnalysisProvider } from '../interfaces/providers/IAnalysisProvider';
import type { IAnalysisRepository } from '../interfaces/repositories/IAnalysisRepository';
import type { ISubmissionRepository } from '../interfaces/repositories/ISubmissionRepository';
import { NotFoundError } from '../errors';
import { MODERATION_PROMPT } from '../constants/prompts';

export class AnalysisService implements IAnalysisService {
  constructor(
    private readonly provider: IAnalysisProvider,
    private readonly analysisRepo: IAnalysisRepository,
    private readonly submissionRepo: ISubmissionRepository
  ) {}

  async analyzeSubmission(submissionId: string): Promise<AIAnalysis> {
    const cached = await this.analysisRepo.findBySubmissionId(submissionId);
    if (cached) return cached;

    const submission = await this.submissionRepo.findById(submissionId);
    if (!submission) throw new NotFoundError('Submission');

    const rawPrompt = MODERATION_PROMPT(submission.title, submission.body);

    try {
      const result = await this.provider.analyze(submission.title, submission.body);
      return this.analysisRepo.create({
        submissionId,
        ...result,
        rawPrompt,
        errorFlag: false,
      });
    } catch (err) {
      console.error('AI analysis failed, storing fallback:', err);
      return this.analysisRepo.create({
        submissionId,
        toxicityScore: 0,
        sentiment: Sentiment.NEUTRAL,
        summary: 'Analysis unavailable — provider error.',
        recommendation: Recommendation.REVIEW,
        rawPrompt,
        errorFlag: true,
      });
    }
  }
}
