import Link from 'next/link';
import type { Submission } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ContentTypeBadge } from '@/components/ui/ContentTypeBadge';

interface SubmissionListProps {
  submissions: Submission[];
}

export function SubmissionList({ submissions }: SubmissionListProps) {
  if (submissions.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        <p className="text-lg font-medium">No submissions found</p>
        <p className="mt-1 text-sm">Try adjusting your filters or search query.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-100">
      {submissions.map((sub) => (
        <li key={sub.id}>
          <Link
            href={`/dashboard/${sub.id}`}
            className="flex items-center justify-between gap-4 py-4 hover:bg-gray-50 px-2 rounded-md transition-colors"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-gray-900">{sub.title}</p>
              <p className="mt-0.5 text-xs text-gray-500">
                By {sub.authorName} &bull; {new Date(sub.submittedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ContentTypeBadge type={sub.type} />
              <StatusBadge status={sub.status} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
