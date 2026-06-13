import type { AIAnalysis } from '@repo/database';
import { prisma } from '@repo/database';
import type { IAnalysisRepository, CreateAnalysisDto } from '../interfaces/repositories/IAnalysisRepository';
import { Sentry } from '../lib/sentry.client';

export class AnalysisRepository implements IAnalysisRepository {
  async findBySubmissionId(submissionId: string): Promise<AIAnalysis | null> {
    return Sentry.startSpan(
      { name: 'db.analysis.findBySubmissionId', op: 'db.query' },
      () => prisma.aIAnalysis.findUnique({ where: { submissionId } })
    );
  }

  async create(dto: CreateAnalysisDto): Promise<AIAnalysis> {
    return Sentry.startSpan(
      { name: 'db.analysis.create', op: 'db.query' },
      () => prisma.aIAnalysis.create({ data: dto })
    );
  }
}
