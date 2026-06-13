import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubmissionService } from '../../src/services/submission.service';
import type { ISubmissionRepository } from '../../src/interfaces/repositories/ISubmissionRepository';
import { ContentType, SubmissionStatus } from '@repo/database';
import { InvalidStatusTransitionError, NotFoundError } from '../../src/errors';

// Mock the prisma singleton so $transaction can be controlled in unit tests
vi.mock('@repo/database', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@repo/database')>();
  return {
    ...actual,
    prisma: {
      submission: { update: vi.fn() },
      moderationLog: { create: vi.fn() },
      $transaction: vi.fn(),
    },
  };
});

import { prisma } from '@repo/database';

const makeSubmission = (status: SubmissionStatus = SubmissionStatus.PENDING) => ({
  id: 'sub-1',
  title: 'Test',
  body: 'Body',
  authorName: 'Author',
  type: ContentType.ARTICLE,
  status,
  submittedAt: new Date(),
});

describe('SubmissionService', () => {
  let submissionRepo: ISubmissionRepository;
  let service: SubmissionService;

  beforeEach(() => {
    vi.clearAllMocks();
    submissionRepo = {
      list: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
      getStats: vi.fn(),
    };
    service = new SubmissionService(submissionRepo);
  });

  it('creates a submission with PENDING status', async () => {
    const sub = makeSubmission();
    vi.mocked(submissionRepo.create).mockResolvedValue(sub);

    const result = await service.createSubmission({
      title: 'Test',
      body: 'Body',
      authorName: 'Author',
      type: ContentType.ARTICLE,
    });

    expect(result.status).toBe(SubmissionStatus.PENDING);
    expect(submissionRepo.create).toHaveBeenCalledOnce();
  });

  it('transitions PENDING → APPROVED atomically via $transaction', async () => {
    const pending = makeSubmission(SubmissionStatus.PENDING);
    const approved = makeSubmission(SubmissionStatus.APPROVED);
    vi.mocked(submissionRepo.findById).mockResolvedValue(pending);
    vi.mocked(prisma.$transaction as ReturnType<typeof vi.fn>).mockResolvedValue([approved, {}]);

    const result = await service.updateStatus('sub-1', { status: SubmissionStatus.APPROVED }, 'mod-1');

    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(result.status).toBe(SubmissionStatus.APPROVED);
  });

  it('throws InvalidStatusTransitionError when updating a non-PENDING submission', async () => {
    vi.mocked(submissionRepo.findById).mockResolvedValue(makeSubmission(SubmissionStatus.APPROVED));

    await expect(
      service.updateStatus('sub-1', { status: SubmissionStatus.REJECTED }, 'mod-1')
    ).rejects.toThrow(InvalidStatusTransitionError);
  });

  it('throws NotFoundError when submission does not exist', async () => {
    vi.mocked(submissionRepo.findById).mockResolvedValue(null);

    await expect(
      service.updateStatus('none', { status: SubmissionStatus.APPROVED }, 'mod-1')
    ).rejects.toThrow(NotFoundError);
  });
});
