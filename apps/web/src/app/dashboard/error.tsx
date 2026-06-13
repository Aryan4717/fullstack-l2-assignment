'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="rounded-lg bg-white p-8 shadow text-center space-y-4 max-w-md w-full">
        <h2 className="text-lg font-semibold text-gray-900">Dashboard error</h2>
        <p className="text-sm text-gray-500">
          Something went wrong loading the dashboard. The team has been notified.
        </p>
        <button
          onClick={reset}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
