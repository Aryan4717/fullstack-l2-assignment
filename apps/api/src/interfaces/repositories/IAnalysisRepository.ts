import type { AIAnalysis, Sentiment, Recommendation } from '@repo/database';

export interface CreateAnalysisDto {
  submissionId: string;
  toxicityScore: number;
  sentiment: Sentiment;
  summary: string;
  recommendation: Recommendation;
  rawPrompt?: string;
  errorFlag: boolean;
}

export interface IAnalysisRepository {
  findBySubmissionId(submissionId: string): Promise<AIAnalysis | null>;
  create(dto: CreateAnalysisDto): Promise<AIAnalysis>;
}
