import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubmissionService } from '../../src/services/submission.service';
import type { ISubmissionRepository } from '../../src/interfaces/repositories/ISubmissionRepository';
import type { IModerationLogRepository } from '../../src/interfaces/repositories/IModerationLogRepository';
import { ContentType, SubmissionStatus } from '@repo/database';
import { InvalidStatusTransitionError, NotFoundError } from '../../src/errors';

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
  let logRepo: IModerationLogRepository;
  let service: SubmissionService;

  beforeEach(() => {
    submissionRepo = {
      list: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
      getStats: vi.fn(),
    };
    logRepo = { create: vi.fn(), findBySubmissionId: vi.fn() };
    service = new SubmissionService(submissionRepo, logRepo);
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

  it('transitions PENDING → APPROVED and logs the action', async () => {
    const pending = makeSubmission(SubmissionStatus.PENDING);
    const approved = makeSubmission(SubmissionStatus.APPROVED);
    vi.mocked(submissionRepo.findById).mockResolvedValue(pending);
    vi.mocked(submissionRepo.updateStatus).mockResolvedValue(approved);
    vi.mocked(logRepo.create).mockResolvedValue({} as never);

    await service.updateStatus('sub-1', { status: SubmissionStatus.APPROVED }, 'mod-1');

    expect(submissionRepo.updateStatus).toHaveBeenCalledWith('sub-1', SubmissionStatus.APPROVED);
    expect(logRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ submissionId: 'sub-1', moderatorId: 'mod-1' })
    );
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
