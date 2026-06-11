import type { Submission, ContentType, SubmissionStatus } from '@repo/database';

export interface SubmissionFilters {
  status?: SubmissionStatus;
  type?: ContentType;
  search?: string;
  page: number;
  limit: number;
}

export interface CreateSubmissionDto {
  title: string;
  body: string;
  authorName: string;
  type: ContentType;
}

export interface ISubmissionRepository {
  list(filters: SubmissionFilters): Promise<{ data: Submission[]; total: number }>;
  findById(id: string): Promise<Submission | null>;
  create(dto: CreateSubmissionDto): Promise<Submission>;
  updateStatus(id: string, status: SubmissionStatus): Promise<Submission>;
  getStats(): Promise<{ total: number; pending: number; approved: number; rejected: number }>;
}
