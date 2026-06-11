import type { SubmissionStatus } from '@/types';

const classMap: Record<SubmissionStatus, string> = {
  PENDING: 'badge-pending',
  APPROVED: 'badge-approved',
  REJECTED: 'badge-rejected',
};

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  return <span className={classMap[status]}>{status}</span>;
}
