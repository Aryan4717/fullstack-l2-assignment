import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubmissionRepository } from '../../src/repositories/submission.repository';
import { prisma, ContentType, SubmissionStatus } from '@repo/database';

const mockSubmissions = [
  {
    id: 'sub-1',
    title: 'Pending Article',
    body: 'Body',
    authorName: 'Author',
    type: ContentType.ARTICLE,
    status: SubmissionStatus.PENDING,
    submittedAt: new Date(),
    analysis: null,
  },
];

describe('SubmissionRepository', () => {
  let repo: SubmissionRepository;

  beforeEach(() => {
    repo = new SubmissionRepository();
    vi.clearAllMocks();
  });

  it('filters by status=PENDING and returns matching submissions', async () => {
    vi.mocked(prisma.submission.findMany).mockResolvedValue(mockSubmissions);
    vi.mocked(prisma.submission.count).mockResolvedValue(1);

    const result = await repo.list({ status: SubmissionStatus.PENDING, page: 1, limit: 10 });

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(prisma.submission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: SubmissionStatus.PENDING }),
      })
    );
  });

  it('applies title search as case-insensitive contains filter', async () => {
    vi.mocked(prisma.submission.findMany).mockResolvedValue([]);
    vi.mocked(prisma.submission.count).mockResolvedValue(0);

    await repo.list({ search: 'quantum', page: 1, limit: 10 });

    expect(prisma.submission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          title: { contains: 'quantum', mode: 'insensitive' },
        }),
      })
    );
  });

  it('paginates correctly — page 2 with limit 5 skips 5 items', async () => {
    vi.mocked(prisma.submission.findMany).mockResolvedValue([]);
    vi.mocked(prisma.submission.count).mockResolvedValue(10);

    await repo.list({ page: 2, limit: 5 });

    expect(prisma.submission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 5, take: 5 })
    );
  });
});
