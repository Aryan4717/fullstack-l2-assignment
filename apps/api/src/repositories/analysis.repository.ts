import type { AIAnalysis } from '@repo/database';
import { prisma } from '@repo/database';
import type { IAnalysisRepository, CreateAnalysisDto } from '../interfaces/repositories/IAnalysisRepository';

export class AnalysisRepository implements IAnalysisRepository {
  async findBySubmissionId(submissionId: string): Promise<AIAnalysis | null> {
    return prisma.aIAnalysis.findUnique({ where: { submissionId } });
  }

  async create(dto: CreateAnalysisDto): Promise<AIAnalysis> {
    return prisma.aIAnalysis.create({ data: dto });
  }
}
