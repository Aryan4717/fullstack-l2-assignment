import type { ModerationLog, SubmissionStatus } from '@repo/database';

export interface CreateModerationLogDto {
  submissionId: string;
  moderatorId: string;
  action: SubmissionStatus;
  reason?: string;
}

export interface IModerationLogRepository {
  create(dto: CreateModerationLogDto): Promise<ModerationLog>;
  findBySubmissionId(submissionId: string): Promise<ModerationLog[]>;
}
