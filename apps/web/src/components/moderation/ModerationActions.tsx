'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import * as Sentry from '@sentry/nextjs';
import { updateSubmissionStatus } from '@/lib/api';

interface ModerationActionsProps {
  submissionId: string;
}

export function ModerationActions({ submissionId }: ModerationActionsProps) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAction = async (status: 'APPROVED' | 'REJECTED') => {
    setError(null);
    try {
      await updateSubmissionStatus(submissionId, status, reason || undefined);
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      Sentry.captureException(err, { tags: { feature: 'moderation', submissionId, action: status } });
      setError(err instanceof Error ? err.message : 'Action failed');
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
          Reason <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          id="reason"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Provide a reason for this decision…"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => handleAction('APPROVED')}
          disabled={isPending}
          className="btn-primary"
        >
          {isPending ? 'Processing…' : 'Approve'}
        </button>
        <button
          onClick={() => handleAction('REJECTED')}
          disabled={isPending}
          className="btn-danger"
        >
          {isPending ? 'Processing…' : 'Reject'}
        </button>
      </div>
    </div>
  );
}
