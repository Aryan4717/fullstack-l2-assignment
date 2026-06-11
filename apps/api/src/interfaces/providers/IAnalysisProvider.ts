import type { Sentiment, Recommendation } from '@repo/database';

export interface AnalysisResult {
  toxicityScore: number;
  sentiment: Sentiment;
  summary: string;
  recommendation: Recommendation;
}

export interface IAnalysisProvider {
  analyze(title: string, body: string): Promise<AnalysisResult>;
}
