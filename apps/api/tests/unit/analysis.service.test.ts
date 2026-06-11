import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalysisService } from '../../src/services/analysis.service';
import type { IAnalysisProvider } from '../../src/interfaces/providers/IAnalysisProvider';
import type { IAnalysisRepository } from '../../src/interfaces/repositories/IAnalysisRepository';
import type { ISubmissionRepository } from '../../src/interfaces/repositories/ISubmissionRepository';
import { ContentType, Sentiment, Recommendation, SubmissionStatus } from '@repo/database';

const mockSubmission = {
  id: 'sub-1',
  title: 'Test Article',
  body: 'Test body content',
  authorName: 'Author',
  type: ContentType.ARTICLE,
  status: SubmissionStatus.PENDING,
  submittedAt: new Date(),
};

const mockAnalysis = {
  id: 'ana-1',
  submissionId: 'sub-1',
  toxicityScore: 2,
  sentiment: Sentiment.POSITIVE,
  summary: 'A positive test article.',
  recommendation: Recommendation.APPROVE,
  rawPrompt: null,
  errorFlag: false,
  createdAt: new Date(),
};

describe('AnalysisService', () => {
  let provider: IAnalysisProvider;
  let analysisRepo: IAnalysisRepository;
  let submissionRepo: ISubmissionRepository;
  let service: AnalysisService;

  beforeEach(() => {
    provider = { analyze: vi.fn() };
    analysisRepo = { findBySubmissionId: vi.fn(), create: vi.fn() };
    submissionRepo = {
      list: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
      getStats: vi.fn(),
    };
    service = new AnalysisService(provider, analysisRepo, submissionRepo);
  });

  it('returns cached result without calling the provider', async () => {
    vi.mocked(analysisRepo.findBySubmissionId).mockResolvedValue(mockAnalysis);

    const result = await service.analyzeSubmission('sub-1');

    expect(result).toEqual(mockAnalysis);
    expect(provider.analyze).not.toHaveBeenCalled();
  });

  it('calls provider and stores result on cache miss', async () => {
    vi.mocked(analysisRepo.findBySubmissionId).mockResolvedValue(null);
    vi.mocked(submissionRepo.findById).mockResolvedValue(mockSubmission);
    vi.mocked(provider.analyze).mockResolvedValue({
      toxicityScore: 2,
      sentiment: Sentiment.POSITIVE,
      summary: 'A positive article.',
      recommendation: Recommendation.APPROVE,
    });
    vi.mocked(analysisRepo.create).mockResolvedValue(mockAnalysis);

    await service.analyzeSubmission('sub-1');

    expect(provider.analyze).toHaveBeenCalledOnce();
    expect(analysisRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ errorFlag: false, submissionId: 'sub-1' })
    );
  });

  it('stores errorFlag=true and returns fallback when provider throws', async () => {
    vi.mocked(analysisRepo.findBySubmissionId).mockResolvedValue(null);
    vi.mocked(submissionRepo.findById).mockResolvedValue(mockSubmission);
    vi.mocked(provider.analyze).mockRejectedValue(new Error('OpenAI timeout'));
    const fallback = { ...mockAnalysis, errorFlag: true, recommendation: Recommendation.REVIEW };
    vi.mocked(analysisRepo.create).mockResolvedValue(fallback);

    const result = await service.analyzeSubmission('sub-1');

    expect(result.errorFlag).toBe(true);
    expect(analysisRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ errorFlag: true, recommendation: Recommendation.REVIEW })
    );
  });
});
