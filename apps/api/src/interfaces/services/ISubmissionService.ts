import type { Submission, SubmissionStatus } from '@repo/database';
import type { SubmissionFilters, CreateSubmissionDto } from '../repositories/ISubmissionRepository';

export interface UpdateStatusDto {
  status: SubmissionStatus;
  reason?: string;
}

export interface ISubmissionService {
  getSubmissions(filters: SubmissionFilters): Promise<{ data: Submission[]; total: number }>;
  getSubmissionById(id: string): Promise<Submission>;
  createSubmission(dto: CreateSubmissionDto): Promise<Submission>;
  updateStatus(id: string, dto: UpdateStatusDto, moderatorId: string): Promise<Submission>;
  getStats(): Promise<{ total: number; pending: number; approved: number; rejected: number }>;
}
