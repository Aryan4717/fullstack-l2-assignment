export type Role = 'ADMIN' | 'MODERATOR';
export type ContentType = 'ARTICLE' | 'COMMENT';
export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type Sentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
export type Recommendation = 'APPROVE' | 'REVIEW' | 'REJECT';

export interface User {
  id: string;
  email: string;
  role: Role;
}

export interface AIAnalysis {
  id: string;
  submissionId: string;
  toxicityScore: number;
  sentiment: Sentiment;
  summary: string;
  recommendation: Recommendation;
  errorFlag: boolean;
  createdAt: string;
}

export interface ModerationLog {
  id: string;
  submissionId: string;
  moderatorId: string;
  action: SubmissionStatus;
  reason: string | null;
  createdAt: string;
}

export interface Submission {
  id: string;
  title: string;
  body: string;
  authorName: string;
  type: ContentType;
  status: SubmissionStatus;
  submittedAt: string;
  analysis?: AIAnalysis | null;
  logs?: ModerationLog[];
}

export interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}
