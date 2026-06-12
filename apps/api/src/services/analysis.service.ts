import type { AIAnalysis } from '@repo/database';
import { Sentiment, Recommendation } from '@repo/database';
import type { IAnalysisService } from '../interfaces/services/IAnalysisService';
import type { IAnalysisProvider } from '../interfaces/providers/IAnalysisProvider';
import type { IAnalysisRepository } from '../interfaces/repositories/IAnalysisRepository';
import type { ISubmissionRepository } from '../interfaces/repositories/ISubmissionRepository';
import { NotFoundError } from '../errors';
import { MODERATION_PROMPT } from '../constants/prompts';
import { getLangfuse } from '../lib/langfuse.client';
import { env } from '../config/env';

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

    const lf = getLangfuse();
    const trace = lf?.trace({
      name: 'content-moderation',
      input: { title: submission.title, contentType: submission.type },
      metadata: { submissionId },
      tags: [submission.type],
    });

    try {
      const generation = trace?.generation({
        name: 'openai-moderation',
        model: env.OPENAI_MODEL,
        input: [{ role: 'user', content: rawPrompt }],
      });

      const result = await this.provider.analyze(submission.title, submission.body);

      generation?.update({ output: result });
      generation?.end();

      trace?.score({
        name: 'toxicity',
        value: result.toxicityScore / 10,
        comment: `Recommendation: ${result.recommendation}, Sentiment: ${result.sentiment}`,
      });

      trace?.update({
        output: { recommendation: result.recommendation, sentiment: result.sentiment },
        tags: [submission.type, result.sentiment, result.recommendation],
      });

      await lf?.flushAsync();

      return this.analysisRepo.create({
        submissionId,
        ...result,
        rawPrompt,
        errorFlag: false,
      });
    } catch (err) {
      console.error('AI analysis failed, storing fallback:', err);

      trace?.update({ output: 'provider-error', metadata: { error: true } });
      await lf?.flushAsync();

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
