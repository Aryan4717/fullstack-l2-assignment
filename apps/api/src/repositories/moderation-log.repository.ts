import type { ModerationLog } from '@repo/database';
import { prisma } from '@repo/database';
import type { IModerationLogRepository, CreateModerationLogDto } from '../interfaces/repositories/IModerationLogRepository';

export class ModerationLogRepository implements IModerationLogRepository {
  async create(dto: CreateModerationLogDto): Promise<ModerationLog> {
    return prisma.moderationLog.create({ data: dto });
  }

  async findBySubmissionId(submissionId: string): Promise<ModerationLog[]> {
    return prisma.moderationLog.findMany({
      where: { submissionId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
