import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSubmission } from '@/lib/api';
import { getServerToken } from '@/lib/auth';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ContentTypeBadge } from '@/components/ui/ContentTypeBadge';
import { AIAnalysisPanel } from '@/components/analysis/AIAnalysisPanel';
import { ModerationActions } from '@/components/moderation/ModerationActions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SubmissionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const token = await getServerToken();

  let submission;
  try {
    submission = await getSubmission(id, token);
  } catch {
    notFound();
  }

  const isPending = submission.status === 'PENDING';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>

      {/* ─── Submission details ─────────────────────────────────────────── */}
      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="min-w-0 flex-1 break-words text-xl font-bold text-gray-900">
            {submission.title}
          </h1>
          <div className="flex shrink-0 flex-wrap items-start gap-2">
            <ContentTypeBadge type={submission.type} />
            <StatusBadge status={submission.status} />
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
          <span>By <span className="font-medium text-gray-700">{submission.authorName}</span></span>
          <span className="hidden sm:inline">•</span>
          <span>{new Date(submission.submittedAt).toLocaleString()}</span>
        </div>

        <div className="prose max-w-none rounded-md bg-gray-50 p-4 text-sm text-gray-800">
          {submission.body}
        </div>
      </div>

      {/* ─── AI Analysis ────────────────────────────────────────────────── */}
      <Suspense fallback={<div className="card animate-pulse h-40" />}>
        <AIAnalysisPanel submissionId={id} analysis={submission.analysis ?? null} />
      </Suspense>

      {/* ─── Moderation actions ─────────────────────────────────────────── */}
      {isPending && (
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Moderation Actions</h2>
          <ModerationActions submissionId={id} />
        </div>
      )}

      {/* ─── Audit log ──────────────────────────────────────────────────── */}
      {submission.logs && submission.logs.length > 0 && (
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Audit Log</h2>
          <ul className="space-y-2">
            {submission.logs.map((log) => (
              <li key={log.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
                <StatusBadge status={log.action} />
                <span className="shrink-0">{new Date(log.createdAt).toLocaleString()}</span>
                {log.reason && <span className="italic text-gray-500">— {log.reason}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
