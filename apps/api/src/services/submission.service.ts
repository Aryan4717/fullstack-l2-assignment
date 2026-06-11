import type { Submission } from '@repo/database';
import { SubmissionStatus } from '@repo/database';
import type { ISubmissionService, UpdateStatusDto } from '../interfaces/services/ISubmissionService';
import type { ISubmissionRepository, SubmissionFilters, CreateSubmissionDto } from '../interfaces/repositories/ISubmissionRepository';
import type { IModerationLogRepository } from '../interfaces/repositories/IModerationLogRepository';
import { NotFoundError, InvalidStatusTransitionError } from '../errors';

export class SubmissionService implements ISubmissionService {
  constructor(
    private readonly submissionRepo: ISubmissionRepository,
    private readonly moderationLogRepo: IModerationLogRepository
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

    const updated = await this.submissionRepo.updateStatus(id, dto.status);

    await this.moderationLogRepo.create({
      submissionId: id,
      moderatorId,
      action: dto.status,
      reason: dto.reason,
    });

    return updated;
  }

  async getStats(): Promise<{ total: number; pending: number; approved: number; rejected: number }> {
    return this.submissionRepo.getStats();
  }
}
