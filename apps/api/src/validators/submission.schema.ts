import { z } from 'zod';
import { ContentType, SubmissionStatus } from '@repo/database';

export const createSubmissionSchema = z.object({
  title: z.string().min(1).max(500),
  body: z.string().min(1).max(50000),
  authorName: z.string().min(1).max(200),
  type: z.nativeEnum(ContentType),
});

export const updateStatusSchema = z.object({
  status: z.enum([SubmissionStatus.APPROVED, SubmissionStatus.REJECTED]),
  reason: z.string().max(1000).optional(),
});

export const listSubmissionsSchema = z.object({
  status: z.nativeEnum(SubmissionStatus).optional(),
  type: z.nativeEnum(ContentType).optional(),
  search: z.string().optional(),
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
