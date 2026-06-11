import type { AIAnalysis } from '@repo/database';

export interface IAnalysisService {
  analyzeSubmission(submissionId: string): Promise<AIAnalysis>;
}
