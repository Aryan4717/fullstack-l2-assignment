import type { Submission, SubmissionStatus, Prisma } from '@repo/database';
import { prisma } from '@repo/database';
import type { ISubmissionRepository, SubmissionFilters, CreateSubmissionDto } from '../interfaces/repositories/ISubmissionRepository';

export class SubmissionRepository implements ISubmissionRepository {
  async list(filters: SubmissionFilters): Promise<{ data: Submission[]; total: number }> {
    const { status, type, search, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.SubmissionWhereInput = {
      ...(status && { status }),
      ...(type && { type }),
      ...(search && {
        title: { contains: search, mode: 'insensitive' as Prisma.QueryMode },
      }),
    };

    const [data, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: { analysis: true },
      }),
      prisma.submission.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<Submission | null> {
    return prisma.submission.findUnique({
      where: { id },
      include: { analysis: true, logs: { orderBy: { createdAt: 'desc' } } },
    });
  }

  async create(dto: CreateSubmissionDto): Promise<Submission> {
    return prisma.submission.create({ data: dto });
  }

  async updateStatus(id: string, status: SubmissionStatus): Promise<Submission> {
    return prisma.submission.update({ where: { id }, data: { status } });
  }

  async getStats(): Promise<{ total: number; pending: number; approved: number; rejected: number }> {
    const grouped = await prisma.submission.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const counts = { total: 0, pending: 0, approved: 0, rejected: 0 };
    for (const group of grouped) {
      const n = group._count._all;
      counts.total += n;
      if (group.status === 'PENDING') counts.pending = n;
      if (group.status === 'APPROVED') counts.approved = n;
      if (group.status === 'REJECTED') counts.rejected = n;
    }
    return counts;
  }
}
