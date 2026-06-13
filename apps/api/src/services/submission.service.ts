import { prisma } from '@repo/database';
import type { Submission } from '@repo/database';
import { SubmissionStatus } from '@repo/database';
import type { ISubmissionService, UpdateStatusDto } from '../interfaces/services/ISubmissionService';
import type { ISubmissionRepository, SubmissionFilters, CreateSubmissionDto } from '../interfaces/repositories/ISubmissionRepository';
import { NotFoundError, InvalidStatusTransitionError } from '../errors';

export class SubmissionService implements ISubmissionService {
  constructor(
    private readonly submissionRepo: ISubmissionRepository,
  ) {}

  async getSubmissions(filters: SubmissionFilters): Promise<{ data: Submission[]; total: number }> {
    return this.submissionRepo.list(filters);
  }

  async getSubmissionById(id: string): Promise<Submission> {
    const submission = await this.submissionRepo.findById(id);
    if (!submission) throw new NotFoundError('Submission');
    return submission;
  }

  async createSubmission(dto: CreateSubmissionDto): Promise<Submission> {
    return this.submissionRepo.create(dto);
  }

  async updateStatus(id: string, dto: UpdateStatusDto, moderatorId: string): Promise<Submission> {
    const submission = await this.submissionRepo.findById(id);
    if (!submission) throw new NotFoundError('Submission');

    if (submission.status !== SubmissionStatus.PENDING) {
      throw new InvalidStatusTransitionError(
        `Cannot transition from ${submission.status} to ${dto.status}. Only PENDING submissions can be actioned.`
      );
    }

    // Atomic: both the status update and the moderation log must succeed or both fail.
    const [updated] = await prisma.$transaction([
      prisma.submission.update({ where: { id }, data: { status: dto.status } }),
      prisma.moderationLog.create({
        data: { submissionId: id, moderatorId, action: dto.status, reason: dto.reason },
      }),
    ]);

    return updated as Submission;
  }

  async getStats(): Promise<{ total: number; pending: number; approved: number; rejected: number }> {
    return this.submissionRepo.getStats();
  }
}
